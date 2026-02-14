// Notifications Page
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  RefreshControl,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { useAlert } from '@/contexts/AlertContext';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '@/services/notifications';
import EventIcon from '@/components/ui/EventIcon';
import { NotificationsListSkeleton } from '@/components/ui/Skeleton';

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
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();
  const { alert } = useAlert();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      loadNotifications().then(() => {
        // Auto-mark all as read when page opens
        markAllAsRead().then(() => {
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        });
      });
    });
    return () => task.cancel();
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
    alert(
      t('notifications.deleteNotification'),
      t('notifications.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
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

    if (seconds < 60) return t('time.justNow');
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return t('time.minutesAgo', { count: minutes });
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return t('time.hoursAgo', { count: hours });
    }
    const days = Math.floor(seconds / 86400);
    return t('time.daysAgo', { count: days });
  }

  const getNotificationEventType = (type: Notification['type']): { eventType: string; color: string } => {
    switch (type) {
      case 'goal':
        return { eventType: 'goal', color: colors.goal };
      case 'match_start':
        return { eventType: 'start_half', color: colors.success };
      case 'match_end':
        return { eventType: 'end_match', color: colors.textTertiary };
      case 'pre_match':
        return { eventType: 'start_half', color: colors.warning };
      case 'red_card':
        return { eventType: 'red_card', color: colors.redCard };
      case 'penalty':
        return { eventType: 'penalty', color: colors.error };
      default:
        return { eventType: 'goal', color: colors.accent };
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
            headerTintColor: colors.text,
          }}
        />
        <NotificationsListSkeleton count={8} />
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
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.back()}
            >
              <Ionicons
                name={isRTL ? 'chevron-back' : 'chevron-forward'}
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push('/notification-settings' as any)}
            >
              <Ionicons name="settings-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          notifications.length === 0 && { flex: 1 }
        ]}
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
            const eventInfo = getNotificationEventType(notification.type);
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
                    flexDirection: isRTL ? 'row-reverse' : 'row',
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
                    { backgroundColor: `${eventInfo.color}15` },
                  ]}
                >
                  <EventIcon type={eventInfo.eventType} size={26} color={eventInfo.color} />
                </View>

                <View style={[styles.notificationContent, { marginLeft: isRTL ? 0 : SPACING.md, marginRight: isRTL ? SPACING.md : 0 }]}>
                  <View style={[styles.notificationHeader, { flexDirection }]}>
                    <Text
                      style={[
                        styles.notificationTitle,
                        { color: colors.text },
                        !notification.isRead && styles.unreadTitle,
                      ]}
                      numberOfLines={2} ellipsizeMode="tail"
                    >
                      {notification.title}
                    </Text>
                    {!notification.isRead && (
                      <View style={[styles.unreadDot, { backgroundColor: colors.live }]} />
                    )}
                  </View>
                  <Text
                    style={[styles.notificationMessage, { color: colors.textSecondary }]}
                    numberOfLines={2} ellipsizeMode="tail"
                  >
                    {notification.body}
                  </Text>
                  <Text style={[styles.notificationTime, { color: colors.textTertiary }]}>
                    {getTimeAgo(notification.sentAt)}
                  </Text>
                </View>

                <Ionicons
                  name={isRTL ? 'chevron-forward' : 'chevron-back'}
                  size={20}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              لا يوجد نتائج
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              لا يوجد إشعارات
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
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  unreadText: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    ...SHADOWS.xs,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
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
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.2,
  },
  unreadTitle: {
    fontWeight: '800',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: SPACING.sm,
  },
  notificationMessage: {
    ...TYPOGRAPHY.bodySmall,
    marginTop: 4,
    lineHeight: 18,
    opacity: 0.75,
  },
  notificationTime: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: 6,
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
    textAlign: 'center',
    fontFamily: FONTS.bold,
  },
  emptyText: {
    ...TYPOGRAPHY.bodyMedium,
    textAlign: 'center',
    opacity: 0.6,
  },
});
