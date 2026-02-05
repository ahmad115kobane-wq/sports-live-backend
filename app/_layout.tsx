import { useEffect, useState, useRef } from 'react';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, I18nManager, View, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/Colors';
import { RTLProvider, useRTL } from '@/contexts/RTLContext';
import { registerForPushNotifications, handleNotificationTap } from '@/services/notifications';
import '@/i18n';

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { loadStoredAuth, isLoading, isAuthenticated, hasSeenWelcome } = useAuthStore();
  const { t, isRTL } = useRTL();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Setup push notifications
  useEffect(() => {
    if (isAuthenticated) {
      // Register for push notifications
      registerForPushNotifications();

      // Listen for notifications received while app is open
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('📬 Notification received:', notification);
        // You can show an in-app notification here if needed
      });

      // Listen for notification taps
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('👆 Notification tapped:', response);
        handleNotificationTap(response.notification, router);
      });

      return () => {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      };
    }
  }, [isAuthenticated]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading || !navigationState?.key) return;

    const inWelcomeScreen = segments[0] === 'welcome';
    const inAuthGroup = segments[0] === 'auth';

    // If user hasn't seen welcome and isn't on welcome screen, redirect to welcome
    if (!hasSeenWelcome && !inWelcomeScreen && !inAuthGroup) {
      router.replace('/welcome');
    }
    // If user has seen welcome and is on welcome screen, redirect to tabs
    else if (hasSeenWelcome && isAuthenticated && inWelcomeScreen) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated, hasSeenWelcome, segments, navigationState?.key]);

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
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
          // تسريع الانتقالات
          animation: 'fade',
          animationDuration: 150,
        }}
      >
        <Stack.Screen 
          name="welcome" 
          options={{ 
            headerShown: false,
            animation: 'fade',
          }} 
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="match/[id]"
          options={{
            title: t('match.stats'),
            headerBackTitle: t('common.back'),
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="team/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="player/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth/login"
          options={{
            title: t('auth.login'),
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth/register"
          options={{
            title: t('auth.register'),
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="operator/index"
          options={{
            title: t('common.loading'),
          }}
        />
        <Stack.Screen
          name="operator/match/[id]"
          options={{
            title: t('match.live'),
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <RTLProvider>
      <RootLayoutContent />
    </RTLProvider>
  );
}
