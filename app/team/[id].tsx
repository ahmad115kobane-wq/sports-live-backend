// Team Details Page
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
  Image,
  Platform,
  RefreshControl,
  Animated,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/Theme';
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
  const colors = Colors[colorScheme ?? 'dark'];
  const { t, isRTL, flexDirection } = useRTL();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'squad' | 'matches'>('squad');

  const scrollY = new Animated.Value(0);

  useEffect(() => {
    loadTeamData();
  }, [id]);

  const loadTeamData = async () => {
    try {
      setIsLoading(true);
      const [teamRes, playersRes] = await Promise.all([
        teamApi.getById(id as string),
        teamApi.getPlayers(id as string),
      ]);
      
      setTeam(teamRes.data);
      setPlayers(playersRes.data || []);
      
      // Fetch team matches - using getAll for now
      const matchesRes = await matchApi.getAll();
      // Filter matches that include this team
      setMatches((matchesRes.data || []).filter((m: Match) => 
        m.homeTeam?.id === id || m.awayTeam?.id === id
      ));
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
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerLeft: () => (
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.surface }]}
              onPress={() => router.back()}
            >
              <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <StatusBar barStyle="light-content" />
      
      {/* Animated Header Background */}
      <Animated.View
        style={[
          styles.headerBackground,
          { opacity: headerOpacity, backgroundColor: team?.primaryColor || colors.primary },
        ]}
      />

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
          <View style={styles.heroContent}>
            <TeamLogo team={team || { name: '' }} size="large" />
            <Text style={[styles.teamName, { color: '#fff' }]}>{team?.name}</Text>
            <Text style={[styles.teamCountry, { color: 'rgba(255,255,255,0.7)' }]}>
              {team?.country} • {team?.shortName}
            </Text>
          </View>
        </LinearGradient>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <GlassCard variant="default" style={styles.statsCard}>
            <View style={[styles.statsRow, { flexDirection }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {players.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {t('team.players')}
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {matches.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {t('team.matches')}
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {matches.filter(m => 
                    (m.homeTeam?.id === id && m.homeScore > m.awayScore) ||
                    (m.awayTeam?.id === id && m.awayScore > m.homeScore)
                  ).length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {t('team.wins')}
                </Text>
              </View>
            </View>
          </GlassCard>
        </View>

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
                      {position}s ({posPlayers.length})
                    </Text>
                    {posPlayers.map(player => (
                      <TouchableOpacity
                        key={player.id}
                        style={[styles.playerCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                        onPress={() => router.push(`/player/${player.id}` as any)}
                      >
                        <View style={[styles.playerNumber, { backgroundColor: team?.primaryColor || colors.accent }]}>
                          <Text style={styles.playerNumberText}>
                            {player.shirtNumber || '-'}
                          </Text>
                        </View>
                        <View style={[styles.playerInfo, { marginLeft: isRTL ? 0 : SPACING.sm, marginRight: isRTL ? SPACING.sm : 0 }]}>
                          <Text style={[styles.playerName, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                            {player.name}
                          </Text>
                          <Text style={[styles.playerPosition, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                            {player.nationality || 'International'}
                          </Text>
                        </View>
                        <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.textTertiary} />
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
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 10,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.xs,
  },
  heroHeader: {
    paddingTop: Platform.OS === 'ios' ? 90 : 70,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  teamName: {
    ...TYPOGRAPHY.headlineMedium,
    fontWeight: '800',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  teamCountry: {
    ...TYPOGRAPHY.bodyMedium,
    marginTop: SPACING.xxs,
  },
  statsSection: {
    paddingHorizontal: SPACING.md,
    marginTop: -SPACING.lg,
  },
  statsCard: {
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...TYPOGRAPHY.headlineSmall,
    fontWeight: '800',
  },
  statLabel: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  tabText: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: SPACING.md,
  },
  positionSection: {
    marginBottom: SPACING.lg,
  },
  positionTitle: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
  },
  playerNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerNumberText: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '700',
    color: '#fff',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '600',
  },
  playerPosition: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: 1,
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
