// Notifications Page
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
  Platform,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '@/services/notifications';

interface Notification {
  id: string;
  type: 'goal' | 'match_start' | 'match_end' | 'pre_match' | 'red_card' | 'penalty';
  title: string;
  body: string;
  sentAt: string;
  isRead: boolean;
  matchId?: string;
  data?: any;
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { t, isRTL, flexDirection } = useRTL();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      const response = await getNotifications(page, 20);
      if (response?.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setPage(1);
    await loadNotifications();
    setRefreshing(false);
  }

  async function handleMarkAsRead(id: string) {
    const success = await markAsRead(id);
    if (success) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  }

  async function handleMarkAllAsRead() {
    const success = await markAllAsRead();
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  }

  async function handleDelete(id: string) {
    Alert.alert(
      isRTL ? 'حذف الإشعار' : 'Delete Notification',
      isRTL ? 'هل تريد حذف هذا الإشعار؟' : 'Are you sure you want to delete this notification?',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteNotification(id);
            if (success) {
              setNotifications(prev => prev.filter(n => n.id !== id));
            }
          },
        },
      ]
    );
  }

  function getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return isRTL ? 'الآن' : 'now';
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return isRTL ? `منذ ${minutes} دقيقة` : `${minutes} min ago`;
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return isRTL ? `منذ ${hours} ساعة` : `${hours} hour ago`;
    }
    const days = Math.floor(seconds / 86400);
    return isRTL ? `منذ ${days} يوم` : `${days} day ago`;
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'goal':
        return { name: 'football-outline' as const, color: colors.success };
      case 'match_start':
        return { name: 'play-circle-outline' as const, color: colors.live };
      case 'match_end':
        return { name: 'flag-outline' as const, color: colors.textSecondary };
      case 'pre_match':
        return { name: 'time-outline' as const, color: colors.warning };
      case 'red_card':
        return { name: 'square-outline' as const, color: '#FF3B30' };
      case 'penalty':
        return { name: 'flag-outline' as const, color: colors.warning };
      default:
        return { name: 'notifications-outline' as const, color: colors.accent };
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: t('settings.notifications'),
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t('settings.notifications'),
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.back()}
            >
              <Ionicons
                name={isRTL ? 'chevron-forward' : 'chevron-back'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleMarkAllAsRead}
                >
                  <Ionicons name="checkmark-done-outline" size={24} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/notification-settings' as any)}
              >
                <Ionicons name="settings-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Unread Count Banner */}
        {unreadCount > 0 && (
          <View style={[styles.unreadBanner, { backgroundColor: colors.liveBackground }]}>
            <Ionicons name="notifications" size={18} color={colors.live} />
            <Text style={[styles.unreadText, { color: colors.live }]}>
              {unreadCount} {t('settings.notifications')}
            </Text>
          </View>
        )}

        {/* Notifications List */}
        {notifications.length > 0 ? (
          notifications.map(notification => {
            const icon = getNotificationIcon(notification.type);
            return (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  {
                    backgroundColor: notification.isRead
                      ? colors.card
                      : colors.cardHighlight,
                    borderColor: notification.isRead
                      ? colors.cardBorder
                      : colors.accent,
                  },
                ]}
                onPress={() => {
                  handleMarkAsRead(notification.id);
                  if (notification.matchId) {
                    router.push(`/match/${notification.matchId}` as any);
                  }
                }}
                onLongPress={() => handleDelete(notification.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${icon.color}15` },
                  ]}
                >
                  <Ionicons name={icon.name} size={22} color={icon.color} />
                </View>

                <View style={[styles.notificationContent, { marginLeft: isRTL ? 0 : SPACING.md, marginRight: isRTL ? SPACING.md : 0 }]}>
                  <View style={[styles.notificationHeader, { flexDirection }]}>
                    <Text
                      style={[
                        styles.notificationTitle,
                        { color: colors.text },
                        !notification.isRead && styles.unreadTitle,
                      ]}
                      numberOfLines={1}
                    >
                      {notification.title}
                    </Text>
                    {!notification.isRead && (
                      <View style={[styles.unreadDot, { backgroundColor: colors.live }]} />
                    )}
                  </View>
                  <Text
                    style={[styles.notificationMessage, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {notification.body}
                  </Text>
                  <Text style={[styles.notificationTime, { color: colors.textTertiary }]}>
                    {getTimeAgo(notification.sentAt)}
                  </Text>
                </View>

                <Ionicons
                  name={isRTL ? 'chevron-back' : 'chevron-forward'}
                  size={18}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t('common.noResults')}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('settings.notifications')}
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    padding: SPACING.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  unreadText: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '600',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationTitle: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '600',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: SPACING.sm,
  },
  notificationMessage: {
    ...TYPOGRAPHY.bodySmall,
    marginTop: 2,
  },
  notificationTime: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: 4,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    marginTop: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '700',
    marginTop: SPACING.md,
    marginBottom: SPACING.xxs,
  },
  emptyText: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
  },
});
