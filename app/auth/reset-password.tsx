import React, { useState, useRef, useEffect } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { useAlert } from '@/contexts/AlertContext';
import api from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ResetPasswordScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();
  const { alert } = useAlert();
  const params = useLocalSearchParams<{ email: string }>();
  const email = params.email || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newCode[i] = digits[i] || '';
      }
      setCode(newCode);
      if (digits.length >= 6) {
        inputRefs.current[5]?.blur();
      } else {
        inputRefs.current[digits.length]?.focus();
      }
      return;
    }

    newCode[index] = text.replace(/\D/g, '');
    setCode(newCode);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await api.post('/auth/forgot-password', { email });
      setCountdown(60);
      setCanResend(false);
      alert(t('common.success'), t('auth.resetCodeSent'));
    } catch (error: any) {
      alert(t('common.error'), error.response?.data?.message || t('errors.tryAgain'));
    }
  };

  const handleReset = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      alert(t('common.error'), t('auth.codeRequired'));
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      alert(t('common.error'), t('auth.passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      alert(t('common.error'), t('auth.passwordsNotMatch'));
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        email,
        code: fullCode,
        newPassword,
      });

      if (response.data.success) {
        alert(t('common.success'), t('auth.passwordResetSuccess'));
        router.replace('/auth/login');
      }
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
                <Ionicons name="lock-open" size={30} color={colors.textInverse} />
              </LinearGradient>
            </View>

            <Text style={[styles.titleText, { color: colors.text }]}>{t('auth.resetPassword')}</Text>
            <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
              {t('auth.resetPasswordSubtitle')}
            </Text>
            <Text style={[styles.emailText, { color: colors.accent }]}>{email}</Text>
          </View>

          {/* Code Input */}
          <View style={styles.codeContainer}>
            <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
              {t('auth.verificationCode')}
            </Text>
            <View style={[styles.codeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[
                    styles.codeInput,
                    { 
                      backgroundColor: colors.surfaceElevated, 
                      borderColor: digit ? colors.accent : colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={index === 0 ? 6 : 1}
                  selectTextOnFocus
                  textAlign="center"
                />
              ))}
            </View>
          </View>

          {/* Password Fields */}
          <View style={styles.formSection}>
            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
                {t('auth.newPassword')}
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
                  placeholder={t('auth.enterNewPassword')}
                  placeholderTextColor={colors.textTertiary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
                {t('auth.confirmNewPassword')}
              </Text>
              <View style={[
                styles.inputWrapper,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                focusedInput === 'confirm' && { borderColor: colors.accent, backgroundColor: colors.accentGlow },
                { flexDirection }
              ]}>
                <View style={[styles.inputIcon, { backgroundColor: colors.surface }, focusedInput === 'confirm' && { backgroundColor: colors.accentGlow }, isRTL ? { marginLeft: 12 } : { marginRight: 12 }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={focusedInput === 'confirm' ? colors.accent : colors.textTertiary} />
                </View>
                <TextInput
                  style={[styles.textInput, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}
                  placeholder={t('auth.confirmNewPasswordPlaceholder')}
                  placeholderTextColor={colors.textTertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocusedInput('confirm')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              style={[styles.primaryButton, { shadowColor: colors.accent }, loading && styles.buttonDisabled]}
              onPress={handleReset}
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
                      <Text style={[styles.buttonText, { color: colors.textInverse }]}>{t('auth.resetting')}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.buttonText, { color: colors.textInverse }]}>{t('auth.resetPassword')}</Text>
                      <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
                    </>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Resend */}
          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={[styles.resendText, { color: colors.accent }]}>{t('auth.resendCode')}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.countdownText, { color: colors.textSecondary }]}>
                {t('auth.resendIn')} {countdown} {t('auth.seconds')}
              </Text>
            )}
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
    marginBottom: 24,
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
    marginBottom: 4,
    fontFamily: FONTS.regular,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  codeContainer: {
    marginBottom: 20,
    width: '100%',
  },
  codeRow: {
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: FONTS.bold,
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
  eyeButton: {
    padding: 6,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 4,
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
  resendContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  countdownText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 16,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
});
