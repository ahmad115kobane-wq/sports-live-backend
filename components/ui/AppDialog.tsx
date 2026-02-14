import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY, FONTS } from '@/constants/Theme';

export type DialogType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface DialogButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AppDialogProps {
  visible: boolean;
  type?: DialogType;
  title: string;
  message?: string;
  buttons?: DialogButton[];
  onDismiss?: () => void;
  loading?: boolean;
  // Legacy props for backwards compatibility
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

const ICON_CONFIG: Record<DialogType, { name: string; lightColor: string; darkColor: string }> = {
  success: { name: 'checkmark-circle', lightColor: '#16A34A', darkColor: '#4ADE80' },
  error: { name: 'close-circle', lightColor: '#DC2626', darkColor: '#F87171' },
  warning: { name: 'alert-circle', lightColor: '#D97706', darkColor: '#FBBF24' },
  info: { name: 'information-circle', lightColor: '#2563EB', darkColor: '#60A5FA' },
  confirm: { name: 'help-circle', lightColor: '#5C5C5C', darkColor: '#9A9A9A' },
};

export default function AppDialog({
  visible,
  type = 'info',
  title,
  message,
  buttons: buttonsProp,
  onDismiss,
  loading = false,
  // Legacy props
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  showCancel,
}: AppDialogProps) {
  // Build buttons from legacy props if no buttons array provided
  const buttons: DialogButton[] = buttonsProp || (() => {
    const btns: DialogButton[] = [];
    if (showCancel && (onCancel || cancelText)) {
      btns.push({ text: cancelText || 'Cancel', style: 'cancel', onPress: onCancel });
    }
    btns.push({ text: confirmText || 'OK', style: 'default', onPress: onConfirm });
    return btns;
  })();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const iconConfig = ICON_CONFIG[type];
  const iconColor = isDark ? iconConfig.darkColor : iconConfig.lightColor;

  const getButtonBg = (style?: string) => {
    if (style === 'destructive') return isDark ? 'rgba(239,68,68,0.15)' : 'rgba(220,38,38,0.08)';
    if (style === 'cancel') return isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
    // default
    if (type === 'error') return colors.error;
    if (type === 'success') return colors.success;
    if (type === 'warning') return isDark ? '#D97706' : '#D97706';
    return colors.accent;
  };

  const getButtonTextColor = (style?: string) => {
    if (style === 'destructive') return isDark ? '#F87171' : '#DC2626';
    if (style === 'cancel') return colors.textSecondary;
    return '#fff';
  };

  const handleDismiss = () => {
    if (onDismiss) onDismiss();
    else if (onCancel) onCancel();
    else {
      const cancelBtn = buttons.find(b => b.style === 'cancel');
      const defaultBtn = buttons[0];
      (cancelBtn?.onPress || defaultBtn?.onPress)?.();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.dialog,
                {
                  backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                  transform: [{ scale: scaleAnim }],
                  opacity: opacityAnim,
                },
              ]}
            >
              {/* Top accent line */}
              <View style={[styles.accentLine, { backgroundColor: iconColor }]} />

              {/* Icon */}
              <View style={[styles.iconWrap, { backgroundColor: iconColor + '12' }]}>
                <Ionicons name={iconConfig.name as any} size={28} color={iconColor} />
              </View>

              {/* Title */}
              {title ? (
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              ) : null}

              {/* Message */}
              {message ? (
                <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
              ) : null}

              {/* Buttons */}
              {loading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="small" color={colors.accent} />
                </View>
              ) : (
                <View style={[styles.buttons, buttons.length === 1 && styles.buttonsSingle]}>
                  {buttons.map((btn, index) => {
                    const isDefault = btn.style !== 'cancel' && btn.style !== 'destructive';
                    const bg = getButtonBg(btn.style);
                    const textColor = getButtonTextColor(btn.style);

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.btn,
                          { backgroundColor: bg },
                          buttons.length === 1 && styles.btnFull,
                          isDefault && type !== 'confirm' && styles.btnElevated,
                        ]}
                        onPress={() => btn.onPress?.()}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.btnText,
                            { color: textColor },
                            isDefault && styles.btnTextBold,
                          ]}
                        >
                          {btn.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: RADIUS.xxl,
    paddingTop: 0,
    paddingHorizontal: 24,
    paddingBottom: 22,
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  accentLine: {
    width: '120%',
    height: 3,
    marginBottom: 22,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
    fontFamily: FONTS.bold,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
    paddingHorizontal: 4,
    opacity: 0.8,
    fontFamily: FONTS.regular,
  },
  loadingWrap: {
    paddingVertical: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  buttonsSingle: {
    justifyContent: 'center',
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  btnFull: {
    flex: 0,
    paddingHorizontal: 36,
  },
  btnElevated: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
    fontFamily: FONTS.semiBold,
  },
  btnTextBold: {
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
});
