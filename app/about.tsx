import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Linking,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, FONTS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { useTheme } from '@/contexts/ThemeContext';
import { settingsApi } from '@/services/api';

const APP_VERSION = '1.0.0';

export default function AboutScreen() {
  const { colorScheme, isDark } = useTheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsApi.getAll()
      .then(res => setSettings(res.data.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const contactEmail = settings.contact_email || '';
  const contactPhone = settings.contact_phone || '';
  const contactInstagram = settings.contact_instagram || '';
  const contactFacebook = settings.contact_facebook || '';
  const contactTelegram = settings.contact_telegram || '';
  const contactWebsite = settings.contact_website || '';

  const InfoRow = ({ icon, label, value, onPress }: { icon: string; label: string; value: string; onPress?: () => void }) => (
    <TouchableOpacity
      style={[styles.infoRow, { flexDirection, borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={[styles.infoIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
        <Ionicons name={icon as any} size={18} color={colors.accent} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoValue, { color: onPress ? colors.accent : colors.text, textAlign: isRTL ? 'right' : 'left' }]}>{value}</Text>
      </View>
      {onPress && (
        <Ionicons name="open-outline" size={16} color={colors.textQuaternary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>حول التطبيق</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* App Logo & Name */}
        <View style={styles.logoSection}>
          <Image source={require('@/assets/icon.png')} style={{ width: 100, height: 100, borderRadius: 24 }} resizeMode="contain" />
          <Text style={[styles.appName, { color: colors.text, marginTop: SPACING.md }]}>{t('app.name')}</Text>
          <Text style={[styles.appVersion, { color: colors.textTertiary }]}>
            الإصدار {APP_VERSION}
          </Text>
        </View>

        {/* Legal Links Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
            الصفحات القانونية
          </Text>
          <InfoRow
            icon="shield-checkmark-outline"
            label="سياسة الخصوصية"
            value={t('settings.privacy') || 'سياسة الخصوصية'}
            onPress={() => router.push('/legal/privacy-policy' as any)}
          />
          <InfoRow
            icon="document-text-outline"
            label="شروط الاستخدام"
            value={t('settings.terms') || 'شروط الاستخدام'}
            onPress={() => router.push('/legal/terms-of-service' as any)}
          />
        </View>

        {/* Contact Card */}
        {loading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: SPACING.md }} />
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
              تواصل معنا
            </Text>
            {!!contactEmail && (
              <InfoRow
                icon="mail-outline"
                label="البريد الإلكتروني"
                value={contactEmail}
                onPress={() => Linking.openURL(`mailto:${contactEmail}`)}
              />
            )}
            {!!contactPhone && (
              <InfoRow
                icon="call-outline"
                label="الهاتف"
                value={contactPhone}
                onPress={() => Linking.openURL(`tel:${contactPhone}`)}
              />
            )}
            {!!contactInstagram && (
              <InfoRow
                icon="logo-instagram"
                label="انستغرام"
                value={contactInstagram}
                onPress={() => Linking.openURL(`https://instagram.com/${contactInstagram.replace('@', '')}`)}
              />
            )}
            {!!contactFacebook && (
              <InfoRow
                icon="logo-facebook"
                label="فيسبوك"
                value={contactFacebook}
                onPress={() => Linking.openURL(contactFacebook.startsWith('http') ? contactFacebook : `https://facebook.com/${contactFacebook}`)}
              />
            )}
            {!!contactTelegram && (
              <InfoRow
                icon="paper-plane-outline"
                label="تيليغرام"
                value={contactTelegram}
                onPress={() => Linking.openURL(`https://t.me/${contactTelegram.replace('@', '')}`)}
              />
            )}
            {!!contactWebsite && (
              <InfoRow
                icon="globe-outline"
                label="الموقع"
                value={contactWebsite}
                onPress={() => Linking.openURL(contactWebsite.startsWith('http') ? contactWebsite : `https://${contactWebsite}`)}
              />
            )}
            {!contactEmail && !contactPhone && !contactInstagram && !contactFacebook && !contactTelegram && !contactWebsite && (
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>لم يتم إضافة معلومات الاتصال بعد</Text>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textQuaternary }]}>
            © {new Date().getFullYear()} {t('app.name')}. جميع الحقوق محفوظة
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24) + 10;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: STATUS_BAR_HEIGHT,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: FONTS.bold,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
    fontFamily: FONTS.extraBold,
  },
  appVersion: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    fontFamily: FONTS.medium,
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
    fontFamily: FONTS.bold,
  },
  infoRow: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: SPACING.md,
    fontFamily: FONTS.regular,
  },
  footer: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
});
