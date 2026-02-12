import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/config';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token (uses in-memory token from axios defaults, no disk I/O)
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/users/me')) {
      try {
        const { getForceLogout } = require('@/store/authStore');
        const forceLogout = getForceLogout();
        if (forceLogout) {
          forceLogout();
        } else {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
        }
      } catch (e) {
        
      }
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
    api.post(`/admin/matches/${matchId}/operators`, { operatorId }),
};

export const adminApi = {
  getOperators: () => api.get('/admin/operators'),
};

export const teamApi = {
  getAll: () => api.get('/teams'),
  getAllWithPlayers: (category?: string) => api.get(`/teams?includePlayers=true${category ? `&category=${category}` : ''}`),
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
  getMatches: (id: string, params?: { status?: string; limit?: number }) =>
    api.get(`/teams/${id}/matches`, { params }),
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
  updateProfile: (data: { name?: string; currentPassword?: string; newPassword?: string }) =>
    api.put('/users/profile', data),
  uploadAvatar: (formData: FormData) => api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getFavorites: () => api.get('/users/favorites'),
  addFavorite: (matchId: string) => api.post(`/users/favorites/${matchId}`),
  removeFavorite: (matchId: string) => api.delete(`/users/favorites/${matchId}`),
  savePreferences: (data: { favoriteTeams: string[]; favoriteCompetitions: string[] }) => 
    api.put('/users/preferences', data),
  getPreferences: () => api.get('/users/preferences'),
  deleteAccount: () => api.delete('/auth/delete-account'),
  // Admin endpoints
  getAll: (page = 1, limit = 10) => api.get('/admin/users', { params: { page, limit } }),
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
  setStoppageTime: (id: string, stoppageMinutes: number) =>
    api.post(`/operator/matches/${id}/stoppage-time`, { stoppageMinutes }),
  startExtraTime: (id: string) => api.post(`/operator/matches/${id}/extra-time-start`),
  setExtraTimeHalftime: (id: string) => api.post(`/operator/matches/${id}/extra-time-halftime`),
  startExtraTimeSecond: (id: string) => api.post(`/operator/matches/${id}/extra-time-second`),
  startPenalties: (id: string) => api.post(`/operator/matches/${id}/penalties`),
  endMatch: (id: string) => api.post(`/operator/matches/${id}/end`),
  updateMinute: (id: string, minute: number) =>
    api.patch(`/operator/matches/${id}/minute`, { currentMinute: minute }),
  makeSubstitution: (matchId: string, data: { playerOutId: string; playerInId: string; minute: number; teamId: string }) =>
    api.post(`/matches/${matchId}/substitution`, data),
  getFormations: () => api.get('/matches/formations/list'),
  saveLineup: (matchId: string, teamId: string, data: { formation: string; coach?: string; players: any[] }) =>
    api.post(`/matches/${matchId}/lineup/${teamId}`, data),
  updateReferees: (matchId: string, data: { referee?: string; assistantReferee1?: string; assistantReferee2?: string; fourthReferee?: string }) =>
    api.patch(`/operator/matches/${matchId}/referee`, data),
};

export const eventApi = {
  create: (data: any) => api.post('/events', data),
  delete: (id: string) => api.delete(`/events/${id}`),
};

export const newsApi = {
  getAll: (page = 1, limit = 20) => api.get(`/news?page=${page}&limit=${limit}`),
  getById: (id: string) => api.get(`/news/${id}`),
  create: (formData: FormData) => api.post('/news', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id: string, formData: FormData) => api.put(`/news/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id: string) => api.delete(`/news/${id}`),
  getMyArticles: () => api.get('/news/my/articles'),
};

export const statsApi = {
  getMatchStats: (matchId: string) => api.get(`/stats/match/${matchId}`),
  togglePossession: (matchId: string, team: 'home' | 'away') =>
    api.post(`/stats/match/${matchId}/possession`, { team }),
  resetPossession: (matchId: string) =>
    api.post(`/stats/match/${matchId}/possession/reset`),
};

export const storeApi = {
  // Public
  getCategories: () => api.get('/store/categories'),
  getProducts: (params?: { categoryId?: string; search?: string; featured?: boolean; badge?: string; page?: number; limit?: number }) =>
    api.get('/store/products', { params }),
  getProduct: (id: string) => api.get(`/store/products/${id}`),
  // Admin
  adminGetCategories: () => api.get('/store/admin/categories'),
  adminCreateCategory: (data: { name: string; nameAr: string; nameKu: string; icon?: string; sortOrder?: number; isActive?: boolean }) =>
    api.post('/store/admin/categories', data),
  adminUpdateCategory: (id: string, data: any) => api.put(`/store/admin/categories/${id}`, data),
  adminDeleteCategory: (id: string) => api.delete(`/store/admin/categories/${id}`),
  adminGetProducts: () => api.get('/store/admin/products'),
  adminCreateProduct: (data: any) => api.post('/store/admin/products', data),
  adminUpdateProduct: (id: string, data: any) => api.put(`/store/admin/products/${id}`, data),
  adminDeleteProduct: (id: string) => api.delete(`/store/admin/products/${id}`),
  // Banners
  getBanners: () => api.get('/store/banners'),
  adminGetBanners: () => api.get('/store/admin/banners'),
  adminCreateBanner: (data: any) => api.post('/store/admin/banners', data),
  adminUpdateBanner: (id: string, data: any) => api.put(`/store/admin/banners/${id}`, data),
  adminDeleteBanner: (id: string) => api.delete(`/store/admin/banners/${id}`),
  // Image Upload
  adminUploadImage: (formData: FormData) => api.post('/store/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const sliderApi = {
  getActive: () => api.get('/sliders'),
  adminGetAll: () => api.get('/sliders/admin'),
  adminCreate: (formData: FormData) => api.post('/sliders/admin', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  adminUpdate: (id: string, formData: FormData) => api.put(`/sliders/admin/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  adminDelete: (id: string) => api.delete(`/sliders/admin/${id}`),
};

export const orderApi = {
  // User
  createOrder: (data: { customerName: string; customerPhone: string; customerAddress: string; items: any[]; deliveryFee?: number }) =>
    api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  // Admin
  adminGetAllOrders: (status?: string) =>
    api.get('/orders/admin/all', { params: status ? { status } : {} }),
  adminUpdateOrderStatus: (id: string, data: { status: string; adminNote?: string; estimatedDelivery?: string; deliveryFee?: number }) =>
    api.put(`/orders/admin/${id}/status`, data),
  adminGetOrderCounts: () => api.get('/orders/admin/counts'),
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

export const videoAdApi = {
  getRandom: () => api.get('/video-ads/random'),
  adminGetAll: () => api.get('/video-ads/admin'),
  adminCreate: (formData: FormData) => api.post('/video-ads/admin', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  adminUpdate: (id: string, formData: FormData) => api.put(`/video-ads/admin/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  adminDelete: (id: string) => api.delete(`/video-ads/admin/${id}`),
};

export const legalApi = {
  getAll: () => api.get('/legal'),
  getBySlug: (slug: string) => api.get(`/legal/${slug}`),
  adminGetAll: () => api.get('/legal/admin/all'),
  adminCreate: (data: any) => api.post('/legal/admin', data),
  adminUpdate: (id: string, data: any) => api.put(`/legal/admin/${id}`, data),
  adminDelete: (id: string) => api.delete(`/legal/admin/${id}`),
};
