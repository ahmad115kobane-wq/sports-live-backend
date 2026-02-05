import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';
import api from '@/services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasSeenWelcome: boolean;
  isGuest: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  upgradeGuest: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  updateUser: (user: User) => void;
  setHasSeenWelcome: (seen: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  hasSeenWelcome: false,
  isGuest: false,

  login: async (email: string, password: string) => {
    try {
      console.log('🔐 Login attempt:', { email, password: '***' });
      console.log('📡 API URL:', api.defaults.baseURL);
      
      const response = await api.post('/auth/login', { email, password });
      console.log('✅ Login response:', response.data);
      
      const { user, token } = response.data.data;
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      set({ user, token, isAuthenticated: true, isGuest: false, hasSeenWelcome: true });
      console.log('✅ Login successful, user set');
    } catch (error: any) {
      console.log('❌ Login error:', error);
      console.log('❌ Error response:', error.response?.data);
      console.log('❌ Error message:', error.message);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  register: async (name: string, email: string, password: string) => {
    try {
      console.log('📝 Register attempt:', { name, email, password: '***' });
      console.log('📡 API URL:', api.defaults.baseURL);
      
      const response = await api.post('/auth/register', { name, email, password });
      console.log('✅ Register response:', response.data);
      
      const { user, token } = response.data.data;
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      set({ user, token, isAuthenticated: true, isGuest: false, hasSeenWelcome: true });
      console.log('✅ Register successful');
    } catch (error: any) {
      console.log('❌ Register error:', error);
      console.log('❌ Error response:', error.response?.data);
      console.log('❌ Error message:', error.message);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  guestLogin: async () => {
    try {
      const response = await api.post('/auth/guest');
      const { user, token } = response.data.data;
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify({ ...user, isGuest: true }));
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
      await AsyncStorage.setItem('isGuest', 'true');
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      set({ user: { ...user, isGuest: true }, token, isAuthenticated: true, isGuest: true, hasSeenWelcome: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Guest login failed');
    }
  },

  upgradeGuest: async (name: string, email: string, password: string) => {
    try {
      const { user: currentUser } = get();
      if (!currentUser) throw new Error('No guest user to upgrade');
      
      const response = await api.post('/auth/upgrade-guest', {
        guestId: currentUser.id,
        name,
        email,
        password,
      });
      const { user, token } = response.data.data;
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.removeItem('isGuest');
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      set({ user, token, isGuest: false });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Upgrade failed');
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('isGuest');
    // Keep hasSeenWelcome so they see the welcome screen again
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, token: null, isAuthenticated: false, isGuest: false });
  },

  loadStoredAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
      const isGuest = await AsyncStorage.getItem('isGuest');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ 
          user, 
          token, 
          isAuthenticated: true, 
          isLoading: false,
          hasSeenWelcome: hasSeenWelcome === 'true',
          isGuest: isGuest === 'true',
        });
      } else {
        set({ 
          isLoading: false,
          hasSeenWelcome: hasSeenWelcome === 'true',
        });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },

  updateUser: (user: User) => {
    set({ user });
    AsyncStorage.setItem('user', JSON.stringify(user));
  },

  setHasSeenWelcome: (seen: boolean) => {
    AsyncStorage.setItem('hasSeenWelcome', seen.toString());
    set({ hasSeenWelcome: seen });
  },
}));
