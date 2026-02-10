import React, { useState, useEffect, useRef } from 'react';
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
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import { useRTL } from '@/contexts/RTLContext';
import { useAlert } from '@/contexts/AlertContext';
import api from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function VerifyEmailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();
  const { alert } = useAlert();
  const params = useLocalSearchParams<{ email: string }>();
  const email = params.email || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
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
    
    // Handle paste of full code
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

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      alert(t('common.error'), t('auth.codeRequired'));
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-email', {
        email,
        code: fullCode,
      });

      if (response.data.success) {
        const { user, token } = response.data.data;
        
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.setItem('hasSeenWelcome', 'true');
        
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        useAuthStore.setState({ 
          user, 
          token, 
          isAuthenticated: true, 
          isGuest: false, 
          hasSeenWelcome: true 
        });

        alert(t('common.success'), t('auth.emailVerified'));
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      alert(t('common.error'), error.response?.data?.message || t('auth.invalidCode'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    try {
      await api.post('/auth/resend-verification', { email });
      setCountdown(60);
      setCanResend(false);
      alert(t('common.success'), t('auth.codeSent'));
    } catch (error: any) {
      alert(t('common.error'), error.response?.data?.message || t('errors.tryAgain'));
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
                <Ionicons name="mail-open" size={30} color={colors.textInverse} />
              </LinearGradient>
            </View>

            <Text style={[styles.titleText, { color: colors.text }]}>{t('auth.verifyEmail')}</Text>
            <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
              {t('auth.verifyEmailSubtitle')}
            </Text>
            <Text style={[styles.emailText, { color: colors.accent }]}>{email}</Text>
          </View>

          {/* Code Input */}
          <View style={styles.codeContainer}>
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

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.primaryButton, { shadowColor: colors.accent }, loading && styles.buttonDisabled]}
            onPress={handleVerify}
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
                    <Text style={[styles.buttonText, { color: colors.textInverse }]}>{t('auth.verifying')}</Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.buttonText, { color: colors.textInverse }]}>{t('auth.verify')}</Text>
                    <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
                  </>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>

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
  },
  subtitleText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '600',
  },
  codeContainer: {
    marginBottom: 24,
    width: '100%',
  },
  codeRow: {
    justifyContent: 'center',
    gap: 8,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
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
  },
  resendContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  countdownText: {
    fontSize: 13,
  },
});
