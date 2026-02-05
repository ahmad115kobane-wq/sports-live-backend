import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Dimensions,
  Animated,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import { useRTL } from '@/contexts/RTLContext';
import LanguageSelector from '@/components/LanguageSelector';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, languageInfo, flexDirection } = useRTL();
  const { guestLogin, isLoading } = useAuthStore();
  const [guestLoading, setGuestLoading] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

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
    router.push('/auth/login');
  };

  const handleRegister = () => {
    router.push('/auth/register');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
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
        <Ionicons name="chevron-down" size={16} color="#fff" />
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
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            style={styles.logoBg}
          >
            <Ionicons name="football" size={50} color="#fff" />
          </LinearGradient>
        </View>
        <Text style={styles.appName}>{t('app.name')}</Text>
        <Text style={styles.tagline}>{t('welcome.tagline')}</Text>
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
        <View style={[styles.featureItem, { flexDirection }]}>
          <View style={styles.featureIcon}>
            <Ionicons name="flash" size={16} color="#fff" />
          </View>
          <Text style={[styles.featureText, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('welcome.feature1')}
          </Text>
        </View>
        <View style={[styles.featureItem, { flexDirection }]}>
          <View style={styles.featureIcon}>
            <Ionicons name="notifications" size={16} color="#fff" />
          </View>
          <Text style={[styles.featureText, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('welcome.feature2')}
          </Text>
        </View>
        <View style={[styles.featureItem, { flexDirection }]}>
          <View style={styles.featureIcon}>
            <Ionicons name="heart" size={16} color="#fff" />
          </View>
          <Text style={[styles.featureText, { textAlign: isRTL ? 'right' : 'left' }]}>
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
            colors={['#fff', '#f5f5f5']}
            style={styles.primaryButtonGradient}
          >
            <Ionicons name="log-in-outline" size={18} color={colors.primary} />
            <Text style={[styles.primaryButtonText, { color: colors.primary }]}>
              {t('welcome.loginOrRegister')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Guest Button */}
        <TouchableOpacity
          style={styles.guestButton}
          onPress={handleGuestLogin}
          disabled={guestLoading}
          activeOpacity={0.8}
        >
          {guestLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="person-outline" size={16} color="#fff" />
              <Text style={styles.guestButtonText}>
                {t('welcome.continueAsGuest')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Terms text */}
        <Text style={styles.termsText}>
          {t('welcome.termsNotice')}
        </Text>
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
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    borderColor: 'rgba(255,255,255,0.3)',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  featuresSection: {
    paddingHorizontal: SPACING.lg,
    gap: 10,
    marginBottom: 10,
  },
  featureItem: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
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
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 6,
  },
  guestButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  termsText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
});
