import { useEffect, useState, useRef } from 'react';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager, View, ActivityIndicator, Platform } from 'react-native';
import { enableScreens } from 'react-native-screens';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/Colors';
import { RTLProvider, useRTL } from '@/contexts/RTLContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AlertProvider } from '@/contexts/AlertContext';
import { registerForPushNotifications, handleNotificationTap } from '@/services/notifications';
import { requestNotificationPermission, setupForegroundNotificationHandler } from '@/services/firebase';
import AnimatedSplash from '@/components/AnimatedSplash';
import VideoAdOverlay from '@/components/VideoAdOverlay';
import LiveMatchBanner from '@/components/LiveMatchBanner';
import { LiveMatchBannerProvider, useLiveMatchBanner } from '@/contexts/LiveMatchBannerContext';
import { liveBannerBridge } from '@/utils/liveBannerBridge';
import { matchUpdateEmitter } from '@/utils/matchEvents';
import { showOrUpdateLiveNotification, cancelLiveNotification, hasActiveNotification } from '@/services/liveNotificationManager';
import notifee, { EventType } from '@notifee/react-native';
import '@/i18n';

// Enable native screens for maximum performance
enableScreens(true);

function RootLayoutContent() {
  const { colorScheme, isDark } = useTheme();
  const colors = Colors[colorScheme];
  const { loadStoredAuth, isLoading, isAuthenticated, hasSeenWelcome } = useAuthStore();
  const { t, isRTL } = useRTL();
  const { showBanner } = useLiveMatchBanner();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Connect live match banner bridge to context
  useEffect(() => {
    liveBannerBridge.register(showBanner);
    return () => liveBannerBridge.unregister();
  }, [showBanner]);

  // Handle notifee notification taps (for persistent live match notifications)
  useEffect(() => {
    return notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification?.data?.matchId) {
        router.push(`/match/${detail.notification.data.matchId}` as any);
      }
    });
  }, []);

  // Subscribe to socket-based match updates to keep persistent notifications live
  useEffect(() => {
    const unsubscribe = matchUpdateEmitter.subscribe((updated) => {
      if (!hasActiveNotification(updated.id)) return;

      // Determine event type from socket update
      let eventType = 'live_update';
      if (updated.status === 'finished') eventType = 'match_end';
      else if (updated.status === 'halftime') eventType = 'end_half';

      if (updated.homeTeam && updated.awayTeam) {
        const notifData = {
          matchId: updated.id,
          type: eventType,
          homeTeamName: updated.homeTeam.name,
          awayTeamName: updated.awayTeam.name,
          homeTeamLogo: updated.homeTeam.logoUrl,
          awayTeamLogo: updated.awayTeam.logoUrl,
          homeScore: (updated.homeScore ?? 0).toString(),
          awayScore: (updated.awayScore ?? 0).toString(),
          minute: updated.currentMinute?.toString(),
          status: updated.status,
          liveStartedAt: updated.liveStartedAt,
          secondHalfStartedAt: updated.secondHalfStartedAt,
        };

        if (updated.status === 'finished') {
          cancelLiveNotification(updated.id);
        } else {
          showOrUpdateLiveNotification(notifData);
        }
      } else if (updated.status === 'finished') {
        cancelLiveNotification(updated.id);
      }
    });
    return unsubscribe;
  }, []);

  // Request notification permission immediately on app start (regardless of auth)
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Setup push notifications (token registration requires auth)
  useEffect(() => {
    if (isAuthenticated) {
      // Register for push notifications
      registerForPushNotifications();

      // Setup FCM foreground handler - THIS IS CRITICAL for receiving FCM messages
      const unsubscribeFCM = setupForegroundNotificationHandler();

      // Listen for notifications received while app is open (local notifications)
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      });

      // Listen for notification taps
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        handleNotificationTap(response.notification, router);
      });

      return () => {
        // Cleanup FCM listener
        if (unsubscribeFCM) {
          unsubscribeFCM();
        }
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      };
    }
  }, [isAuthenticated]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading || !navigationState?.key) return;

    const inWelcomeScreen = segments[0] === 'welcome';
    const inAuthGroup = segments[0] === 'auth';
    const inLegalPage = segments[0] === 'legal';

    // If user is NOT authenticated (not logged in, not guest) → go to welcome
    // Allow legal pages (terms/privacy) to be viewed without auth
    if (!isAuthenticated && !inWelcomeScreen && !inAuthGroup && !inLegalPage) {
      router.replace('/welcome');
    }
    // If user IS authenticated and still on welcome screen → go to tabs
    else if (isAuthenticated && inWelcomeScreen) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated, segments, navigationState?.key]);

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {showSplash && <AnimatedSplash onFinish={() => setShowSplash(false)} />}
      {!showSplash && <VideoAdOverlay isAuthenticated={isAuthenticated} />}
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: isDark ? '#fff' : '#0F0F0F',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
          // ── Smooth slide transitions (no flash on back) ──
          animation: 'slide_from_right',
          animationDuration: 200,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
          freezeOnBlur: true,
        }}
      >
        <Stack.Screen
          name="welcome"
          options={{
            headerShown: false,
            animation: 'fade',
            animationDuration: 150,
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            animation: 'none',
          }}
        />
        <Stack.Screen
          name="match/[id]"
          options={{
            title: t('match.stats'),
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="team/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="player/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            headerShown: false,
            presentation: 'transparentModal',
            animation: 'fade',
            animationDuration: 150,
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="auth/login"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="auth/register"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="auth/forgot-password"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="auth/verify-email"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="auth/reset-password"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="auth/select-favorites"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="operator/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="operator/match/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="operator/match/setup"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="cart"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="checkout"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="orders"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="legal/[slug]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="about"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="admin"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="publisher/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="store-dashboard"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="delegate/index"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <LiveMatchBanner />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RTLProvider>
        <AlertProvider>
          <LiveMatchBannerProvider>
            <RootLayoutContent />
          </LiveMatchBannerProvider>
        </AlertProvider>
      </RTLProvider>
    </ThemeProvider>
  );
}
