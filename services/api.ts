import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/config';

console.log('🌐 API URL configured:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    console.log('📤 Request:', config.method?.toUpperCase(), config.baseURL + config.url);
    
    // Add auth token if available
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error getting token:', error);
    }
    
    return config;
  },
  (error) => {
    console.log('📤 Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('📥 Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log('📥 Response Error:', error.code, error.message);
    if (error.response?.status === 401) {
      console.log('Unauthorized request');
    }
    return Promise.reject(error);
  }
);

export default api;

// API Functions
export const matchApi = {
  getAll: (params?: { date?: string; status?: string }) =>
    api.get('/matches', { params }),
  getLive: () => api.get('/matches/live'),
  getFeatured: () => api.get('/matches/featured'),
  getById: (id: string) => api.get(`/matches/${id}`),
  getEvents: (id: string) => api.get(`/matches/${id}/events`),
  create: (data: {
    competitionId: string;
    homeTeamId: string;
    awayTeamId: string;
    startTime: string;
    venue?: string;
    referee?: string;
    isFeatured?: boolean;
    operatorId?: string;
  }) => api.post('/matches', data),
  update: (id: string, data: any) => api.put(`/matches/${id}`, data),
  delete: (id: string) => api.delete(`/matches/${id}`),
  assignOperator: (matchId: string, operatorId: string) => 
    api.post(`/admin/matches/${matchId}/assign`, { operatorId }),
};

export const adminApi = {
  getOperators: () => api.get('/admin/operators'),
};

export const teamApi = {
  getAll: () => api.get('/teams'),
  getById: (id: string) => api.get(`/teams/${id}`),
  getByCompetition: (competitionId: string) => {
    // Create a request without auth token for public access during onboarding
    return axios.get(`${API_URL}/teams?competitionId=${competitionId}`, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
  },
  getPlayers: (id: string) => api.get(`/teams/${id}/players`),
  create: (data: {
    name: string;
    shortName: string;
    logoUrl?: string;
    primaryColor?: string;
    coach?: string;
    stadium?: string;
    city?: string;
    country?: string;
  }) => api.post('/teams', data),
  update: (id: string, data: any) => api.put(`/teams/${id}`, data),
  delete: (id: string) => api.delete(`/teams/${id}`),
  addPlayer: (teamId: string, data: {
    name: string;
    shirtNumber: number;
    position?: string;
    nationality?: string;
  }) => api.post(`/teams/${teamId}/players`, data),
  addToCompetition: (teamId: string, competitionId: string) => 
    api.post(`/teams/${teamId}/competitions/${competitionId}`, { season: '2025-2026' }),
  removeFromCompetition: (teamId: string, competitionId: string) => 
    api.delete(`/teams/${teamId}/competitions/${competitionId}`),
};

export const playerApi = {
  getAll: (params?: { teamId?: string; search?: string }) =>
    api.get('/players', { params }),
  getById: (id: string) => api.get(`/players/${id}`),
  create: (data: {
    name: string;
    number: number;
    teamId: string;
    position?: string;
    nationality?: string;
  }) => api.post('/players', data),
  update: (id: string, data: any) => api.put(`/players/${id}`, data),
  delete: (id: string) => api.delete(`/players/${id}`),
};

export const userApi = {
  getProfile: () => api.get('/users/me'),
  getFavorites: () => api.get('/users/favorites'),
  addFavorite: (matchId: string) => api.post(`/users/favorites/${matchId}`),
  removeFavorite: (matchId: string) => api.delete(`/users/favorites/${matchId}`),
  savePreferences: (data: { favoriteTeams: string[]; favoriteCompetitions: string[] }) => 
    api.post('/users/preferences', data),
  getPreferences: () => api.get('/users/preferences'),
  // Admin endpoints
  getAll: () => api.get('/admin/users'),
  getById: (id: string) => api.get(`/admin/users/${id}`),
  toggleBan: (id: string) => api.post(`/admin/users/${id}/toggle-ban`),
  updateRole: (id: string, role: string) => api.patch(`/admin/users/${id}/role`, { role }),
  delete: (id: string) => api.delete(`/admin/users/${id}`),
};

export const operatorApi = {
  getMatches: () => api.get('/operator/matches'),
  getMatch: (id: string) => api.get(`/operator/matches/${id}`),
  startMatch: (id: string) => api.post(`/operator/matches/${id}/start`),
  setHalftime: (id: string) => api.post(`/operator/matches/${id}/halftime`),
  startSecondHalf: (id: string) => api.post(`/operator/matches/${id}/second-half`),
  endMatch: (id: string) => api.post(`/operator/matches/${id}/end`),
  updateMinute: (id: string, minute: number) =>
    api.patch(`/operator/matches/${id}/minute`, { currentMinute: minute }),
};

export const eventApi = {
  create: (data: any) => api.post('/events', data),
  delete: (id: string) => api.delete(`/events/${id}`),
};

export const competitionApi = {
  getAll: (params?: { type?: string; active?: boolean }) =>
    api.get('/competitions', { params }),
  getActive: () => {
    // Create a request without auth token for public access during onboarding
    return axios.get(`${API_URL}/competitions/active`, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
  },
  getById: (id: string) => api.get(`/competitions/${id}`),
  getMatches: (id: string, params?: { status?: string; date?: string }) =>
    api.get(`/competitions/${id}/matches`, { params }),
  create: (data: {
    name: string;
    shortName: string;
    country: string;
    season: string;
    type: string;
    icon: string;
    sortOrder?: number;
    logoUrl?: string;
  }) => api.post('/competitions', data),
  update: (id: string, data: {
    name?: string;
    shortName?: string;
    country?: string;
    season?: string;
    type?: string;
    icon?: string;
    isActive?: boolean;
    sortOrder?: number;
    logoUrl?: string;
  }) => api.put(`/competitions/${id}`, data),
  delete: (id: string) => api.delete(`/competitions/${id}`),
};
