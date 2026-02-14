import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import { useRTL } from '@/contexts/RTLContext';
import { useAlert } from '@/contexts/AlertContext';
import AppIcon from '@/components/AppIcon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();
  const { alert } = useAlert();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const { login } = useAuthStore();

  // Animations removed (previously included)

  const handleLogin = async () => {
    if (!email || !password) {
      alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      if (error?.requiresVerification) {
        router.replace({ pathname: '/auth/verify-email', params: { email: error.email } });
        return;
      }
      alert(t('auth.loginFailed'), error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Full Screen Gradient Background */}
      <LinearGradient
        colors={colors.gradients.dark}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Back Button */}
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: colors.surfacePressed }, isRTL && styles.backButtonRTL]}
        onPress={() => router.back()}
      >
        <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={24} color={colors.text} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            {/* Logo */}
            <View style={styles.logoWrapper}>
              <AppIcon size={60} showBackground={false} />
            </View>

            <Text style={[styles.welcomeText, { color: colors.text }]}>{t('auth.welcomeBack')}</Text>
            <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>{t('auth.signInContinue')}</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
                {t('auth.email')}
              </Text>
              <View style={[
                styles.inputWrapper,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                focusedInput === 'email' && { borderColor: colors.accent, backgroundColor: colors.accentGlow },
                { flexDirection }
              ]}>
                <View style={[styles.inputIcon, { backgroundColor: colors.surface }, focusedInput === 'email' && { backgroundColor: colors.accentGlow }, isRTL ? { marginLeft: 12 } : { marginRight: 12 }]}>
                  <Ionicons name="mail-outline" size={20} color={focusedInput === 'email' ? colors.accent : colors.textTertiary} />
                </View>
                <TextInput
                  style={[styles.textInput, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}
                  placeholder={t('auth.enterEmail')}
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
                {t('auth.password')}
              </Text>
              <View style={[
                styles.inputWrapper,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                focusedInput === 'password' && { borderColor: colors.accent, backgroundColor: colors.accentGlow },
                { flexDirection }
              ]}>
                <View style={[styles.inputIcon, { backgroundColor: colors.surface }, focusedInput === 'password' && { backgroundColor: colors.accentGlow }, isRTL ? { marginLeft: 12 } : { marginRight: 12 }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'password' ? colors.accent : colors.textTertiary} />
                </View>
                <TextInput
                  style={[styles.textInput, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}
                  placeholder={t('auth.enterPassword')}
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={[styles.forgotButton, { alignSelf: isRTL ? 'flex-start' : 'flex-end' }]}
              onPress={() => router.push('/auth/forgot-password')}
            >
              <Text style={[styles.forgotText, { color: colors.accent }]}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.primaryButton, { shadowColor: colors.accent }, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={colors.gradients.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <View style={[styles.buttonContent, { flexDirection }]}>
                    <Ionicons name="reload" size={20} color={colors.textInverse} />
                    <Text style={[styles.buttonText, { color: colors.textInverse }]}>{t('auth.signingIn')}</Text>
                  </View>
                ) : (
                  <View style={[styles.buttonContent, { flexDirection }]}>
                    <Text style={[styles.buttonText, { color: colors.textInverse }]}>{t('auth.signIn')}</Text>
                    <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={20} color={colors.textInverse} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={[styles.footer, { flexDirection }]}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t('auth.noAccount')} </Text>
            <TouchableOpacity onPress={() => router.replace('/auth/register')}>
              <Text style={[styles.footerLink, { color: colors.accent }]}>{t('auth.signUp')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1,
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -150,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    borderWidth: 1,
  },
  bgCircle3: {
    position: 'absolute',
    top: '40%',
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 16,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonRTL: {
    left: undefined,
    right: 20,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  logoWrapper: {
    marginBottom: 16,
  },
  logoGradient: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    fontFamily: FONTS.bold,
  },
  subtitleText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: FONTS.regular,
  },
  formSection: {
    marginBottom: 16,
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
    fontFamily: FONTS.semiBold,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapperFocused: {
    borderColor: '#059669',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  inputIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputIconFocused: {
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
    height: '100%',
    fontFamily: FONTS.regular,
  },
  eyeButton: {
    padding: 6,
  },
  forgotButton: {
    marginBottom: 16,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    fontFamily: FONTS.bold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: FONTS.regular,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
});
