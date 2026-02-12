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

// Helper to add cache-busting timestamp to image URLs
export const getImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  // Add timestamp to bust cache
  const timestamp = Math.floor(Date.now() / (1000 * 60 * 60)); // Changes every hour
  return `${SOCKET_URL}${imageUrl}?t=${timestamp}`;
};

// App Configuration
export const APP_CONFIG = {
  name: 'Mini Football',
  version: '1.0.0',
  refreshInterval: 30000, // 30 seconds
};

// Event Types
export const EVENT_TYPES: Record<string, { label: string; color: string }> = {
  goal: { label: 'Goal', color: '#22C55E' },
  foul: { label: 'Foul', color: '#F59E0B' },
  yellow_card: { label: 'Yellow Card', color: '#EAB308' },
  red_card: { label: 'Red Card', color: '#EF4444' },
  substitution: { label: 'Substitution', color: '#3B82F6' },
  var_review: { label: 'VAR Review', color: '#A855F7' },
  penalty: { label: 'Penalty', color: '#EC4899' },
  corner: { label: 'Corner', color: '#06B6D4' },
  offside: { label: 'Offside', color: '#64748B' },
  injury: { label: 'Injury', color: '#F97316' },
  stop: { label: 'Match Stopped', color: '#78716C' },
  start_half: { label: 'Half Started', color: '#22C55E' },
  end_half: { label: 'Half Time', color: '#F59E0B' },
  end_match: { label: 'Full Time', color: '#6B7280' },
};

// Match Status
export const MATCH_STATUS: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Scheduled', color: '#6B7280' },
  live: { label: 'LIVE', color: '#EF4444' },
  halftime: { label: 'Half Time', color: '#F59E0B' },
  extra_time: { label: 'Extra Time', color: '#EC4899' },
  extra_time_halftime: { label: 'ET Half', color: '#F59E0B' },
  penalties: { label: 'Penalties', color: '#A855F7' },
  finished: { label: 'Finished', color: '#22C55E' },
};
