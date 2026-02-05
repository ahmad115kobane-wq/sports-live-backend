import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
  Animated,
  StatusBar,
  Platform,
  Share,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/components/ui/BlurView';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/Theme';
import { useMatchStore } from '@/store/matchStore';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/services/socket';
import { userApi } from '@/services/api';
import { format } from 'date-fns';
import { MATCH_STATUS, EVENT_TYPES } from '@/constants/config';
import EventItem from '@/components/EventItem';
import FootballField from '@/components/FootballField';
import LineupView from '@/components/LineupView';
import TeamLogo from '@/components/ui/TeamLogo';
import LiveBadge from '@/components/ui/LiveBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { EventItemSkeleton } from '@/components/ui/Skeleton';
import { useRTL } from '@/contexts/RTLContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();
  const [refreshing, setRefreshing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'stats' | 'field'>('events');
  
  // Animations
  const scrollY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const tabAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const { currentMatch, fetchMatchById, isLoading } = useMatchStore();
  const { isAuthenticated } = useAuthStore();
  const { joinMatch, leaveMatch } = useSocket();

  const isLive = currentMatch?.status === 'live' || currentMatch?.status === 'halftime';
  const isFinished = currentMatch?.status === 'finished';

  useEffect(() => {
    if (id) {
      fetchMatchById(id);
      joinMatch(id);
    }

    return () => {
      if (id) {
        leaveMatch(id);
      }
    };
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (id) {
      await fetchMatchById(id);
    }
    setRefreshing(false);
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated || !id) return;
    try {
      if (isFavorite) {
        await userApi.removeFavorite(id);
      } else {
        await userApi.addFavorite(id);
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleShare = async () => {
    if (!currentMatch) return;
    try {
      await Share.share({
        message: `${currentMatch.homeTeam.name} ${currentMatch.homeScore} - ${currentMatch.awayScore} ${currentMatch.awayTeam.name}\n\nFollow live on Sports Live App!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleTabChange = (tab: 'events' | 'stats' | 'field') => {
    const tabIndex = tab === 'events' ? 0 : tab === 'stats' ? 1 : 2;
    Animated.spring(tabAnim, { 
      toValue: tabIndex, 
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
    setActiveTab(tab);
  };

  const tabs = [
    { key: 'events' as const, label: t('match.events'), icon: 'list-outline' as const },
    { key: 'stats' as const, label: t('match.stats'), icon: 'stats-chart-outline' as const },
    { key: 'field' as const, label: t('match.lineup'), icon: 'football-outline' as const }
  ];

  // Header animation
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [320, 200],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  if (!currentMatch) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colors.gradients.premium}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContent}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View style={[styles.loadingIcon, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Ionicons name="football" size={44} color="rgba(255,255,255,0.8)" />
            </View>
          </Animated.View>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  const statusInfo = MATCH_STATUS[currentMatch.status];

  // Calculate match stats
  const homeGoals = currentMatch.events?.filter(e => e.type === 'goal' && e.teamId === currentMatch.homeTeamId).length || 0;
  const awayGoals = currentMatch.events?.filter(e => e.type === 'goal' && e.teamId === currentMatch.awayTeamId).length || 0;
  const totalCards = currentMatch.events?.filter(e => e.type === 'yellow_card' || e.type === 'red_card').length || 0;
  const homeWinning = currentMatch.homeScore > currentMatch.awayScore;
  const awayWinning = currentMatch.awayScore > currentMatch.homeScore;

  const tabIndicatorPosition = tabAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, SCREEN_WIDTH / 3, (SCREEN_WIDTH / 3) * 2],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight, opacity: headerOpacity }]}>
        <LinearGradient
          colors={isLive ? colors.gradients.live : colors.gradients.premium}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Shimmer Effect */}
          {isLive && (
            <Animated.View style={[styles.shimmerEffect, { transform: [{ translateX: shimmerTranslate }] }]}>
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.08)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          )}

          {/* Decorative Elements */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          {/* Navigation */}
          <View style={[styles.headerNav, { flexDirection }]}>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={22} color="#fff" />
            </TouchableOpacity>
            <View style={[styles.navActions, { flexDirection }]}>
              <TouchableOpacity style={styles.navButton} onPress={handleShare} activeOpacity={0.8}>
                <Ionicons name="share-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButton} onPress={toggleFavorite} activeOpacity={0.8}>
                <Ionicons 
                  name={isFavorite ? 'heart' : 'heart-outline'} 
                  size={20} 
                  color={isFavorite ? '#EF4444' : '#fff'} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Competition Badge */}
          <View style={styles.competitionBadge}>
            <Text style={styles.competitionText}>
              {currentMatch.competition?.name || t('match.match')}
            </Text>
          </View>

          {/* Teams & Score */}
          <View style={styles.matchInfo}>
            {/* Home Team */}
            <View style={styles.teamSection}>
              <View style={[
                styles.teamLogoContainer,
                homeWinning && styles.winningTeamLogo
              ]}>
                <TeamLogo 
                  team={{ 
                    name: currentMatch.homeTeam.name, 
                    shortName: currentMatch.homeTeam.shortName,
                    logoUrl: currentMatch.homeTeam.logoUrl 
                  }} 
                  size="large" 
                />
              </View>
              <Text style={styles.teamName} numberOfLines={2}>
                {currentMatch.homeTeam.name}
              </Text>
              {homeWinning && (
                <View style={styles.winIndicator}>
                  <Ionicons name="chevron-up" size={12} color="#4ADE80" />
                </View>
              )}
            </View>

            {/* Score Section */}
            <View style={styles.scoreSection}>
              <View style={styles.scoreContainer}>
                <View style={[styles.scoreBox, homeWinning && styles.winningScoreBox]}>
                  <Text style={[styles.score, homeWinning && styles.winningScore]}>
                    {currentMatch.homeScore}
                  </Text>
                </View>
                <View style={styles.scoreDividerContainer}>
                  <View style={styles.scoreDividerLine} />
                  <Text style={styles.scoreDivider}>-</Text>
                  <View style={styles.scoreDividerLine} />
                </View>
                <View style={[styles.scoreBox, awayWinning && styles.winningScoreBox]}>
                  <Text style={[styles.score, awayWinning && styles.winningScore]}>
                    {currentMatch.awayScore}
                  </Text>
                </View>
              </View>

              {/* Status Badge */}
              {isLive ? (
                <View style={styles.liveStatusContainer}>
                  <Animated.View 
                    style={[
                      styles.livePulse,
                      { transform: [{ scale: pulseAnim }], opacity: glowAnim }
                    ]}
                  />
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                  {currentMatch.currentMinute && (
                    <Text style={styles.minuteText}>{currentMatch.currentMinute}'</Text>
                  )}
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '30' }]}>
                  <Text style={[styles.statusText, { color: '#fff' }]}>{statusInfo.label}</Text>
                </View>
              )}
            </View>

            {/* Away Team */}
            <View style={styles.teamSection}>
              <View style={[
                styles.teamLogoContainer,
                awayWinning && styles.winningTeamLogo
              ]}>
                <TeamLogo 
                  team={{ 
                    name: currentMatch.awayTeam.name, 
                    shortName: currentMatch.awayTeam.shortName,
                    logoUrl: currentMatch.awayTeam.logoUrl 
                  }} 
                  size="large" 
                />
              </View>
              <Text style={styles.teamName} numberOfLines={2}>
                {currentMatch.awayTeam.name}
              </Text>
              {awayWinning && (
                <View style={styles.winIndicator}>
                  <Ionicons name="chevron-up" size={12} color="#4ADE80" />
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.surface }]}>
        <Animated.View 
          style={[
            styles.tabIndicator,
            { 
              backgroundColor: colors.accent,
              transform: [{ translateX: tabIndicatorPosition }],
              width: SCREEN_WIDTH / 3,
            }
          ]} 
        />
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => handleTabChange(tab.key as any)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.key ? colors.accent : colors.textTertiary}
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.key ? colors.accent : colors.textTertiary },
              activeTab === tab.key && styles.tabTextActive,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <Animated.ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.accent}
            progressViewOffset={320}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {activeTab === 'events' && (
          <View style={styles.eventsSection}>
            {/* Quick Stats Card */}
            <View style={[styles.quickStatsCard, { backgroundColor: colors.surface }]}>
              <View style={styles.quickStatsRow}>
                <View style={styles.quickStatItem}>
                  <View style={[styles.quickStatIconBg, { backgroundColor: colors.successLight }]}>
                    <Text style={styles.quickStatEmoji}>⚽</Text>
                  </View>
                  <Text style={[styles.quickStatValue, { color: colors.text }]}>{homeGoals + awayGoals}</Text>
                  <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>{t('match.goals')}</Text>
                </View>
                
                <View style={[styles.quickStatDivider, { backgroundColor: colors.border }]} />
                
                <View style={styles.quickStatItem}>
                  <View style={[styles.quickStatIconBg, { backgroundColor: colors.warningLight }]}>
                    <View style={styles.cardIcon} />
                  </View>
                  <Text style={[styles.quickStatValue, { color: colors.text }]}>{totalCards}</Text>
                  <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>{t('player.cards')}</Text>
                </View>
                
                <View style={[styles.quickStatDivider, { backgroundColor: colors.border }]} />
                
                <View style={styles.quickStatItem}>
                  <View style={[styles.quickStatIconBg, { backgroundColor: colors.infoLight }]}>
                    <Ionicons name="swap-horizontal" size={16} color={colors.info} />
                  </View>
                  <Text style={[styles.quickStatValue, { color: colors.text }]}>
                    {currentMatch.events?.filter(e => e.type === 'substitution').length || 0}
                  </Text>
                  <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>{t('match.substitution')}</Text>
                </View>
              </View>
            </View>

            {/* Events List Header */}
            <View style={[styles.eventsHeader, { flexDirection }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('match.events')}</Text>
              {currentMatch.events && currentMatch.events.length > 0 && (
                <View style={[styles.eventsCountBadge, { backgroundColor: colors.accent + '20' }]}>
                  <Text style={[styles.eventsCount, { color: colors.accent }]}>
                    {currentMatch.events.length}
                  </Text>
                </View>
              )}
            </View>

            {/* Events List */}
            {isLoading ? (
              <>
                <EventItemSkeleton />
                <EventItemSkeleton />
                <EventItemSkeleton />
              </>
            ) : currentMatch.events && currentMatch.events.length > 0 ? (
              <View style={styles.eventsList}>
                {currentMatch.events.map((event, index) => (
                  <Animated.View 
                    key={event.id}
                    style={{ opacity: 1 }}
                  >
                    <EventItem event={event} />
                  </Animated.View>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyEvents, { backgroundColor: colors.surface }]}>
                <View style={[styles.emptyIconBg, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="document-text-outline" size={36} color={colors.textTertiary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('match.noEvents')}</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {isLive ? t('match.eventsWillAppear') : t('match.eventsHere')}
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'stats' && (
          <View style={styles.statsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: SPACING.lg }]}>
              {t('match.stats')}
            </Text>
            
            {/* Stats Cards */}
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <View style={styles.statRow}>
                <Text style={[styles.statTeamValue, { color: homeWinning ? colors.success : colors.text }]}>
                  {homeGoals}
                </Text>
                <View style={styles.statMiddle}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('match.goals')}</Text>
                  <View style={styles.statBarContainer}>
                    <View style={[
                      styles.statBarHome, 
                      { 
                        width: `${Math.max((homeGoals / Math.max(homeGoals + awayGoals, 1)) * 100, 5)}%`,
                        backgroundColor: colors.homeTeam 
                      }
                    ]} />
                    <View style={[
                      styles.statBarAway, 
                      { 
                        width: `${Math.max((awayGoals / Math.max(homeGoals + awayGoals, 1)) * 100, 5)}%`,
                        backgroundColor: colors.awayTeam 
                      }
                    ]} />
                  </View>
                </View>
                <Text style={[styles.statTeamValue, { color: awayWinning ? colors.success : colors.text }]}>
                  {awayGoals}
                </Text>
              </View>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <View style={styles.statRow}>
                <Text style={[styles.statTeamValue, { color: colors.text }]}>
                  {currentMatch.events?.filter(e => e.type === 'yellow_card' && e.teamId === currentMatch.homeTeamId).length || 0}
                </Text>
                <View style={styles.statMiddle}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('player.cards')}</Text>
                  <View style={styles.statBarContainer}>
                    <View style={[styles.statBarHome, { width: '50%', backgroundColor: colors.warning }]} />
                    <View style={[styles.statBarAway, { width: '50%', backgroundColor: colors.warning }]} />
                  </View>
                </View>
                <Text style={[styles.statTeamValue, { color: colors.text }]}>
                  {currentMatch.events?.filter(e => e.type === 'yellow_card' && e.teamId === currentMatch.awayTeamId).length || 0}
                </Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'field' && (
          <View style={styles.fieldSection}>
            <LineupView
              homeLineup={currentMatch.lineups?.find((l: any) => l.teamId === currentMatch.homeTeamId)}
              awayLineup={currentMatch.lineups?.find((l: any) => l.teamId === currentMatch.awayTeamId)}
              homeTeam={currentMatch.homeTeam}
              awayTeam={currentMatch.awayTeam}
            />
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 120 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  loadingText: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255,255,255,0.7)',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  shimmerEffect: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 150,
  },
  decorCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 24,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 20,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  competitionBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
  },
  competitionText: {
    color: 'rgba(255,255,255,0.9)',
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
  },
  teamLogoContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  winningTeamLogo: {
    borderColor: '#4ADE80',
    borderWidth: 1.5,
  },
  teamInitials: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -1,
  },
  teamName: {
    color: 'rgba(255,255,255,0.9)',
    ...TYPOGRAPHY.labelSmall,
    textAlign: 'center',
    maxWidth: 90,
    lineHeight: 16,
  },
  winIndicator: {
    marginTop: SPACING.xs,
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  scoreSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  scoreBox: {
    width: 44,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  winningScoreBox: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
  },
  score: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  winningScore: {
    color: '#4ADE80',
  },
  scoreDividerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  scoreDividerLine: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scoreDivider: {
    fontSize: 20,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.4)',
    marginVertical: 2,
  },
  liveStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginTop: SPACING.md,
    position: 'relative',
  },
  livePulse: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: SPACING.xs,
  },
  liveText: {
    color: '#fff',
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '800',
    letterSpacing: 1,
  },
  minuteText: {
    color: '#fff',
    ...TYPOGRAPHY.labelLarge,
    fontWeight: '800',
    marginLeft: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginTop: SPACING.md,
  },
  statusText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 320,
    position: 'relative',
    ...SHADOWS.sm,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.xs,
  },
  tabText: {
    ...TYPOGRAPHY.labelMedium,
  },
  tabTextActive: {
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: SPACING.lg,
  },
  eventsSection: {
    paddingHorizontal: SPACING.lg,
  },
  quickStatsCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.xs,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  quickStatEmoji: {
    fontSize: 14,
  },
  cardIcon: {
    width: 12,
    height: 15,
    backgroundColor: '#FBBF24',
    borderRadius: 2,
  },
  quickStatValue: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '800',
  },
  quickStatLabel: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    height: 40,
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '700',
  },
  eventsCountBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  eventsCount: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '700',
  },
  eventsList: {
    gap: SPACING.sm,
  },
  emptyEvents: {
    padding: SPACING.xl,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    ...SHADOWS.xs,
  },
  emptyIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '700',
    marginBottom: SPACING.xxs,
  },
  emptyText: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
  },
  statsSection: {
    paddingHorizontal: SPACING.lg,
  },
  statCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.xs,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statTeamValue: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '800',
    width: 36,
    textAlign: 'center',
  },
  statMiddle: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: SPACING.md,
  },
  statLabel: {
    ...TYPOGRAPHY.labelSmall,
    marginBottom: SPACING.sm,
  },
  statBarContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
    gap: 4,
  },
  statBarHome: {
    height: '100%',
    borderRadius: 4,
  },
  statBarAway: {
    height: '100%',
    borderRadius: 4,
    marginLeft: 'auto',
  },
  fieldSection: {
    paddingHorizontal: SPACING.lg,
  },
});
