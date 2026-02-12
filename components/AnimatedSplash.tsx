import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const logoBlack = require('@/assets/logo-black.png');
const logoWhite = require('@/assets/logo-white.png');

export default function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const { isDark } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => onFinish(), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#080808' : '#FFFFFF' }]}>
      <Image
        source={isDark ? logoWhite : logoBlack}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  logo: {
    width: 180,
    height: 180,
  },
});
