// 🎨 Sports App - Pure White & Black (Inverted Mirror)
// Light = inverse of Dark. Same grayscale, flipped.

export const Colors = {
  light: {
    // 🎨 Primary Palette - Light (used for headers)
    primary: '#F0F0F0',
    primaryLight: '#E8E8E8',
    primaryDark: '#F5F5F5',
    
    // ⚡ Accent - Emerald Green
    accent: '#059669',
    accentLight: '#34D399',
    accentDark: '#047857',
    accentGlow: 'rgba(5, 150, 105, 0.12)',
    
    // �️ Pitch / Sport Accents (The "Kohl" Touch)
    pitch: '#059669',       // Emerald 600 - Professional Green
    pitchLight: '#34D399',  // Emerald 400
    pitchDark: '#065F46',   // Emerald 800
    pitchGlow: 'rgba(5, 150, 105, 0.15)',
    pitchBorder: 'rgba(5, 150, 105, 0.3)',
    
    // �🌊 Secondary - Medium Gray
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
    
    // ✅ Semantic Colors - Real Colors
    success: '#16A34A',
    successLight: 'rgba(22, 163, 74, 0.1)',
    successDark: '#15803D',
    successGlow: 'rgba(22, 163, 74, 0.12)',
    
    warning: '#D97706',
    warningLight: 'rgba(217, 119, 6, 0.1)',
    warningDark: '#B45309',
    warningGlow: 'rgba(217, 119, 6, 0.12)',
    
    error: '#DC2626',
    errorLight: 'rgba(220, 38, 38, 0.1)',
    errorDark: '#B91C1C',
    errorGlow: 'rgba(220, 38, 38, 0.12)',
    
    info: '#2563EB',
    infoLight: 'rgba(37, 99, 235, 0.1)',
    infoDark: '#1D4ED8',
    infoGlow: 'rgba(37, 99, 235, 0.12)',
    
    // ⚽ Live Match Colors
    live: '#DC2626',
    liveLight: 'rgba(220, 38, 38, 0.1)',
    liveBackground: 'rgba(220, 38, 38, 0.06)',
    livePulse: '#EF4444',
    liveGlow: 'rgba(220, 38, 38, 0.15)',
    
    // 🥅 Match Events
    goal: '#16A34A',
    goalBackground: 'rgba(22, 163, 74, 0.08)',
    goalGlow: 'rgba(22, 163, 74, 0.12)',
    
    yellowCard: '#CA8A04',
    yellowCardBackground: 'rgba(202, 138, 4, 0.1)',
    yellowCardGlow: 'rgba(202, 138, 4, 0.15)',
    
    redCard: '#DC2626',
    redCardBackground: 'rgba(220, 38, 38, 0.08)',
    redCardGlow: 'rgba(220, 38, 38, 0.12)',
    
    substitution: '#2563EB',
    substitutionBackground: 'rgba(37, 99, 235, 0.08)',
    
    var: '#7C3AED',
    varBackground: 'rgba(124, 58, 237, 0.08)',
    
    // 🃏 Card Styles - White cards
    card: '#FFFFFF',
    cardBorder: '#E8E8E8',
    cardHighlight: '#F5F5F5',
    cardPressed: '#F0F0F0',
    cardShadow: 'rgba(0, 0, 0, 0.08)',
    
    // 🏟️ Match Specific
    homeTeam: '#2563EB',
    awayTeam: '#DC2626',
    draw: '#8A8A8A',
    
    // 📊 Stats Colors
    possession: '#2563EB',
    shots: '#DC2626',
    passes: '#16A34A',
    fouls: '#D97706',
    
    // 🎨 Gradient Presets
    gradients: {
      primary: ['#F5F5F5', '#EBEBEB', '#E0E0E0'] as const,
      accent: ['#059669', '#047857', '#065F46'] as const,
      secondary: ['#9A9A9A', '#8A8A8A', '#7A7A7A'] as const,
      live: ['#DC2626', '#B91C1C', '#991B1B'] as const,
      featured: ['#059669', '#047857', '#065F46'] as const,
      premium: ['#059669', '#047857', '#065F46'] as const,
      dark: ['#FAFAFA', '#F3F3F3', '#EDEDED'] as const,
      authDark: ['#000000', '#0A0A0A', '#141414'] as const,
      success: ['#16A34A', '#15803D', '#166534'] as const,
      cool: ['#9A9A9A', '#8A8A8A'] as const,
      sunset: ['#8A8A8A', '#7A7A7A'] as const,
      ocean: ['#9A9A9A', '#8A8A8A', '#7A7A7A'] as const,
      glass: ['rgba(255, 255, 255, 0.97)', 'rgba(255, 255, 255, 0.92)'] as const,
      hero: ['#FAFAFA', '#F3F3F3', '#EDEDED'] as const,
      card: ['#FFFFFF', '#F7F7F7'] as const,
      pitch: ['#059669', '#047857'] as const,
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
    tabActive: '#059669',
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
    
    // ⚡ Accent - Emerald Green
    accent: '#10B981',
    accentLight: '#34D399',
    accentDark: '#059669',
    accentGlow: 'rgba(16, 185, 129, 0.2)',
    
    // �️ Pitch / Sport Accents (The "Kohl" Touch)
    pitch: '#10B981',       // Emerald 500 - Brighter for Dark Mode
    pitchLight: '#34D399',  // Emerald 400
    pitchDark: '#047857',   // Emerald 700
    pitchGlow: 'rgba(16, 185, 129, 0.2)',
    pitchBorder: 'rgba(16, 185, 129, 0.4)',
    
    // �🌊 Secondary - Medium Gray
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
    
    // ✅ Semantic Colors - Real Colors
    success: '#22C55E',
    successLight: 'rgba(34, 197, 94, 0.12)',
    successDark: '#16A34A',
    successGlow: 'rgba(34, 197, 94, 0.18)',
    
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.12)',
    warningDark: '#D97706',
    warningGlow: 'rgba(245, 158, 11, 0.18)',
    
    error: '#EF4444',
    errorLight: 'rgba(239, 68, 68, 0.12)',
    errorDark: '#DC2626',
    errorGlow: 'rgba(239, 68, 68, 0.18)',
    
    info: '#3B82F6',
    infoLight: 'rgba(59, 130, 246, 0.12)',
    infoDark: '#2563EB',
    infoGlow: 'rgba(59, 130, 246, 0.18)',
    
    // ⚽ Live Match Colors
    live: '#EF4444',
    liveLight: 'rgba(239, 68, 68, 0.15)',
    liveBackground: 'rgba(239, 68, 68, 0.08)',
    livePulse: '#F87171',
    liveGlow: 'rgba(239, 68, 68, 0.25)',
    
    // 🥅 Match Events
    goal: '#22C55E',
    goalBackground: 'rgba(34, 197, 94, 0.12)',
    goalGlow: 'rgba(34, 197, 94, 0.18)',
    
    yellowCard: '#EAB308',
    yellowCardBackground: 'rgba(234, 179, 8, 0.15)',
    yellowCardGlow: 'rgba(234, 179, 8, 0.25)',
    
    redCard: '#EF4444',
    redCardBackground: 'rgba(239, 68, 68, 0.12)',
    redCardGlow: 'rgba(239, 68, 68, 0.18)',
    
    substitution: '#3B82F6',
    substitutionBackground: 'rgba(59, 130, 246, 0.12)',
    
    var: '#A855F7',
    varBackground: 'rgba(168, 85, 247, 0.12)',
    
    // 🃏 Card Styles
    card: '#151515',
    cardBorder: '#2A2A2A',
    cardHighlight: '#1E1E1E',
    cardPressed: '#2A2A2A',
    cardShadow: 'rgba(0, 0, 0, 0.4)',
    
    // 🏟️ Match Specific
    homeTeam: '#3B82F6',
    awayTeam: '#EF4444',
    draw: '#6B6B6B',
    
    // 📊 Stats Colors
    possession: '#3B82F6',
    shots: '#EF4444',
    passes: '#22C55E',
    fouls: '#F59E0B',
    
    // 🎨 Gradient Presets
    gradients: {
      primary: ['#0A0A0A', '#141414', '#1E1E1E'] as const,
      accent: ['#10B981', '#059669', '#047857'] as const,
      secondary: ['#5C5C5C', '#6B6B6B', '#7A7A7A'] as const,
      live: ['#EF4444', '#DC2626', '#B91C1C'] as const,
      featured: ['#10B981', '#059669', '#047857'] as const,
      premium: ['#10B981', '#059669', '#047857'] as const,
      dark: ['#000000', '#0A0A0A', '#141414'] as const,
      authDark: ['#000000', '#0A0A0A', '#141414'] as const,
      success: ['#22C55E', '#16A34A', '#15803D'] as const,
      cool: ['#5C5C5C', '#6B6B6B'] as const,
      sunset: ['#6B6B6B', '#7A7A7A'] as const,
      ocean: ['#5C5C5C', '#6B6B6B', '#7A7A7A'] as const,
      glass: ['rgba(20, 20, 20, 0.95)', 'rgba(20, 20, 20, 0.9)'] as const,
      hero: ['#141414', '#1E1E1E', '#282828'] as const,
      card: ['#141414', '#1E1E1E'] as const,
      pitch: ['#065F46', '#064E3B'] as const,
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
    tabActive: '#34D399',
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
