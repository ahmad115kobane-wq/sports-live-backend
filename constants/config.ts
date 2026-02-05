// API Configuration
// For Android Emulator use: 10.0.2.2
// For iOS Simulator use: localhost
// For physical device use: your computer's IP address (e.g., 192.168.1.x)
import { Platform } from 'react-native';

// Your local IP address - update this if using physical device
const LOCAL_IP = '192.168.0.116'; // From Expo output

const getApiUrl = () => {
  if (!__DEV__) return 'https://your-production-api.com/api';
  
  // For web, use localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  }
  
  // Use actual IP for all devices in development
  // This works for physical devices, emulators, and simulators
  return `http://${LOCAL_IP}:3000/api`;
};

const getSocketUrl = () => {
  if (!__DEV__) return 'https://your-production-api.com';
  
  // For web, use localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }
  
  // Use actual IP for all devices in development
  return `http://${LOCAL_IP}:3000`;
};

export const API_URL = getApiUrl();
export const SOCKET_URL = getSocketUrl();

// App Configuration
export const APP_CONFIG = {
  name: 'Sports Live',
  version: '1.0.0',
  refreshInterval: 30000, // 30 seconds
};

// Event Types
export const EVENT_TYPES = {
  goal: { icon: '⚽', label: 'Goal', color: '#4CAF50' },
  foul: { icon: '⚠️', label: 'Foul', color: '#FF9800' },
  yellow_card: { icon: '🟨', label: 'Yellow Card', color: '#FFEB3B' },
  red_card: { icon: '🟥', label: 'Red Card', color: '#F44336' },
  substitution: { icon: '🔄', label: 'Substitution', color: '#2196F3' },
  var_review: { icon: '📺', label: 'VAR Review', color: '#9C27B0' },
  penalty: { icon: '⚽', label: 'Penalty', color: '#E91E63' },
  corner: { icon: '🚩', label: 'Corner', color: '#00BCD4' },
  offside: { icon: '🚫', label: 'Offside', color: '#607D8B' },
  injury: { icon: '🏥', label: 'Injury', color: '#FF5722' },
  stop: { icon: '⏸️', label: 'Match Stopped', color: '#795548' },
  start_half: { icon: '▶️', label: 'Half Started', color: '#4CAF50' },
  end_half: { icon: '⏸️', label: 'Half Time', color: '#FF9800' },
  end_match: { icon: '🏁', label: 'Full Time', color: '#9E9E9E' },
} as const;

// Match Status
export const MATCH_STATUS = {
  scheduled: { label: 'Scheduled', color: '#9E9E9E' },
  live: { label: 'LIVE', color: '#F44336' },
  halftime: { label: 'Half Time', color: '#FF9800' },
  finished: { label: 'Finished', color: '#4CAF50' },
} as const;
