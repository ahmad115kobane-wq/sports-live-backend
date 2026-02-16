// Player Profile Page
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  RefreshControl,
  InteractionManager,
  Image,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { playerApi } from '@/services/api';
import { Player } from '@/types';
import TeamLogo from '@/components/ui/TeamLogo';
import { useRTL } from '@/contexts/RTLContext';
import { PlayerProfileSkeleton } from '@/components/ui/Skeleton';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24);

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();
  
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      loadPlayerData();
    });
    return () => task.cancel();
  }, [id]);

  const loadPlayerData = async () => {
    try {
      setIsLoading(true);
      const response = await playerApi.getById(id as string);
      setPlayer(response.data.data);
    } catch (error) {
      console.error('Error loading player:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlayerData();
    setRefreshing(false);
  };

  const getPositionColor = (position?: string) => {
    switch (position?.toLowerCase()) {
      case 'goalkeeper': return '#FBBF24';
      case 'defender': return '#3B82F6';
      case 'midfielder': return '#10B981';
      case 'forward': return '#EF4444';
      default: return colors.accent;
    }
  };

  const getPositionIcon = (position?: string): keyof typeof Ionicons.glyphMap => {
    switch (position?.toLowerCase()) {
      case 'goalkeeper': return 'hand-left-outline';
      case 'defender': return 'shield-outline';
      case 'midfielder': return 'settings-outline';
      case 'forward': return 'flash-outline';
      default: return 'football-outline';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />
        <PlayerProfileSkeleton />
      </View>
    );
  }

  if (!player) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="person-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {t('common.error')}
          </Text>
        </View>
      </View>
    );
  }

  const teamColor = player?.team?.primaryColor || colors.accent;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* ═══ FIXED GRADIENT HEADER ═══ */}
      <LinearGradient
        colors={isDark
          ? [teamColor, '#1E293B', '#0F172A']
          : [teamColor, '#334155', '#1E293B']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.headerGradient}
      >
        {/* Nav Bar */}
        <View style={[styles.navBar, { flexDirection }]}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={22} color="#fff" />
          </TouchableOpacity>
          <Text 
            style={styles.navTitle} 
          >
            {t('player.profile')}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Player Hero */}
        <View style={styles.heroContent}>
          {/* Player Image or Number Circle */}
          {player?.imageUrl ? (
            <Image source={{ uri: player.imageUrl }} style={[styles.playerHeroImage, { alignSelf: 'center' }]} />
          ) : (
            <View style={[styles.numberCircle, { borderColor: 'rgba(255,255,255,0.25)', alignSelf: 'center' }]}>
              <Text style={styles.numberText}>
                {player?.shirtNumber || '?'}
              </Text>
            </View>
          )}

          {/* Player Name */}
          <Text style={styles.playerName}>
            {player?.name}
          </Text>

          {/* Position Badge */}
          <View style={[styles.positionBadge, { backgroundColor: getPositionColor(player?.position), alignSelf: 'center' }]}>
            <Ionicons name={getPositionIcon(player?.position)} size={14} color="#fff" />
            <Text style={styles.positionText}>{player?.position ? (t(`positions.${player.position}`) || player.position) : t('operator.player')}</Text>
          </View>

          {/* Team Chip */}
          {player?.team && (
            <TouchableOpacity
              style={[styles.teamChip, { alignSelf: 'center' }]}
              onPress={() => router.push(`/team/${player.team?.id}` as any)}
              activeOpacity={0.7}
            >
              <TeamLogo team={player.team} size="small" />
              <Text style={styles.teamChipText}>{player.team.name}</Text>
              <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={14} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* ═══ SCROLLABLE CONTENT ═══ */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* ── Basic Info ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('player.basicInfo')}
          </Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <InfoRow label={t('player.nationality')} value={player?.nationality || '-'} colors={colors} flexDirection={flexDirection} />
            {player?.dateOfBirth && (
              <InfoRow
                label={t('player.age')}
                value={`${Math.floor((Date.now() - new Date(player.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}`}
                colors={colors}
                flexDirection={flexDirection}
                showBorder
              />
            )}
            {player?.height && (
              <InfoRow label={t('player.height')} value={`${player.height} cm`} colors={colors} flexDirection={flexDirection} showBorder />
            )}
            {player?.weight && (
              <InfoRow label={t('player.weight')} value={`${player.weight} kg`} colors={colors} flexDirection={flexDirection} showBorder />
            )}
            {player?.preferredFoot && (
              <InfoRow label={t('player.foot')} value={player.preferredFoot} colors={colors} flexDirection={flexDirection} showBorder />
            )}
            <InfoRow label={t('player.appearances')} value={`${player?.statistics?.appearances || 0}`} colors={colors} flexDirection={flexDirection} showBorder />
            <InfoRow label={t('player.goals')} value={`${player?.statistics?.goals || 0}`} colors={colors} flexDirection={flexDirection} showBorder />
            <InfoRow label={t('player.assists')} value={`${player?.statistics?.assists || 0}`} colors={colors} flexDirection={flexDirection} showBorder />
            <InfoRow label={t('player.yellowCards')} value={`${player?.statistics?.yellowCards || 0}`} colors={colors} flexDirection={flexDirection} showBorder />
            <InfoRow label={t('player.redCards')} value={`${player?.statistics?.redCards || 0}`} colors={colors} flexDirection={flexDirection} showBorder />
          </View>
        </View>

        {/* ── Recent Goals ── */}
        {player?.recentGoals && player.recentGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('player.recentPerformance')}
            </Text>
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {player.recentGoals.map((goal, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.goalItem,
                    { flexDirection },
                    index > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                  ]}
                  onPress={() => router.push(`/match/${goal.matchId}`)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.goalMinute, { backgroundColor: colors.success + '15' }]}>
                    <Ionicons name="football" size={12} color={colors.success} />
                    <Text style={[styles.goalMinuteText, { color: colors.success }]}>{goal.minute}'</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.goalMatchText, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
                      {goal.match?.homeTeam?.shortName || goal.match?.homeTeam?.name} - {goal.match?.awayTeam?.shortName || goal.match?.awayTeam?.name}
                    </Text>
                    {goal.match?.competition && (
                      <Text style={[styles.goalCompText, { color: colors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
                        {goal.match.competition.name}
                      </Text>
                    )}
                  </View>
                  <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Info Row Component ──
function InfoRow({ label, value, colors, flexDirection, showBorder }: {
  label: string;
  value: string;
  colors: any;
  flexDirection: 'row' | 'row-reverse';
  showBorder?: boolean;
}) {
  return (
    <View style={[
      styles.infoRow,
      { flexDirection },
      showBorder && { borderTopWidth: 1, borderTopColor: colors.border },
    ]}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Header ──
  headerGradient: {
    paddingTop: STATUS_BAR_HEIGHT,
    paddingBottom: SPACING.xl,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    ...TYPOGRAPHY.titleMedium,
    color: '#fff',
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  heroContent: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
  },
  playerHeroImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  numberCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  numberText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    fontVariant: ['tabular-nums'],
    fontFamily: FONTS.extraBold,
  },
  playerName: {
    ...TYPOGRAPHY.titleLarge,
    fontWeight: '800',
    color: '#fff',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  positionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm,
  },
  positionText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  teamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginTop: SPACING.md,
  },
  teamChipText: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },

  // ── Sections ──
  section: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.headlineMedium,
    fontWeight: '700',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  infoCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // ── Info Rows ──
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  infoLabel: {
    ...TYPOGRAPHY.headlineSmall,
    fontWeight: '500',
  },
  infoValue: {
    ...TYPOGRAPHY.headlineSmall,
    fontWeight: '700',
  },

  // ── Goal Items ──
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  goalMinute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  goalMinuteText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '800',
  },
  goalMatchText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
  },
  goalCompText: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: 2,
  },

  // ── Error ──
  errorText: {
    ...TYPOGRAPHY.bodyMedium,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
