// 🎨 Minimal Professional Sports App - Black & Gray Theme
// Clean, Professional Design

export const Colors = {
  light: {
    // 🎨 Primary Palette - Professional Gray
    primary: '#1A1A1A',
    primaryLight: '#2D2D2D',
    primaryDark: '#0D0D0D',
    
    // ⚡ Accent - Subtle Gray
    accent: '#4A4A4A',
    accentLight: '#6B6B6B',
    accentDark: '#333333',
    accentGlow: 'rgba(74, 74, 74, 0.15)',
    
    // 🌊 Secondary - Medium Gray
    secondary: '#5C5C5C',
    secondaryLight: '#7A7A7A',
    secondaryDark: '#404040',
    
    // 🎯 Tertiary - Light Gray
    tertiary: '#8A8A8A',
    tertiaryLight: '#A0A0A0',
    tertiaryDark: '#6E6E6E',
    
    // 📱 Background System
    background: '#FAFAFA',
    backgroundSecondary: '#F5F5F5',
    backgroundTertiary: '#EBEBEB',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfacePressed: '#F0F0F0',
    
    // ✍️ Typography Colors
    text: '#1A1A1A',
    textSecondary: '#5C5C5C',
    textTertiary: '#8A8A8A',
    textQuaternary: '#B0B0B0',
    textInverse: '#FFFFFF',
    textAccent: '#3A3A3A',
    
    // 🔲 Borders & Dividers
    border: '#E5E5E5',
    borderLight: '#F0F0F0',
    borderFocus: '#4A4A4A',
    divider: '#E8E8E8',
    
    // ✅ Semantic Colors - Muted
    success: '#4A4A4A',
    successLight: '#F5F5F5',
    successDark: '#333333',
    successGlow: 'rgba(74, 74, 74, 0.1)',
    
    warning: '#6B6B6B',
    warningLight: '#F5F5F5',
    warningDark: '#4A4A4A',
    warningGlow: 'rgba(107, 107, 107, 0.1)',
    
    error: '#5C5C5C',
    errorLight: '#F5F5F5',
    errorDark: '#3A3A3A',
    errorGlow: 'rgba(92, 92, 92, 0.1)',
    
    info: '#4A4A4A',
    infoLight: '#F5F5F5',
    infoDark: '#333333',
    infoGlow: 'rgba(74, 74, 74, 0.1)',
    
    // ⚽ Live Match Colors
    live: '#3A3A3A',
    liveLight: 'rgba(58, 58, 58, 0.08)',
    liveBackground: 'rgba(58, 58, 58, 0.05)',
    livePulse: '#2D2D2D',
    liveGlow: 'rgba(58, 58, 58, 0.15)',
    
    // 🥅 Match Events
    goal: '#3A3A3A',
    goalBackground: 'rgba(58, 58, 58, 0.08)',
    goalGlow: 'rgba(58, 58, 58, 0.12)',
    
    yellowCard: '#8A8A8A',
    yellowCardBackground: 'rgba(138, 138, 138, 0.1)',
    yellowCardGlow: 'rgba(138, 138, 138, 0.15)',
    
    redCard: '#5C5C5C',
    redCardBackground: 'rgba(92, 92, 92, 0.08)',
    redCardGlow: 'rgba(92, 92, 92, 0.12)',
    
    substitution: '#6B6B6B',
    substitutionBackground: 'rgba(107, 107, 107, 0.08)',
    
    var: '#7A7A7A',
    varBackground: 'rgba(122, 122, 122, 0.08)',
    
    // 🃏 Card Styles
    card: '#FFFFFF',
    cardBorder: '#EBEBEB',
    cardHighlight: '#FAFAFA',
    cardPressed: '#F5F5F5',
    cardShadow: 'rgba(0, 0, 0, 0.04)',
    
    // 🏟️ Match Specific
    homeTeam: '#3A3A3A',
    awayTeam: '#6B6B6B',
    draw: '#8A8A8A',
    
    // 📊 Stats Colors
    possession: '#4A4A4A',
    shots: '#5C5C5C',
    passes: '#6B6B6B',
    fouls: '#7A7A7A',
    
    // 🎨 Gradient Presets
    gradients: {
      primary: ['#1A1A1A', '#2D2D2D', '#404040'] as const,
      accent: ['#3A3A3A', '#4A4A4A', '#5C5C5C'] as const,
      secondary: ['#4A4A4A', '#5C5C5C', '#6B6B6B'] as const,
      live: ['#2D2D2D', '#3A3A3A', '#4A4A4A'] as const,
      featured: ['#3A3A3A', '#4A4A4A', '#5C5C5C'] as const,
      premium: ['#4A4A4A', '#5C5C5C', '#6B6B6B'] as const,
      dark: ['#1A1A1A', '#2D2D2D', '#404040'] as const,
      success: ['#3A3A3A', '#4A4A4A', '#5C5C5C'] as const,
      cool: ['#4A4A4A', '#5C5C5C'] as const,
      sunset: ['#5C5C5C', '#6B6B6B'] as const,
      ocean: ['#3A3A3A', '#4A4A4A', '#5C5C5C'] as const,
      glass: ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)'] as const,
      hero: ['#2D2D2D', '#3A3A3A', '#4A4A4A'] as const,
      card: ['#FFFFFF', '#FAFAFA'] as const,
    },
    
    // 🌫️ Overlays & Glass
    overlay: 'rgba(26, 26, 26, 0.5)',
    overlayLight: 'rgba(26, 26, 26, 0.25)',
    overlayDark: 'rgba(26, 26, 26, 0.8)',
    glass: 'rgba(255, 255, 255, 0.95)',
    glassBorder: 'rgba(255, 255, 255, 0.5)',
    
    // 💀 Skeleton Loading
    skeleton: '#EBEBEB',
    skeletonHighlight: '#F5F5F5',
    
    // 🔘 Tab Bar
    tabBar: 'rgba(255, 255, 255, 0.98)',
    tabBarBorder: '#EBEBEB',
    tabActive: '#1A1A1A',
    tabInactive: '#8A8A8A',
    
    // 🌟 Special Effects
    shimmer: ['#EBEBEB', '#F5F5F5', '#EBEBEB'] as const,
    glow: 'rgba(74, 74, 74, 0.08)',
    spotlight: 'rgba(74, 74, 74, 0.05)',
  },
  
  dark: {
    // 🎨 Primary Palette - Deep Black
    primary: '#0A0A0A',
    primaryLight: '#141414',
    primaryDark: '#000000',
    
    // ⚡ Accent - Silver Gray
    accent: '#9A9A9A',
    accentLight: '#B0B0B0',
    accentDark: '#7A7A7A',
    accentGlow: 'rgba(154, 154, 154, 0.2)',
    
    // 🌊 Secondary - Medium Gray
    secondary: '#6B6B6B',
    secondaryLight: '#8A8A8A',
    secondaryDark: '#4A4A4A',
    
    // 🎯 Tertiary - Light Gray
    tertiary: '#5C5C5C',
    tertiaryLight: '#7A7A7A',
    tertiaryDark: '#404040',
    
    // 📱 Background System
    background: '#0A0A0A',
    backgroundSecondary: '#141414',
    backgroundTertiary: '#1E1E1E',
    surface: '#141414',
    surfaceElevated: '#1E1E1E',
    surfacePressed: '#282828',
    
    // ✍️ Typography Colors
    text: '#F0F0F0',
    textSecondary: '#9A9A9A',
    textTertiary: '#6B6B6B',
    textQuaternary: '#4A4A4A',
    textInverse: '#0A0A0A',
    textAccent: '#B0B0B0',
    
    // 🔲 Borders & Dividers
    border: '#282828',
    borderLight: '#333333',
    borderFocus: '#9A9A9A',
    divider: '#1E1E1E',
    
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
    card: '#141414',
    cardBorder: '#282828',
    cardHighlight: '#1E1E1E',
    cardPressed: '#282828',
    cardShadow: 'rgba(0, 0, 0, 0.3)',
    
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
    tabBar: 'rgba(20, 20, 20, 0.98)',
    tabBarBorder: '#1E1E1E',
    tabActive: '#F0F0F0',
    tabInactive: '#5C5C5C',
    
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
