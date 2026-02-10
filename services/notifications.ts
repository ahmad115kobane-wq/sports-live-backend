import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';
import { 
  requestNotificationPermission, 
  getFCMToken, 
  registerFCMToken,
  setupForegroundNotificationHandler,
  setupNotificationOpenHandler,
  setupTokenRefreshHandler
} from './firebase';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Register for push notifications using Firebase
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check if running on physical device
    if (!Device.isDevice) {
      return null;
    }

    // Request Firebase notification permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return null;
    }

    // Get FCM token
    const token = await getFCMToken();
    if (!token) {
      return null;
    }

    // Send token to backend (only if authenticated)
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const authToken = await AsyncStorage.getItem('token');
      if (authToken) {
        await api.post('/users/push-token', { pushToken: token });
      }
    } catch (error) {
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('match-notifications', {
        name: 'Match Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    return token;
  } catch (error) {
    return null;
  }
}

// Remove push token (on logout)
export async function removePushToken(): Promise<void> {
  try {
    await api.delete('/users/push-token');
  } catch (error) {
  }
}

// Get notification preferences
export async function getNotificationPreferences(): Promise<any> {
  try {
    const response = await api.get('/users/preferences');
    return response.data.data.notifications || {};
  } catch (error) {
    return null;
  }
}

// Update notification preferences
export async function updateNotificationPreferences(preferences: any): Promise<boolean> {
  try {
    await api.put('/users/preferences', { notifications: preferences });
    return true;
  } catch (error) {
    return false;
  }
}

// Get notifications list
export async function getNotifications(page = 1, limit = 20, unreadOnly = false): Promise<any> {
  try {
    const response = await api.get('/notifications', {
      params: { page, limit, unreadOnly },
    });
    return response.data;
  } catch (error) {
    return null;
  }
}

// Get unread count
export async function getUnreadCount(): Promise<number> {
  try {
    const response = await api.get('/notifications/unread-count');
    return response.data.count || 0;
  } catch (error) {
    return 0;
  }
}

// Mark notification as read
export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    await api.put(`/notifications/${notificationId}/read`);
    return true;
  } catch (error) {
    return false;
  }
}

// Mark all as read
export async function markAllAsRead(): Promise<boolean> {
  try {
    await api.put('/notifications/read-all');
    return true;
  } catch (error) {
    return false;
  }
}

// Delete notification
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    await api.delete(`/notifications/${notificationId}`);
    return true;
  } catch (error) {
    return false;
  }
}

// Handle notification tap
export function handleNotificationTap(notification: any, router: any): void {
  const data = notification.request?.content?.data || notification.data;
  
  if (data?.matchId) {
    router.push(`/match/${data.matchId}`);
  }
}
