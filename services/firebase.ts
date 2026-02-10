import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from './api';

// طلب إذن الإشعارات
export async function requestNotificationPermission() {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

// الحصول على FCM Token
export async function getFCMToken() {
  try {
    const token = await messaging().getToken();
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

// تسجيل FCM Token في Backend
export async function registerFCMToken(userId: string) {
  try {
    const token = await getFCMToken();
    if (!token) {
      return false;
    }

    await api.post('/users/push-token', {
      userId,
      pushToken: token,
      platform: Platform.OS,
    });

    return true;
  } catch (error) {
    return false;
  }
}

// معالجة الإشعارات في الخلفية (Background)
// FCM مع notification payload يعرض الإشعار تلقائياً مع الصورة — لا حاجة لإشعار محلي
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
});

// معالجة الإشعارات عندما يكون التطبيق مفتوحاً (Foreground)
export function setupForegroundNotificationHandler() {
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    
    const title = remoteMessage.notification?.title || 'إشعار جديد';
    const body = remoteMessage.notification?.body || '';
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: remoteMessage.data as { [key: string]: unknown },
        sound: 'default' as const,
      },
      trigger: null,
    });
    
  });

  return unsubscribe;
}

// معالجة النقر على الإشعار
export function setupNotificationOpenHandler(callback: (data: any) => void) {
  // عندما يكون التطبيق مغلقاً تماماً
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        callback(remoteMessage.data);
      }
    });

  // عندما يكون التطبيق في الخلفية
  const unsubscribe = messaging().onNotificationOpenedApp((remoteMessage) => {
    callback(remoteMessage.data);
  });

  return unsubscribe;
}

// تحديث Token عند تغييره
export function setupTokenRefreshHandler(userId: string) {
  const unsubscribe = messaging().onTokenRefresh(async (token) => {
    try {
      await api.post('/users/push-token', {
        userId,
        pushToken: token,
        platform: Platform.OS,
      });
    } catch (error) {
    }
  });

  return unsubscribe;
}
