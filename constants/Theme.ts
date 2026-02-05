// 🎨 Minimal Professional Theme - Compact Sizes
import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// 📱 Responsive Breakpoints
export const SCREEN = {
  width,
  height,
  isSmall: width < 375,
  isMedium: width >= 375 && width < 414,
  isLarge: width >= 414,
  isTablet: width >= 768,
};

// 📐 Compact Spacing System
export const SPACING = {
  xxs: 2,
  xs: 3,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  huge: 34,
  massive: 42,
  giant: 56,
};

// ✍️ Compact Typography Scale
export const TYPOGRAPHY = {
  // Display - Hero Headlines
  displayLarge: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  displaySmall: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  // Headlines - Section Titles
  headlineLarge: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  headlineMedium: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  // Titles - Component Headers
  titleLarge: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  titleMedium: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  titleSmall: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  // Body - Content Text
  bodyLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0.2,
  },
  bodyMedium: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '400' as const,
    letterSpacing: 0.15,
  },
  bodySmall: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '400' as const,
    letterSpacing: 0.2,
  },
  // Labels - UI Elements
  labelLarge: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.3,
  },
  labelSmall: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.4,
  },
  // Score Display
  scoreDisplay: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  scoreLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  scoreMedium: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700' as const,
    letterSpacing: 0,
  },
};

// 🔲 Border Radius System
export const RADIUS = {
  none: 0,
  xs: 3,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 26,
  full: 9999,
};

// 🌟 Minimal Shadow System
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  xxl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  inner: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 0,
  },
  glow: (color: string, intensity: number = 0.2) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: 8,
    elevation: 4,
  }),
  colored: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  }),
};

// ⏱️ Animation Timing
export const ANIMATION = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 400,
  verySlow: 600,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  bounce: {
    damping: 8,
    stiffness: 100,
    mass: 0.8,
  },
};

// 📍 Z-Index Layers
export const Z_INDEX = {
  base: 0,
  card: 10,
  sticky: 50,
  header: 100,
  overlay: 200,
  modal: 500,
  toast: 1000,
  tooltip: 1100,
  maximum: 9999,
};

// 📏 Compact Sizes
export const SIZES = {
  // Icons
  iconXs: 14,
  iconSm: 16,
  iconMd: 20,
  iconLg: 26,
  iconXl: 32,
  
  // Avatars
  avatarSm: 26,
  avatarMd: 34,
  avatarLg: 46,
  avatarXl: 64,
  
  // Buttons
  buttonSm: 30,
  buttonMd: 38,
  buttonLg: 44,
  buttonXl: 50,
  
  // Inputs
  inputSm: 34,
  inputMd: 40,
  inputLg: 46,
  
  // Cards
  cardMinHeight: 60,
  cardImageHeight: 120,
  
  // Tab Bar
  tabBarHeight: Platform.OS === 'ios' ? 75 : 56,
  
  // Header
  headerHeight: Platform.OS === 'ios' ? 88 : 68,
  
  // Team Logos
  teamLogoSm: 22,
  teamLogoMd: 32,
  teamLogoLg: 44,
  teamLogoXl: 58,
};

// 🎨 Common Styles
export const COMMON_STYLES = {
  flexCenter: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  flexRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  flexRowBetween: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  absoluteFill: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  pressable: {
    activeOpacity: 0.7,
    pressScale: 0.98,
  },
};
