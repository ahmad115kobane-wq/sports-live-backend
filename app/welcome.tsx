import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import { useAlert } from '@/contexts/AlertContext';
import { useRTL } from '@/contexts/RTLContext';
import LanguageSelector from '@/components/LanguageSelector';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, languageInfo, flexDirection } = useRTL();
  const { guestLogin, isLoading } = useAuthStore();
  const [guestLoading, setGuestLoading] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const { alert } = useAlert();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const buttonSlide = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    // Staggered animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(buttonSlide, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleGuestLogin = async () => {
    if (!agreedToTerms) {
      alert(t('settings.attention'), t('welcome.mustAgree'));
      return;
    }
    try {
      setGuestLoading(true);
      await guestLogin();
      router.replace('/auth/select-favorites');
    } catch (error) {
      console.error('Guest login error:', error);
    } finally {
      setGuestLoading(false);
    }
  };

  const handleLogin = () => {
    if (!agreedToTerms) {
      alert(t('settings.attention'), t('welcome.mustAgree'));
      return;
    }
    router.push('/auth/login');
  };

  const handleRegister = () => {
    if (!agreedToTerms) {
      alert(t('settings.attention'), t('welcome.mustAgree'));
      return;
    }
    router.push('/auth/register');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <LanguageSelector 
        visible={showLanguageSelector} 
        onClose={() => setShowLanguageSelector(false)} 
      />
      
      {/* Background Gradient - Same as login screen */}
      <LinearGradient
        colors={colors.gradients.dark}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Language Selector Button */}
      <TouchableOpacity
        style={[styles.languageButton, { [isRTL ? 'left' : 'right']: 20 }]}
        onPress={() => setShowLanguageSelector(true)}
      >
        <Text style={styles.languageFlag}>{languageInfo.flag}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.text} />
      </TouchableOpacity>

      {/* Logo Section */}
      <Animated.View 
        style={[
          styles.logoSection,
          {
            opacity: fadeAnim,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <Image source={require('@/assets/icon.png')} style={{ width: 120, height: 120, borderRadius: 28 }} resizeMode="contain" />
        </View>
        <Text style={[styles.appName, { color: colors.text }]}>{t('app.name')}</Text>
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>{t('welcome.tagline')}</Text>
      </Animated.View>

      {/* Features Section */}
      <Animated.View 
        style={[
          styles.featuresSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={[styles.featureItem, { flexDirection, backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(5,150,105,0.06)' }]}>
          <View style={[styles.featureIcon, { backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(5,150,105,0.12)' }]}>
            <Ionicons name="flash" size={16} color={colors.accent} />
          </View>
          <Text style={[styles.featureText, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>
            {t('welcome.feature1')}
          </Text>
        </View>
        <View style={[styles.featureItem, { flexDirection, backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(5,150,105,0.06)' }]}>
          <View style={[styles.featureIcon, { backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(5,150,105,0.12)' }]}>
            <Ionicons name="notifications" size={16} color={colors.accent} />
          </View>
          <Text style={[styles.featureText, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>
            {t('welcome.feature2')}
          </Text>
        </View>
        <View style={[styles.featureItem, { flexDirection, backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(5,150,105,0.06)' }]}>
          <View style={[styles.featureIcon, { backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(5,150,105,0.12)' }]}>
            <Ionicons name="heart" size={16} color={colors.accent} />
          </View>
          <Text style={[styles.featureText, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>
            {t('welcome.feature3')}
          </Text>
        </View>
      </Animated.View>

      {/* Buttons Section */}
      <Animated.View 
        style={[
          styles.buttonsSection,
          {
            transform: [{ translateY: buttonSlide }],
          },
        ]}
      >
        {/* Login / Register Button */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleLogin}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={isDark ? ['#fff', '#f5f5f5'] : [colors.accent, colors.accentDark]}
            style={styles.primaryButtonGradient}
          >
            <Ionicons name="log-in-outline" size={18} color={isDark ? colors.primary : '#fff'} />
            <Text style={[styles.primaryButtonText, { color: isDark ? colors.primary : '#fff' }]}>
              {t('welcome.loginOrRegister')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Guest Button */}
        <TouchableOpacity
          style={[styles.guestButton, { borderColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.15)', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)' }]}
          onPress={handleGuestLogin}
          disabled={guestLoading}
          activeOpacity={0.8}
        >
          {guestLoading ? (
            <ActivityIndicator color={colors.text} size="small" />
          ) : (
            <>
              <Ionicons name="person-outline" size={16} color={colors.text} />
              <Text style={[styles.guestButtonText, { color: colors.text }]}>
                {t('welcome.continueAsGuest')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Terms Agreement - Text only (no checkbox) */}
        <View style={[styles.termsRow, { flexDirection }]}>
          <View style={[styles.termsTextWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.termsText, { color: colors.textSecondary }]}>
              {t('welcome.agreeToTerms')}{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/legal/terms-of-service' as any)} activeOpacity={0.6}>
              <Text style={[styles.termsLink, { color: colors.accent }]}>{t('settings.terms')}</Text>
            </TouchableOpacity>
            <Text style={[styles.termsText, { color: colors.textSecondary }]}>
              {' '}{t('welcome.andText')}{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/legal/privacy-policy' as any)} activeOpacity={0.6}>
              <Text style={[styles.termsLink, { color: colors.accent }]}>{t('settings.privacy')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 50,
    paddingBottom: 30,
  },

  languageButton: {
    position: 'absolute',
    top: 45,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  languageFlag: {
    fontSize: 16,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 20,
    marginBottom: 20,
  },
  logoContainer: {
    marginBottom: SPACING.md,
  },
  logoBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: FONTS.bold,
  },
  tagline: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    fontFamily: FONTS.regular,
  },
  featuresSection: {
    paddingHorizontal: SPACING.lg,
    gap: 10,
    marginBottom: 10,
  },
  featureItem: {
    alignItems: 'center',
    gap: 10,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  buttonsSection: {
    paddingHorizontal: SPACING.lg,
    gap: 10,
    marginBottom: 10,
  },
  primaryButton: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    gap: 6,
  },
  guestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  termsRow: {
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsTextWrap: {
    flex: 1,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.regular,
  },
  termsLink: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    textDecorationLine: 'underline',
    fontFamily: FONTS.bold,
  },
});
