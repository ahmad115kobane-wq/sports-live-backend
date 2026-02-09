import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  Platform,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import { useRTL } from '@/contexts/RTLContext';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import LanguageSelector from '@/components/LanguageSelector';
import { SOCKET_URL } from '@/constants/config';
import { legalApi } from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen() {
  const { colorScheme, isDark, themeMode, setThemeMode } = useTheme();
  const colors = Colors[colorScheme];
  const { user, isAuthenticated, logout, isGuest } = useAuthStore();
  const { t, isRTL, languageInfo, flexDirection } = useRTL();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [legalPages, setLegalPages] = useState<{ id: string; slug: string; title: string; titleAr: string; titleKu: string }[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
    legalApi.getAll().then(res => setLegalPages(res.data.data || [])).catch(() => {});
  }, []);

  const getLegalTitle = (page: typeof legalPages[0]) => {
    const lang = languageInfo?.code || 'ar';
    if (lang === 'ku') return page.titleKu || page.titleAr || page.title;
    if (lang === 'ar') return page.titleAr || page.title;
    return page.title;
  };

  const handleLogout = () => {
    Alert.alert(t('settings.logout'), t('auth.loginError'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logout'),
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const getRoleIcon = (role: string): keyof typeof Ionicons.glyphMap => {
    switch (role) {
      case 'admin': return 'shield-checkmark';
      case 'operator': return 'radio';
      case 'publisher': return 'newspaper';
      default: return 'person';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return t('settings.title');
      case 'operator': return t('match.live');
      case 'publisher': return t('news.title');
      default: return t('auth.login');
    }
  };

  // ── Menu Item renderer ──
  const MenuItem = ({ 
    icon, iconBg, label, sublabel, onPress, trailing, emoji
  }: { 
    icon?: keyof typeof Ionicons.glyphMap; 
    iconBg: string; 
    label: string; 
    sublabel: string;
    onPress?: () => void;
    trailing?: React.ReactNode;
    emoji?: string;
  }) => (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: colors.surface, flexDirection }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
        {emoji ? (
          <Text style={styles.menuEmoji}>{emoji}</Text>
        ) : icon ? (
          <Ionicons name={icon} size={20} color={colors.text} />
        ) : null}
      </View>
      <View style={[styles.menuContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.menuSublabel, { color: colors.textTertiary }]}>{sublabel}</Text>
      </View>
      {trailing || (
        <Ionicons 
          name={isRTL ? 'chevron-forward' : 'chevron-back'} 
          size={20} 
          color={colors.textTertiary} 
        />
      )}
    </TouchableOpacity>
  );

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
          <Animated.View style={[
            styles.guestCard, 
            { backgroundColor: colors.surface, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}>
            <LinearGradient
              colors={colors.gradients.accent}
              style={styles.guestAvatar}
            >
              <Ionicons name="person-outline" size={36} color="#fff" />
            </LinearGradient>

            <Text style={[styles.guestTitle, { color: colors.text }]}>
              {t('home.welcome')}
            </Text>
            <Text style={[styles.guestSubtitle, { color: colors.textSecondary }]}>
              {t('favorites.addFavorites')}
            </Text>

            <View style={styles.guestActions}>
              <Button
                title={t('auth.login')}
                onPress={() => router.push('/auth/login')}
                variant="primary"
                size="large"
                fullWidth
              />
              <Button
                title={t('auth.register')}
                onPress={() => router.push('/auth/register')}
                variant="outline"
                size="large"
                fullWidth
              />
            </View>
          </Animated.View>

          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('settings.title').toUpperCase()}
            </Text>
            <MenuItem
              iconBg={colors.warningLight}
              emoji={languageInfo.flag}
              label={t('settings.language')}
              sublabel={languageInfo.nativeName}
              onPress={() => setShowLanguageSelector(true)}
            />
          </View>

          {/* Legal & About (guest) */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('settings.about').toUpperCase()}
            </Text>
            {legalPages.map((page) => (
              <MenuItem
                key={page.id}
                icon="document-text-outline"
                iconBg={colors.successLight}
                label={getLegalTitle(page)}
                sublabel={page.slug}
                onPress={() => router.push(`/legal/${page.slug}` as any)}
              />
            ))}
            <MenuItem
              icon="information-circle-outline"
              iconBg={colors.infoLight}
              label={t('settings.about')}
              sublabel={`${t('settings.version')} 1.0.0`}
            />
          </View>

          {/* Appearance */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('settings.theme').toUpperCase()}
            </Text>
            <View style={[styles.themeSelector, { backgroundColor: colors.surface }]}>
              {[
                { mode: 'light' as ThemeMode, icon: 'sunny-outline' as const, label: t('settings.lightMode') },
                { mode: 'dark' as ThemeMode, icon: 'moon-outline' as const, label: t('settings.darkMode') },
                { mode: 'system' as ThemeMode, icon: 'phone-portrait-outline' as const, label: t('settings.systemMode') },
              ].map((item) => (
                <TouchableOpacity
                  key={item.mode}
                  style={[
                    styles.themeOption,
                    { borderColor: themeMode === item.mode ? colors.accent : colors.border },
                    themeMode === item.mode && { backgroundColor: colors.accentGlow },
                  ]}
                  onPress={() => setThemeMode(item.mode)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.themeIconWrap,
                    { backgroundColor: themeMode === item.mode ? colors.accent : colors.backgroundSecondary },
                  ]}>
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={themeMode === item.mode ? '#fff' : colors.textTertiary}
                    />
                  </View>
                  <Text style={[
                    styles.themeLabel,
                    { color: themeMode === item.mode ? colors.accent : colors.textSecondary },
                  ]}>
                    {item.label}
                  </Text>
                  {themeMode === item.mode && (
                    <View style={[styles.themeCheck, { backgroundColor: colors.accent }]}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  // ── Authenticated ──
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <LanguageSelector visible={showLanguageSelector} onClose={() => setShowLanguageSelector(false)} />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Profile Header */}
        <LinearGradient
          colors={colors.gradients.dark}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHeader}
        >
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {user?.avatar ? (
              <Image source={{ uri: `${SOCKET_URL}${user.avatar}` }} style={styles.avatarGradient} />
            ) : (
              <LinearGradient colors={colors.gradients.accent} style={styles.avatarGradient}>
                <Ionicons name="person" size={34} color="#fff" />
              </LinearGradient>
            )}
          </View>

          {/* Info */}
          <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>{user?.name}</Text>
          {!isGuest && (
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]} numberOfLines={1}>{user?.email}</Text>
          )}
          {isGuest ? (
            <View style={[styles.rolePill, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }]}>
              <Ionicons name="person-outline" size={10} color={colors.text} />
              <Text style={[styles.roleText, { color: colors.text }]}>{t('welcome.guestAccount')}</Text>
            </View>
          ) : (
            <View style={[styles.rolePill, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }]}>
              <Ionicons name={getRoleIcon(user?.role || 'user')} size={10} color={colors.text} />
              <Text style={[styles.roleText, { color: colors.text }]}>{user?.role?.toUpperCase()}</Text>
            </View>
          )}

          {/* Edit Profile Button */}
          {!isGuest && (
            <TouchableOpacity
              style={[styles.editProfileBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)', borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
              onPress={() => router.push('/edit-profile' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={14} color={colors.text} />
              <Text style={[styles.editProfileText, { color: colors.text }]}>
                {t('profile.editProfile')}
              </Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        <View style={styles.bodyPadding}>
          {/* Upgrade Banner for Guest */}
          {isGuest && (
            <TouchableOpacity
              style={[styles.upgradeBanner, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}
              onPress={() => router.push('/auth/register')}
              activeOpacity={0.8}
            >
              <View style={[styles.upgradeBannerIcon, { backgroundColor: colors.accent + '20' }]}>
                <Ionicons name="arrow-up-circle" size={22} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.upgradeBannerTitle, { color: colors.text }]}>
                  {t('welcome.upgradeAccount')}
                </Text>
                <Text style={[styles.upgradeBannerDesc, { color: colors.textSecondary }]}>
                  {t('welcome.upgradeDescription')}
                </Text>
              </View>
              <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={18} color={colors.accent} />
            </TouchableOpacity>
          )}

          {/* Quick Access — Operator / Admin / Publisher */}
          {(user?.role === 'operator' || user?.role === 'admin' || user?.role === 'publisher') && (
            <View style={styles.section}>
              <Text style={[styles.sectionHeader, { color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('tabs.matches').toUpperCase()}
              </Text>

              {(user?.role === 'operator' || user?.role === 'admin') && (
                <TouchableOpacity
                  style={[styles.menuItem, { backgroundColor: colors.surface, flexDirection }]}
                  onPress={() => router.push('/operator')}
                  activeOpacity={0.7}
                >
                  <LinearGradient colors={colors.gradients.live} style={styles.menuIconGrad}>
                    <Ionicons name="radio" size={20} color="#fff" />
                  </LinearGradient>
                  <View style={[styles.menuContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                    <Text style={[styles.menuLabel, { color: colors.text }]}>{t('match.live')}</Text>
                    <Text style={[styles.menuSublabel, { color: colors.textTertiary }]}>{t('tabs.matches')}</Text>
                  </View>
                  <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              )}

              {(user?.role === 'publisher' || user?.role === 'admin') && (
                <TouchableOpacity
                  style={[styles.menuItem, { backgroundColor: colors.surface, flexDirection }]}
                  onPress={() => router.push('/publisher' as any)}
                  activeOpacity={0.7}
                >
                  <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.menuIconGrad}>
                    <Ionicons name="newspaper" size={20} color="#fff" />
                  </LinearGradient>
                  <View style={[styles.menuContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                    <Text style={[styles.menuLabel, { color: colors.text }]}>{t('news.publisherPanel')}</Text>
                    <Text style={[styles.menuSublabel, { color: colors.textTertiary }]}>{t('news.title')}</Text>
                  </View>
                  <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              )}

              {user?.role === 'admin' && (
                <TouchableOpacity
                  style={[styles.menuItem, { backgroundColor: colors.surface, flexDirection }]}
                  onPress={() => router.push('/admin')}
                  activeOpacity={0.7}
                >
                  <LinearGradient colors={colors.gradients.premium} style={styles.menuIconGrad}>
                    <Ionicons name="settings" size={20} color="#fff" />
                  </LinearGradient>
                  <View style={[styles.menuContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                    <Text style={[styles.menuLabel, { color: colors.text }]}>{t('settings.title')}</Text>
                    <Text style={[styles.menuSublabel, { color: colors.textTertiary }]}>{t('tabs.matches')}</Text>
                  </View>
                  <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              )}

              {user?.role === 'admin' && (
                <TouchableOpacity
                  style={[styles.menuItem, { backgroundColor: colors.surface, flexDirection }]}
                  onPress={() => router.push('/admin/store' as any)}
                  activeOpacity={0.7}
                >
                  <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.menuIconGrad}>
                    <Ionicons name="bag-handle" size={20} color="#fff" />
                  </LinearGradient>
                  <View style={[styles.menuContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                    <Text style={[styles.menuLabel, { color: colors.text }]}>{t('store.storeManagement')}</Text>
                    <Text style={[styles.menuSublabel, { color: colors.textTertiary }]}>{t('store.productsOffersCategories')}</Text>
                  </View>
                  <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* General Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('settings.title').toUpperCase()}
            </Text>

            <MenuItem
              iconBg={colors.warningLight}
              emoji={languageInfo.flag}
              label={t('settings.language')}
              sublabel={languageInfo.nativeName}
              onPress={() => setShowLanguageSelector(true)}
            />
            <MenuItem
              icon="notifications-outline"
              iconBg={colors.infoLight}
              label={t('settings.notifications')}
              sublabel={t('settings.matchNotifications')}
              onPress={() => router.push('/notification-settings' as any)}
            />
          </View>

          {/* Appearance */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('settings.theme').toUpperCase()}
            </Text>

            <View style={[styles.themeSelector, { backgroundColor: colors.surface }]}>
              {[
                { mode: 'light' as ThemeMode, icon: 'sunny-outline' as const, label: t('settings.lightMode') },
                { mode: 'dark' as ThemeMode, icon: 'moon-outline' as const, label: t('settings.darkMode') },
                { mode: 'system' as ThemeMode, icon: 'phone-portrait-outline' as const, label: t('settings.systemMode') },
              ].map((item) => (
                <TouchableOpacity
                  key={item.mode}
                  style={[
                    styles.themeOption,
                    { borderColor: themeMode === item.mode ? colors.accent : colors.border },
                    themeMode === item.mode && { backgroundColor: colors.accentGlow },
                  ]}
                  onPress={() => setThemeMode(item.mode)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.themeIconWrap,
                    { backgroundColor: themeMode === item.mode ? colors.accent : colors.backgroundSecondary },
                  ]}>
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={themeMode === item.mode ? '#fff' : colors.textTertiary}
                    />
                  </View>
                  <Text style={[
                    styles.themeLabel,
                    { color: themeMode === item.mode ? colors.accent : colors.textSecondary },
                  ]}>
                    {item.label}
                  </Text>
                  {themeMode === item.mode && (
                    <View style={[styles.themeCheck, { backgroundColor: colors.accent }]}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Legal & About */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('settings.about').toUpperCase()}
            </Text>

            {legalPages.map((page) => (
              <MenuItem
                key={page.id}
                icon="document-text-outline"
                iconBg={colors.successLight}
                label={getLegalTitle(page)}
                sublabel={page.slug}
                onPress={() => router.push(`/legal/${page.slug}` as any)}
              />
            ))}
            <MenuItem
              icon="information-circle-outline"
              iconBg={colors.infoLight}
              label={t('settings.about')}
              sublabel={`${t('settings.version')} 1.0.0`}
            />
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: colors.errorLight }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>{t('settings.logout')}</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textTertiary }]}>Sports Live v1.0.0</Text>
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

  // ── Guest ──
  guestContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? 80 : (StatusBar.currentHeight || 24) + SPACING.xxl,
    paddingBottom: SPACING.xxl,
  },
  guestCard: {
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    alignItems: 'center',
    ...SHADOWS.sm,
    marginBottom: SPACING.lg,
  },
  guestAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
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

  // ── Authenticated Header ──
  profileHeader: {
    paddingTop: Platform.OS === 'ios' ? 64 : (StatusBar.currentHeight || 24) + SPACING.xl,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  avatarWrap: {
    marginBottom: SPACING.lg,
    ...SHADOWS.lg,
  },
  avatarGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarLetter: {
    fontSize: 26,
    color: '#fff',
    fontWeight: '700',
  },
  profileName: {
    ...TYPOGRAPHY.headlineLarge,
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.xxs,
    letterSpacing: -0.5,
  },
  profileEmail: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.full,
    gap: SPACING.xxs,
  },
  roleText: {
    ...TYPOGRAPHY.labelSmall,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  editProfileText: {
    ...TYPOGRAPHY.labelSmall,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bodyPadding: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },

  // ── Sections ──
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    opacity: 0.6,
  },

  // ── Menu Items ──
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.sm,
    ...SHADOWS.xs,
    minHeight: 56,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  menuIconGrad: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
    ...SHADOWS.sm,
  },
  menuEmoji: {
    fontSize: 20,
  },
  menuContent: {
    flex: 1,
    marginHorizontal: SPACING.sm,
  },
  menuLabel: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  menuSublabel: {
    ...TYPOGRAPHY.bodySmall,
    marginTop: 3,
    opacity: 0.6,
  },

  // ── Theme Selector ──
  themeSelector: {
    flexDirection: 'row',
    borderRadius: RADIUS.xl,
    padding: SPACING.sm,
    gap: SPACING.sm,
    ...SHADOWS.xs,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    gap: SPACING.xs,
  },
  themeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  themeLabel: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700' as const,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  themeCheck: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    ...SHADOWS.xs,
  },

  // ── Upgrade Banner ──
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
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
  },

  // ── Logout ──
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    gap: SPACING.sm,
    marginTop: SPACING.md,
    minHeight: 48,
  },
  logoutText: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  footerText: {
    ...TYPOGRAPHY.labelSmall,
  },
});
