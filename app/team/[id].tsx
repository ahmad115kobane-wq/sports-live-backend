// Team Details Page
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Platform,
  RefreshControl,
  Animated,
  InteractionManager,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { teamApi, matchApi } from '@/services/api';
import { Team, Player, Match } from '@/types';
import TeamLogo from '@/components/ui/TeamLogo';
import MatchCard from '@/components/MatchCard';
import { MatchCardSkeleton } from '@/components/ui/Skeleton';
import GlassCard from '@/components/ui/GlassCard';
import { useRTL } from '@/contexts/RTLContext';

export default function TeamDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'squad' | 'matches'>('squad');

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      loadTeamData();
    });
    return () => task.cancel();
  }, [id]);

  const loadTeamData = async () => {
    try {
      setIsLoading(true);
      const [teamRes, playersRes] = await Promise.all([
        teamApi.getById(id as string),
        teamApi.getPlayers(id as string),
      ]);
      
      setTeam(teamRes.data?.data || teamRes.data);
      setPlayers(playersRes.data?.data || playersRes.data || []);
      
      // Fetch team matches using dedicated endpoint
      const matchesRes = await teamApi.getMatches(id as string);
      setMatches(matchesRes.data?.data || []);
    } catch (error) {
      console.error('Error loading team:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeamData();
    setRefreshing(false);
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const groupPlayersByPosition = () => {
    const groups: { [key: string]: Player[] } = {
      'Goalkeeper': [],
      'Defender': [],
      'Midfielder': [],
      'Forward': [],
    };
    
    players.forEach(player => {
      const pos = player.position || 'Forward';
      if (groups[pos]) {
        groups[pos].push(player);
      } else {
        groups['Forward'].push(player);
      }
    });
    
    return groups;
  };

  if (!team && !isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          {t('common.error')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Hero Header */}
        <LinearGradient
          colors={[
            team?.primaryColor || colors.primary,
            colors.background,
          ]}
          style={styles.heroHeader}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={[styles.backButton, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}
            onPress={() => router.back()}
          >
            <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.heroContent}>
            <View style={{ alignSelf: 'center' }}>
              <TeamLogo team={team || { name: '' }} size="xlarge" />
            </View>
            <Text 
              style={[styles.teamName, { color: colorScheme === 'dark' ? '#fff' : '#000' }]} 
            >
              {team?.name}
            </Text>
            <Text 
              style={[styles.teamCountry, { color: colorScheme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }]}
            >
              {team?.country} • {team?.shortName}
            </Text>
            {team?.coach && (
              <Text 
                style={[styles.teamCoach, { color: colorScheme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}
              >
                {t('match.coach')}: {team.coach}
              </Text>
            )}
          </View>
        </LinearGradient>

        {/* Team Stats Row */}
        {team && (team.wins !== undefined || team.draws !== undefined || team.losses !== undefined) && (
          <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#22C55E' }]}>{team.wins || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('team.wins')}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{team.draws || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('team.draws')}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>{team.losses || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('team.losses')}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{team.goalsFor || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('team.goalsFor')}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{team.goalsAgainst || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('team.goalsAgainst')}</Text>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'squad' && { borderBottomColor: colors.accent, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab('squad')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'squad' ? colors.accent : colors.textSecondary },
              ]}
            >
              {t('team.squad')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'matches' && { borderBottomColor: colors.accent, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab('matches')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'matches' ? colors.accent : colors.textSecondary },
              ]}
            >
              {t('team.matches')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.content}>
          {activeTab === 'squad' ? (
            <View>
              {Object.entries(groupPlayersByPosition()).map(([position, posPlayers]) => (
                posPlayers.length > 0 && (
                  <View key={position} style={styles.positionSection}>
                    <Text style={[styles.positionTitle, { color: colors.textSecondary }]}>
                      {t(`positions.${position}`) || position} ({posPlayers.length})
                    </Text>
                    {posPlayers.map(player => (
                      <TouchableOpacity
                        key={player.id}
                        style={[styles.playerCard, { backgroundColor: colors.card, borderColor: colors.cardBorder, flexDirection }]}
                        onPress={() => router.push(`/player/${player.id}` as any)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.playerNumber, { backgroundColor: team?.primaryColor || colors.accent }]}>
                          <Text style={styles.playerNumberText}>
                            {player.shirtNumber || '-'}
                          </Text>
                        </View>
                        <View style={[styles.playerInfo, { marginLeft: isRTL ? 0 : SPACING.md, marginRight: isRTL ? SPACING.md : 0, flex: 1 }]}>
                          <Text style={[styles.playerName, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2} ellipsizeMode="tail">
                            {player.name}
                          </Text>
                          <Text style={[styles.playerPosition, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                            {player.nationality || ''}
                          </Text>
                        </View>
                        <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={18} color={colors.textTertiary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )
              ))}
            </View>
          ) : (
            <View style={styles.matchesList}>
              {isLoading ? (
                <>
                  <MatchCardSkeleton />
                  <MatchCardSkeleton />
                </>
              ) : matches.length > 0 ? (
                matches.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onPress={() => router.push(`/match/${match.id}`)}
                  />
                ))
              ) : (
                <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                  <Ionicons name="calendar-outline" size={40} color={colors.textTertiary} style={{ marginBottom: SPACING.sm }} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {t('team.noMatches')}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
  },
  heroHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 20,
    paddingBottom: SPACING.xxl,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  heroContent: {
    marginTop: SPACING.lg,
  },
  teamName: {
    ...TYPOGRAPHY.headlineLarge,
    fontWeight: '900',
    marginTop: SPACING.md,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    letterSpacing: -0.5,
  },
  teamCountry: {
    ...TYPOGRAPHY.titleMedium,
    marginTop: SPACING.xs,
    opacity: 0.9,
    fontWeight: '500',
    textAlign: 'center',
  },
  teamCoach: {
    ...TYPOGRAPHY.bodySmall,
    marginTop: SPACING.xs,
    fontWeight: '500',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.titleLarge,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
    padding: 4,
    ...SHADOWS.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.full,
  },
  tabText: {
    ...TYPOGRAPHY.labelLarge,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: SPACING.md,
  },
  positionSection: {
    marginBottom: SPACING.xl,
  },
  positionTitle: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '800',
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.7,
    marginLeft: SPACING.xs,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    ...SHADOWS.xs,
  },
  playerNumber: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  playerNumberText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    fontVariant: ['tabular-nums'],
    fontFamily: FONTS.extraBold,
  },
  playerInfo: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
  },
  playerName: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  playerPosition: {
    ...TYPOGRAPHY.bodySmall,
    marginTop: 2,
    opacity: 0.7,
  },
  matchesList: {},
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
  },
  errorText: {
    ...TYPOGRAPHY.titleSmall,
    textAlign: 'center',
    marginTop: 100,
  },
});
