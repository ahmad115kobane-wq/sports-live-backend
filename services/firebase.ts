import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import notifee, { AndroidStyle, AndroidImportance } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';
import api from './api';
import { liveBannerBridge } from '@/utils/liveBannerBridge';
import { handleLiveMatchFCMData } from './liveNotificationManager';

// طلب إذن الإشعارات
export async function requestNotificationPermission() {
  try {
    // Android 13+ (API 33+) requires POST_NOTIFICATIONS runtime permission
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        return false;
      }
    }

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    return enabled;
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
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  // Update persistent live match notification in background
  const data = remoteMessage.data || {};
  if (data.matchId && data.homeTeamName && data.awayTeamName) {
    await handleLiveMatchFCMData(data);
  }
});

// معالجة الإشعارات عندما يكون التطبيق مفتوحاً (Foreground)
export function setupForegroundNotificationHandler() {
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    
    const title = remoteMessage.notification?.title || 'إشعار جديد';
    const body = remoteMessage.notification?.body || '';
    const imageUrl = remoteMessage.notification?.android?.imageUrl
      || (remoteMessage.notification as any)?.imageUrl
      || (remoteMessage.data?.imageUrl as string | undefined);

    // Check if this is a match-related notification
    const data = remoteMessage.data || {};
    const isMatchNotification = !!(data.matchId && data.homeTeamName && data.awayTeamName);
    const isLiveUpdate = data.type === 'live_update';

    if (isMatchNotification) {
      // Update/create persistent system notification (stays in notification tray)
      await handleLiveMatchFCMData(data);

      // Show in-app banner for event notifications (goals, start, etc.) — NOT for silent live updates
      if (!isLiveUpdate) {
        liveBannerBridge.show({
          matchId: data.matchId as string,
          type: (data.type as string) || 'match_start',
          title,
          body,
          homeTeamName: data.homeTeamName as string,
          awayTeamName: data.awayTeamName as string,
          homeTeamLogo: data.homeTeamLogo as string | undefined,
          awayTeamLogo: data.awayTeamLogo as string | undefined,
          homeScore: data.homeScore as string | undefined,
          awayScore: data.awayScore as string | undefined,
          minute: data.minute as string | undefined,
          homePossession: data.homePossession as string | undefined,
          awayPossession: data.awayPossession as string | undefined,
          competitionName: data.competitionName as string | undefined,
        });
      }

      // The persistent notification already handles the display — skip creating a normal notification
      return;
    }

    // Non-match notifications: show normal one-time notification
    if (Platform.OS === 'android') {
      const channelId = await notifee.createChannel({
        id: 'general-notifications',
        name: 'General Notifications',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });

      const androidConfig: any = {
        channelId,
        pressAction: { id: 'default' },
        sound: 'default',
      };

      if (imageUrl) {
        androidConfig.style = {
          type: AndroidStyle.BIGPICTURE,
          picture: imageUrl,
        };
        androidConfig.largeIcon = imageUrl;
      }

      await notifee.displayNotification({
        title,
        body,
        data: remoteMessage.data as { [key: string]: string },
        android: androidConfig,
      });
    } else {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: remoteMessage.data as { [key: string]: unknown },
          sound: 'default' as const,
        },
        trigger: null,
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
