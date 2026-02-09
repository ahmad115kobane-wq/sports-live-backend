// 🎨 Sports App - Pure White & Black (Inverted Mirror)
// Light = inverse of Dark. Same grayscale, flipped.

export const Colors = {
  light: {
    // 🎨 Primary Palette - Light (used for headers)
    primary: '#F0F0F0',
    primaryLight: '#E8E8E8',
    primaryDark: '#F5F5F5',
    
    // ⚡ Accent - Dark Gray (inverse of dark's #9A9A9A)
    accent: '#5C5C5C',
    accentLight: '#4A4A4A',
    accentDark: '#7A7A7A',
    accentGlow: 'rgba(92, 92, 92, 0.12)',
    
    // 🌊 Secondary - Medium Gray
    secondary: '#8A8A8A',
    secondaryLight: '#6B6B6B',
    secondaryDark: '#A0A0A0',
    
    // 🎯 Tertiary
    tertiary: '#9A9A9A',
    tertiaryLight: '#7A7A7A',
    tertiaryDark: '#B0B0B0',
    
    // 📱 Background System - Pure White
    background: '#FFFFFF',
    backgroundSecondary: '#F5F5F5',
    backgroundTertiary: '#EEEEEE',
    surface: '#F7F7F7',
    surfaceElevated: '#F0F0F0',
    surfacePressed: '#E8E8E8',
    
    // ✍️ Typography Colors - Black text on white
    text: '#111111',
    textSecondary: '#555555',
    textTertiary: '#999999',
    textQuaternary: '#BBBBBB',
    textInverse: '#FFFFFF',
    textAccent: '#333333',
    
    // 🔲 Borders & Dividers
    border: '#E2E2E2',
    borderLight: '#EEEEEE',
    borderFocus: '#5C5C5C',
    divider: '#F0F0F0',
    
    // ✅ Semantic Colors - Muted (inverse)
    success: '#6B6B6B',
    successLight: 'rgba(107, 107, 107, 0.1)',
    successDark: '#8A8A8A',
    successGlow: 'rgba(107, 107, 107, 0.12)',
    
    warning: '#5C5C5C',
    warningLight: 'rgba(92, 92, 92, 0.1)',
    warningDark: '#7A7A7A',
    warningGlow: 'rgba(92, 92, 92, 0.12)',
    
    error: '#6B6B6B',
    errorLight: 'rgba(107, 107, 107, 0.1)',
    errorDark: '#8A8A8A',
    errorGlow: 'rgba(107, 107, 107, 0.12)',
    
    info: '#7A7A7A',
    infoLight: 'rgba(122, 122, 122, 0.1)',
    infoDark: '#9A9A9A',
    infoGlow: 'rgba(122, 122, 122, 0.12)',
    
    // ⚽ Live Match Colors
    live: '#5C5C5C',
    liveLight: 'rgba(92, 92, 92, 0.1)',
    liveBackground: 'rgba(92, 92, 92, 0.06)',
    livePulse: '#4A4A4A',
    liveGlow: 'rgba(92, 92, 92, 0.15)',
    
    // 🥅 Match Events
    goal: '#5C5C5C',
    goalBackground: 'rgba(92, 92, 92, 0.08)',
    goalGlow: 'rgba(92, 92, 92, 0.12)',
    
    yellowCard: '#4A4A4A',
    yellowCardBackground: 'rgba(74, 74, 74, 0.1)',
    yellowCardGlow: 'rgba(74, 74, 74, 0.15)',
    
    redCard: '#6B6B6B',
    redCardBackground: 'rgba(107, 107, 107, 0.08)',
    redCardGlow: 'rgba(107, 107, 107, 0.12)',
    
    substitution: '#7A7A7A',
    substitutionBackground: 'rgba(122, 122, 122, 0.08)',
    
    var: '#5C5C5C',
    varBackground: 'rgba(92, 92, 92, 0.08)',
    
    // 🃏 Card Styles - White cards
    card: '#FFFFFF',
    cardBorder: '#E8E8E8',
    cardHighlight: '#F5F5F5',
    cardPressed: '#F0F0F0',
    cardShadow: 'rgba(0, 0, 0, 0.08)',
    
    // 🏟️ Match Specific
    homeTeam: '#5C5C5C',
    awayTeam: '#7A7A7A',
    draw: '#8A8A8A',
    
    // 📊 Stats Colors
    possession: '#5C5C5C',
    shots: '#6B6B6B',
    passes: '#7A7A7A',
    fouls: '#8A8A8A',
    
    // 🎨 Gradient Presets
    gradients: {
      primary: ['#F5F5F5', '#EBEBEB', '#E0E0E0'] as const,
      accent: ['#5C5C5C', '#4A4A4A', '#3A3A3A'] as const,
      secondary: ['#9A9A9A', '#8A8A8A', '#7A7A7A'] as const,
      live: ['#5C5C5C', '#4A4A4A', '#3A3A3A'] as const,
      featured: ['#5C5C5C', '#4A4A4A', '#3A3A3A'] as const,
      premium: ['#5C5C5C', '#4A4A4A', '#3A3A3A'] as const,
      dark: ['#FAFAFA', '#F3F3F3', '#EDEDED'] as const,
      authDark: ['#000000', '#0A0A0A', '#141414'] as const,
      success: ['#8A8A8A', '#7A7A7A', '#6B6B6B'] as const,
      cool: ['#9A9A9A', '#8A8A8A'] as const,
      sunset: ['#8A8A8A', '#7A7A7A'] as const,
      ocean: ['#9A9A9A', '#8A8A8A', '#7A7A7A'] as const,
      glass: ['rgba(255, 255, 255, 0.97)', 'rgba(255, 255, 255, 0.92)'] as const,
      hero: ['#FAFAFA', '#F3F3F3', '#EDEDED'] as const,
      card: ['#FFFFFF', '#F7F7F7'] as const,
    },
    
    // 🌫️ Overlays & Glass
    overlay: 'rgba(255, 255, 255, 0.7)',
    overlayLight: 'rgba(255, 255, 255, 0.4)',
    overlayDark: 'rgba(255, 255, 255, 0.9)',
    glass: 'rgba(255, 255, 255, 0.96)',
    glassBorder: 'rgba(0, 0, 0, 0.06)',
    
    // 💀 Skeleton Loading
    skeleton: '#F0F0F0',
    skeletonHighlight: '#E5E5E5',
    
    // 🔘 Tab Bar
    tabBar: 'rgba(255, 255, 255, 0.98)',
    tabBarBorder: '#EEEEEE',
    tabActive: '#111111',
    tabInactive: '#AAAAAA',
    
    // 🌟 Special Effects
    shimmer: ['#F0F0F0', '#E5E5E5', '#F0F0F0'] as const,
    glow: 'rgba(0, 0, 0, 0.06)',
    spotlight: 'rgba(0, 0, 0, 0.03)',
  },
  
  dark: {
    // 🎨 Primary Palette - Deep Black
    primary: '#0A0A0A',
    primaryLight: '#141414',
    primaryDark: '#000000',
    
    // ⚡ Accent - Silver Gray
    accent: '#A8A8A8',
    accentLight: '#C0C0C0',
    accentDark: '#888888',
    accentGlow: 'rgba(168, 168, 168, 0.2)',
    
    // 🌊 Secondary - Medium Gray
    secondary: '#6B6B6B',
    secondaryLight: '#8A8A8A',
    secondaryDark: '#4A4A4A',
    
    // 🎯 Tertiary - Light Gray
    tertiary: '#5C5C5C',
    tertiaryLight: '#7A7A7A',
    tertiaryDark: '#404040',
    
    // 📱 Background System
    background: '#080808',
    backgroundSecondary: '#121212',
    backgroundTertiary: '#1A1A1A',
    surface: '#151515',
    surfaceElevated: '#1E1E1E',
    surfacePressed: '#2A2A2A',
    
    // ✍️ Typography Colors
    text: '#F5F5F5',
    textSecondary: '#A0A0A0',
    textTertiary: '#6E6E6E',
    textQuaternary: '#4A4A4A',
    textInverse: '#080808',
    textAccent: '#C0C0C0',
    
    // 🔲 Borders & Dividers
    border: '#2A2A2A',
    borderLight: '#363636',
    borderFocus: '#A8A8A8',
    divider: '#1C1C1C',
    
    // ✅ Semantic Colors - Muted
    success: '#8A8A8A',
    successLight: 'rgba(138, 138, 138, 0.1)',
    successDark: '#6B6B6B',
    successGlow: 'rgba(138, 138, 138, 0.15)',
    
    warning: '#9A9A9A',
    warningLight: 'rgba(154, 154, 154, 0.1)',
    warningDark: '#7A7A7A',
    warningGlow: 'rgba(154, 154, 154, 0.15)',
    
    error: '#8A8A8A',
    errorLight: 'rgba(138, 138, 138, 0.1)',
    errorDark: '#6B6B6B',
    errorGlow: 'rgba(138, 138, 138, 0.15)',
    
    info: '#7A7A7A',
    infoLight: 'rgba(122, 122, 122, 0.1)',
    infoDark: '#5C5C5C',
    infoGlow: 'rgba(122, 122, 122, 0.15)',
    
    // ⚽ Live Match Colors
    live: '#9A9A9A',
    liveLight: 'rgba(154, 154, 154, 0.12)',
    liveBackground: 'rgba(154, 154, 154, 0.08)',
    livePulse: '#B0B0B0',
    liveGlow: 'rgba(154, 154, 154, 0.2)',
    
    // 🥅 Match Events
    goal: '#9A9A9A',
    goalBackground: 'rgba(154, 154, 154, 0.1)',
    goalGlow: 'rgba(154, 154, 154, 0.15)',
    
    yellowCard: '#B0B0B0',
    yellowCardBackground: 'rgba(176, 176, 176, 0.12)',
    yellowCardGlow: 'rgba(176, 176, 176, 0.2)',
    
    redCard: '#8A8A8A',
    redCardBackground: 'rgba(138, 138, 138, 0.1)',
    redCardGlow: 'rgba(138, 138, 138, 0.15)',
    
    substitution: '#7A7A7A',
    substitutionBackground: 'rgba(122, 122, 122, 0.1)',
    
    var: '#9A9A9A',
    varBackground: 'rgba(154, 154, 154, 0.1)',
    
    // 🃏 Card Styles
    card: '#151515',
    cardBorder: '#2A2A2A',
    cardHighlight: '#1E1E1E',
    cardPressed: '#2A2A2A',
    cardShadow: 'rgba(0, 0, 0, 0.4)',
    
    // 🏟️ Match Specific
    homeTeam: '#9A9A9A',
    awayTeam: '#7A7A7A',
    draw: '#6B6B6B',
    
    // 📊 Stats Colors
    possession: '#9A9A9A',
    shots: '#8A8A8A',
    passes: '#7A7A7A',
    fouls: '#6B6B6B',
    
    // 🎨 Gradient Presets
    gradients: {
      primary: ['#0A0A0A', '#141414', '#1E1E1E'] as const,
      accent: ['#7A7A7A', '#8A8A8A', '#9A9A9A'] as const,
      secondary: ['#5C5C5C', '#6B6B6B', '#7A7A7A'] as const,
      live: ['#6B6B6B', '#7A7A7A', '#8A8A8A'] as const,
      featured: ['#4A4A4A', '#5C5C5C', '#6B6B6B'] as const,
      premium: ['#5C5C5C', '#6B6B6B', '#7A7A7A'] as const,
      dark: ['#000000', '#0A0A0A', '#141414'] as const,
      authDark: ['#000000', '#0A0A0A', '#141414'] as const,
      success: ['#6B6B6B', '#7A7A7A', '#8A8A8A'] as const,
      cool: ['#5C5C5C', '#6B6B6B'] as const,
      sunset: ['#6B6B6B', '#7A7A7A'] as const,
      ocean: ['#5C5C5C', '#6B6B6B', '#7A7A7A'] as const,
      glass: ['rgba(20, 20, 20, 0.95)', 'rgba(20, 20, 20, 0.9)'] as const,
      hero: ['#141414', '#1E1E1E', '#282828'] as const,
      card: ['#141414', '#1E1E1E'] as const,
    },
    
    // 🌫️ Overlays & Glass
    overlay: 'rgba(0, 0, 0, 0.6)',
    overlayLight: 'rgba(0, 0, 0, 0.35)',
    overlayDark: 'rgba(0, 0, 0, 0.85)',
    glass: 'rgba(20, 20, 20, 0.95)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    
    // 💀 Skeleton Loading
    skeleton: '#1E1E1E',
    skeletonHighlight: '#282828',
    
    // 🔘 Tab Bar
    tabBar: 'rgba(12, 12, 12, 0.98)',
    tabBarBorder: '#1C1C1C',
    tabActive: '#F5F5F5',
    tabInactive: '#606060',
    
    // 🌟 Special Effects
    shimmer: ['#1E1E1E', '#282828', '#1E1E1E'] as const,
    glow: 'rgba(154, 154, 154, 0.1)',
    spotlight: 'rgba(154, 154, 154, 0.08)',
  },
};

// 🎯 Helper Functions
export const getMatchEventColor = (eventType: string, isDark: boolean) => {
  const scheme = isDark ? Colors.dark : Colors.light;
  switch (eventType) {
    case 'goal': return { color: scheme.goal, bg: scheme.goalBackground };
    case 'yellow_card': return { color: scheme.yellowCard, bg: scheme.yellowCardBackground };
    case 'red_card': return { color: scheme.redCard, bg: scheme.redCardBackground };
    case 'substitution': return { color: scheme.substitution, bg: scheme.substitutionBackground };
    case 'var': return { color: scheme.var, bg: scheme.varBackground };
    default: return { color: scheme.textSecondary, bg: scheme.surface };
  }
};

export const withOpacity = (color: string, opacity: number): string => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export type ColorScheme = typeof Colors.light;
export type ThemeType = 'light' | 'dark';
