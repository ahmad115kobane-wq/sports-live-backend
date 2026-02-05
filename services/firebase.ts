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
      console.log('✅ Firebase notification permission granted');
      return true;
    } else {
      console.log('❌ Firebase notification permission denied');
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
    console.log('📱 FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

// تسجيل FCM Token في Backend
export async function registerFCMToken(userId: number) {
  try {
    const token = await getFCMToken();
    if (!token) {
      console.error('❌ No FCM token available');
      return false;
    }

    await api.post('/users/push-token', {
      userId,
      pushToken: token,
      platform: Platform.OS,
    });

    console.log('✅ FCM token registered successfully');
    return true;
  } catch (error) {
    console.error('Error registering FCM token:', error);
    return false;
  }
}

// معالجة الإشعارات في الخلفية (Background)
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('📬 Background notification received:', remoteMessage);
  
  // عرض الإشعار محلياً
  if (remoteMessage.notification) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: remoteMessage.notification.title || 'إشعار جديد',
        body: remoteMessage.notification.body || '',
        data: remoteMessage.data,
      },
      trigger: null, // عرض فوري
    });
  }
});

// معالجة الإشعارات عندما يكون التطبيق مفتوحاً (Foreground)
export function setupForegroundNotificationHandler() {
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log('📬 Foreground notification received:', remoteMessage);
    
    // عرض الإشعار محلياً
    if (remoteMessage.notification) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification.title || 'إشعار جديد',
          body: remoteMessage.notification.body || '',
          data: remoteMessage.data,
        },
        trigger: null, // عرض فوري
      });
    }
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
        console.log('📬 Notification opened app from quit state:', remoteMessage);
        callback(remoteMessage.data);
      }
    });

  // عندما يكون التطبيق في الخلفية
  const unsubscribe = messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('📬 Notification opened app from background:', remoteMessage);
    callback(remoteMessage.data);
  });

  return unsubscribe;
}

// تحديث Token عند تغييره
export function setupTokenRefreshHandler(userId: number) {
  const unsubscribe = messaging().onTokenRefresh(async (token) => {
    console.log('🔄 FCM token refreshed:', token);
    
    try {
      await api.post('/users/push-token', {
        userId,
        pushToken: token,
        platform: Platform.OS,
      });
      console.log('✅ New FCM token registered');
    } catch (error) {
      console.error('Error registering new FCM token:', error);
    }
  });

  return unsubscribe;
}
