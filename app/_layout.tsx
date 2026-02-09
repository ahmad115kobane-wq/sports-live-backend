import { useEffect, useState, useRef } from 'react';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager, View, ActivityIndicator } from 'react-native';
import { enableScreens } from 'react-native-screens';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/Colors';
import { RTLProvider, useRTL } from '@/contexts/RTLContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { registerForPushNotifications, handleNotificationTap } from '@/services/notifications';
import { setupForegroundNotificationHandler } from '@/services/firebase';
import '@/i18n';

// Enable native screens for maximum performance
enableScreens(true);

function RootLayoutContent() {
  const { colorScheme, isDark } = useTheme();
  const colors = Colors[colorScheme];
  const { loadStoredAuth, isLoading, isAuthenticated, hasSeenWelcome } = useAuthStore();
  const { t, isRTL } = useRTL();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Setup push notifications
  useEffect(() => {
    if (isAuthenticated) {
      // Register for push notifications
      registerForPushNotifications();

      // Setup FCM foreground handler - THIS IS CRITICAL for receiving FCM messages
      const unsubscribeFCM = setupForegroundNotificationHandler();

      // Listen for notifications received while app is open (local notifications)
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('📬 Notification received:', notification);
      });

      // Listen for notification taps
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('👆 Notification tapped:', response);
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

    // If user is NOT authenticated (not logged in, not guest) → go to welcome
    if (!isAuthenticated && !inWelcomeScreen && !inAuthGroup) {
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
          // ── Smooth transitions with swipe-back gesture ──
          animation: 'slide_from_right',
          animationDuration: 250,
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
            animationDuration: 200,
          }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
            animation: 'fade',
            animationDuration: 150,
          }} 
        />
        <Stack.Screen
          name="match/[id]"
          options={{
            title: t('match.stats'),
            headerShown: false,
            animation: 'slide_from_right',
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
            animationDuration: 200,
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
            animationDuration: 200,
          }}
        />
        <Stack.Screen
          name="auth/login"
          options={{
            title: t('auth.login'),
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="auth/register"
          options={{
            title: t('auth.register'),
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="operator/index"
          options={{
            headerShown: false,
            animation: 'fade_from_bottom',
            animationDuration: 200,
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
            animation: 'slide_from_bottom',
            animationDuration: 250,
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
          name="admin"
          options={{
            headerShown: false,
            animation: 'fade_from_bottom',
            animationDuration: 200,
          }}
        />
        <Stack.Screen
          name="publisher/index"
          options={{
            headerShown: false,
            animation: 'fade_from_bottom',
            animationDuration: 200,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RTLProvider>
        <RootLayoutContent />
      </RTLProvider>
    </ThemeProvider>
  );
}
