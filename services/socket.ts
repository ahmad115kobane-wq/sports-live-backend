import { useEffect, useRef, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/constants/config';
import { useAuthStore } from '@/store/authStore';
import { useMatchStore } from '@/store/matchStore';
import { MatchEvent } from '@/types';

let socket: Socket | null = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

// ── Direct store access (no re-render subscription) ──
const getMatchActions = () => useMatchStore.getState();

export const useSocket = () => {
  // Only subscribe to token (changes rarely — login/logout only)
  const token = useAuthStore(s => s.token);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    if (!socketRef.current && connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      
      
      socketRef.current = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 10000,
      });

      socket = socketRef.current;

      socketRef.current.on('connect', () => {
        connectionAttempts = 0;
      });

      socketRef.current.on('disconnect', () => {
      });

      socketRef.current.on('connect_error', (error) => {
        connectionAttempts++;
        
        if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
          socketRef.current?.disconnect();
          socketRef.current = null;
          socket = null;
        }
      });

      // Global events — use getState() to avoid re-render subscriptions
      socketRef.current.on('global:event', (event: MatchEvent) => {
        if (event.match) {
          const update: any = { id: event.matchId };
          if (event.match.homeScore !== undefined) update.homeScore = event.match.homeScore;
          if (event.match.awayScore !== undefined) update.awayScore = event.match.awayScore;
          if (event.match.status) update.status = event.match.status;
          if (event.match.currentMinute) update.currentMinute = event.match.currentMinute;
          getMatchActions().updateMatchFromSocket(update);
        }
      });

      socketRef.current.on('global:match:started', (match) => {
        getMatchActions().updateMatchFromSocket({
          id: match.id,
          status: 'live',
          currentMinute: 1,
          liveStartedAt: match.liveStartedAt,
        });
      });

      socketRef.current.on('global:match:ended', (match) => {
        getMatchActions().updateMatchFromSocket({
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
      
      // Listen for match-specific events — use getState() directly
      socketRef.current.on('match:event', (event: MatchEvent) => {
        getMatchActions().addEventToMatch(event);
        
        // Update score if goal
        if (event.type === 'goal' && event.match) {
          getMatchActions().updateMatchFromSocket({
            id: event.matchId,
            homeScore: event.match.homeScore,
            awayScore: event.match.awayScore,
          });
        }
      });

      socketRef.current.on('match:event:deleted', ({ eventId, matchId }) => {
        getMatchActions().removeEventFromMatch(matchId, eventId);
      });

      socketRef.current.on('match:status', (data) => {
        getMatchActions().updateMatchFromSocket({
          id: data.matchId,
          status: data.status,
          currentMinute: data.currentMinute,
          liveStartedAt: data.liveStartedAt,
          secondHalfStartedAt: data.secondHalfStartedAt,
          updatedAt: new Date().toISOString(),
        });
      });

      socketRef.current.on('match:minute', (data) => {
        getMatchActions().updateMatchFromSocket({
          id: data.matchId,
          currentMinute: data.currentMinute,
        });
      });
    }
  }, []);

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

  return useMemo(() => ({
    socket: socketRef.current,
    joinMatch,
    leaveMatch,
    joinLiveFeed,
    leaveLiveFeed,
  }), [joinMatch, leaveMatch, joinLiveFeed, leaveLiveFeed]);
};

export const getSocket = () => socket;
