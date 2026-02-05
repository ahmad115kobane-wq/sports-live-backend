import { create } from 'zustand';
import { Competition } from '@/types';
import { competitionApi } from '@/services/api';

interface CompetitionState {
  competitions: Competition[];
  currentCompetition: Competition | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCompetitions: () => Promise<void>;
  fetchActiveCompetitions: () => Promise<void>;
  fetchCompetitionById: (id: string) => Promise<void>;
  setCurrentCompetition: (competition: Competition | null) => void;
}

export const useCompetitionStore = create<CompetitionState>((set, get) => ({
  competitions: [],
  currentCompetition: null,
  isLoading: false,
  error: null,

  fetchCompetitions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await competitionApi.getAll();
      set({ competitions: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchActiveCompetitions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await competitionApi.getActive();
      set({ competitions: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchCompetitionById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await competitionApi.getById(id);
      set({ currentCompetition: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  setCurrentCompetition: (competition) => {
    set({ currentCompetition: competition });
  },
}));
