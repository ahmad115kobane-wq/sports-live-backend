import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/Theme';

type BadgeVariant = 'default' | 'live' | 'success' | 'warning' | 'error' | 'info' | 'premium';
type BadgeSize = 'small' | 'medium' | 'large';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  style?: any;
}

export default function StatusBadge({
  label,
  variant = 'default',
  size = 'medium',
  icon,
  style,
}: StatusBadgeProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const sizeStyles = {
    small: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      fontSize: 9,
      iconSize: 10,
    },
    medium: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      fontSize: 11,
      iconSize: 12,
    },
    large: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      fontSize: 13,
      iconSize: 14,
    },
  };

  const currentSize = sizeStyles[size];

  const getVariantStyles = () => {
    switch (variant) {
      case 'live':
        return {
          backgroundColor: colors.liveBackground,
          borderColor: colors.live,
          textColor: colors.live,
          gradient: colors.gradients.live,
        };
      case 'success':
        return {
          backgroundColor: colors.successLight,
          borderColor: colors.success,
          textColor: colorScheme === 'dark' ? colors.success : colors.successDark,
        };
      case 'warning':
        return {
          backgroundColor: colors.warningLight,
          borderColor: colors.warning,
          textColor: colorScheme === 'dark' ? colors.warning : colors.warningDark,
        };
      case 'error':
        return {
          backgroundColor: colors.errorLight,
          borderColor: colors.error,
          textColor: colorScheme === 'dark' ? colors.error : colors.errorDark,
        };
      case 'info':
        return {
          backgroundColor: colors.infoLight,
          borderColor: colors.info,
          textColor: colorScheme === 'dark' ? colors.info : colors.infoDark,
        };
      case 'premium':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.secondary,
          textColor: '#FFFFFF',
          gradient: colors.gradients.premium,
        };
      default:
        return {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          textColor: colors.textSecondary,
        };
    }
  };

  const variantStyles = getVariantStyles();

  if (variantStyles.gradient) {
    return (
      <LinearGradient
        colors={[...variantStyles.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.container,
          {
            paddingHorizontal: currentSize.paddingHorizontal,
            paddingVertical: currentSize.paddingVertical,
          },
          style,
        ]}
      >
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text
          style={[
            styles.text,
            {
              fontSize: currentSize.fontSize,
              color: '#FFFFFF',
            },
          ]}
        >
          {label}
        </Text>
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
        },
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          styles.text,
          {
            fontSize: currentSize.fontSize,
            color: variantStyles.textColor,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
