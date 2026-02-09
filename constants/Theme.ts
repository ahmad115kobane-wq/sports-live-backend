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

// 📐 Balanced Spacing System
export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  xxxl: 30,
  huge: 36,
  massive: 44,
  giant: 56,
};

// ✍️ Balanced Typography Scale
export const TYPOGRAPHY = {
  // Display - Hero Headlines
  displayLarge: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  displaySmall: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  // Headlines - Section Titles
  headlineLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  headlineMedium: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  // Titles - Component Headers
  titleLarge: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  titleMedium: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  titleSmall: {
    fontSize: 12,
    lineHeight: 16,
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
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: 0.15,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
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
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500' as const,
    letterSpacing: 0.3,
  },
  labelSmall: {
    fontSize: 10,
    lineHeight: 14,
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
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
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

// 📏 Balanced Sizes
export const SIZES = {
  // Icons
  iconXs: 14,
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  iconXl: 28,
  
  // Avatars
  avatarSm: 28,
  avatarMd: 36,
  avatarLg: 44,
  avatarXl: 56,
  
  // Buttons
  buttonSm: 30,
  buttonMd: 36,
  buttonLg: 42,
  buttonXl: 48,
  
  // Inputs
  inputSm: 34,
  inputMd: 40,
  inputLg: 46,
  
  // Cards
  cardMinHeight: 56,
  cardImageHeight: 120,
  
  // Tab Bar
  tabBarHeight: Platform.OS === 'ios' ? 60 : 52,
  
  // Header
  headerHeight: Platform.OS === 'ios' ? 80 : 60,
  
  // Team Logos
  teamLogoSm: 24,
  teamLogoMd: 32,
  teamLogoLg: 42,
  teamLogoXl: 54,
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
