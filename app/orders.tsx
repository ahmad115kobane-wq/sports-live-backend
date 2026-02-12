import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Image,
  InteractionManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { useTheme } from '@/contexts/ThemeContext';
import { orderApi } from '@/services/api';
import { router } from 'expo-router';
import { formatPrice } from '@/utils/currency';
import { OrdersListSkeleton } from '@/components/ui/Skeleton';

interface OrderItem {
  id: string;
  productName: string;
  productNameAr: string;
  productNameKu: string;
  price: number;
  quantity: number;
  selectedSize?: string | null;
  selectedColor?: string | null;
  imageUrl?: string | null;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  totalAmount: number;
  status: string;
  adminNote?: string | null;
  estimatedDelivery?: string | null;
  createdAt: string;
  items: OrderItem[];
}

function getLocalizedProductName(item: OrderItem, lang: string) {
  if (lang === 'ar') return item.productNameAr;
  if (lang === 'ku') return item.productNameKu;
  return item.productName;
}

const STATUS_ICONS: Record<string, string> = {
  pending: 'time-outline',
  approved: 'checkmark-circle-outline',
  rejected: 'close-circle-outline',
  delivered: 'cube-outline',
};

export default function OrdersScreen() {
  const { colorScheme, isDark } = useTheme();
  const colors = Colors[colorScheme];

  const getStatusStyle = (status: string) => {
    return {
      icon: STATUS_ICONS[status] || STATUS_ICONS.pending,
      label: t(`orders.${status}`) || status,
      color: colors.accent,
      bg: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    };
  };
  const { t, isRTL, language } = useRTL();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const response = await orderApi.getMyOrders();
      setOrders(response.data?.data || []);
    } catch (error) {
      console.error('Load orders error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      loadOrders();
    });
    return () => task.cancel();
  }, [loadOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
              <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={22} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{t('orders.trackOrders')}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
        <OrdersListSkeleton count={4} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{t('orders.trackOrders')}</Text>
            {orders.length > 0 && (
              <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>{orders.length} {t('orders.orderCount')}</Text>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Ionicons name="receipt-outline" size={28} color={colors.textTertiary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('orders.noOrders')}</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
            {t('orders.noOrdersDesc')}
          </Text>
          <TouchableOpacity
            style={[styles.shopBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', borderColor: colors.border }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={[styles.shopBtnText, { color: colors.accent }]}>{t('orders.browseStore')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {orders.map((order) => {
            const statusConf = getStatusStyle(order.status);
            const isExpanded = expandedOrder === order.id;

            return (
              <TouchableOpacity
                key={order.id}
                style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setExpandedOrder(isExpanded ? null : order.id)}
                activeOpacity={0.7}
              >
                {/* Order Header */}
                <View style={[styles.orderHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.orderStatusIcon, { backgroundColor: statusConf.bg }]}>
                    <Ionicons name={statusConf.icon as any} size={22} color={statusConf.color} />
                  </View>
                  <View style={[styles.orderInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                    <Text style={[styles.orderStatusText, { color: statusConf.color }]}>{statusConf.label}</Text>
                    <Text style={[styles.orderDate, { color: colors.textTertiary }]}>{formatDate(order.createdAt)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.orderTotal, { color: colors.text }]}>{formatPrice(order.totalAmount)}</Text>
                    <Text style={[styles.orderItemCount, { color: colors.textTertiary }]}>{order.items.length} {t('orders.product')}</Text>
                  </View>
                </View>

                {/* Admin Note / Estimated Delivery */}
                {(order.adminNote || order.estimatedDelivery) && (
                  <View style={[styles.orderNote, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderColor: colors.border }]}>
                    {order.estimatedDelivery && (
                      <View style={[styles.noteRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.noteText, { color: colors.text }]}>{t('orders.deliveryTime')}: {order.estimatedDelivery}</Text>
                      </View>
                    )}
                    {order.adminNote && (
                      <View style={[styles.noteRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.noteText, { color: colors.text }]}>{order.adminNote}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Expanded Items */}
                {isExpanded && (
                  <View style={styles.orderItems}>
                    {order.items.map((item) => (
                      <View key={item.id} style={[styles.orderItemRow, { flexDirection: isRTL ? 'row-reverse' : 'row', borderTopColor: colors.border }]}>
                        <View style={[styles.orderItemImg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                          {item.imageUrl ? (
                            <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="cover" />
                          ) : (
                            <Ionicons name="cube-outline" size={18} color={colors.textTertiary} />
                          )}
                        </View>
                        <View style={[styles.orderItemInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                          <Text style={[styles.orderItemName, { color: colors.text }]} numberOfLines={2}>
                            {getLocalizedProductName(item, language)}
                          </Text>
                          <View style={[styles.orderItemMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <Text style={[styles.orderItemMetaText, { color: colors.textTertiary }]}>×{item.quantity}</Text>
                            {item.selectedSize && <Text style={[styles.orderItemMetaText, { color: colors.textTertiary }]}>{item.selectedSize}</Text>}
                          </View>
                        </View>
                        <Text style={[styles.orderItemPrice, { color: colors.text }]}>{formatPrice(item.price * item.quantity)}</Text>
                      </View>
                    ))}

                    {/* Delivery Info */}
                    <View style={[styles.deliveryInfo, { borderTopColor: colors.border }]}>
                      <View style={[styles.deliveryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Ionicons name="person-outline" size={14} color={colors.textTertiary} />
                        <Text style={[styles.deliveryText, { color: colors.textSecondary }]}>{order.customerName}</Text>
                      </View>
                      <View style={[styles.deliveryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Ionicons name="call-outline" size={14} color={colors.textTertiary} />
                        <Text style={[styles.deliveryText, { color: colors.textSecondary }]}>{order.customerPhone}</Text>
                      </View>
                      <View style={[styles.deliveryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
                        <Text style={[styles.deliveryText, { color: colors.textSecondary }]}>{order.customerAddress}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Expand indicator */}
                <View style={styles.expandIndicator}>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textTertiary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.md,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  shopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    marginTop: SPACING.md,
    borderWidth: 1,
  },
  shopBtnText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  orderCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 0.5,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
  },
  orderStatusIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
    gap: 3,
  },
  orderStatusText: {
    fontSize: 15,
    fontWeight: '700',
  },
  orderDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '800',
  },
  orderItemCount: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  orderNote: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 6,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  orderItems: {},
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderTopWidth: 0.5,
  },
  orderItemImg: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  orderItemInfo: {
    flex: 1,
    gap: 2,
  },
  orderItemName: {
    fontSize: 13,
    fontWeight: '600',
  },
  orderItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderItemMetaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  orderItemPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  deliveryInfo: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 0.5,
    gap: 6,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  expandIndicator: {
    alignItems: 'center',
    paddingBottom: SPACING.sm,
  },
});
