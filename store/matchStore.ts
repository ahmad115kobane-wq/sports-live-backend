import { create } from 'zustand';
import { Match, MatchEvent } from '@/types';
import api from '@/services/api';
import { matchUpdateEmitter } from '@/utils/matchEvents';

interface MatchState {
  matches: Match[];
  liveMatches: Match[];
  featuredMatch: Match | null;
  currentMatch: Match | null;
  isLoading: boolean;
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
  isLoading: false,
  error: null,

  fetchMatches: async (date?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params = date ? { date } : {};
      const response = await api.get('/matches', { params });
      set({ matches: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
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
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/matches/${id}`);
      const match = response.data.data;
      set({ currentMatch: match, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateMatchFromSocket: (updatedMatch) => {
    const { matches, liveMatches, currentMatch, featuredMatch } = get();

    // Update in matches list
    const updatedMatches = matches.map((m) =>
      m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m
    );

    // Update in live matches
    const updatedLiveMatches = liveMatches.map((m) =>
      m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m
    );

    // Update current match if it's the same
    let updatedCurrentMatch = currentMatch;
    if (currentMatch?.id === updatedMatch.id) {
      updatedCurrentMatch = { ...currentMatch, ...updatedMatch };
    }

    // Update featured match if it's the same
    let updatedFeaturedMatch = featuredMatch;
    if (featuredMatch?.id === updatedMatch.id) {
      updatedFeaturedMatch = { ...featuredMatch, ...updatedMatch };
    }

    set({
      matches: updatedMatches,
      liveMatches: updatedLiveMatches,
      currentMatch: updatedCurrentMatch,
      featuredMatch: updatedFeaturedMatch,
    });

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
