import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/Theme';

type DialogType = 'confirm' | 'error' | 'warning';

interface AppDialogProps {
  visible: boolean;
  type?: DialogType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  loading?: boolean;
}

const ICON_MAP: Record<DialogType, { name: string; color: string }> = {
  confirm: { name: 'help-circle', color: '#3B82F6' },
  error: { name: 'close-circle', color: '#EF4444' },
  warning: { name: 'warning', color: '#F59E0B' },
};

export default function AppDialog({
  visible,
  type = 'confirm',
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  showCancel = true,
  loading = false,
}: AppDialogProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const iconInfo = ICON_MAP[type];
  const handleClose = onCancel || onConfirm;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
              {/* Icon */}
              <View style={[styles.iconWrap, { backgroundColor: iconInfo.color + '15' }]}>
                <Ionicons name={iconInfo.name as any} size={32} color={iconInfo.color} />
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

              {/* Message */}
              <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* Buttons */}
              <View style={styles.buttons}>
                {showCancel && onCancel && (
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
                    onPress={onCancel}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{cancelText}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : colors.accent }]}
                  onPress={onConfirm}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Text style={styles.confirmText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  dialog: {
    width: '100%',
    borderRadius: RADIUS.xl,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    ...TYPOGRAPHY.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {},
  confirmBtn: {},
  cancelText: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
  },
  confirmText: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    color: '#fff',
  },
});
