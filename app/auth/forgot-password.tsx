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
import { SPACING, RADIUS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { useAlert } from '@/contexts/AlertContext';
import api from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();
  const { alert } = useAlert();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!email) {
      alert(t('common.error'), t('auth.emailRequired'));
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      alert(t('common.success'), t('auth.resetCodeSent'));
      router.push({ pathname: '/auth/reset-password', params: { email } });
    } catch (error: any) {
      alert(t('common.error'), error.response?.data?.message || t('errors.tryAgain'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <LinearGradient
        colors={colors.gradients.dark}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

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
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.logoWrapper}>
              <LinearGradient
                colors={colors.gradients.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.logoGradient, { shadowColor: colors.accent }]}
              >
                <Ionicons name="key" size={30} color={colors.textInverse} />
              </LinearGradient>
            </View>

            <Text style={[styles.titleText, { color: colors.text }]}>{t('auth.forgotPasswordTitle')}</Text>
            <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
              {t('auth.forgotPasswordSubtitle')}
            </Text>
          </View>

          {/* Email Input */}
          <View style={styles.formSection}>
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

            {/* Send Code Button */}
            <TouchableOpacity
              style={[styles.primaryButton, { shadowColor: colors.accent }, loading && styles.buttonDisabled]}
              onPress={handleSendCode}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={colors.gradients.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <View style={[styles.buttonContent, { flexDirection }]}>
                  {loading ? (
                    <>
                      <Ionicons name="reload" size={20} color={colors.textInverse} />
                      <Text style={[styles.buttonText, { color: colors.textInverse }]}>{t('auth.sending')}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.buttonText, { color: colors.textInverse }]}>{t('auth.sendResetCode')}</Text>
                      <Ionicons name="send" size={18} color={colors.textInverse} />
                    </>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Back to Login */}
          <View style={[styles.footer, { flexDirection }]}>
            <TouchableOpacity onPress={() => router.replace('/auth/login')}>
              <Text style={[styles.footerLink, { color: colors.accent }]}>{t('auth.backToLogin')}</Text>
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
    marginBottom: 30,
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
    fontFamily: FONTS.bold,
  },
  subtitleText: {
    fontSize: 13,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  formSection: {
    marginBottom: 16,
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: FONTS.semiBold,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
    fontFamily: FONTS.regular,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
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
    fontFamily: FONTS.bold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 20,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
});
