import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/constants/config';
import { useAuthStore } from '@/store/authStore';
import { useMatchStore } from '@/store/matchStore';
import { MatchEvent } from '@/types';

let socket: Socket | null = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

export const useSocket = () => {
  const { token } = useAuthStore();
  const { updateMatchFromSocket, addEventToMatch, removeEventFromMatch } = useMatchStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    if (!socketRef.current && connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      console.log('🔌 Attempting socket connection to:', SOCKET_URL);
      
      socketRef.current = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'], // Allow fallback to polling
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 10000,
      });

      socket = socketRef.current;

      socketRef.current.on('connect', () => {
        console.log('🔌 Socket connected successfully');
        connectionAttempts = 0; // Reset on successful connection
      });

      socketRef.current.on('disconnect', () => {
        console.log('🔌 Socket disconnected');
      });

      socketRef.current.on('connect_error', (error) => {
        connectionAttempts++;
        console.log('🔌 Socket connection failed (attempt ' + connectionAttempts + '/' + MAX_CONNECTION_ATTEMPTS + '):', error.message);
        
        if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
          console.log('🔌 Max connection attempts reached. Socket disabled.');
          socketRef.current?.disconnect();
          socketRef.current = null;
          socket = null;
        }
      });

      // Global events — update scores/status across all screens
      socketRef.current.on('global:event', (event: MatchEvent) => {
        console.log('📡 Global event received:', event.type);
        if (event.match) {
          const update: any = { id: event.matchId };
          if (event.match.homeScore !== undefined) update.homeScore = event.match.homeScore;
          if (event.match.awayScore !== undefined) update.awayScore = event.match.awayScore;
          if (event.match.status) update.status = event.match.status;
          if (event.match.currentMinute) update.currentMinute = event.match.currentMinute;
          updateMatchFromSocket(update);
        }
      });

      socketRef.current.on('global:match:started', (match) => {
        console.log('🏟 Match started:', match.id);
        updateMatchFromSocket({
          id: match.id,
          status: 'live',
          currentMinute: 1,
          liveStartedAt: match.liveStartedAt,
        });
      });

      socketRef.current.on('global:match:ended', (match) => {
        console.log('🏁 Match ended:', match.id);
        updateMatchFromSocket({
          id: match.id,
          status: 'finished',
          currentMinute: 90,
        });
      });
    }

    return () => {
      // Don't disconnect on unmount, keep connection alive
    };
  }, [token]);

  const joinMatch = useCallback((matchId: string) => {
    if (socketRef.current) {
      // Remove previous listeners to prevent stacking
      socketRef.current.off('match:event');
      socketRef.current.off('match:event:deleted');
      socketRef.current.off('match:status');
      socketRef.current.off('match:minute');

      socketRef.current.emit('match:join', matchId);
      
      // Listen for match-specific events
      socketRef.current.on('match:event', (event: MatchEvent) => {
        console.log('⚽ Match event received:', {
          type: event.type,
          minute: event.minute,
          matchId: event.matchId,
          player: event.player?.name,
        });
        
        addEventToMatch(event);
        
        // Update score if goal
        if (event.type === 'goal' && event.match) {
          console.log('🎯 Goal! Updating scores:', {
            home: event.match.homeScore,
            away: event.match.awayScore,
          });
          updateMatchFromSocket({
            id: event.matchId,
            homeScore: event.match.homeScore,
            awayScore: event.match.awayScore,
          });
        }
      });

      socketRef.current.on('match:event:deleted', ({ eventId, matchId }) => {
        console.log('🗑️ Event deleted:', eventId);
        removeEventFromMatch(matchId, eventId);
      });

      socketRef.current.on('match:status', (data) => {
        console.log('📊 Match status changed:', {
          matchId: data.matchId,
          status: data.status,
          minute: data.currentMinute,
        });
        updateMatchFromSocket({
          id: data.matchId,
          status: data.status,
          currentMinute: data.currentMinute,
          liveStartedAt: data.liveStartedAt,
          secondHalfStartedAt: data.secondHalfStartedAt,
          updatedAt: new Date().toISOString(),
        });
      });

      socketRef.current.on('match:minute', (data) => {
        console.log('⏱️ Match minute updated:', data.currentMinute);
        updateMatchFromSocket({
          id: data.matchId,
          currentMinute: data.currentMinute,
        });
      });
    }
  }, [addEventToMatch, removeEventFromMatch, updateMatchFromSocket]);

  const leaveMatch = useCallback((matchId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('match:leave', matchId);
      socketRef.current.off('match:event');
      socketRef.current.off('match:event:deleted');
      socketRef.current.off('match:status');
      socketRef.current.off('match:minute');
    }
  }, []);

  const joinLiveFeed = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('livefeed:join');
    }
  }, []);

  const leaveLiveFeed = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('livefeed:leave');
    }
  }, []);

  return {
    socket: socketRef.current,
    joinMatch,
    leaveMatch,
    joinLiveFeed,
    leaveLiveFeed,
  };
};

export const getSocket = () => socket;
