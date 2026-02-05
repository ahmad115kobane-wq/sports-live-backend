// Pulsing Live Indicator Dot
import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';

interface PulsingDotProps {
  color?: string;
  size?: number;
  style?: ViewStyle;
}

export default function PulsingDot({
  color = '#EF4444',
  size = 8,
  style,
}: PulsingDotProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.4,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, []);

  return (
    <View style={[styles.container, style]}>
      {/* Outer pulsing ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: size * 2.5,
            height: size * 2.5,
            borderRadius: size * 1.25,
            backgroundColor: color,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />
      {/* Inner solid dot */}
      <View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
  },
  dot: {
    zIndex: 1,
  },
});
