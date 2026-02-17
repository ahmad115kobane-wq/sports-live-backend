import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import Svg, { Rect, Line, Circle, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import TeamLogo from '@/components/ui/TeamLogo';
import { getCategoryRules } from '@/constants/categoryRules';
import { SOCKET_URL } from '@/constants/config';

interface LineupPlayer {
  id: string;
  playerId: string;
  position?: string;
  positionX?: number;
  positionY?: number;
  isStarter: boolean;
  isCaptain: boolean;
  player?: {
    id: string;
    name: string;
    shirtNumber?: number;
    position?: string;
    imageUrl?: string;
  };
}

interface Lineup {
  id: string;
  formation?: string;
  coach?: string;
  coachImageUrl?: string;
  team?: {
    id: string;
    name: string;
    shortName: string;
    logoUrl?: string;
    primaryColor?: string;
  };
  players?: LineupPlayer[];
}

interface LineupViewProps {
  homeLineup?: Lineup | null;
  awayLineup?: Lineup | null;
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    logoUrl?: string;
    primaryColor?: string;
    category?: string;
    players?: any[];
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    logoUrl?: string;
    primaryColor?: string;
    category?: string;
    players?: any[];
  };
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FIELD_PADDING = 16;
const FIELD_WIDTH = SCREEN_WIDTH - 32;
const FIELD_HEIGHT = FIELD_WIDTH * 1.45;
const PLAYER_MARKER_SIZE = 36;
const PLAYER_NAME_WIDTH = 70;

// Field color schemes per sport
const FIELD_COLORS: Record<string, { bg1: string; bg2: string; line: string }> = {
  football: { bg1: '#2d8a4e', bg2: '#34a853', line: 'rgba(255,255,255,0.65)' },
  futsal: { bg1: '#1a6b3a', bg2: '#228B22', line: 'rgba(255,255,255,0.7)' },
  handball: { bg1: '#1565C0', bg2: '#1976D2', line: 'rgba(255,255,255,0.7)' },
  basketball: { bg1: '#BF360C', bg2: '#D84315', line: 'rgba(255,255,255,0.7)' },
};

function renderFutsalField() {
  const c = FIELD_COLORS.futsal;
  const P = FIELD_PADDING;
  const W = FIELD_WIDTH;
  const H = FIELD_HEIGHT;
  const iW = W - P * 2;
  const iH = H - P * 2;
  return (
    <>
      <Defs>
        <LinearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={c.bg1} />
          <Stop offset="50%" stopColor={c.bg2} />
          <Stop offset="100%" stopColor={c.bg1} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={W} height={H} fill="url(#pitchGrad)" rx="12" />
      <Rect x={P} y={P} width={iW} height={iH} stroke={c.line} strokeWidth="1.5" fill="none" rx="2" />
      <Line x1={P} y1={H / 2} x2={W - P} y2={H / 2} stroke={c.line} strokeWidth="1.5" />
      <Circle cx={W / 2} cy={H / 2} r={iW * 0.12} stroke={c.line} strokeWidth="1.5" fill="none" />
      <Circle cx={W / 2} cy={H / 2} r="3" fill="rgba(255,255,255,0.8)" />
      {/* Top penalty area (D-shape) */}
      <Rect x={W * 0.25} y={P} width={W * 0.5} height={iH * 0.12} stroke={c.line} strokeWidth="1.5" fill="none" />
      <Path d={`M ${W * 0.35} ${P + iH * 0.12} A ${iW * 0.1} ${iW * 0.1} 0 0 0 ${W * 0.65} ${P + iH * 0.12}`} stroke={c.line} strokeWidth="1.5" fill="none" />
      {/* Bottom penalty area */}
      <Rect x={W * 0.25} y={H - P - iH * 0.12} width={W * 0.5} height={iH * 0.12} stroke={c.line} strokeWidth="1.5" fill="none" />
      <Path d={`M ${W * 0.35} ${H - P - iH * 0.12} A ${iW * 0.1} ${iW * 0.1} 0 0 1 ${W * 0.65} ${H - P - iH * 0.12}`} stroke={c.line} strokeWidth="1.5" fill="none" />
      {/* Goals */}
      <Rect x={W * 0.35} y={P - 8} width={W * 0.3} height={8} stroke={c.line} strokeWidth="1.5" fill="rgba(255,255,255,0.08)" rx="2" />
      <Rect x={W * 0.35} y={H - P} width={W * 0.3} height={8} stroke={c.line} strokeWidth="1.5" fill="rgba(255,255,255,0.08)" rx="2" />
    </>
  );
}

function renderHandballField() {
  const c = FIELD_COLORS.handball;
  const P = FIELD_PADDING;
  const W = FIELD_WIDTH;
  const H = FIELD_HEIGHT;
  const iW = W - P * 2;
  const iH = H - P * 2;
  return (
    <>
      <Defs>
        <LinearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={c.bg1} />
          <Stop offset="50%" stopColor={c.bg2} />
          <Stop offset="100%" stopColor={c.bg1} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={W} height={H} fill="url(#pitchGrad)" rx="12" />
      <Rect x={P} y={P} width={iW} height={iH} stroke={c.line} strokeWidth="1.5" fill="none" rx="2" />
      <Line x1={P} y1={H / 2} x2={W - P} y2={H / 2} stroke={c.line} strokeWidth="1.5" />
      {/* Top 6m area (D-shape) */}
      <Path d={`M ${W * 0.2} ${P} A ${iW * 0.35} ${iH * 0.15} 0 0 0 ${W * 0.8} ${P}`} stroke={c.line} strokeWidth="2" fill="none" />
      {/* Top 9m dashed line */}
      <Path d={`M ${W * 0.15} ${P} A ${iW * 0.4} ${iH * 0.2} 0 0 0 ${W * 0.85} ${P}`} stroke={c.line} strokeWidth="1" fill="none" strokeDasharray="6,4" />
      {/* Bottom 6m area */}
      <Path d={`M ${W * 0.2} ${H - P} A ${iW * 0.35} ${iH * 0.15} 0 0 1 ${W * 0.8} ${H - P}`} stroke={c.line} strokeWidth="2" fill="none" />
      {/* Bottom 9m dashed */}
      <Path d={`M ${W * 0.15} ${H - P} A ${iW * 0.4} ${iH * 0.2} 0 0 1 ${W * 0.85} ${H - P}`} stroke={c.line} strokeWidth="1" fill="none" strokeDasharray="6,4" />
      {/* Goals */}
      <Rect x={W * 0.3} y={P - 8} width={W * 0.4} height={8} stroke={c.line} strokeWidth="1.5" fill="rgba(255,255,255,0.08)" rx="2" />
      <Rect x={W * 0.3} y={H - P} width={W * 0.4} height={8} stroke={c.line} strokeWidth="1.5" fill="rgba(255,255,255,0.08)" rx="2" />
      {/* 7m penalty marks */}
      <Circle cx={W / 2} cy={P + iH * 0.1} r="3" fill="rgba(255,255,255,0.7)" />
      <Circle cx={W / 2} cy={H - P - iH * 0.1} r="3" fill="rgba(255,255,255,0.7)" />
    </>
  );
}

function renderBasketballField() {
  const c = FIELD_COLORS.basketball;
  const P = FIELD_PADDING;
  const W = FIELD_WIDTH;
  const H = FIELD_HEIGHT;
  const iW = W - P * 2;
  const iH = H - P * 2;
  return (
    <>
      <Defs>
        <LinearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={c.bg1} />
          <Stop offset="50%" stopColor={c.bg2} />
          <Stop offset="100%" stopColor={c.bg1} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={W} height={H} fill="url(#pitchGrad)" rx="12" />
      <Rect x={P} y={P} width={iW} height={iH} stroke={c.line} strokeWidth="1.5" fill="none" rx="2" />
      <Line x1={P} y1={H / 2} x2={W - P} y2={H / 2} stroke={c.line} strokeWidth="1.5" />
      {/* Center circle */}
      <Circle cx={W / 2} cy={H / 2} r={iW * 0.14} stroke={c.line} strokeWidth="1.5" fill="none" />
      {/* Top key/paint area */}
      <Rect x={W * 0.28} y={P} width={W * 0.44} height={iH * 0.18} stroke={c.line} strokeWidth="1.5" fill="none" />
      {/* Top free throw circle */}
      <Circle cx={W / 2} cy={P + iH * 0.18} r={iW * 0.1} stroke={c.line} strokeWidth="1.5" fill="none" />
      {/* Top basket */}
      <Circle cx={W / 2} cy={P + iH * 0.04} r="6" stroke={c.line} strokeWidth="2" fill="none" />
      {/* Top 3-point arc */}
      <Path d={`M ${W * 0.12} ${P} A ${iW * 0.42} ${iH * 0.28} 0 0 0 ${W * 0.88} ${P}`} stroke={c.line} strokeWidth="1.5" fill="none" />
      {/* Bottom key */}
      <Rect x={W * 0.28} y={H - P - iH * 0.18} width={W * 0.44} height={iH * 0.18} stroke={c.line} strokeWidth="1.5" fill="none" />
      {/* Bottom free throw circle */}
      <Circle cx={W / 2} cy={H - P - iH * 0.18} r={iW * 0.1} stroke={c.line} strokeWidth="1.5" fill="none" />
      {/* Bottom basket */}
      <Circle cx={W / 2} cy={H - P - iH * 0.04} r="6" stroke={c.line} strokeWidth="2" fill="none" />
      {/* Bottom 3-point arc */}
      <Path d={`M ${W * 0.12} ${H - P} A ${iW * 0.42} ${iH * 0.28} 0 0 1 ${W * 0.88} ${H - P}`} stroke={c.line} strokeWidth="1.5" fill="none" />
    </>
  );
}

export default function LineupView({ homeLineup, awayLineup, homeTeam, awayTeam }: LineupViewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const category = homeTeam?.category || 'FOOTBALL';
  const categoryRules = getCategoryRules(category);
  const fieldType = categoryRules.fieldType;

  const currentLineup = selectedTeam === 'home' ? homeLineup : awayLineup;
  const currentTeam = selectedTeam === 'home' ? homeTeam : awayTeam;
  const teamColor = currentTeam.primaryColor || (selectedTeam === 'home' ? '#3B82F6' : '#EF4444');

  const starters = currentLineup?.players?.filter(p => p.isStarter) || [];
  const substitutes = currentLineup?.players?.filter(p => !p.isStarter) || [];

  const getPlayerLastName = (name?: string) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0];
    return parts[parts.length - 1];
  };

  // Translate position to Arabic
  const translatePosition = (position?: string) => {
    if (!position) return t('operator.sub');

    const normalizedPosition = position.trim();
    const upperPosition = normalizedPosition.toUpperCase();

    const positionAliases: Record<string, string> = {
      DEF: 'DF',
      MID: 'MF',
      FWD: 'FW',
      ATT: 'FW',
      GOALKEEPER: 'Goalkeeper',
      DEFENDER: 'Defender',
      MIDFIELDER: 'Midfielder',
      FORWARD: 'Forward',
    };

    const translationKey = positionAliases[upperPosition] || normalizedPosition;
    const translated = t(`positions.${translationKey}`);

    // If translation key doesn't exist, return original
    return translated.startsWith('positions.') ? normalizedPosition : translated;
  };

  const getPlayerPixelPosition = (player: LineupPlayer) => {
    const posY = selectedTeam === 'away' ? 100 - (player.positionY || 50) : (player.positionY || 50);
    const posX = player.positionX || 50;
    const pixelX = (posX / 100) * (FIELD_WIDTH - FIELD_PADDING * 2) + FIELD_PADDING;
    const pixelY = (posY / 100) * (FIELD_HEIGHT - FIELD_PADDING * 2) + FIELD_PADDING;
    return { pixelX, pixelY };
  };

  const renderPlayerCard = (player: any, index: number) => {
    const rawName = player?.player?.name || player?.name;
    const shirtNumber = player?.player?.shirtNumber ?? player?.shirtNumber ?? '-';
    const playerPosition = player?.position || player?.player?.position;
    const imageUrl = player?.player?.imageUrl || player?.imageUrl;

    return (
      <View
        key={player.id || index}
        style={[styles.playerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={[styles.playerCardAccent, { backgroundColor: teamColor }]} />

        <View style={[styles.playerCardBody, { flexDirection }]}> 
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.playerAvatarImage} />
          ) : (
            <View style={[styles.playerAvatarNumber, { backgroundColor: teamColor }]}> 
              <Text style={styles.playerAvatarNumberText}>{shirtNumber}</Text>
            </View>
          )}

          <View style={styles.playerCardTexts}>
            <Text
              style={[styles.playerCardName, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {rawName}
            </Text>

            <View style={[styles.playerCardMetaRow, { flexDirection }]}> 
              <View style={[styles.playerMetaPill, { backgroundColor: colors.backgroundSecondary || colors.background }]}> 
                <Text style={[styles.playerMetaText, { color: colors.textSecondary }]}> 
                  {translatePosition(playerPosition)}
                </Text>
              </View>

              <View style={[styles.playerMetaPill, { backgroundColor: colors.backgroundSecondary || colors.background }]}> 
                <Text style={[styles.playerMetaText, { color: colors.textSecondary }]}>#{shirtNumber}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Team Selector - Segmented Style */}
      <View style={[styles.teamSelector, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.teamTab,
            selectedTeam === 'home' && { backgroundColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
          ]}
          onPress={() => setSelectedTeam('home')}
          activeOpacity={0.9}
        >
          <TeamLogo team={homeTeam} size="small" showName={false} />
          <Text
            style={[
              styles.teamTabText,
              { color: selectedTeam === 'home' ? '#fff' : colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {homeTeam.shortName || homeTeam.name}
          </Text>
          {homeLineup?.formation && (
            <View style={[styles.formationBadge, { backgroundColor: selectedTeam === 'home' ? 'rgba(0,0,0,0.2)' : colors.backgroundSecondary }]}>
              <Text style={[styles.formationText, { color: selectedTeam === 'home' ? '#fff' : colors.textSecondary }]}>
                {homeLineup.formation}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.teamTab,
            selectedTeam === 'away' && { backgroundColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
          ]}
          onPress={() => setSelectedTeam('away')}
          activeOpacity={0.9}
        >
          <TeamLogo team={awayTeam} size="small" showName={false} />
          <Text
            style={[
              styles.teamTabText,
              { color: selectedTeam === 'away' ? '#fff' : colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {awayTeam.shortName || awayTeam.name}
          </Text>
          {awayLineup?.formation && (
            <View style={[styles.formationBadge, { backgroundColor: selectedTeam === 'away' ? 'rgba(0,0,0,0.2)' : colors.backgroundSecondary }]}>
              <Text style={[styles.formationText, { color: selectedTeam === 'away' ? '#fff' : colors.textSecondary }]}>
                {awayLineup.formation}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {currentLineup ? (
        <>
          {/* Coach Info Bar (Compact) */}
          {currentLineup.coach && (
            <View style={[styles.coachBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {(() => {
                const imgUrl = currentLineup.coachImageUrl
                  ? (currentLineup.coachImageUrl.startsWith('http') ? currentLineup.coachImageUrl : `${SOCKET_URL}${currentLineup.coachImageUrl}`)
                  : null;
                return imgUrl ? (
                  <Image source={{ uri: imgUrl }} style={styles.coachAvatar} />
                ) : (
                  <View style={[styles.coachAvatarFallback, { backgroundColor: teamColor + '15' }]}>
                    <Ionicons name="person" size={18} color={teamColor} />
                  </View>
                );
              })()}
              <View style={{ flex: 1 }}>
                <Text style={[styles.coachNameFull, { color: colors.text }]}>{currentLineup.coach}</Text>
                <Text style={[styles.coachLabel, { color: colors.textSecondary }]}>{t('match.coach')}</Text>
              </View>
            </View>
          )}

          {/* Playing Field */}
          <View style={[styles.fieldContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.fieldWrapper}>
              {/* SVG Pitch - renders based on sport category */}
              <Svg width={FIELD_WIDTH} height={FIELD_HEIGHT} viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`}>
                {fieldType === 'futsal' ? renderFutsalField()
                  : fieldType === 'handball' ? renderHandballField()
                  : fieldType === 'basketball' ? renderBasketballField()
                  : (
                  <>
                    <Defs>
                      <LinearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor="#2d8a4e" />
                        <Stop offset="25%" stopColor="#34a853" />
                        <Stop offset="50%" stopColor="#2d8a4e" />
                        <Stop offset="75%" stopColor="#34a853" />
                        <Stop offset="100%" stopColor="#2d8a4e" />
                      </LinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width={FIELD_WIDTH} height={FIELD_HEIGHT} fill="url(#pitchGrad)" rx="12" />
                    {Array.from({ length: 12 }).map((_, i) => {
                      const stripeH = FIELD_HEIGHT / 12;
                      return i % 2 === 0 ? (
                        <Rect key={`stripe-${i}`} x="0" y={i * stripeH} width={FIELD_WIDTH} height={stripeH} fill="rgba(255,255,255,0.04)" />
                      ) : null;
                    })}
                    <Rect x={FIELD_PADDING} y={FIELD_PADDING} width={FIELD_WIDTH - FIELD_PADDING * 2} height={FIELD_HEIGHT - FIELD_PADDING * 2} stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" fill="none" rx="2" />
                    <Line x1={FIELD_PADDING} y1={FIELD_HEIGHT / 2} x2={FIELD_WIDTH - FIELD_PADDING} y2={FIELD_HEIGHT / 2} stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
                    <Circle cx={FIELD_WIDTH / 2} cy={FIELD_HEIGHT / 2} r={FIELD_WIDTH * 0.12} stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" fill="none" />
                    <Circle cx={FIELD_WIDTH / 2} cy={FIELD_HEIGHT / 2} r="3" fill="rgba(255,255,255,0.8)" />
                    <Rect x={FIELD_WIDTH * 0.2} y={FIELD_PADDING} width={FIELD_WIDTH * 0.6} height={FIELD_HEIGHT * 0.14} stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" fill="none" />
                    <Rect x={FIELD_WIDTH * 0.32} y={FIELD_PADDING} width={FIELD_WIDTH * 0.36} height={FIELD_HEIGHT * 0.055} stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" fill="none" />
                    <Circle cx={FIELD_WIDTH / 2} cy={FIELD_PADDING + FIELD_HEIGHT * 0.1} r="2.5" fill="rgba(255,255,255,0.7)" />
                    <Path d={`M ${FIELD_WIDTH * 0.35} ${FIELD_PADDING + FIELD_HEIGHT * 0.14} A ${FIELD_WIDTH * 0.12} ${FIELD_WIDTH * 0.12} 0 0 0 ${FIELD_WIDTH * 0.65} ${FIELD_PADDING + FIELD_HEIGHT * 0.14}`} stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" fill="none" />
                    <Rect x={FIELD_WIDTH * 0.2} y={FIELD_HEIGHT - FIELD_PADDING - FIELD_HEIGHT * 0.14} width={FIELD_WIDTH * 0.6} height={FIELD_HEIGHT * 0.14} stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" fill="none" />
                    <Rect x={FIELD_WIDTH * 0.32} y={FIELD_HEIGHT - FIELD_PADDING - FIELD_HEIGHT * 0.055} width={FIELD_WIDTH * 0.36} height={FIELD_HEIGHT * 0.055} stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" fill="none" />
                    <Circle cx={FIELD_WIDTH / 2} cy={FIELD_HEIGHT - FIELD_PADDING - FIELD_HEIGHT * 0.1} r="2.5" fill="rgba(255,255,255,0.7)" />
                    <Path d={`M ${FIELD_WIDTH * 0.35} ${FIELD_HEIGHT - FIELD_PADDING - FIELD_HEIGHT * 0.14} A ${FIELD_WIDTH * 0.12} ${FIELD_WIDTH * 0.12} 0 0 1 ${FIELD_WIDTH * 0.65} ${FIELD_HEIGHT - FIELD_PADDING - FIELD_HEIGHT * 0.14}`} stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" fill="none" />
                    <Rect x={FIELD_WIDTH * 0.38} y={FIELD_PADDING - 8} width={FIELD_WIDTH * 0.24} height={8} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="rgba(255,255,255,0.08)" rx="2" />
                    <Rect x={FIELD_WIDTH * 0.38} y={FIELD_HEIGHT - FIELD_PADDING} width={FIELD_WIDTH * 0.24} height={8} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="rgba(255,255,255,0.08)" rx="2" />
                    <Path d={`M ${FIELD_PADDING + 8} ${FIELD_PADDING} A 8 8 0 0 0 ${FIELD_PADDING} ${FIELD_PADDING + 8}`} stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" fill="none" />
                    <Path d={`M ${FIELD_WIDTH - FIELD_PADDING - 8} ${FIELD_PADDING} A 8 8 0 0 1 ${FIELD_WIDTH - FIELD_PADDING} ${FIELD_PADDING + 8}`} stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" fill="none" />
                    <Path d={`M ${FIELD_PADDING} ${FIELD_HEIGHT - FIELD_PADDING - 8} A 8 8 0 0 0 ${FIELD_PADDING + 8} ${FIELD_HEIGHT - FIELD_PADDING}`} stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" fill="none" />
                    <Path d={`M ${FIELD_WIDTH - FIELD_PADDING} ${FIELD_HEIGHT - FIELD_PADDING - 8} A 8 8 0 0 1 ${FIELD_WIDTH - FIELD_PADDING - 8} ${FIELD_HEIGHT - FIELD_PADDING}`} stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" fill="none" />
                  </>
                )}
              </Svg>

              {/* Player markers as RN Views (fixes Arabic/RTL text) */}
              {starters.map((player, index) => {
                const { pixelX, pixelY } = getPlayerPixelPosition(player);
                return (
                  <View
                    key={player.id || index}
                    style={[
                      styles.playerMarkerContainer,
                      {
                        left: pixelX - PLAYER_MARKER_SIZE / 2,
                        top: pixelY - PLAYER_MARKER_SIZE / 2,
                      },
                    ]}
                    pointerEvents="none"
                  >
                    {/* Shadow */}
                    <View style={[styles.playerMarkerShadow, { backgroundColor: 'rgba(0,0,0,0.25)' }]} />
                    {/* Circle with photo or number */}
                    {player.player?.imageUrl ? (
                      <View style={[styles.playerMarker, { backgroundColor: teamColor, borderColor: '#fff', overflow: 'hidden' }]}>
                        <Image source={{ uri: player.player.imageUrl }} style={styles.playerPhotoField} />
                      </View>
                    ) : (
                      <View style={[styles.playerMarker, { backgroundColor: teamColor, borderColor: '#fff' }]}>
                        <Text style={styles.playerMarkerNumber}>
                          {player.player?.shirtNumber || ''}
                        </Text>
                      </View>
                    )}
                    {/* Captain badge */}
                    {player.isCaptain && (
                      <View style={styles.captainBadge}>
                        <Text style={styles.captainBadgeText}>C</Text>
                      </View>
                    )}
                    {/* Player name - using RN Text for proper RTL support */}
                    <View style={styles.playerNameContainer}>
                      <Text
                        style={[styles.playerNameText, { writingDirection: isRTL ? 'rtl' : 'ltr' }]}
                        numberOfLines={2} ellipsizeMode="tail"
                      >
                        {player.player?.name}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Substitutes */}
          {substitutes.length > 0 && (
            <View style={styles.substitutesSection}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: teamColor + '15' }]}> 
                  <Ionicons name="swap-horizontal" size={16} color={teamColor} />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}> 
                  {t('match.substitutes')} <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '400' }}>({substitutes.length})</Text>
                </Text>
              </View>

              <View style={styles.playersStack}>
                {substitutes.map((player, index) => renderPlayerCard(player, index))}
              </View>
            </View>
          )}
        </>
      ) : (
        /* No Lineup - Show team players as professional list cards */
        <View>
          {/* Show team players if available */}
          {currentTeam.players && currentTeam.players.length > 0 ? (
            <View>
              <View style={[styles.noLineupHeader, { backgroundColor: colors.surface }]}> 
                <View style={[styles.noLineupHeaderMain, { flexDirection }]}> 
                  <TeamLogo team={currentTeam} size="small" />
                  <Text style={[styles.noLineupHeaderText, { color: colors.text }]}> 
                    {currentTeam.name}
                  </Text>
                </View>

                <View style={[styles.noLineupCountBadge, { backgroundColor: teamColor + '15' }]}> 
                  <Text style={[styles.noLineupCountText, { color: teamColor }]}> 
                    {currentTeam.players.length}
                  </Text>
                </View>
              </View>

              <View style={styles.playersStack}>
                {currentTeam.players.map((player: any, index: number) => renderPlayerCard(player, index))}
              </View>
            </View>
          ) : (
            <View style={[styles.noLineupEmpty, { backgroundColor: colors.surface }]}> 
              <Ionicons name="people-outline" size={36} color={colors.textTertiary} />
              <Text style={[styles.noLineupEmptyText, { color: colors.textSecondary }]}>
                {t('match.lineupNotAvailable')}
              </Text>
            </View>
          )}
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  teamSelector: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    padding: SPACING.xs,
    marginBottom: SPACING.md,
  },
  teamTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  teamTabText: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '600',
    flex: 1,
  },
  tabDivider: {
    width: 1,
    marginVertical: SPACING.sm,
  },
  formationBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  formationText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700',
  },
  infoBar: {
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    padding: SPACING.sm,
    gap: 0,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    gap: SPACING.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoDivider: {
    height: 1,
    marginHorizontal: SPACING.md,
  },
  infoLabel: {
    ...TYPOGRAPHY.labelSmall,
    marginBottom: 2,
  },
  infoValue: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
  },
  fieldContainer: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    alignItems: 'center',
  },
  fieldWrapper: {
    width: FIELD_WIDTH,
    height: FIELD_HEIGHT,
    position: 'relative',
  },
  playerMarkerContainer: {
    position: 'absolute',
    width: PLAYER_MARKER_SIZE,
    alignItems: 'center',
  },
  playerMarkerShadow: {
    position: 'absolute',
    top: 2,
    width: PLAYER_MARKER_SIZE - 2,
    height: PLAYER_MARKER_SIZE - 2,
    borderRadius: (PLAYER_MARKER_SIZE - 2) / 2,
  },
  playerMarker: {
    width: PLAYER_MARKER_SIZE,
    height: PLAYER_MARKER_SIZE,
    borderRadius: PLAYER_MARKER_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  playerMarkerNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: FONTS.extraBold,
  },
  captainBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 1,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  captainBadgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
    fontFamily: FONTS.extraBold,
  },
  playerNameContainer: {
    marginTop: 2,
    width: PLAYER_NAME_WIDTH,
    alignItems: 'center',
  },
  playerNameText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    fontFamily: FONTS.bold,
  },
  substitutesSection: {
    marginTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  playersStack: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  playerCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  playerCardAccent: {
    height: 3,
    width: '100%',
  },
  playerCardBody: {
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  playerAvatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  playerAvatarNumber: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 3,
      },
      android: { elevation: 3 },
    }),
  },
  playerAvatarNumberText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONTS.extraBold,
  },
  playerCardTexts: {
    flex: 1,
    gap: SPACING.xs,
  },
  playerCardName: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  playerCardMetaRow: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  playerMetaPill: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  playerMetaText: {
    ...TYPOGRAPHY.labelMedium,
    fontFamily: FONTS.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
    gap: SPACING.sm,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '700',
  },
  noLineupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    justifyContent: 'space-between',
  },
  noLineupHeaderMain: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  noLineupHeaderText: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    flex: 1,
  },
  noLineupCountBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  noLineupCountText: {
    ...TYPOGRAPHY.labelMedium,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  noLineupEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  noLineupEmptyText: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
  },
  coachBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  coachAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  coachAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachNameFull: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
  },
  coachLabel: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '500',
    marginTop: 2,
  },

  // ── Player Photos ──
  playerPhotoField: {
    width: PLAYER_MARKER_SIZE,
    height: PLAYER_MARKER_SIZE,
    borderRadius: PLAYER_MARKER_SIZE / 2,
  },

});
