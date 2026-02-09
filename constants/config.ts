// API Configuration
// For Android Emulator use: 10.0.2.2
// For iOS Simulator use: localhost
// For physical device use: your computer's IP address (e.g., 192.168.1.x)
import { Platform } from 'react-native';

// Your local IP address - update this if using physical device
const LOCAL_IP = '192.168.0.116'; // From Expo output

const getApiUrl = () => {
  // Always use Railway backend
  return 'https://sports-live.up.railway.app/api';
  
  // // For local development, uncomment below:
  // if (Platform.OS === 'web') return 'http://localhost:3000/api';
  // return `http://${LOCAL_IP}:3000/api`;
};

const getSocketUrl = () => {
  // Always use Railway backend
  return 'https://sports-live.up.railway.app';
  
  // // For local development, uncomment below:
  // if (Platform.OS === 'web') return 'http://localhost:3000';
  // return `http://${LOCAL_IP}:3000`;
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
export const EVENT_TYPES: Record<string, { label: string; color: string }> = {
  goal: { label: 'Goal', color: '#4CAF50' },
  foul: { label: 'Foul', color: '#FF9800' },
  yellow_card: { label: 'Yellow Card', color: '#FFEB3B' },
  red_card: { label: 'Red Card', color: '#F44336' },
  substitution: { label: 'Substitution', color: '#2196F3' },
  var_review: { label: 'VAR Review', color: '#9C27B0' },
  penalty: { label: 'Penalty', color: '#E91E63' },
  corner: { label: 'Corner', color: '#00BCD4' },
  offside: { label: 'Offside', color: '#607D8B' },
  injury: { label: 'Injury', color: '#FF5722' },
  stop: { label: 'Match Stopped', color: '#795548' },
  start_half: { label: 'Half Started', color: '#4CAF50' },
  end_half: { label: 'Half Time', color: '#FF9800' },
  end_match: { label: 'Full Time', color: '#9E9E9E' },
};

// Match Status
export const MATCH_STATUS: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Scheduled', color: '#9E9E9E' },
  live: { label: 'LIVE', color: '#F44336' },
  halftime: { label: 'Half Time', color: '#FF9800' },
  extra_time: { label: 'Extra Time', color: '#E91E63' },
  extra_time_halftime: { label: 'ET Half', color: '#FF9800' },
  penalties: { label: 'Penalties', color: '#9C27B0' },
  finished: { label: 'Finished', color: '#4CAF50' },
};
