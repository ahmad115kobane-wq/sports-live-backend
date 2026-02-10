import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCartStore, CartItem } from '@/store/cartStore';
import { router } from 'expo-router';
import { formatPrice } from '@/utils/currency';

function getLocalizedName(item: { name: string; nameAr: string; nameKu: string }, lang: string) {
  if (lang === 'ar') return item.nameAr;
  if (lang === 'ku') return item.nameKu;
  return item.name;
}

export default function CartScreen() {
  const { colorScheme, isDark } = useTheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, language } = useRTL();
  const { items, updateQuantity, removeItem, getTotal } = useCartStore();

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const total = getTotal();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t('store.cart')}
            </Text>
            {items.length > 0 && (
              <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
                {itemCount} {t('store.itemsCount')}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={() => router.push('/orders' as any)} style={[styles.trackBtn, { backgroundColor: isDark ? 'rgba(168,168,168,0.12)' : 'rgba(92,92,92,0.08)' }]}>
            <Ionicons name="receipt-outline" size={18} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Ionicons name="bag-outline" size={52} color={colors.textTertiary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t('store.emptyCart')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
            {t('store.emptyCartDesc')}
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isDark ? ['#4a4a4a', '#3a3a3a'] : ['#333333', '#1a1a1a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.browseBtnGradient}
            >
              <Ionicons name="storefront-outline" size={18} color="#fff" />
              <Text style={styles.browseBtnText}>
                {t('store.continueShopping')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: SPACING.md, paddingBottom: 160 }}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item, index) => (
              <CartItemCard
                key={`${item.productId}-${item.selectedSize}-${item.selectedColor}-${index}`}
                item={item}
                colors={colors}
                isDark={isDark}
                language={language}
                isRTL={isRTL}
                onUpdateQuantity={(qty) => updateQuantity(item.productId, qty, item.selectedSize, item.selectedColor)}
                onRemove={() => removeItem(item.productId, item.selectedSize, item.selectedColor)}
              />
            ))}
          </ScrollView>

          {/* Bottom Checkout */}
          <View style={[styles.checkoutBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <View style={[styles.checkoutBarInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                <Text style={[styles.totalLabel, { color: colors.textTertiary }]}>
                  {t('store.total')}
                </Text>
                <Text style={[styles.totalPrice, { color: colors.text }]}>
                  {formatPrice(total)}
                </Text>
              </View>
              <TouchableOpacity style={styles.checkoutBtn} activeOpacity={0.8} onPress={() => router.push('/checkout' as any)}>
                <LinearGradient
                  colors={isDark ? ['#4a4a4a', '#3a3a3a'] : ['#333333', '#1a1a1a']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.checkoutGradient, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                >
                  <Ionicons name="card" size={18} color="#fff" />
                  <Text style={styles.checkoutText}>
                    {t('store.checkout')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

function CartItemCard({
  item, colors, isDark, language, isRTL, onUpdateQuantity, onRemove,
}: {
  item: CartItem; colors: any; isDark: boolean; language: string; isRTL: boolean;
  onUpdateQuantity: (qty: number) => void; onRemove: () => void;
}) {
  return (
    <View style={[styles.cartItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.cartItemRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {/* Product Image/Emoji */}
        <View style={[styles.cartItemImage, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', overflow: 'hidden' }]}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Text style={styles.cartItemEmoji}>{item.image}</Text>
          )}
        </View>

        {/* Product Info */}
        <View style={[styles.cartItemInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.cartItemName, { color: colors.text }]} numberOfLines={2}>
            {getLocalizedName(item, language)}
          </Text>
          <View style={[styles.cartItemMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {item.selectedSize && (
              <Text style={[styles.cartItemMetaText, { color: colors.textTertiary }]}>
                {item.selectedSize}
              </Text>
            )}
            {item.selectedColor && (
              <View style={[styles.cartItemColorDot, { backgroundColor: item.selectedColor }]} />
            )}
          </View>
          <View style={[styles.cartItemPriceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.cartItemPrice, { color: colors.text }]}>
              {formatPrice(item.price)}
            </Text>
            {item.originalPrice && (
              <Text style={[styles.cartItemOrigPrice, { color: colors.textTertiary }]}>
                {formatPrice(item.originalPrice)}
              </Text>
            )}
          </View>
        </View>

        {/* Remove Button */}
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
          <Ionicons name="close-circle" size={22} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Quantity Controls */}
      <View style={[styles.quantityBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.quantityControls, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            onPress={() => onUpdateQuantity(item.quantity - 1)}
            style={[styles.qtyBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
          >
            <Ionicons name="remove" size={16} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => onUpdateQuantity(item.quantity + 1)}
            style={[styles.qtyBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
          >
            <Ionicons name="add" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.itemTotal, { color: colors.text }]}>
          {formatPrice(item.price * item.quantity)}
        </Text>
      </View>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.headlineMedium,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  trackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.md,
  },
  emptyIconWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.lg,
  },
  browseBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginTop: SPACING.xl,
  },
  browseBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  browseBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cartItem: {
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 0.5,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemEmoji: {
    fontSize: 30,
  },
  cartItemInfo: {
    flex: 1,
    gap: 4,
  },
  cartItemName: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
  },
  cartItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cartItemMetaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cartItemColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  cartItemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cartItemPrice: {
    fontSize: 15,
    fontWeight: '800',
  },
  cartItemOrigPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  removeBtn: {
    padding: 4,
  },
  quantityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(128,128,128,0.15)',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '800',
  },
  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
    borderTopWidth: 0.5,
  },
  checkoutBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: '800',
  },
  checkoutBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  checkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
