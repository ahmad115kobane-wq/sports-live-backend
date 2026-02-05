import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Svg, { Rect, Line, Circle, G, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import TeamLogo from '@/components/ui/TeamLogo';

interface LineupPlayer {
  id: string;
  playerId: string;
  position: string;
  positionX: number;
  positionY: number;
  isStarter: boolean;
  isCaptain: boolean;
  player: {
    id: string;
    name: string;
    shirtNumber?: number;
    position?: string;
    imageUrl?: string;
  };
}

interface Lineup {
  id: string;
  formation: string;
  coach?: string;
  team: {
    id: string;
    name: string;
    shortName: string;
    logoUrl?: string;
    primaryColor?: string;
  };
  players: LineupPlayer[];
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
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    logoUrl?: string;
    primaryColor?: string;
  };
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FIELD_WIDTH = SCREEN_WIDTH - 32;
const FIELD_HEIGHT = FIELD_WIDTH * 1.4;

export default function LineupView({ homeLineup, awayLineup, homeTeam, awayTeam }: LineupViewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { t, isRTL, flexDirection } = useRTL();
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');

  const currentLineup = selectedTeam === 'home' ? homeLineup : awayLineup;
  const currentTeam = selectedTeam === 'home' ? homeTeam : awayTeam;
  const teamColor = selectedTeam === 'home' ? '#3B82F6' : '#EF4444';

  const starters = currentLineup?.players?.filter(p => p.isStarter) || [];
  const substitutes = currentLineup?.players?.filter(p => !p.isStarter) || [];

  const renderPlayerMarker = (player: LineupPlayer, index: number) => {
    // Adjust position for away team (flip vertically)
    const posY = selectedTeam === 'away' ? 100 - player.positionY : player.positionY;
    
    return (
      <G key={player.id || index}>
        {/* Player circle shadow */}
        <Circle
          cx={player.positionX}
          cy={posY + 0.5}
          r="4.5"
          fill="rgba(0,0,0,0.3)"
        />
        {/* Player circle */}
        <Circle
          cx={player.positionX}
          cy={posY}
          r="4.5"
          fill={teamColor}
          stroke="#fff"
          strokeWidth="0.5"
        />
        {/* Shirt number */}
        <SvgText
          x={player.positionX}
          y={posY + 1.8}
          fontSize="4"
          fontWeight="bold"
          textAnchor="middle"
          fill="#fff"
        >
          {String(player.player?.shirtNumber || '')}
        </SvgText>
        {/* Captain badge */}
        {player.isCaptain && (
          <G>
            <Circle
              cx={player.positionX + 3.5}
              cy={posY - 3.5}
              r="2"
              fill="#FFD700"
              stroke="#fff"
              strokeWidth="0.3"
            />
            <SvgText
              x={player.positionX + 3.5}
              y={posY - 2.7}
              fontSize="2.5"
              fontWeight="bold"
              textAnchor="middle"
              fill="#000"
            >
              {'C'}
            </SvgText>
          </G>
        )}
        {/* Player name */}
        <SvgText
          x={player.positionX}
          y={posY + 7}
          fontSize="2.5"
          textAnchor="middle"
          fill="#fff"
        >
          {String(player.player?.name?.split(' ').pop() || '')}
        </SvgText>
      </G>
    );
  };

  return (
    <View style={styles.container}>
      {/* Team Selector */}
      <View style={[styles.teamSelector, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.teamTab,
            selectedTeam === 'home' && { backgroundColor: '#3B82F6' + '30' },
          ]}
          onPress={() => setSelectedTeam('home')}
          activeOpacity={0.7}
        >
          <TeamLogo team={homeTeam} size="small" />
          <Text
            style={[
              styles.teamTabText,
              { color: selectedTeam === 'home' ? '#3B82F6' : colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {homeTeam.shortName || homeTeam.name}
          </Text>
          {homeLineup?.formation && (
            <View style={[styles.formationBadge, { backgroundColor: '#3B82F6' + '20' }]}>
              <Text style={[styles.formationText, { color: '#3B82F6' }]}>
                {homeLineup.formation}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={[styles.tabDivider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          style={[
            styles.teamTab,
            selectedTeam === 'away' && { backgroundColor: '#EF4444' + '30' },
          ]}
          onPress={() => setSelectedTeam('away')}
          activeOpacity={0.7}
        >
          <TeamLogo team={awayTeam} size="small" />
          <Text
            style={[
              styles.teamTabText,
              { color: selectedTeam === 'away' ? '#EF4444' : colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {awayTeam.shortName || awayTeam.name}
          </Text>
          {awayLineup?.formation && (
            <View style={[styles.formationBadge, { backgroundColor: '#EF4444' + '20' }]}>
              <Text style={[styles.formationText, { color: '#EF4444' }]}>
                {awayLineup.formation}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {currentLineup ? (
        <>
          {/* Coach Info */}
          {currentLineup.coach && (
            <View style={[styles.coachCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.coachIcon, { backgroundColor: teamColor + '20' }]}>
                <Ionicons name="person" size={18} color={teamColor} />
              </View>
              <View style={styles.coachInfo}>
                <Text style={[styles.coachLabel, { color: colors.textSecondary }]}>
                  {t('match.coach')}
                </Text>
                <Text style={[styles.coachName, { color: colors.text }]}>
                  {currentLineup.coach}
                </Text>
              </View>
            </View>
          )}

          {/* Football Field */}
          <View style={[styles.fieldContainer, { backgroundColor: colors.surface }]}>
            <Svg width={FIELD_WIDTH} height={FIELD_HEIGHT} viewBox="0 0 100 140">
              <Defs>
                <LinearGradient id="fieldGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#1a5c32" />
                  <Stop offset="50%" stopColor="#228b22" />
                  <Stop offset="100%" stopColor="#1a5c32" />
                </LinearGradient>
              </Defs>

              {/* Field Background with stripes */}
              <Rect x="0" y="0" width="100" height="140" fill="url(#fieldGradient)" rx="4" />
              
              {/* Field stripes */}
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <Rect
                  key={i}
                  x="0"
                  y={i * 20}
                  width="100"
                  height="20"
                  fill={i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
                />
              ))}

              {/* Field Lines */}
              <G stroke="#fff" strokeWidth="0.4" fill="none" opacity={0.8}>
                {/* Outer boundary */}
                <Rect x="5" y="5" width="90" height="130" />
                
                {/* Center line */}
                <Line x1="5" y1="70" x2="95" y2="70" />
                
                {/* Center circle */}
                <Circle cx="50" cy="70" r="12" />
                <Circle cx="50" cy="70" r="0.8" fill="#fff" />
                
                {/* Top penalty area */}
                <Rect x="20" y="5" width="60" height="22" />
                <Rect x="32" y="5" width="36" height="8" />
                <Circle cx="50" cy="18" r="0.8" fill="#fff" />
                
                {/* Bottom penalty area */}
                <Rect x="20" y="113" width="60" height="22" />
                <Rect x="32" y="127" width="36" height="8" />
                <Circle cx="50" cy="122" r="0.8" fill="#fff" />
                
                {/* Goals */}
                <Rect x="38" y="0" width="24" height="5" fill="none" stroke="#fff" strokeWidth="0.5" />
                <Rect x="38" y="135" width="24" height="5" fill="none" stroke="#fff" strokeWidth="0.5" />
                
                {/* Penalty arcs */}
                <Circle cx="50" cy="18" r="12" strokeDasharray="0 13 20 100" />
                <Circle cx="50" cy="122" r="12" strokeDasharray="20 13 0 100" />
              </G>

              {/* Players */}
              {starters.map((player, index) => renderPlayerMarker(player, index))}
            </Svg>
          </View>

          {/* Substitutes */}
          {substitutes.length > 0 && (
            <View style={styles.substitutesSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('match.substitutes')} ({substitutes.length})
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.substitutesList}
              >
                {substitutes.map((player, index) => (
                  <View
                    key={player.id || index}
                    style={[styles.substituteCard, { backgroundColor: colors.surface }]}
                  >
                    <View style={[styles.substituteNumber, { backgroundColor: teamColor }]}>
                      <Text style={styles.substituteNumberText}>
                        {player.player?.shirtNumber || '-'}
                      </Text>
                    </View>
                    <Text
                      style={[styles.substituteName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {player.player?.name}
                    </Text>
                    <Text style={[styles.substitutePosition, { color: colors.textSecondary }]}>
                      {player.position || player.player?.position || 'SUB'}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </>
      ) : (
        /* No Lineup */
        <View style={[styles.noLineup, { backgroundColor: colors.surface }]}>
          <View style={[styles.noLineupIcon, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="people-outline" size={40} color={colors.textTertiary} />
          </View>
          <Text style={[styles.noLineupTitle, { color: colors.text }]}>
            {t('match.noLineup')}
          </Text>
          <Text style={[styles.noLineupText, { color: colors.textSecondary }]}>
            {t('match.lineupNotAvailable')}
          </Text>
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
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  coachIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachInfo: {
    marginLeft: SPACING.md,
  },
  coachLabel: {
    ...TYPOGRAPHY.labelSmall,
  },
  coachName: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
  },
  fieldContainer: {
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    overflow: 'hidden',
  },
  substitutesSection: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  substitutesList: {
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  substituteCard: {
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    width: 80,
    marginRight: SPACING.sm,
  },
  substituteNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  substituteNumberText: {
    color: '#fff',
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '700',
  },
  substituteName: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '500',
    textAlign: 'center',
  },
  substitutePosition: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: 2,
  },
  noLineup: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    borderRadius: RADIUS.lg,
    minHeight: 200,
  },
  noLineupIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  noLineupTitle: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  noLineupText: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
  },
});
