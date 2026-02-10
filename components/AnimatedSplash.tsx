import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text } from 'react-native';
import Svg, { Circle, G, Path, Defs, RadialGradient, LinearGradient, Stop, ClipPath } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

const { width: W } = Dimensions.get('window');

export default function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const { colorScheme, isDark } = useTheme();
  const colors = Colors[colorScheme];

  const ballScale = useRef(new Animated.Value(0.6)).current;
  const ballOpacity = useRef(new Animated.Value(0)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;
  const pulseTranslateX = useRef(new Animated.Value(W)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  const lineColor = isDark ? '#A8A8A8' : '#5C5C5C';
  const lineColorFaint = isDark ? 'rgba(168,168,168,0.15)' : 'rgba(92,92,92,0.12)';
  const bgColor = isDark ? '#080808' : '#FFFFFF';
  const textColor = isDark ? '#F5F5F5' : '#111111';
  const subColor = isDark ? '#6E6E6E' : '#999999';
  const patchColor = isDark ? '#1A1A1A' : '#E0E0E0';
  const patchStroke = isDark ? '#2A2A2A' : '#CCCCCC';
  const seamColor = isDark ? '#C8C8D0' : '#AAAAAA';

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(ballScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.timing(ballOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(pulseOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(pulseTranslateX, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(500),
      Animated.timing(fadeOut, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start(() => onFinish());
  }, []);

  const pulsePath = `M0 60L${W*0.22} 60L${W*0.29} 28L${W*0.36} 92L${W*0.43} 8L${W*0.50} 105L${W*0.57} 38L${W*0.64} 72L${W*0.72} 60L${W} 60`;

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor, opacity: fadeOut }]}>
      {/* Ball */}
      <Animated.View style={{ opacity: ballOpacity, transform: [{ scale: ballScale }], marginBottom: 16 }}>
        <Svg width={180} height={180} viewBox="0 0 1024 1024" fill="none">
          <Defs>
            <RadialGradient id="sBS" cx="420" cy="340" r="380" fx="420" fy="340" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={isDark ? '#FFFFFF' : '#FAFAFA'} />
              <Stop offset="0.5" stopColor={isDark ? '#E0E0E0' : '#E8E8E8'} />
              <Stop offset="0.8" stopColor={isDark ? '#B0B0B0' : '#C8C8C8'} />
              <Stop offset="1" stopColor={isDark ? '#707070' : '#A0A0A0'} />
            </RadialGradient>
            <RadialGradient id="sBH" cx="380" cy="300" r="220" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.5" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
            <ClipPath id="sBC">
              <Circle cx="512" cy="512" r="400" />
            </ClipPath>
          </Defs>
          <Circle cx="512" cy="512" r="400" fill="url(#sBS)" />
          <G clipPath="url(#sBC)">
            <Path d="M512 400L575 436L558 510H466L449 436Z" fill={patchColor} stroke={patchStroke} strokeWidth="4" />
            <Path d="M512 140L570 174L554 244H470L454 174Z" fill={patchColor} stroke={patchStroke} strokeWidth="4" />
            <Path d="M760 250L814 288L794 358H730L712 288Z" fill={patchColor} stroke={patchStroke} strokeWidth="4" />
            <Path d="M264 250L312 288L294 358H230L210 288Z" fill={patchColor} stroke={patchStroke} strokeWidth="4" />
            <Path d="M730 620L782 658L764 728H700L682 658Z" fill={patchColor} stroke={patchStroke} strokeWidth="4" />
            <Path d="M294 620L340 658L322 728H258L240 658Z" fill={patchColor} stroke={patchStroke} strokeWidth="4" />
            <Path d="M512 770L564 806L548 876H476L460 806Z" fill={patchColor} stroke={patchStroke} strokeWidth="4" />
            <Path d="M512 244L512 400M554 244L575 436M470 244L449 436M454 174L312 288M570 174L712 288M575 436L730 620M449 436L294 620M558 510L730 620M466 510L294 620M558 510L564 806M466 510L460 806" stroke={seamColor} strokeWidth="4" strokeOpacity="0.5" />
          </G>
          <Circle cx="380" cy="300" r="200" fill="url(#sBH)" />
          <Circle cx="512" cy="512" r="400" stroke={isDark ? '#FFF' : '#000'} strokeWidth="4" strokeOpacity="0.06" fill="none" />
        </Svg>
      </Animated.View>

      {/* Pulse Wave */}
      <Animated.View style={{ width: W, height: 100, opacity: pulseOpacity, transform: [{ translateX: pulseTranslateX }] }}>
        <Svg width={W} height={100} viewBox={`0 0 ${W} 120`} fill="none">
          <Defs>
            <LinearGradient id="sPG" x1="0" y1="60" x2={String(W)} y2="60" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={lineColor} stopOpacity="0" />
              <Stop offset="0.15" stopColor={lineColor} stopOpacity="1" />
              <Stop offset="0.85" stopColor={lineColor} stopOpacity="1" />
              <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path d={pulsePath} stroke={lineColorFaint} strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Path d={pulsePath} stroke="url(#sPG)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      </Animated.View>

      {/* Text */}
      <Animated.View style={{ alignItems: 'center', marginTop: 20, opacity: textOpacity }}>
        <Text style={[styles.title, { color: textColor }]}>Mini Football</Text>
        <Text style={[styles.subtitle, { color: subColor }]}>LIVE SCORES</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 5,
    marginTop: 6,
  },
});
