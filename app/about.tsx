import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { useTheme } from '@/contexts/ThemeContext';
import AppIcon from '@/components/AppIcon';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';

export default function AboutScreen() {
  const { colorScheme, isDark } = useTheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();

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
      <View style={[styles.infoContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: onPress ? colors.accent : colors.text }]}>{value}</Text>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings.about')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* App Logo & Name */}
        <View style={styles.logoSection}>
          <AppIcon size={100} />
          <Text style={[styles.appName, { color: colors.text, marginTop: SPACING.md }]}>{t('app.name')}</Text>
          <Text style={[styles.appVersion, { color: colors.textTertiary }]}>
            {t('settings.version')} {APP_VERSION} ({BUILD_NUMBER})
          </Text>
          <Text style={[styles.appTagline, { color: colors.textSecondary }]}>
            {t('welcome.tagline')}
          </Text>
        </View>

        {/* App Info Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('about.appInfo')}
          </Text>
          <InfoRow icon="code-slash-outline" label={t('about.version')} value={`${APP_VERSION} (${BUILD_NUMBER})`} />
          <InfoRow icon="phone-portrait-outline" label={t('about.platform')} value={Platform.OS === 'ios' ? 'iOS' : 'Android'} />
          <InfoRow icon="globe-outline" label={t('about.developer')} value="Mini Football Team" />
        </View>

        {/* Legal Links Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('settings.legalPages')}
          </Text>
          <InfoRow
            icon="shield-checkmark-outline"
            label={t('about.readOur')}
            value={t('settings.privacy')}
            onPress={() => router.push('/legal/privacy-policy' as any)}
          />
          <InfoRow
            icon="document-text-outline"
            label={t('about.readOur')}
            value={t('settings.terms')}
            onPress={() => router.push('/legal/terms-of-service' as any)}
          />
        </View>

        {/* Contact Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('about.contact')}
          </Text>
          <InfoRow
            icon="mail-outline"
            label={t('about.email')}
            value="support@minifootball.app"
            onPress={() => Linking.openURL('mailto:support@minifootball.app')}
          />
          <InfoRow
            icon="logo-instagram"
            label={t('about.socialMedia')}
            value="@minifootball"
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textQuaternary }]}>
            © 2026 Mini Football. {t('about.allRightsReserved')}
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
  },
  scrollContent: {
    padding: SPACING.md,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  logoBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: SPACING.md,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
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
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
