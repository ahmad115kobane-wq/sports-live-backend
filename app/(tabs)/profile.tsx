import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Alert,
  ScrollView,
  StatusBar,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/components/ui/BlurView';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import { useRTL } from '@/contexts/RTLContext';
import LanguageSelector from '@/components/LanguageSelector';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const isDark = colorScheme === 'dark';
  const { user, isAuthenticated, logout, isGuest } = useAuthStore();
  const { t, isRTL, languageInfo, flexDirection } = useRTL();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();

    // Pulse animation for status dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // Shimmer animation
    Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
    ).start();
  }, []);

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

  const getRoleGradient = (role: string) => {
    switch (role) {
      case 'admin':
        return colors.gradients.live;
      case 'operator':
        return colors.gradients.premium;
      default:
        return colors.gradients.success;
    }
  };

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  // Show simple login screen for unauthenticated users OR guest users
  if (!isAuthenticated || isGuest) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        
        <LanguageSelector 
          visible={showLanguageSelector} 
          onClose={() => setShowLanguageSelector(false)} 
        />

        <ScrollView 
          style={styles.guestScroll}
          contentContainerStyle={styles.guestContentSimple}
          showsVerticalScrollIndicator={false}
        >
          {/* Simple Avatar */}
          <Animated.View style={[
            styles.guestAvatarSimple,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}>
            <LinearGradient
              colors={colors.gradients.accent}
              style={styles.guestAvatarGradient}
            >
              <Ionicons name="person-outline" size={60} color="#fff" />
            </LinearGradient>
          </Animated.View>

          {/* Welcome Text */}
          <Animated.View style={[
            styles.guestWelcome,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}>
            <Text style={[styles.guestTitle, { color: colors.text }]}>
              {isGuest ? t('welcome.guestAccount') : t('home.welcome')}
            </Text>
            <Text style={[styles.guestSubtitle, { color: colors.textSecondary }]}>
              {isGuest ? t('welcome.upgradeDescription') : t('favorites.addFavorites')}
            </Text>
          </Animated.View>

          {/* Login/Register Buttons */}
          <Animated.View style={[
            styles.guestButtons,
            { opacity: fadeAnim }
          ]}>
            <Button
              title={isGuest ? t('welcome.upgradeAccount') : t('auth.login')}
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
          </Animated.View>

          {/* Settings Section */}
          <View style={styles.guestSettings}>
            {/* Language */}
            <TouchableOpacity
              style={[styles.guestSettingItem, { backgroundColor: colors.surface, flexDirection }]}
              onPress={() => setShowLanguageSelector(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.guestSettingIcon, { backgroundColor: colors.warningLight }]}>
                <Text style={styles.guestSettingEmoji}>{languageInfo.flag}</Text>
              </View>
              <View style={styles.guestSettingContent}>
                <Text style={[styles.guestSettingLabel, { color: colors.textSecondary }]}>
                  {t('settings.language')}
                </Text>
                <Text style={[styles.guestSettingValue, { color: colors.text }]}>
                  {languageInfo.nativeName}
                </Text>
              </View>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            {/* Terms & Privacy */}
            <TouchableOpacity
              style={[styles.guestSettingItem, { backgroundColor: colors.surface, flexDirection }]}
              activeOpacity={0.7}
            >
              <View style={[styles.guestSettingIcon, { backgroundColor: colors.infoLight }]}>
                <Ionicons name="document-text-outline" size={20} color={colors.info} />
              </View>
              <View style={styles.guestSettingContent}>
                <Text style={[styles.guestSettingLabel, { color: colors.textSecondary }]}>
                  {t('settings.privacy')}
                </Text>
                <Text style={[styles.guestSettingValue, { color: colors.text }]}>
                  {t('settings.terms')}
                </Text>
              </View>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            {/* About */}
            <TouchableOpacity
              style={[styles.guestSettingItem, { backgroundColor: colors.surface, flexDirection }]}
              activeOpacity={0.7}
            >
              <View style={[styles.guestSettingIcon, { backgroundColor: colors.successLight }]}>
                <Ionicons name="information-circle-outline" size={20} color={colors.success} />
              </View>
              <View style={styles.guestSettingContent}>
                <Text style={[styles.guestSettingLabel, { color: colors.textSecondary }]}>
                  {t('settings.about')}
                </Text>
                <Text style={[styles.guestSettingValue, { color: colors.text }]}>
                  {t('settings.version')} 1.0.0
                </Text>
              </View>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Logout for Guest */}
          {isGuest && (
            <TouchableOpacity
              style={[styles.guestLogout, { backgroundColor: colors.errorLight }]}
              onPress={() => logout()}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={[styles.guestLogoutText, { color: colors.error }]}>
                {t('settings.logout')}
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    );
  }

  const roleGradient = getRoleGradient(user?.role || 'user');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      <LanguageSelector 
        visible={showLanguageSelector} 
        onClose={() => setShowLanguageSelector(false)} 
      />
      
      {/* Premium Header with Gradient */}
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={colors.gradients.premium}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Shimmer Effect */}
          <Animated.View style={[styles.shimmerEffect, { transform: [{ translateX: shimmerTranslate }] }]}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.08)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Decorative Circles */}
          <View style={[styles.decorCircle1, { borderColor: 'rgba(255,255,255,0.06)' }]} />
          <View style={[styles.decorCircle2, { borderColor: 'rgba(255,255,255,0.04)' }]} />

          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={roleGradient}
              style={styles.avatarRing}
            >
              <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            </LinearGradient>
            <Animated.View 
              style={[
                styles.statusDot,
                { transform: [{ scale: pulseAnim }] }
              ]}
            />
          </View>
          
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          
          <View style={styles.roleBadge}>
            <LinearGradient
              colors={roleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.roleBadgeGradient}
            >
              <Ionicons 
                name={user?.role === 'admin' ? 'shield-checkmark' : user?.role === 'operator' ? 'radio' : 'person'} 
                size={14} 
                color="#fff" 
              />
              <Text style={styles.roleBadgeText}>{user?.role}</Text>
            </LinearGradient>
          </View>
        </LinearGradient>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.statsRow, { flexDirection }]}>
            <View style={styles.statItem}>
              <LinearGradient
                colors={[colors.live + '20', colors.live + '10']}
                style={styles.statIconBg}
              >
                <Ionicons name="heart" size={18} color={colors.live} />
              </LinearGradient>
              <Text style={[styles.statValue, { color: colors.text }]}>12</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t('favorites.title')}</Text>
            </View>
            
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            
            <View style={styles.statItem}>
              <LinearGradient
                colors={[colors.success + '20', colors.success + '10']}
                style={styles.statIconBg}
              >
                <Ionicons name="eye" size={18} color={colors.success} />
              </LinearGradient>
              <Text style={[styles.statValue, { color: colors.text }]}>48</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t('profile.watched')}</Text>
            </View>
            
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            
            <View style={styles.statItem}>
              <LinearGradient
                colors={[colors.info + '20', colors.info + '10']}
                style={styles.statIconBg}
              >
                <Ionicons name="flame" size={18} color={colors.info} />
              </LinearGradient>
              <Text style={[styles.statValue, { color: colors.text }]}>7</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t('profile.days')}</Text>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('settings.title').toUpperCase()}
          </Text>

          {(user?.role === 'operator' || user?.role === 'admin') && (
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: colors.surface, flexDirection }]}
              onPress={() => router.push('/operator')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={colors.gradients.live}
                style={styles.menuIconGradient}
              >
                <Ionicons name="radio" size={18} color="#fff" />
              </LinearGradient>
              <View style={[styles.menuContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text style={[styles.menuText, { color: colors.text }]}>{t('match.live')}</Text>
                <Text style={[styles.menuSubtext, { color: colors.textTertiary }]}>
                  {t('tabs.matches')}
                </Text>
              </View>
              <View style={[styles.menuChevron, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>
          )}

          {user?.role === 'admin' && (
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: colors.surface, flexDirection }]}
              onPress={() => router.push('/admin')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={colors.gradients.premium}
                style={styles.menuIconGradient}
              >
                <Ionicons name="settings" size={18} color="#fff" />
              </LinearGradient>
              <View style={[styles.menuContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text style={[styles.menuText, { color: colors.text }]}>لوحة الإدارة</Text>
                <Text style={[styles.menuSubtext, { color: colors.textTertiary }]}>
                  إنشاء مباريات وإدارة الفرق
                </Text>
              </View>
              <View style={[styles.menuChevron, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.surface, flexDirection }]}
            onPress={() => setShowLanguageSelector(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconSquare, { backgroundColor: colors.warningLight }]}>
              <Text style={styles.menuIconEmoji}>{languageInfo.flag}</Text>
            </View>
            <View style={[styles.menuContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.menuText, { color: colors.text }]}>{t('settings.language')}</Text>
              <Text style={[styles.menuSubtext, { color: colors.textTertiary }]}>
                {languageInfo.nativeName}
              </Text>
            </View>
            <View style={[styles.menuChevron, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.surface, flexDirection }]}
            activeOpacity={0.7}
            onPress={() => router.push('/notification-settings' as any)}
          >
            <View style={[styles.menuIconSquare, { backgroundColor: colors.infoLight }]}>
              <Ionicons name="notifications-outline" size={18} color={colors.info} />
            </View>
            <View style={[styles.menuContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.menuText, { color: colors.text }]}>{t('settings.notifications')}</Text>
              <Text style={[styles.menuSubtext, { color: colors.textTertiary }]}>
                {t('settings.matchNotifications')}
              </Text>
            </View>
            <View style={[styles.notifBadge, { backgroundColor: colors.live }]}>
              <Text style={styles.notifBadgeText}>3</Text>
            </View>
            <View style={[styles.menuChevron, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('settings.theme').toUpperCase()}
          </Text>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.surface, flexDirection }]}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconSquare, { backgroundColor: colors.secondaryLight }]}>
              <Ionicons name="moon-outline" size={18} color={colors.secondary} />
            </View>
            <View style={[styles.menuContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.menuText, { color: colors.text }]}>{t('settings.darkMode')}</Text>
              <Text style={[styles.menuSubtext, { color: colors.textTertiary }]}>
                {isDark ? 'On' : 'Off'}
              </Text>
            </View>
            <View style={[styles.toggleSwitch, { backgroundColor: isDark ? colors.success : colors.border }]}>
              <View style={[styles.toggleKnob, isDark && styles.toggleKnobActive]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.surface, flexDirection }]}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconSquare, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="color-palette-outline" size={18} color={colors.warning} />
            </View>
            <View style={[styles.menuContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.menuText, { color: colors.text }]}>{t('settings.theme')}</Text>
              <Text style={[styles.menuSubtext, { color: colors.textTertiary }]}>
                System
              </Text>
            </View>
            <View style={[styles.menuChevron, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('settings.about').toUpperCase()}
          </Text>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.surface, flexDirection }]}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconSquare, { backgroundColor: colors.successLight }]}>
              <Ionicons name="help-circle-outline" size={18} color={colors.success} />
            </View>
            <View style={[styles.menuContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.menuText, { color: colors.text }]}>{t('settings.contact')}</Text>
              <Text style={[styles.menuSubtext, { color: colors.textTertiary }]}>
                {t('settings.privacy')}
              </Text>
            </View>
            <View style={[styles.menuChevron, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.surface, flexDirection }]}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconSquare, { backgroundColor: colors.infoLight }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.info} />
            </View>
            <View style={[styles.menuContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.menuText, { color: colors.text }]}>{t('settings.about')}</Text>
              <Text style={[styles.menuSubtext, { color: colors.textTertiary }]}>
                {t('settings.version')} 1.0.0
              </Text>
            </View>
            <View style={[styles.menuChevron, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.errorLight, flexDirection }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>{t('settings.logout')}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            Sports Live v1.0.0
          </Text>
          <Text style={[styles.footerSubtext, { color: colors.textTertiary }]}>
            Made with ❤️
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Guest Screen Styles - Simplified
  guestScroll: {
    flex: 1,
  },
  guestContentSimple: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  guestAvatarSimple: {
    alignSelf: 'center',
    marginBottom: SPACING.xxl,
  },
  guestAvatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  guestWelcome: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  guestTitle: {
    ...TYPOGRAPHY.headlineMedium,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  guestSubtitle: {
    ...TYPOGRAPHY.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
  },
  guestButtons: {
    width: '100%',
    gap: SPACING.md,
    marginBottom: SPACING.xxxl,
  },
  guestSettings: {
    width: '100%',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  guestSettingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    ...SHADOWS.sm,
  },
  guestSettingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  guestSettingEmoji: {
    fontSize: 24,
  },
  guestSettingContent: {
    flex: 1,
  },
  guestSettingLabel: {
    ...TYPOGRAPHY.labelSmall,
    marginBottom: 2,
  },
  guestSettingValue: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
  },
  guestLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    gap: SPACING.sm,
  },
  guestLogoutText: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
  },
  // Authenticated Screen Styles
  shimmerEffect: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 150,
  },
  headerWrapper: {
    zIndex: 10,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + SPACING.lg,
    paddingBottom: SPACING.xxxl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 40,
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: '700',
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4ADE80',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  name: {
    ...TYPOGRAPHY.titleLarge,
    color: '#fff',
    fontWeight: '700',
    marginBottom: SPACING.xxs,
  },
  email: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.sm,
  },
  roleBadge: {
    overflow: 'hidden',
    borderRadius: RADIUS.full,
  },
  roleBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: SPACING.xxs,
  },
  roleBadgeText: {
    ...TYPOGRAPHY.labelSmall,
    color: '#fff',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
    marginTop: -SPACING.md,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 100,
  },
  statsCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statValue: {
    ...TYPOGRAPHY.titleLarge,
    fontWeight: '700',
  },
  statLabel: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: SPACING.xs,
  },
  statDivider: {
    width: 1,
    height: 46,
  },
  menuSection: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xs,
    ...SHADOWS.xs,
  },
  menuIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  menuIconSquare: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  menuIconEmoji: {
    fontSize: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuText: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
  },
  menuSubtext: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: 1,
  },
  menuChevron: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  notifBadgeText: {
    ...TYPOGRAPHY.labelSmall,
    color: '#fff',
    fontWeight: '700',
  },
  toggleSwitch: {
    width: 40,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    ...SHADOWS.xs,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  logoutText: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    gap: SPACING.xxs,
  },
  footerText: {
    ...TYPOGRAPHY.labelMedium,
  },
  footerSubtext: {
    ...TYPOGRAPHY.labelSmall,
  },
});
