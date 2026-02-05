import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useColorScheme,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/Theme';

interface LiveBadgeProps {
  minute?: number;
  size?: 'small' | 'medium' | 'large';
  showPulse?: boolean;
  style?: any;
}

export default function LiveBadge({ 
  minute, 
  size = 'medium',
  showPulse = true,
  style 
}: LiveBadgeProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (showPulse) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();
      glowAnimation.start();

      return () => {
        pulseAnimation.stop();
        glowAnimation.stop();
      };
    }
  }, [showPulse]);

  const sizeStyles = {
    small: {
      dotSize: 6,
      padding: { paddingHorizontal: 8, paddingVertical: 4 },
      fontSize: 10,
      minuteFontSize: 10,
    },
    medium: {
      dotSize: 8,
      padding: { paddingHorizontal: 12, paddingVertical: 6 },
      fontSize: 12,
      minuteFontSize: 14,
    },
    large: {
      dotSize: 10,
      padding: { paddingHorizontal: 16, paddingVertical: 8 },
      fontSize: 14,
      minuteFontSize: 18,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[styles.container, currentSize.padding, style]}>
      {/* Pulse ring */}
      {showPulse && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: currentSize.dotSize * 2,
              height: currentSize.dotSize * 2,
              borderRadius: currentSize.dotSize,
              borderColor: colors.live,
              transform: [{ scale: pulseAnim }],
              opacity: glowAnim,
            },
          ]}
        />
      )}
      
      {/* Live dot */}
      <View
        style={[
          styles.liveDot,
          {
            width: currentSize.dotSize,
            height: currentSize.dotSize,
            borderRadius: currentSize.dotSize / 2,
            backgroundColor: colors.live,
          },
        ]}
      />
      
      {/* Live text */}
      <Text
        style={[
          styles.liveText,
          {
            fontSize: currentSize.fontSize,
            color: colors.live,
          },
        ]}
      >
        LIVE
      </Text>
      
      {/* Minute */}
      {minute !== undefined && (
        <Text
          style={[
            styles.minute,
            {
              fontSize: currentSize.minuteFontSize,
              color: colors.text,
            },
          ]}
        >
          {minute}'
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  pulseRing: {
    position: 'absolute',
    left: 10,
    borderWidth: 2,
  },
  liveDot: {
    marginRight: SPACING.sm,
  },
  liveText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  minute: {
    marginLeft: SPACING.sm,
    fontWeight: '700',
  },
});
