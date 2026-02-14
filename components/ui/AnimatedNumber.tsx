// Animated Number Counter Component
import React, { useEffect, useRef } from 'react';
import { Animated, Text, TextStyle, StyleSheet } from 'react-native';
import { TYPOGRAPHY, FONTS } from '@/constants/Theme';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  style?: TextStyle;
  prefix?: string;
  suffix?: string;
}

export default function AnimatedNumber({
  value,
  duration = 800,
  style,
  prefix = '',
  suffix = '',
}: AnimatedNumberProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    animatedValue.setValue(0);
    
    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();

    animatedValue.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    return () => {
      animatedValue.removeAllListeners();
    };
  }, [value]);

  return (
    <Text style={[styles.number, style]}>
      {prefix}{displayValue}{suffix}
    </Text>
  );
}

const styles = StyleSheet.create({
  number: {
    ...TYPOGRAPHY.headlineLarge,
    fontWeight: '800',
  },
});
