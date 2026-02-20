import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { useAlert } from '@/contexts/AlertContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCartStore } from '@/store/cartStore';
import { orderApi, settingsApi } from '@/services/api';
import { router } from 'expo-router';
import { formatPrice } from '@/utils/currency';

function getLocalizedName(item: { name: string; nameAr: string; nameKu: string }, lang: string) {
  if (lang === 'ar') return item.nameAr;
  if (lang === 'ku') return item.nameKu;
  return item.name;
}

export default function CheckoutScreen() {
  const { colorScheme, isDark } = useTheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, language } = useRTL();
  const { alert } = useAlert();
  const { items, getTotal, clearCart } = useCartStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(5000);

  useEffect(() => {
    (async () => {
      try {
        const res = await settingsApi.getAll();
        const settings = res.data?.data || {};
        if (settings.delivery_fee) {
          setDeliveryFee(parseInt(settings.delivery_fee, 10) || 5000);
        }
      } catch (e) {
        console.log('Failed to load delivery fee setting, using default');
      }
    })();
  }, []);

  const total = getTotal();
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) {
      alert(t('checkout.alert'), t('checkout.nameRequired'));
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 10) {
      alert(t('checkout.alert'), t('checkout.phoneRequired'));
      return;
    }
    if (!customerAddress.trim()) {
      alert(t('checkout.alert'), t('checkout.addressRequired'));
      return;
    }

    try {
      setSubmitting(true);
      await orderApi.createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        deliveryFee,
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.name,
          productNameAr: item.nameAr,
          productNameKu: item.nameKu,
          price: item.price,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          imageUrl: item.imageUrl || null,
        })),
      });

      clearCart();
      alert(
        t('checkout.orderSent'),
        t('checkout.orderSentDesc'),
        [
          {
            text: t('checkout.trackOrder'),
            onPress: () => router.replace('/orders' as any),
          },
          {
            text: t('common.ok'),
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Place order error:', error);
      alert(t('common.error'), t('checkout.orderError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('checkout.title')}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 200 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Order Summary */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.sectionIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                <Ionicons name="receipt-outline" size={18} color={colors.accent} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('checkout.orderSummary')}</Text>
            </View>

            {items.map((item, index) => (
              <View
                key={`${item.productId}-${item.selectedSize}-${item.selectedColor}-${index}`}
                style={[styles.summaryItem, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.border }]}
              >
                <View style={[styles.summaryItemImg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%', borderRadius: RADIUS.md }} resizeMode="cover" />
                  ) : (
                    <Text style={{ fontSize: 22 }}>{item.image}</Text>
                  )}
                </View>
                <View style={styles.summaryItemInfo}>
                  <Text style={[styles.summaryItemName, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
                    {getLocalizedName(item, language)}
                  </Text>
                  <View style={[styles.summaryItemMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={[styles.summaryItemQty, { color: colors.textTertiary }]}>×{item.quantity}</Text>
                    {item.selectedSize && <Text style={[styles.summaryItemTag, { color: colors.textTertiary, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>{item.selectedSize}</Text>}
                    {item.selectedColor && <View style={[styles.summaryItemColor, { backgroundColor: item.selectedColor }]} />}
                  </View>
                </View>
                <Text style={[styles.summaryItemPrice, { color: colors.text }]}>{formatPrice(item.price * item.quantity)}</Text>
              </View>
            ))}

            <View style={[styles.totalRow, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomWidth: 0.5, borderBottomColor: 'rgba(128,128,128,0.1)', paddingBottom: SPACING.sm }]}>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>{t('checkout.products')} ({itemCount} {t('checkout.product')})</Text>
              <Text style={[styles.totalValue, { color: colors.text, fontSize: 15 }]}>{formatPrice(total)}</Text>
            </View>
            <View style={[styles.totalRow, { flexDirection: isRTL ? 'row-reverse' : 'row', paddingTop: SPACING.xs, paddingBottom: SPACING.xs }]}>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>{t('checkout.delivery')}</Text>
              <Text style={[styles.totalValue, { color: colors.accent, fontSize: 14, fontWeight: '600' }]}>{formatPrice(deliveryFee)}</Text>
            </View>
            <View style={[styles.totalRow, { flexDirection: isRTL ? 'row-reverse' : 'row', borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.15)', paddingTop: SPACING.sm }]}>
              <Text style={[styles.totalLabel, { color: colors.text, fontWeight: '800', fontSize: 15 }]}>{t('checkout.grandTotal')}</Text>
              <Text style={[styles.totalValue, { color: colors.text }]}>{formatPrice(total + deliveryFee)}</Text>
            </View>
          </View>

          {/* Payment Method */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.sectionIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                <Ionicons name="cash-outline" size={18} color={colors.accent} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('checkout.paymentMethod')}</Text>
            </View>
            <View style={[styles.paymentMethod, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.paymentIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                <Ionicons name="wallet-outline" size={22} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>{t('checkout.cashOnDelivery')}</Text>
                <Text style={[styles.paymentDesc, { color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>{t('checkout.cashOnDeliveryDesc')}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
            </View>
          </View>

          {/* Customer Info */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.sectionIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                <Ionicons name="person-outline" size={18} color={colors.accent} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('checkout.deliveryInfo')}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('checkout.fullName')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', borderColor: colors.border, color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
                placeholder={t('checkout.fullNamePlaceholder')}
                placeholderTextColor={colors.textTertiary}
                value={customerName}
                onChangeText={setCustomerName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('checkout.phone')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', borderColor: colors.border, color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
                placeholder="07XXXXXXXXX"
                placeholderTextColor={colors.textTertiary}
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('checkout.address')}</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', borderColor: colors.border, color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
                placeholder={t('checkout.addressPlaceholder')}
                placeholderTextColor={colors.textTertiary}
                value={customerAddress}
                onChangeText={setCustomerAddress}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Place Order */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <View style={[styles.bottomBarInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View>
            <Text style={[styles.bottomLabel, { color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>{t('checkout.grandTotalWithDelivery')}</Text>
            <Text style={[styles.bottomPrice, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>{formatPrice(total + deliveryFee)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.placeOrderBtn, submitting && { opacity: 0.6 }]}
            onPress={handlePlaceOrder}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isDark ? ['#4a4a4a', '#3a3a3a'] : ['#333333', '#1a1a1a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.placeOrderGradient, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.placeOrderText}>{t('checkout.confirmOrder')}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    fontFamily: FONTS.bold,
  },
  section: {
    borderRadius: RADIUS.xl,
    borderWidth: 0.5,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  sectionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    fontFamily: FONTS.bold,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    borderBottomWidth: 0.5,
  },
  summaryItemImg: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  summaryItemInfo: {
    flex: 1,
    gap: 3,
  },
  summaryItemName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  summaryItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryItemQty: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  summaryItemTag: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  summaryItemColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: FONTS.extraBold,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    margin: SPACING.lg,
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
  },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  paymentDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    fontFamily: FONTS.medium,
  },
  inputGroup: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.1,
    fontFamily: FONTS.bold,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
    borderTopWidth: 0.5,
  },
  bottomBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomLabel: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  bottomPrice: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: FONTS.extraBold,
  },
  placeOrderBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  placeOrderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
});
