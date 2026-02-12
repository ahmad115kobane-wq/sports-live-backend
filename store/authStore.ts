import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';
import api from '@/services/api';

// Global reference for API interceptor to trigger logout
let _forceLogout: (() => void) | null = null;
export const getForceLogout = () => _forceLogout;

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
  updateUser: (updatedFields: Partial<User>) => void;
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
      const response = await api.post('/auth/login', { email, password });
      
      const { user, token, requiresVerification } = response.data.data;
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      if (requiresVerification) {
        set({ hasSeenWelcome: true });
        throw { requiresVerification: true, email: user.email };
      }
      
      set({ user, token, isAuthenticated: true, isGuest: false, hasSeenWelcome: true });
    } catch (error: any) {
      if (error?.requiresVerification) {
        throw error;
      }
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  register: async (name: string, email: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      
      const { user, token, requiresVerification } = response.data.data;
      
      // Store token temporarily for verification
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // If email verification is required, don't fully authenticate yet
      if (requiresVerification) {
        set({ hasSeenWelcome: true });
        throw { requiresVerification: true, email };
      }
      
      set({ user, token, isAuthenticated: true, isGuest: false, hasSeenWelcome: true });
    } catch (error: any) {
      if (error?.requiresVerification) {
        throw error; // Re-throw verification redirect
      }
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
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, token: null, isAuthenticated: false, isGuest: false });
  },

  loadStoredAuth: async () => {
    try {
      const [token, userStr, hasSeenWelcome, isGuest] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('hasSeenWelcome'),
        AsyncStorage.getItem('isGuest'),
      ]);
      
      // Register force logout for API interceptor
      _forceLogout = () => {
        AsyncStorage.removeItem('token');
        AsyncStorage.removeItem('user');
        AsyncStorage.removeItem('isGuest');
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, token: null, isAuthenticated: false, isGuest: false });
      };
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // ── INSTANT: Trust local data → allow navigation immediately ──
        set({ 
          user, 
          token, 
          isAuthenticated: true, 
          isLoading: false,
          hasSeenWelcome: hasSeenWelcome === 'true',
          isGuest: isGuest === 'true',
        });

        // ── BACKGROUND: Validate token silently, logout only if invalid ──
        api.get('/users/me').then(response => {
          const validUser = response.data?.data;
          if (validUser) {
            set({ user: validUser });
            AsyncStorage.setItem('user', JSON.stringify(validUser));
          }
        }).catch(() => {
          AsyncStorage.removeItem('token');
          AsyncStorage.removeItem('user');
          AsyncStorage.removeItem('isGuest');
          delete api.defaults.headers.common['Authorization'];
          set({ user: null, token: null, isAuthenticated: false, isGuest: false });
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

  updateUser: (updatedFields: Partial<User>) => {
    const currentUser = get().user;
    if (!currentUser) return;
    const merged = { ...currentUser, ...updatedFields };
    set({ user: merged });
    AsyncStorage.setItem('user', JSON.stringify(merged));
  },

  setHasSeenWelcome: (seen: boolean) => {
    AsyncStorage.setItem('hasSeenWelcome', seen.toString());
    set({ hasSeenWelcome: seen });
  },
}));
