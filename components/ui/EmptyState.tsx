import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: 'default' | 'minimal';
}

export default function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  actionIcon,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default',
}: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  // variant 'card' removed — all empty states now render centered without card background

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const iconBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(iconBounce, {
          toValue: -6,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(iconBounce, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  if (variant === 'minimal') {
    return (
      <Animated.View
        style={[
          styles.minimalContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ translateY: iconBounce }] }}>
          <View style={[styles.minimalIconBg, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name={icon} size={28} color={colors.textTertiary} />
          </View>
        </Animated.View>
        <Text style={[styles.minimalTitle, { color: colors.textSecondary }]}>{title}</Text>
        <Text style={[styles.minimalSubtitle, { color: colors.textTertiary }]}>{subtitle}</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Icon with decorative rings */}
      <Animated.View style={[styles.iconArea, { transform: [{ translateY: iconBounce }] }]}>
        <View style={[styles.iconRingOuter, { borderColor: colors.border }]} />
        <View style={[styles.iconRingInner, { borderColor: colors.borderLight }]} />
        <LinearGradient
          colors={isDark ? ['#1E1E1E', '#282828'] : ['#F0F0F0', '#E5E5E5']}
          style={styles.iconCircle}
        >
          <Ionicons name={icon} size={32} color={colors.textTertiary} />
        </LinearGradient>
      </Animated.View>

      {/* Text */}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <View style={styles.actions}>
          {actionLabel && onAction && (
            <TouchableOpacity activeOpacity={0.8} onPress={onAction}>
              <LinearGradient
                colors={colors.gradients.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionBtn}
              >
                {actionIcon && <Ionicons name={actionIcon} size={16} color="#fff" />}
                <Text style={styles.actionBtnText}>{actionLabel}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              activeOpacity={0.7}
              onPress={onSecondaryAction}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>
                {secondaryActionLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  iconArea: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  iconRingOuter: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    opacity: 0.4,
  },
  iconRingInner: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    opacity: 0.6,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: SCREEN_WIDTH * 0.7,
    marginBottom: SPACING.lg,
  },
  actions: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  actionBtnText: {
    ...TYPOGRAPHY.labelMedium,
    color: '#fff',
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  secondaryBtnText: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '600',
  },
  // Minimal variant
  minimalContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  minimalIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  minimalTitle: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.xxs,
  },
  minimalSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
    lineHeight: 16,
  },
});
