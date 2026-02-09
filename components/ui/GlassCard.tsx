// Premium Glassmorphism Card Component
import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { BlurView } from '@/components/ui/BlurView';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RADIUS, SHADOWS, SPACING } from '@/constants/Theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  borderColor?: string;
  gradientColors?: readonly [string, string, ...string[]];
  variant?: 'default' | 'accent' | 'live' | 'premium';
}

export default function GlassCard({
  children,
  style,
  intensity = 30,
  borderColor,
  gradientColors,
  variant = 'default',
}: GlassCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const getVariantColors = (): readonly [string, string] => {
    switch (variant) {
      case 'accent':
        return isDark 
          ? ['rgba(0, 217, 255, 0.1)', 'rgba(8, 145, 178, 0.05)'] as const
          : ['rgba(0, 217, 255, 0.15)', 'rgba(8, 145, 178, 0.08)'] as const;
      case 'live':
        return isDark 
          ? ['rgba(239, 68, 68, 0.15)', 'rgba(185, 28, 28, 0.08)'] as const
          : ['rgba(239, 68, 68, 0.1)', 'rgba(185, 28, 28, 0.05)'] as const;
      case 'premium':
        return isDark 
          ? ['rgba(245, 158, 11, 0.12)', 'rgba(249, 115, 22, 0.08)'] as const
          : ['rgba(245, 158, 11, 0.15)', 'rgba(249, 115, 22, 0.1)'] as const;
      default:
        return isDark 
          ? ['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.9)'] as const
          : ['rgba(255, 255, 255, 0.8)', 'rgba(248, 250, 252, 0.9)'] as const;
    }
  };

  const getBorderColor = () => {
    if (borderColor) return borderColor;
    switch (variant) {
      case 'accent':
        return isDark ? 'rgba(0, 217, 255, 0.3)' : 'rgba(0, 217, 255, 0.2)';
      case 'live':
        return isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)';
      case 'premium':
        return isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)';
      default:
        return isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
    }
  };

  const containerStyle: ViewStyle = {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: getBorderColor(),
    ...SHADOWS.sm,
    ...(style as object),
  };

  // On Android, BlurView might not work well, so use gradient fallback
  if (Platform.OS === 'android') {
    return (
      <LinearGradient
        colors={gradientColors || getVariantColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={containerStyle}
      >
        <View style={styles.content}>{children}</View>
      </LinearGradient>
    );
  }

  return (
    <View style={containerStyle}>
      <BlurView intensity={intensity} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={gradientColors || getVariantColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.md,
  },
});
