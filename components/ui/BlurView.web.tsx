import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';

interface BlurViewProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

// Web fallback for BlurView - uses semi-transparent background instead
export const BlurView: React.FC<BlurViewProps> = ({ 
  intensity = 50, 
  tint = 'default',
  style,
  children,
  ...props 
}) => {
  const getBackgroundColor = () => {
    const opacity = intensity / 100;
    switch (tint) {
      case 'light':
        return `rgba(255, 255, 255, ${opacity * 0.8})`;
      case 'dark':
        return `rgba(0, 0, 0, ${opacity * 0.6})`;
      default:
        return `rgba(128, 128, 128, ${opacity * 0.5})`;
    }
  };

  return (
    <View
      {...props}
      style={[
        style,
        {
          backgroundColor: getBackgroundColor(),
          backdropFilter: `blur(${intensity / 5}px)`,
          WebkitBackdropFilter: `blur(${intensity / 5}px)`,
        } as any,
      ]}
    >
      {children}
    </View>
  );
};
