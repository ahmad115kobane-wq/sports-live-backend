import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Stack, router, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { useAuthStore } from '@/store/authStore';

const TAB_ITEMS = [
  { key: 'index', label: 'إنشاء مباراة', icon: 'add-circle' as const, route: '/admin' },
  { key: 'competitions', label: 'البطولات', icon: 'trophy' as const, route: '/admin/competitions' },
  { key: 'teams', label: 'الأندية', icon: 'shield' as const, route: '/admin/teams' },
  { key: 'matches', label: 'المباريات', icon: 'football' as const, route: '/admin/matches' },
  { key: 'users', label: 'المستخدمون', icon: 'people' as const, route: '/admin/users' },
];

export default function AdminLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { isRTL, flexDirection } = useRTL();
  const pathname = usePathname();
  const { user } = useAuthStore();

  const getActiveTab = () => {
    if (pathname === '/admin' || pathname === '/admin/index') return 'index';
    if (pathname.includes('/admin/competitions')) return 'competitions';
    if (pathname.includes('/admin/matches')) return 'matches';
    if (pathname.includes('/admin/teams')) return 'teams';
    if (pathname.includes('/admin/users')) return 'users';
    return 'index';
  };

  const activeTab = getActiveTab();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={colors.gradients.premium}
        style={styles.header}
      >
        <View style={[styles.headerContent, { flexDirection }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>لوحة الإدارة</Text>
            <Text style={styles.headerSubtitle}>مرحباً، {user?.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              useAuthStore.getState().logout();
              router.replace('/');
            }}
          >
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabsContainer, { flexDirection }]}
        >
          {TAB_ITEMS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabItem,
                activeTab === tab.key && styles.tabItemActive,
              ]}
              onPress={() => router.push(tab.route as any)}
            >
              <Ionicons 
                name={tab.icon} 
                size={20} 
                color={activeTab === tab.key ? '#fff' : 'rgba(255,255,255,0.6)'} 
              />
              <Text style={[
                styles.tabLabel,
                activeTab === tab.key && styles.tabLabelActive,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Content */}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="competitions" />
        <Stack.Screen name="teams" />
        <Stack.Screen name="matches" />
        <Stack.Screen name="users" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: SPACING.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.titleLarge,
    color: '#fff',
    fontWeight: '700',
  },
  headerSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    gap: SPACING.xs,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabItemActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabLabel: {
    ...TYPOGRAPHY.labelMedium,
    color: 'rgba(255,255,255,0.6)',
  },
  tabLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
