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
import { SPACING, RADIUS, TYPOGRAPHY, FONTS, SHADOWS } from '@/constants/Theme';
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

      {/* ═══ MODERN HEADER ═══ */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={isLive 
            ? ['#991B1B', '#7F1D1D', '#1E293B'] // Live: Red/Dark
            : [colors.pitch, '#065f46', '#1E293B'] // Standard: Emerald/Dark
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Pattern Overlay (Optional) */}
        <View style={styles.headerPattern} />

        {/* Nav Bar */}
        <View style={[styles.navBar, { flexDirection, paddingTop: STATUS_BAR_HEIGHT }]}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={22} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {currentMatch.competition?.name || t('match.match')}
          </Text>

          <View style={[styles.navActions, { flexDirection }]}>
            <TouchableOpacity style={styles.navBtn} onPress={handleShare} activeOpacity={0.7}>
              <Ionicons name="share-social-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navBtn} onPress={toggleFavorite} activeOpacity={0.7}>
              <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={20} color={isFavorite ? '#EF4444' : '#fff'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Match Score Board */}
        <View style={styles.scoreBoard}>
          {/* Home Team */}
          <View style={styles.teamColumn}>
            <View style={[styles.logoContainer, homeWinning && styles.logoWinner]}>
              <TeamLogo
                team={{ name: currentMatch.homeTeam.name, shortName: currentMatch.homeTeam.shortName, logoUrl: currentMatch.homeTeam.logoUrl }}
                size="large"
              />
            </View>
            <Text style={styles.teamNameText} numberOfLines={2}>
              {currentMatch.homeTeam.name}
            </Text>
          </View>

          {/* Score & Status */}
          <View style={styles.scoreInfo}>
            {isFinished || isLive || currentMatch.status === 'halftime' ? (
              <View style={styles.scoreResult}>
                <Text style={[styles.scoreText, homeWinning && styles.scoreTextWin]}>
                  {currentMatch.homeScore}
                </Text>
                <Text style={styles.scoreSeparator}>:</Text>
                <Text style={[styles.scoreText, awayWinning && styles.scoreTextWin]}>
                  {currentMatch.awayScore}
                </Text>
              </View>
            ) : (
              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>VS</Text>
              </View>
            )}

            {/* Status Pill */}
            {isLive ? (
              <View style={styles.statusPillLive}>
                <Animated.View style={[styles.statusDotLive, { opacity: pulseAnim }]} />
                <Text style={styles.statusTextLive}>
                   {liveTime ? `${liveTime}'` : t('match.live')}
                </Text>
              </View>
            ) : (
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>
                  {statusInfo?.label || currentMatch.status}
                </Text>
              </View>
            )}
            
            {/* Start Time (if scheduled) */}
            {currentMatch.status === 'scheduled' && (
              <Text style={styles.startTimeText}>
                {new Date(currentMatch.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>

          {/* Away Team */}
          <View style={styles.teamColumn}>
            <View style={[styles.logoContainer, awayWinning && styles.logoWinner]}>
              <TeamLogo
                team={{ name: currentMatch.awayTeam.name, shortName: currentMatch.awayTeam.shortName, logoUrl: currentMatch.awayTeam.logoUrl }}
                size="large"
              />
            </View>
            <Text style={styles.teamNameText} numberOfLines={2}>
              {currentMatch.awayTeam.name}
            </Text>
          </View>
        </View>

        {/* Match Details (Venue/Ref) - subtle footer in header */}
        {(currentMatch.venue || currentMatch.referee) && (
          <View style={[styles.matchMetaRow, { flexDirection }]}>
            {currentMatch.venue && (
              <View style={styles.matchMetaItem}>
                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.matchMetaText} numberOfLines={1}>{currentMatch.venue}</Text>
              </View>
            )}
            {currentMatch.referee && (
               <View style={styles.matchMetaItem}>
                 <Ionicons name="person-outline" size={14} color="rgba(255,255,255,0.7)" />
                 <Text style={styles.matchMetaText} numberOfLines={1}>{currentMatch.referee}</Text>
               </View>
            )}
          </View>
        )}
      </View>

      {/* ═══ TABS & CONTENT ═══ */}
      <View style={styles.contentContainer}>
        <View style={styles.tabsWrapper}>
          <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabItem, isActive && { backgroundColor: colors.accent + '15' }]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={isActive ? tab.icon : ((tab.icon as string).replace('-outline', '') + '-outline') as any} 
                    size={18} 
                    color={isActive ? colors.accent : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.tabLabel, 
                    { color: isActive ? colors.accent : colors.textSecondary, fontFamily: isActive ? FONTS.bold : FONTS.medium }
                  ]}>
                    {tab.label}
                  </Text>
                  {isActive && <View style={[styles.activeIndicator, { backgroundColor: colors.accent }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'events' && (
            <View style={styles.tabContent}>
               {/* Events Filter */}
               {(currentMatch.events && currentMatch.events.length > 0) && (
                <View style={[styles.filterRow, { flexDirection }]}>
                  <TouchableOpacity 
                    style={[styles.filterChip, eventsFilter === 'key' && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                    onPress={() => setEventsFilter('key')}
                  >
                    <Text style={[styles.filterText, eventsFilter === 'key' ? { color: '#fff' } : { color: colors.textSecondary }]}>أبرز الأحداث</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.filterChip, eventsFilter === 'all' && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                    onPress={() => setEventsFilter('all')}
                  >
                    <Text style={[styles.filterText, eventsFilter === 'all' ? { color: '#fff' } : { color: colors.textSecondary }]}>الكل</Text>
                  </TouchableOpacity>
                </View>
               )}

               {isLoading ? (
                 <EventItemSkeleton />
               ) : (currentMatch.events && currentMatch.events.length > 0) ? (
                 <EventTimeline 
                   events={eventsFilter === 'key' 
                     ? currentMatch.events.filter((e: any) => ['goal', 'red_card', 'yellow_card', 'substitution'].includes(e.type)) 
                     : currentMatch.events
                   } 
                   match={currentMatch} 
                 />
               ) : (
                 <View style={styles.emptyState}>
                   <Ionicons name="time-outline" size={48} color={colors.textTertiary} />
                   <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                     {t('match.noEvents')}
                   </Text>
                 </View>
               )}
            </View>
          )}

          {activeTab === 'stats' && (
            <View style={styles.tabContent}>
              <MatchStatsView match={currentMatch} />
            </View>
          )}

          {activeTab === 'field' && (
            <View style={styles.tabContent}>
              <LineupView
                homeLineup={currentMatch.lineups?.find((l: any) => l.teamId === currentMatch.homeTeamId)}
                awayLineup={currentMatch.lineups?.find((l: any) => l.teamId === currentMatch.awayTeamId)}
                homeTeam={currentMatch.homeTeam}
                awayTeam={currentMatch.awayTeam}
              />
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // ── Header Styles ──
  headerContainer: {
    paddingBottom: SPACING.xl,
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 10,
  },
  headerPattern: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.05)',
    // Could add a pattern image here if desired
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    height: STATUS_BAR_HEIGHT + 60,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: SPACING.md,
    opacity: 0.9,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },

  // ── Score Board ──
  scoreBoard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xs,
  },
  teamColumn: {
    flex: 1,
    alignItems: 'center',
    maxWidth: '35%',
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: SPACING.sm,
  },
  logoWinner: {
    borderColor: '#4ADE80',
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
  },
  teamNameText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    lineHeight: 18,
  },
  
  scoreInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingTop: SPACING.sm,
  },
  scoreResult: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  scoreText: {
    fontSize: 32,
    color: '#fff',
    fontFamily: FONTS.extraBold,
  },
  scoreTextWin: {
    color: '#4ADE80',
    textShadowColor: 'rgba(74, 222, 128, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  scoreSeparator: {
    fontSize: 32,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: FONTS.regular,
    marginTop: -4,
  },
  vsContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  vsText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  
  statusPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  statusText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  statusPillLive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: '#EF4444',
    gap: 6,
  },
  statusDotLive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  statusTextLive: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  startTimeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: FONTS.medium,
    marginTop: 4,
  },
  
  matchMetaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.lg,
    opacity: 0.8,
  },
  matchMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchMetaText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: FONTS.regular,
  },

  // ── Tabs & Content ──
  contentContainer: {
    flex: 1,
    marginTop: -SPACING.lg,
    zIndex: 20,
  },
  tabsWrapper: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.md,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 6,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 13,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  tabContent: {
    minHeight: 200,
  },
  
  // ── Filters & Empty States ──
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
    backgroundColor: 'transparent',
  },
  filterText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xxl,
    opacity: 0.7,
  },
  emptyText: {
    fontFamily: FONTS.medium,
    marginTop: SPACING.md,
    fontSize: 14,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: FONTS.medium,
  },
});
