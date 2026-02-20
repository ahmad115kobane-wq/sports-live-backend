import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Animated,
  Image,
  InteractionManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import { useRTL } from '@/contexts/RTLContext';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import LanguageSelector from '@/components/LanguageSelector';
import { SOCKET_URL } from '@/constants/config';
import { legalApi, userApi } from '@/services/api';
import { useAlert } from '@/contexts/AlertContext';

const STATUS_TOP = Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24);

export default function ProfileScreen() {
  const { colorScheme, isDark, themeMode, setThemeMode } = useTheme();
  const colors = Colors[colorScheme];
  const { user, isAuthenticated, logout, isGuest } = useAuthStore();
  const { t, isRTL, languageInfo, flexDirection } = useRTL();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const { alert } = useAlert();
  const [legalPages, setLegalPages] = useState<{ id: string; slug: string; title: string; titleAr: string; titleKu: string }[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
      ]).start();
      legalApi.getAll().then(res => setLegalPages(res.data.data || [])).catch(() => {});
    });
    return () => task.cancel();
  }, []);

  const getLegalTitle = (page: typeof legalPages[0]) => {
    const lang = languageInfo?.code || 'ar';
    if (lang === 'ku') return page.titleKu || page.titleAr || page.title;
    if (lang === 'ar') return page.titleAr || page.title;
    return page.title;
  };

  const handleLogout = () => {
    alert(t('settings.logout'), t('settings.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logout'),
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const handleDeleteAccount = () => {
    alert(
      t('settings.deleteAccount'),
      t('settings.deleteAccountWarning'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.deleteAccount'),
          style: 'destructive',
          onPress: async () => {
            try {
              await userApi.deleteAccount();
              alert(t('settings.deleteAccountSuccess'));
              logout();
            } catch (error) {
              alert(t('settings.deleteAccountFailed'));
            }
          },
        },
      ]
    );
  };

  const getRoleIcon = (role: string): keyof typeof Ionicons.glyphMap => {
    switch (role) {
      case 'admin': return 'shield-checkmark';
      case 'operator': return 'radio';
      case 'publisher': return 'newspaper';
      case 'delegate': return 'people-circle';
      case 'merchant': return 'bag-handle';
      default: return 'person';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return t('settings.title');
      case 'operator': return t('match.live');
      case 'publisher': return t('news.title');
      case 'delegate': return 'مكلف';
      case 'merchant': return 'تاجر';
      default: return t('auth.login');
    }
  };

  // ── Section Card wrapper ──
  const SectionCard = ({ children, style }: { children: React.ReactNode; style?: any }) => (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {children}
    </View>
  );

  // ── Row Item inside a card ──
  const RowItem = ({
    icon, iconColor, iconBg, label, sublabel, onPress, trailing, emoji, isLast, gradientColors,
  }: {
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    iconBg?: string;
    label: string;
    sublabel?: string;
    onPress?: () => void;
    trailing?: React.ReactNode;
    emoji?: string;
    isLast?: boolean;
    gradientColors?: readonly [string, string, ...string[]];
  }) => (
    <TouchableOpacity
      style={[styles.rowItem, { flexDirection }, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      {gradientColors ? (
        <LinearGradient colors={gradientColors} style={styles.rowIconWrap}>
          {icon && <Ionicons name={icon} size={18} color="#fff" />}
        </LinearGradient>
      ) : (
        <View style={[styles.rowIconWrap, { backgroundColor: iconBg || colors.backgroundSecondary }]}>
          {emoji ? (
            <Text style={{ fontSize: 18 }}>{emoji}</Text>
          ) : icon ? (
            <Ionicons name={icon} size={18} color={iconColor || colors.text} />
          ) : null}
        </View>
      )}
      <View style={[styles.rowContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.rowLabel, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{label}</Text>
        {sublabel ? <Text style={[styles.rowSublabel, { color: colors.textTertiary }]}>{sublabel}</Text> : null}
      </View>
      {trailing || (
        <Ionicons
          name={isRTL ? 'chevron-forward' : 'chevron-back'}
          size={18}
          color={colors.textQuaternary}
        />
      )}
    </TouchableOpacity>
  );

  // ── Theme pill ──
  const ThemePill = ({ mode, icon, label }: { mode: ThemeMode; icon: keyof typeof Ionicons.glyphMap; label: string }) => {
    const active = themeMode === mode;
    return (
      <TouchableOpacity
        style={[
          styles.themePill,
          { backgroundColor: active ? colors.accent : 'transparent', borderColor: active ? colors.accent : colors.border },
        ]}
        onPress={() => setThemeMode(mode)}
        activeOpacity={0.7}
      >
        <Ionicons name={icon} size={16} color={active ? '#fff' : colors.textTertiary} />
        <Text style={[styles.themePillText, { color: active ? '#fff' : colors.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{label}</Text>
      </TouchableOpacity>
    );
  };

  // ── Unauthenticated (not logged in at all) ──
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <LanguageSelector visible={showLanguageSelector} onClose={() => setShowLanguageSelector(false)} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.guestContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Hero Card */}
            <View style={[styles.guestHero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <LinearGradient colors={colors.gradients.accent} style={styles.guestAvatar}>
                <Ionicons name="person-outline" size={32} color="#fff" />
              </LinearGradient>
              <Text style={[styles.guestTitle, { color: colors.text }]}>{t('home.welcome')}</Text>
              <Text style={[styles.guestSubtitle, { color: colors.textSecondary }]}>{t('favorites.addFavorites')}</Text>
              <View style={styles.guestActions}>
                <Button title={t('auth.login')} onPress={() => router.push('/auth/login')} variant="primary" size="large" fullWidth />
                <Button title={t('auth.register')} onPress={() => router.push('/auth/register')} variant="outline" size="large" fullWidth />
              </View>
            </View>

            {/* Settings */}
            <Text style={[styles.sectionTitle, { color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('settings.title')}
            </Text>
            <SectionCard>
              <RowItem emoji={languageInfo.flag} label={t('settings.language')} sublabel={languageInfo.nativeName} onPress={() => setShowLanguageSelector(true)} isLast />
            </SectionCard>

            {/* Theme */}
            <Text style={[styles.sectionTitle, { color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('settings.theme')}
            </Text>
            <View style={[styles.themeRow, { flexDirection }]}>
              <ThemePill mode="light" icon="sunny-outline" label={t('settings.lightMode')} />
              <ThemePill mode="dark" icon="moon-outline" label={t('settings.darkMode')} />
              <ThemePill mode="system" icon="phone-portrait-outline" label={t('settings.systemMode')} />
            </View>

            {/* Legal & Privacy */}
            <Text style={[styles.sectionTitle, { color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('settings.legalPages')}
            </Text>
            <SectionCard>
              {legalPages.filter(p => p.slug !== 'about-app').map((page) => (
                <RowItem
                  key={page.id}
                  icon={page.slug === 'privacy-policy' ? 'shield-checkmark-outline' : page.slug === 'terms-of-service' ? 'document-text-outline' : 'document-outline'}
                  iconBg={colors.backgroundTertiary}
                  label={getLegalTitle(page)}
                  onPress={() => router.push(`/legal/${page.slug}` as any)}
                />
              ))}
              <RowItem icon="information-circle-outline" iconBg={colors.backgroundTertiary} label={t('settings.about')} sublabel={`${t('settings.version')} 1.0.0`} onPress={() => router.push('/about' as any)} isLast />
            </SectionCard>
          </Animated.View>
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  // ── Authenticated ──
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : '?';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <LanguageSelector visible={showLanguageSelector} onClose={() => setShowLanguageSelector(false)} />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ══════ PROFILE HEADER ══════ */}
        <View style={[styles.headerBg, { backgroundColor: colors.backgroundSecondary }]}>
          {/* Top row: settings gear */}
          <View style={[styles.headerTopRow, { flexDirection }]}>
            <View style={{ flex: 1 }} />
            {!isGuest && (
              <TouchableOpacity
                style={[styles.headerIconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
                onPress={() => router.push('/edit-profile' as any)}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Avatar + Name Card */}
          <View style={styles.profileCardWrap}>
            <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Avatar */}
              <View style={styles.avatarOuter}>
                <View style={[styles.avatarRing, { borderColor: colors.accent }]}>
                  {user?.avatar ? (
                    <Image source={{ uri: `${SOCKET_URL}${user.avatar}` }} style={styles.avatarImg} />
                  ) : (
                    <LinearGradient colors={colors.gradients.accent} style={styles.avatarImg}>
                      <Text style={styles.avatarInitials}>{initials}</Text>
                    </LinearGradient>
                  )}
                </View>
                {/* Role badge overlapping avatar */}
                <View style={[styles.roleBadge, { backgroundColor: colors.accent, borderColor: colors.surface }]}>
                  <Ionicons name={getRoleIcon(user?.role || 'user')} size={10} color="#fff" />
                </View>
              </View>

              {/* Name & Email */}
              <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{user?.name}</Text>
              {!isGuest && user?.email && (
                <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user.email}</Text>
              )}

              {/* Role Chip */}
              <View style={[styles.roleChip, { backgroundColor: colors.accent + '15' }]}>
                <Text style={[styles.roleChipText, { color: colors.accent }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {isGuest ? t('welcome.guestAccount') : getRoleLabel(user?.role || 'user')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ══════ BODY ══════ */}
        <View style={styles.body}>
          {/* Upgrade Banner for Guest */}
          {isGuest && (
            <TouchableOpacity
              style={[styles.upgradeBanner, { backgroundColor: colors.accent + '10', borderColor: colors.accent + '25' }]}
              onPress={() => router.push('/auth/register')}
              activeOpacity={0.8}
            >
              <View style={[styles.upgradeBannerIcon, { backgroundColor: colors.accent + '20' }]}>
                <Ionicons name="arrow-up-circle" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.upgradeBannerTitle, { color: colors.text }]}>{t('welcome.upgradeAccount')}</Text>
                <Text style={[styles.upgradeBannerDesc, { color: colors.textSecondary }]}>{t('welcome.upgradeDescription')}</Text>
              </View>
              <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={16} color={colors.accent} />
            </TouchableOpacity>
          )}

          {/* ── Quick Access (Admin / Operator / Publisher / Delegate / Merchant) ── */}
          {(user?.role === 'operator' || user?.role === 'admin' || user?.role === 'publisher' || user?.role === 'delegate' || user?.role === 'merchant') && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('tabs.matches')}
              </Text>
              <SectionCard>
                {(user?.role === 'operator' || user?.role === 'admin') && (
                  <RowItem
                    icon="radio"
                    gradientColors={colors.gradients.live}
                    label={t('match.live')}
                    sublabel={t('tabs.matches')}
                    onPress={() => router.push('/operator')}
                    isLast={user?.role === 'operator'}
                  />
                )}
                {(user?.role === 'publisher' || user?.role === 'admin') && (
                  <RowItem
                    icon="newspaper"
                    gradientColors={['#8B5CF6', '#7C3AED'] as unknown as readonly [string, string, ...string[]]}
                    label={t('news.publisherPanel')}
                    sublabel={t('news.title')}
                    onPress={() => router.push('/publisher' as any)}
                    isLast={user?.role === 'publisher'}
                  />
                )}
                {(user?.role === 'delegate' || user?.role === 'admin') && (
                  <RowItem
                    icon="people-circle"
                    gradientColors={['#059669', '#047857'] as unknown as readonly [string, string, ...string[]]}
                    label="لوحة المكلف"
                    sublabel="إدارة البطولة المعينة"
                    onPress={() => router.push('/delegate' as any)}
                    isLast={user?.role === 'delegate'}
                  />
                )}
                {(user?.role === 'merchant' || user?.role === 'admin') && (
                  <RowItem
                    icon="bag-handle"
                    gradientColors={['#f59e0b', '#d97706'] as unknown as readonly [string, string, ...string[]]}
                    label={t('store.storeManagement')}
                    sublabel={t('store.productsOffersCategories')}
                    onPress={() => router.push('/store-dashboard' as any)}
                    isLast={user?.role === 'merchant'}
                  />
                )}
                {user?.role === 'admin' && (
                  <RowItem
                    icon="settings"
                    gradientColors={colors.gradients.premium}
                    label={t('settings.title')}
                    sublabel={t('tabs.matches')}
                    onPress={() => router.push('/admin')}
                    isLast
                  />
                )}
              </SectionCard>
            </>
          )}

          {/* ── General Settings ── */}
          <Text style={[styles.sectionTitle, { color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('settings.title')}
          </Text>
          <SectionCard>
            <RowItem
              emoji={languageInfo.flag}
              label={t('settings.language')}
              sublabel={languageInfo.nativeName}
              onPress={() => setShowLanguageSelector(true)}
            />
            <RowItem
              icon="notifications-outline"
              iconBg={colors.backgroundTertiary}
              label={t('settings.notifications')}
              sublabel={t('settings.matchNotifications')}
              onPress={() => router.push('/notification-settings' as any)}
              isLast
            />
          </SectionCard>

          {/* ── Theme ── */}
          <Text style={[styles.sectionTitle, { color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('settings.theme')}
          </Text>
          <View style={[styles.themeRow, { flexDirection }]}>
            <ThemePill mode="light" icon="sunny-outline" label={t('settings.lightMode')} />
            <ThemePill mode="dark" icon="moon-outline" label={t('settings.darkMode')} />
            <ThemePill mode="system" icon="phone-portrait-outline" label={t('settings.systemMode')} />
          </View>

          {/* ── Legal & Privacy ── */}
          <Text style={[styles.sectionTitle, { color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('settings.legalPages')}
          </Text>
          <SectionCard>
            {legalPages.filter(p => p.slug !== 'about-app').map((page) => (
              <RowItem
                key={page.id}
                icon={page.slug === 'privacy-policy' ? 'shield-checkmark-outline' : page.slug === 'terms-of-service' ? 'document-text-outline' : 'document-outline'}
                iconBg={colors.backgroundTertiary}
                label={getLegalTitle(page)}
                onPress={() => router.push(`/legal/${page.slug}` as any)}
              />
            ))}
            <RowItem
              icon="information-circle-outline"
              iconBg={colors.backgroundTertiary}
              label={t('settings.about')}
              sublabel={`${t('settings.version')} 1.0.0`}
              onPress={() => router.push('/about' as any)}
            />
            <RowItem
              icon="people-circle-outline"
              iconBg={colors.backgroundTertiary}
              label="من نحن"
              sublabel="أعضاء الاتحاد والتعريف"
              onPress={() => router.push('/about-us' as any)}
              isLast
            />
          </SectionCard>

          {/* ── Account Actions ── */}
          <Text style={[styles.sectionTitle, { color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('settings.account')}
          </Text>
          <SectionCard>
            <TouchableOpacity
              style={[styles.rowItem, { flexDirection }, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              onPress={handleLogout}
              activeOpacity={0.6}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: isDark ? 'rgba(255,80,80,0.12)' : 'rgba(220,38,38,0.08)' }]}>
                <Ionicons name="log-out-outline" size={18} color={isDark ? '#FF6B6B' : '#DC2626'} />
              </View>
              <View style={[styles.rowContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text style={[styles.rowLabel, { color: isDark ? '#FF6B6B' : '#DC2626' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{t('settings.logout')}</Text>
              </View>
              <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={18} color={colors.textQuaternary} />
            </TouchableOpacity>
            {!isGuest && (
              <TouchableOpacity
                style={[styles.rowItem, { flexDirection }]}
                onPress={handleDeleteAccount}
                activeOpacity={0.6}
              >
                <View style={[styles.rowIconWrap, { backgroundColor: isDark ? 'rgba(255,80,80,0.12)' : 'rgba(220,38,38,0.08)' }]}>
                  <Ionicons name="trash-outline" size={18} color={isDark ? '#FF6B6B' : '#DC2626'} />
                </View>
                <View style={[styles.rowContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[styles.rowLabel, { color: isDark ? '#FF6B6B' : '#DC2626' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{t('settings.deleteAccount')}</Text>
                  <Text style={[styles.rowSublabel, { color: colors.textTertiary }]}>{t('settings.deleteAccountDesc')}</Text>
                </View>
              </TouchableOpacity>
            )}
          </SectionCard>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textQuaternary }]}>Mini Football Iraq v1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ══════ Guest ══════
  guestContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: STATUS_TOP + SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  guestHero: {
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxl + 4,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: SPACING.xl,
  },
  guestAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  guestTitle: {
    ...TYPOGRAPHY.headlineMedium,
    fontWeight: '800',
    marginBottom: SPACING.xs,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  guestSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
    opacity: 0.7,
  },
  guestActions: {
    width: '100%',
    gap: SPACING.md,
  },

  // ══════ Authenticated Header ══════
  headerBg: {
    paddingTop: STATUS_TOP,
    paddingBottom: 52,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCardWrap: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
  },
  profileCard: {
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
  },

  // ── Avatar ──
  avatarOuter: {
    marginBottom: SPACING.md,
    position: 'relative',
  },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2.5,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: 74,
    height: 74,
    borderRadius: 37,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  roleBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  profileName: {
    ...TYPOGRAPHY.headlineLarge,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  profileEmail: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  roleChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginTop: SPACING.xs,
  },
  roleChipText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ══════ Body ══════
  body: {
    paddingHorizontal: SPACING.lg,
    marginTop: -28,
  },

  // ── Sections ──
  sectionTitle: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xs,
    textTransform: 'uppercase',
    opacity: 0.5,
  },
  sectionCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // ── Row Items ──
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    minHeight: 54,
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  rowSublabel: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: 2,
    opacity: 0.5,
  },

  // ── Theme ──
  themeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  themePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
  },
  themePillText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Upgrade Banner ──
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  upgradeBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeBannerTitle: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
  },
  upgradeBannerDesc: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: 1,
    opacity: 0.6,
  },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  footerText: {
    ...TYPOGRAPHY.labelSmall,
    letterSpacing: 0.5,
  },
});
