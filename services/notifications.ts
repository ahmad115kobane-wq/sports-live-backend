import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

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

// Register for push notifications
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check if running on physical device
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // Get existing permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission to receive notifications was denied');
      return null;
    }

    // Get Expo push token
    let tokenData;
    try {
      // Try with project ID from app.json
      tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Will be replaced with actual project ID
      });
    } catch (error) {
      // Fallback: try without project ID (for development)
      console.log('Trying to get push token without project ID...');
      tokenData = await Notifications.getExpoPushTokenAsync();
    }

    const token = tokenData.data;
    console.log('📱 Push token obtained:', token);

    // Register token with backend
    try {
      await api.post('/users/push-token', { pushToken: token });
      console.log('✅ Push token registered with backend');
    } catch (error) {
      console.error('Failed to register push token with backend:', error);
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('match-events', {
        name: 'Match Events',
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
    console.error('Error registering for push notifications:', error);
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
    const response = await api.get('/notifications/unread-count');
    return response.data.count || 0;
  } catch (error) {
    console.error('Failed to get unread count:', error);
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
