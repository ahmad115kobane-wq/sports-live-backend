import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Platform,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  children?: React.ReactNode;
  compact?: boolean;
  logo?: ImageSourcePropType;
}

export default function PageHeader({
  title,
  subtitle,
  leftContent,
  rightContent,
  children,
  compact = false,
  logo,
}: PageHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { isRTL, flexDirection } = useRTL();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 120, friction: 14, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[
      styles.header,
      compact && styles.headerCompact,
      { backgroundColor: colors.background },
    ]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Animated.View
        style={[
          styles.content,
          { flexDirection, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Left actions (back button) */}
        {leftContent}

        {/* Title / Logo */}
        <View style={[styles.titleBlock, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          {logo ? (
            <Image source={logo} style={styles.logo} resizeMode="contain" />
          ) : (
            <>
              <Text style={[styles.title, { color: colors.text }]}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
                  {subtitle}
                </Text>
              ) : null}
            </>
          )}
        </View>

        {/* Right actions */}
        {rightContent && <View style={[styles.actions, { flexDirection }]}>{rightContent}</View>}
      </Animated.View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24) + 14,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  headerCompact: {
    paddingBottom: SPACING.xs,
  },
  content: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  logo: {
    width: 130,
    height: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0,
    opacity: 0.6,
    marginTop: 3,
  },
  actions: {
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
});
