import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Stack, router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { useAuthStore } from '@/store/authStore';
import PageHeader from '@/components/ui/PageHeader';

const TAB_ITEMS = [
  { key: 'index', label: 'إنشاء مباراة', icon: 'add-circle' as const, route: '/admin' },
  { key: 'competitions', label: 'البطولات', icon: 'trophy' as const, route: '/admin/competitions' },
  { key: 'teams', label: 'الأندية', icon: 'shield' as const, route: '/admin/teams' },
  { key: 'matches', label: 'المباريات', icon: 'football' as const, route: '/admin/matches' },
  { key: 'referees', label: 'الحكام', icon: 'flag' as const, route: '/admin/referees' },
  { key: 'supervisors', label: 'المشرفون', icon: 'eye' as const, route: '/admin/supervisors' },
  { key: 'users', label: 'المستخدمون', icon: 'people' as const, route: '/admin/users' },
  { key: 'store', label: 'المتجر', icon: 'bag-handle' as const, route: '/admin/store' },
  { key: 'sliders', label: 'الإعلانات', icon: 'images' as const, route: '/admin/sliders' },
  { key: 'legal', label: 'الصفحات القانونية', icon: 'document-text' as const, route: '/admin/legal' },
  { key: 'settings', label: 'الإعدادات', icon: 'settings' as const, route: '/admin/settings' },
];

export default function AdminLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();
  const pathname = usePathname();
  const { user } = useAuthStore();

  const getActiveTab = () => {
    if (pathname === '/admin' || pathname === '/admin/index') return 'index';
    if (pathname.includes('/admin/competitions')) return 'competitions';
    if (pathname.includes('/admin/matches')) return 'matches';
    if (pathname.includes('/admin/teams')) return 'teams';
    if (pathname.includes('/admin/referees')) return 'referees';
    if (pathname.includes('/admin/supervisors')) return 'supervisors';
    if (pathname.includes('/admin/users')) return 'users';
    if (pathname.includes('/admin/store')) return 'store';
    if (pathname.includes('/admin/sliders')) return 'sliders';
    if (pathname.includes('/admin/legal')) return 'legal';
    if (pathname.includes('/admin/settings')) return 'settings';
    return 'index';
  };

  const activeTab = getActiveTab();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PageHeader
        title={t('admin.dashboard') || 'لوحة الإدارة'}
        subtitle={`${t('home.welcome') || 'مرحباً'}${user?.name ? `, ${user.name}` : ''}`}
        compact
        rightContent={
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace('/(tabs)/profile' as any)}
          >
            <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={18} color={colors.text} />
          </TouchableOpacity>
        }
      >
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
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' },
                activeTab === tab.key && { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' },
              ]}
              onPress={() => router.push(tab.route as any)}
            >
              <Ionicons 
                name={tab.icon} 
                size={18} 
                color={activeTab === tab.key ? colors.text : colors.textTertiary} 
              />
              <Text style={[
                styles.tabLabel,
                { color: activeTab === tab.key ? colors.text : colors.textTertiary },
                activeTab === tab.key && styles.tabLabelActive,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </PageHeader>

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
        <Stack.Screen name="referees" />
        <Stack.Screen name="supervisors" />
        <Stack.Screen name="users" />
        <Stack.Screen name="store" />
        <Stack.Screen name="sliders" />
        <Stack.Screen name="legal" />
        <Stack.Screen name="video-ads" />
        <Stack.Screen name="settings" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(128,128,128,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.12)',
  },
  tabsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.xl,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
    fontFamily: FONTS.semiBold,
  },
  tabLabelActive: {
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
});
