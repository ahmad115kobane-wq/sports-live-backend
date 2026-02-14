import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY, SHADOWS, FONTS } from '@/constants/Theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  animated?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  animated = true,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (!animated) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
      Animated.timing(pressAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (!animated) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
      Animated.timing(pressAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const sizeStyles = {
    small: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
      fontSize: 12,
      iconSize: 12,
      borderRadius: RADIUS.md,
      height: 32,
    },
    medium: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm + 2,
      fontSize: 13,
      iconSize: 16,
      borderRadius: RADIUS.lg,
      height: 40,
    },
    large: {
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.md,
      fontSize: 14,
      iconSize: 18,
      borderRadius: RADIUS.lg,
      height: 46,
    },
  };

  const currentSize = sizeStyles[size];

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle; gradient?: string[] } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: colors.accent,
          },
          text: {
            color: '#FFFFFF',
            fontWeight: '700',
          },
          gradient: [...colors.gradients.accent],
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: colors.secondary,
          },
          text: {
            color: '#FFFFFF',
            fontWeight: '700',
          },
          gradient: [...colors.gradients.premium],
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: colors.accent,
          },
          text: {
            color: colors.accent,
            fontWeight: '600',
          },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: colors.accent + '15',
          },
          text: {
            color: colors.accent,
            fontWeight: '600',
          },
        };
      case 'danger':
        return {
          container: {
            backgroundColor: colors.error,
          },
          text: {
            color: '#FFFFFF',
            fontWeight: '700',
          },
          gradient: [...colors.gradients.live],
        };
      case 'success':
        return {
          container: {
            backgroundColor: colors.success,
          },
          text: {
            color: '#FFFFFF',
            fontWeight: '700',
          },
          gradient: [...colors.gradients.success],
        };
      default:
        return {
          container: {},
          text: {},
        };
    }
  };

  const variantStyles = getVariantStyles();

  const buttonContent = (
    <View style={styles.contentWrapper}>
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variantStyles.text.color} 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <View style={{ marginRight: SPACING.sm }}>{icon}</View>
          )}
          <Text
            style={[
              styles.text,
              { fontSize: currentSize.fontSize },
              variantStyles.text,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <View style={{ marginLeft: SPACING.sm }}>{icon}</View>
          )}
        </>
      )}
    </View>
  );

  const containerStyle: ViewStyle[] = [
    styles.container,
    {
      paddingHorizontal: currentSize.paddingHorizontal,
      height: currentSize.height,
      borderRadius: currentSize.borderRadius,
    },
    variantStyles.container,
    fullWidth ? styles.fullWidth : {},
    disabled ? styles.disabled : {},
  ];

  if (variantStyles.gradient && !disabled) {
    return (
      <Animated.View style={[
        fullWidth && styles.fullWidth,
        style,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={1}
        >
          <LinearGradient
            colors={variantStyles.gradient as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.container,
              styles.gradientContainer,
              {
                paddingHorizontal: currentSize.paddingHorizontal,
                height: currentSize.height,
                borderRadius: currentSize.borderRadius,
              },
              fullWidth && styles.fullWidth,
              disabled && styles.disabled,
            ]}
          >
            {buttonContent}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[
      fullWidth && styles.fullWidth,
      style,
      { transform: [{ scale: scaleAnim }] }
    ]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        style={containerStyle}
      >
        {buttonContent}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  gradientContainer: {
    ...SHADOWS.md,
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    letterSpacing: 0.3,
    fontFamily: FONTS.bold,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
