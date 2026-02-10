import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
  StatusBar,
  Platform,
  Share,
  ScrollView,
  InteractionManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/Theme';
import { useMatchStore } from '@/store/matchStore';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/services/socket';
import { userApi } from '@/services/api';
import { MATCH_STATUS } from '@/constants/config';
import EventTimeline from '@/components/EventTimeline';
import MatchStatsView from '@/components/MatchStatsView';
import LineupView from '@/components/LineupView';
import TeamLogo from '@/components/ui/TeamLogo';
import { EventItemSkeleton } from '@/components/ui/Skeleton';
import { useRTL } from '@/contexts/RTLContext';
import { useLiveMatchTime } from '@/hooks/useLiveMinute';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24);

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();
  const [refreshing, setRefreshing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'stats' | 'field'>('events');
  const [eventsFilter, setEventsFilter] = useState<'key' | 'all'>('key');
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  const currentMatch = useMatchStore(s => s.currentMatch);
  const fetchMatchById = useMatchStore(s => s.fetchMatchById);
  const isLoading = useMatchStore(s => s.isLoadingMatch);
  const { isAuthenticated } = useAuthStore();
  const { joinMatch, leaveMatch } = useSocket();

  const isLive = currentMatch?.status === 'live' || currentMatch?.status === 'halftime';
  const isFinished = currentMatch?.status === 'finished';

  // Client-side live time computation (ticks every second for MM:SS)
  const liveTime = useLiveMatchTime(currentMatch);

  useEffect(() => {
    if (!id) return;
    const task = InteractionManager.runAfterInteractions(() => {
      fetchMatchById(id);
      joinMatch(id);
    });
    return () => {
      task.cancel();
      if (id) leaveMatch(id);
    };
  }, [id]);

  useEffect(() => {
    if (isLive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      glow.start();
      return () => { pulse.stop(); glow.stop(); };
    }
  }, [isLive]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (id) await fetchMatchById(id);
    setRefreshing(false);
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated || !id) return;
    try {
      if (isFavorite) await userApi.removeFavorite(id);
      else await userApi.addFavorite(id);
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleShare = async () => {
    if (!currentMatch) return;
    try {
      await Share.share({
        message: `${currentMatch.homeTeam.name} ${currentMatch.homeScore} - ${currentMatch.awayScore} ${currentMatch.awayTeam.name}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const tabs = [
    { key: 'events' as const, label: t('match.events'), icon: 'list-outline' as const },
    { key: 'stats' as const, label: t('match.stats'), icon: 'stats-chart-outline' as const },
    { key: 'field' as const, label: t('match.lineup'), icon: 'football-outline' as const },
  ];

  // Loading state
  if (!currentMatch) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <LinearGradient colors={isDark ? ['#0F172A', '#1E293B'] : ['#1E293B', '#334155']} style={StyleSheet.absoluteFill} />
        <View style={styles.loadingContent}>
          <View style={[styles.loadingIcon, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
            <Ionicons name="football" size={40} color="rgba(255,255,255,0.7)" />
          </View>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  const statusInfo = MATCH_STATUS[currentMatch.status];
  const homeWinning = currentMatch.homeScore > currentMatch.awayScore;
  const awayWinning = currentMatch.awayScore > currentMatch.homeScore;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* ═══ FIXED HEADER ═══ */}
      <LinearGradient
        colors={isLive 
          ? (isDark ? ['#7F1D1D', '#991B1B', '#1E293B'] : ['#991B1B', '#B91C1C', '#1E293B'])
          : (isDark ? ['#0F172A', '#1E293B', '#334155'] : ['#1E293B', '#334155', '#475569'])
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

          <View style={[styles.navActions, { flexDirection }]}>
            <TouchableOpacity style={styles.navBtn} onPress={handleShare} activeOpacity={0.7}>
              <Ionicons name="share-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navBtn} onPress={toggleFavorite} activeOpacity={0.7}>
              <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={20} color={isFavorite ? '#EF4444' : '#fff'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Competition */}
        <View style={styles.competitionBadge}>
          <Ionicons name="trophy" size={11} color="#FFD700" />
          <Text style={styles.competitionText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {currentMatch.competition?.name || t('match.match')}
          </Text>
        </View>

        {/* Teams & Score */}
        <View style={[styles.teamsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {/* Home Team */}
          <View style={styles.teamCol}>
            <View style={[styles.logoWrap, homeWinning && styles.logoWrapWin]}>
              <TeamLogo
                team={{ name: currentMatch.homeTeam.name, shortName: currentMatch.homeTeam.shortName, logoUrl: currentMatch.homeTeam.logoUrl }}
                size="large"
              />
            </View>
            <Text style={styles.teamName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75}>{currentMatch.homeTeam.name}</Text>
          </View>

          {/* Score */}
          <View style={styles.scoreCol}>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreNum, homeWinning && styles.scoreWin]}>{currentMatch.homeScore}</Text>
              <Text style={styles.scoreSep}>:</Text>
              <Text style={[styles.scoreNum, awayWinning && styles.scoreWin]}>{currentMatch.awayScore}</Text>
            </View>

            {isLive ? (
              <View style={styles.livePill}>
                <Animated.View style={[styles.livePulse, { transform: [{ scale: pulseAnim }], opacity: glowAnim }]} />
                <View style={styles.liveDotSmall} />
                <Text style={styles.liveLabel}>{t('match.live')}</Text>
                {liveTime ? (
                  <Text style={styles.liveMinute}>{liveTime.display}</Text>
                ) : currentMatch.currentMinute ? (
                  <Text style={styles.liveMinute}>{currentMatch.currentMinute}'</Text>
                ) : null}
              </View>
            ) : isFinished ? (
              <View style={styles.finishedPill}>
                <Text style={styles.finishedLabel}>{statusInfo.label}</Text>
              </View>
            ) : (
              <View style={styles.scheduledPill}>
                <Text style={styles.scheduledLabel}>{statusInfo.label}</Text>
              </View>
            )}
          </View>

          {/* Away Team */}
          <View style={styles.teamCol}>
            <View style={[styles.logoWrap, awayWinning && styles.logoWrapWin]}>
              <TeamLogo
                team={{ name: currentMatch.awayTeam.name, shortName: currentMatch.awayTeam.shortName, logoUrl: currentMatch.awayTeam.logoUrl }}
                size="large"
              />
            </View>
            <Text style={styles.teamName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75}>{currentMatch.awayTeam.name}</Text>
          </View>
        </View>

        {/* Match Details (venue, referee) */}
        {(currentMatch.venue || currentMatch.referee) && (
          <View style={styles.matchDetailsRow}>
            {currentMatch.venue && (
              <View style={styles.detailChip}>
                <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.6)" />
                <Text style={styles.detailChipText} numberOfLines={2}>{currentMatch.venue}</Text>
              </View>
            )}
            {currentMatch.referee && (
              <View style={styles.detailChip}>
                <Ionicons name="person-outline" size={12} color="rgba(255,255,255,0.6)" />
                <Text style={styles.detailChipText} numberOfLines={2}>{currentMatch.referee}</Text>
              </View>
            )}
          </View>
        )}
      </LinearGradient>

      {/* ═══ TABS ═══ */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.tabBarInner, { backgroundColor: colors.backgroundSecondary }]}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, isActive && { backgroundColor: colors.accent }]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Ionicons name={tab.icon as any} size={16} color={isActive ? '#fff' : colors.textTertiary} />
                <Text style={[styles.tabLabel, { color: isActive ? '#fff' : colors.textTertiary }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ═══ SCROLLABLE CONTENT ═══ */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentWrap}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {activeTab === 'events' && (
          <View style={styles.section}>
            {/* Sub-tabs: Key Events / All Events */}
            <View style={[styles.eventsFilterRow, { flexDirection }]}>
              <TouchableOpacity
                style={[styles.eventsFilterBtn, { backgroundColor: eventsFilter === 'key' ? colors.accent : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
                onPress={() => setEventsFilter('key')}
                activeOpacity={0.7}
              >
                <Text style={[styles.eventsFilterText, { color: eventsFilter === 'key' ? '#fff' : colors.textSecondary }]}>
                  {t('match.keyEvents') || 'أحداث مهمة'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.eventsFilterBtn, { backgroundColor: eventsFilter === 'all' ? colors.accent : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
                onPress={() => setEventsFilter('all')}
                activeOpacity={0.7}
              >
                <Text style={[styles.eventsFilterText, { color: eventsFilter === 'all' ? '#fff' : colors.textSecondary }]}>
                  {t('match.allEvents') || 'جميع الأحداث'}
                </Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <>
                <EventItemSkeleton />
                <EventItemSkeleton />
                <EventItemSkeleton />
              </>
            ) : currentMatch.events && currentMatch.events.length > 0 ? (
              <EventTimeline
                events={
                  eventsFilter === 'key'
                    ? currentMatch.events.filter(e => ['goal', 'red_card', 'penalty', 'start_half', 'end_half', 'end_match'].includes(e.type))
                    : currentMatch.events
                }
                match={currentMatch}
              />
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {isLive ? t('match.noEventsYet') : t('match.noEvents')}
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'stats' && (
          <View style={styles.section}>
            <MatchStatsView match={currentMatch} />
          </View>
        )}

        {activeTab === 'field' && (
          <View style={styles.section}>
            <LineupView
              homeLineup={currentMatch.lineups?.find((l: any) => l.teamId === currentMatch.homeTeamId)}
              awayLineup={currentMatch.lineups?.find((l: any) => l.teamId === currentMatch.awayTeamId)}
              homeTeam={currentMatch.homeTeam}
              awayTeam={currentMatch.awayTeam}
            />
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Loading ──
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  loadingText: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255,255,255,0.6)',
  },

  // ── Header ──
  headerGradient: {
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },

  // ── Competition ──
  competitionBadge: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  competitionText: {
    color: 'rgba(255,255,255,0.9)',
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ── Teams Row ──
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  logoWrap: {
    marginBottom: SPACING.sm,
    padding: 3,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  logoWrapWin: {
    borderColor: 'rgba(74, 222, 128, 0.5)',
  },
  teamName: {
    color: 'rgba(255,255,255,0.95)',
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: '100%',
  },

  // ── Score ──
  scoreCol: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    minWidth: 80,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  scoreNum: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    includeFontPadding: false,
  },
  scoreWin: {
    color: '#4ADE80',
  },
  scoreSep: {
    fontSize: 24,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.35)',
    marginTop: -2,
  },

  // ── Status Pills ──
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  livePulse: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 5,
  },
  liveLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  liveMinute: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
  finishedPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm,
  },
  finishedLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scheduledPill: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm,
  },
  scheduledLabel: {
    color: 'rgba(147, 197, 253, 0.9)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Tabs ──
  tabBar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  tabBarInner: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    gap: 5,
  },
  tabLabel: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700',
  },

  // ── Content ──
  contentWrap: {
    paddingTop: SPACING.md,
  },
  section: {
    paddingHorizontal: SPACING.lg,
  },

  // ── Match Details ──
  matchDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  detailChipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '500',
  },

  // ── Empty State ──
  emptyCard: {
    padding: SPACING.lg,
    alignItems: 'center',
    borderRadius: RADIUS.xl,
    marginTop: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '600',
    textAlign: 'center',
  },
  eventsFilterRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  eventsFilterBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
  },
  eventsFilterText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
