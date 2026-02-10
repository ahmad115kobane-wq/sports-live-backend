import { create } from 'zustand';
import { Match, MatchEvent } from '@/types';
import api from '@/services/api';
import { matchUpdateEmitter } from '@/utils/matchEvents';

interface MatchState {
  matches: Match[];
  liveMatches: Match[];
  featuredMatch: Match | null;
  currentMatch: Match | null;
  isLoadingMatches: boolean;
  isLoadingMatch: boolean;
  error: string | null;

  // Actions
  fetchMatches: (date?: string) => Promise<void>;
  fetchLiveMatches: () => Promise<void>;
  fetchFeaturedMatch: () => Promise<void>;
  fetchMatchById: (id: string) => Promise<void>;
  updateMatchFromSocket: (match: Partial<Match> & { id: string }) => void;
  addEventToMatch: (event: MatchEvent) => void;
  removeEventFromMatch: (matchId: string, eventId: string) => void;
  setCurrentMatch: (match: Match | null) => void;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  liveMatches: [],
  featuredMatch: null,
  currentMatch: null,
  isLoadingMatches: false,
  isLoadingMatch: false,
  error: null,

  fetchMatches: async (date?: string) => {
    set({ isLoadingMatches: true, error: null });
    try {
      const params = date ? { date } : {};
      const response = await api.get('/matches', { params });
      set({ matches: response.data.data, isLoadingMatches: false });
    } catch (error: any) {
      set({ error: error.message, isLoadingMatches: false });
    }
  },

  fetchLiveMatches: async () => {
    try {
      const response = await api.get('/matches/live');
      set({ liveMatches: response.data.data });
    } catch (error: any) {
      console.error('Error fetching live matches:', error);
    }
  },

  fetchFeaturedMatch: async () => {
    try {
      const response = await api.get('/matches/featured');
      set({ featuredMatch: response.data.data });
    } catch (error: any) {
      console.error('Error fetching featured match:', error);
    }
  },

  fetchMatchById: async (id: string) => {
    set({ isLoadingMatch: true, error: null });
    try {
      const response = await api.get(`/matches/${id}`);
      const match = response.data.data;
      set({ currentMatch: match, isLoadingMatch: false });
    } catch (error: any) {
      set({ error: error.message, isLoadingMatch: false });
    }
  },

  updateMatchFromSocket: (updatedMatch) => {
    const { matches, liveMatches, currentMatch, featuredMatch } = get();
    const patch: Partial<MatchState> = {};

    // Only update arrays that actually contain this match
    const inMatches = matches.some(m => m.id === updatedMatch.id);
    if (inMatches) {
      patch.matches = matches.map(m =>
        m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m
      );
    }

    const inLive = liveMatches.some(m => m.id === updatedMatch.id);
    if (inLive) {
      patch.liveMatches = liveMatches.map(m =>
        m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m
      );
    }

    if (currentMatch?.id === updatedMatch.id) {
      patch.currentMatch = { ...currentMatch, ...updatedMatch };
    }

    if (featuredMatch?.id === updatedMatch.id) {
      patch.featuredMatch = { ...featuredMatch, ...updatedMatch };
    }

    // Only call set() if something actually changed
    if (Object.keys(patch).length > 0) {
      set(patch);
    }

    // Notify local state listeners (home page, favorites, etc.)
    matchUpdateEmitter.emit(updatedMatch);
  },

  addEventToMatch: (event) => {
    const { currentMatch } = get();
    if (currentMatch?.id === event.matchId) {
      const events = currentMatch.events || [];
      set({
        currentMatch: {
          ...currentMatch,
          events: [event, ...events],
        },
      });
    }
  },

  removeEventFromMatch: (matchId, eventId) => {
    const { currentMatch } = get();
    if (currentMatch?.id === matchId && currentMatch.events) {
      set({
        currentMatch: {
          ...currentMatch,
          events: currentMatch.events.filter((e) => e.id !== eventId),
        },
      });
    }
  },

  setCurrentMatch: (match) => {
    set({ currentMatch: match });
  },
}));
