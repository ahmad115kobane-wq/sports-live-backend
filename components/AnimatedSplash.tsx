import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const appIcon = require('@/assets/icon.png');

export default function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const { isDark } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => onFinish(), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#080808' : '#FFFFFF' }]}>
      <Image
        source={appIcon}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  logo: {
    width: 250,
    height: 250,
  },
});
