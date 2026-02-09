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
      console.log('⚠️ Push notifications only work on physical devices');
      return null;
    }

    // Request Firebase notification permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('❌ Permission to receive notifications was denied');
      return null;
    }

    // Get FCM token
    const token = await getFCMToken();
    if (!token) {
      console.log('❌ Failed to get FCM token');
      return null;
    }

    console.log('✅ FCM token obtained');

    // Send token to backend (only if authenticated)
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const authToken = await AsyncStorage.getItem('token');
      if (authToken) {
        await api.post('/users/push-token', { pushToken: token });
        console.log('✅ FCM token sent to backend');
      } else {
        console.log('⚠️ Skipping push token registration - user not authenticated');
      }
    } catch (error) {
      console.log('⚠️ Failed to send FCM token to backend (will retry on login)');
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
    console.error('❌ Error registering for push notifications:', error);
    return null;
  }
}

// Remove push token (on logout)
export async function removePushToken(): Promise<void> {
  try {
    await api.delete('/users/push-token');
    console.log('✅ Push token removed from backend');
  } catch (error) {
    console.error('Failed to remove push token:', error);
  }
}

// Get notification preferences
export async function getNotificationPreferences(): Promise<any> {
  try {
    const response = await api.get('/users/preferences');
    return response.data.data.notifications || {};
  } catch (error) {
    console.error('Failed to get notification preferences:', error);
    return null;
  }
}

// Update notification preferences
export async function updateNotificationPreferences(preferences: any): Promise<boolean> {
  try {
    await api.put('/users/preferences', { notifications: preferences });
    console.log('✅ Notification preferences updated');
    return true;
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
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
    console.error('Failed to get notifications:', error);
    return null;
  }
}

// Get unread count
export async function getUnreadCount(): Promise<number> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const token = await AsyncStorage.getItem('token');
    if (!token) return 0;
    
    const response = await api.get('/notifications/unread-count');
    return response.data.count || 0;
  } catch (error) {
    console.log('Failed to get unread count:', error);
    return 0;
  }
}

// Mark notification as read
export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    await api.put(`/notifications/${notificationId}/read`);
    return true;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return false;
  }
}

// Mark all as read
export async function markAllAsRead(): Promise<boolean> {
  try {
    await api.put('/notifications/read-all');
    return true;
  } catch (error) {
    console.error('Failed to mark all as read:', error);
    return false;
  }
}

// Delete notification
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    await api.delete(`/notifications/${notificationId}`);
    return true;
  } catch (error) {
    console.error('Failed to delete notification:', error);
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
