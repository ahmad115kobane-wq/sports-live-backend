import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Animated,
  Platform,
  Dimensions,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/Theme';
import { useMatchStore } from '@/store/matchStore';
import { useAuthStore } from '@/store/authStore';
import { useCompetitionStore } from '@/store/competitionStore';
import { useSocket } from '@/services/socket';
import { matchApi, sliderApi } from '@/services/api';
import { getUnreadCount } from '@/services/notifications';
import MatchCard from '@/components/MatchCard';
import EmptyState from '@/components/ui/EmptyState';
import { MatchCardSkeleton } from '@/components/ui/Skeleton';
import LiveBadge from '@/components/ui/LiveBadge';
import PageHeader from '@/components/ui/PageHeader';
import { format, isToday } from 'date-fns';
import { ar, enUS, arSA } from 'date-fns/locale';
import { useRTL } from '@/contexts/RTLContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Match } from '@/types';
import { useLiveMatchTimes, useCountdowns, MatchTime } from '@/hooks/useLiveMinute';
import { SOCKET_URL } from '@/constants/config';
import { matchUpdateEmitter } from '@/utils/matchEvents';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NEWS_BANNER_WIDTH = SCREEN_WIDTH - SPACING.lg * 2;
const NEWS_BANNER_HEIGHT = 170;

function getImageUrl(imageUrl?: string) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${SOCKET_URL}${imageUrl}`;
}

function NewsBanner({ articles, colors, isDark }: { articles: any[]; colors: any; isDark: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<any>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (articles.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % articles.length;
        scrollRef.current?.scrollTo({ x: next * NEWS_BANNER_WIDTH, animated: true });
        return next;
      });
    }, 5000);
  }, [articles.length]);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  const onScrollEnd = useCallback((e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / NEWS_BANNER_WIDTH);
    if (idx >= 0 && idx < articles.length) {
      setActiveIndex(idx);
      startTimer();
    }
  }, [articles.length, startTimer]);

  if (articles.length === 0) return null;

  return (
    <View style={newsBannerStyles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        snapToInterval={NEWS_BANNER_WIDTH}
        decelerationRate="fast"
        bounces={false}
      >
        {articles.map((article) => {
          const imgUrl = getImageUrl(article.imageUrl);
          return (
            <TouchableOpacity
              key={article.id}
              activeOpacity={0.9}
              onPress={() => article.linkUrl ? router.push(article.linkUrl as any) : null}
              style={[newsBannerStyles.slide, { width: NEWS_BANNER_WIDTH }]}
            >
              {imgUrl ? (
                <Image source={{ uri: imgUrl }} style={newsBannerStyles.image} contentFit="cover" cachePolicy="memory-disk" />
              ) : (
                <LinearGradient
                  colors={isDark ? ['#1a1a2e', '#0f3460'] : ['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={newsBannerStyles.image}
                />
              )}
              {article.title && (
                <>
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.7)']}
                    locations={[0, 0.35, 1]}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={newsBannerStyles.textOverlay}>
                    <Text style={newsBannerStyles.title} numberOfLines={2}>{article.title}</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Dots */}
      {articles.length > 1 && (
        <View style={newsBannerStyles.dotsRow}>
          {articles.map((_: any, i: number) => (
            <View
              key={i}
              style={[
                newsBannerStyles.dot,
                i === activeIndex ? newsBannerStyles.dotActive : newsBannerStyles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const newsBannerStyles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    height: NEWS_BANNER_HEIGHT,
  },
  slide: {
    height: NEWS_BANNER_HEIGHT,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  newsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
    marginBottom: 6,
  },
  newsBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  dotsRow: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 20,
  },
  dot: {
    borderRadius: 4,
  },
  dotActive: {
    width: 18,
    height: 6,
    backgroundColor: '#fff',
  },
  dotInactive: {
    width: 6,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
});

// أسماء الأيام بالكردي
const KURDISH_DAYS: { [key: string]: string } = {
  'Sunday': 'یەکشەممە',
  'Monday': 'دووشەممە',
  'Tuesday': 'سێشەممە',
  'Wednesday': 'چوارشەممە',
  'Thursday': 'پێنجشەممە',
  'Friday': 'هەینی',
  'Saturday': 'شەممە',
};

// أسماء الأشهر بالكردي
const KURDISH_MONTHS: { [key: string]: string } = {
  'January': 'کانوونی دووەم',
  'February': 'شوبات',
  'March': 'ئازار',
  'April': 'نیسان',
  'May': 'ئایار',
  'June': 'حوزەیران',
  'July': 'تەمموز',
  'August': 'ئاب',
  'September': 'ئەیلوول',
  'October': 'تشرینی یەکەم',
  'November': 'تشرینی دووەم',
  'December': 'کانوونی یەکەم',
};

// نوع لتخزين المباريات مع التاريخ
interface DayMatches {
  date: Date;
  matches: Match[];
  isLoading: boolean;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [refreshing, setRefreshing] = useState(false);
  const { t, isRTL, flexDirection, language } = useRTL();
  
  // قائمة المباريات مجمعة حسب الأيام
  const [dayMatchesList, setDayMatchesList] = useState<DayMatches[]>([]);
  
  // ── Zustand selectors: subscribe only to what's needed ──
  const featuredMatch = useMatchStore(s => s.featuredMatch);
  const liveMatches = useMatchStore(s => s.liveMatches);
  const fetchFeaturedMatch = useMatchStore(s => s.fetchFeaturedMatch);
  const fetchLiveMatches = useMatchStore(s => s.fetchLiveMatches);

  const competitions = useCompetitionStore(s => s.competitions);
  const fetchActiveCompetitions = useCompetitionStore(s => s.fetchActiveCompetitions);
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);
  
  // جميع المباريات المجمعة حسب التاريخ
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loadingAllMatches, setLoadingAllMatches] = useState(true);

  const [unreadCount, setUnreadCount] = useState(0);
  const [sliders, setSliders] = useState<any[]>([]);

  // Only pass relevant matches to timer hooks (not ALL matches)
  const activeMatches = useMemo(() => {
    const ACTIVE = ['live', 'extra_time', 'halftime', 'extra_time_halftime', 'penalties'];
    const map = new Map<string, Match>();
    // Live matches from store
    liveMatches.forEach(m => map.set(m.id, m));
    // Active matches from allMatches (live/paused only)
    allMatches.forEach(m => { if (ACTIVE.includes(m.status)) map.set(m.id, m); });
    return Array.from(map.values());
  }, [allMatches, liveMatches]);

  const upcomingMatches = useMemo(() => {
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    return allMatches.filter(m => {
      if (m.status !== 'scheduled') return false;
      const diff = new Date(m.startTime).getTime() - now;
      return diff > 0 && diff <= DAY;
    });
  }, [allMatches]);

  const liveTimesMap = useLiveMatchTimes(activeMatches);
  const countdownsMap = useCountdowns(upcomingMatches);

  const { user } = useAuthStore();
  const { joinLiveFeed } = useSocket();

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      loadData();
      joinLiveFeed();
    });
    return () => task.cancel();
  }, []);

  // Subscribe to real-time match updates (goals, status changes, etc.)
  useEffect(() => {
    const unsubscribe = matchUpdateEmitter.subscribe((updated) => {
      setAllMatches(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
    });
    return unsubscribe;
  }, []);

  // تجميع المباريات حسب التاريخ
  const groupMatchesByDate = useCallback((matchesList: Match[]): DayMatches[] => {
    const grouped: { [key: string]: Match[] } = {};
    
    matchesList.forEach(match => {
      const dateKey = format(new Date(match.startTime), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(match);
    });
    
    // ترتيب حسب التاريخ
    const sortedDates = Object.keys(grouped).sort();
    
    return sortedDates.map(dateKey => ({
      date: new Date(dateKey),
      matches: grouped[dateKey].sort((a, b) => {
        // المباريات التي لم تبدأ أولاً ثم المنتهية
        const statusOrder = (s: string) => s === 'finished' ? 1 : 0;
        const diff = statusOrder(a.status) - statusOrder(b.status);
        if (diff !== 0) return diff;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      }),
      isLoading: false,
    }));
  }, []);

  // مجموعة IDs المباريات المباشرة لاستبعادها من قسم مباريات اليوم
  const liveMatchIds = useMemo(() => new Set(liveMatches.map(m => m.id)), [liveMatches]);

  // تحديث قائمة الأيام — الفلترة والتجميع تتم بعد frame الحالي
  useEffect(() => {
    if (allMatches.length > 0) {
      const task = InteractionManager.runAfterInteractions(() => {
        let filteredMatches = selectedCompetition 
          ? allMatches.filter(match => match.competitionId === selectedCompetition)
          : allMatches;
        filteredMatches = filteredMatches.filter(match => !liveMatchIds.has(match.id));
        const grouped = groupMatchesByDate(filteredMatches);
        setDayMatchesList(grouped);
      });
      return () => task.cancel();
    } else if (!loadingAllMatches && allMatches.length === 0) {
      setDayMatchesList([]);
    }
  }, [allMatches, loadingAllMatches, groupMatchesByDate, selectedCompetition, liveMatchIds]);

  const loadData = async () => {
    setLoadingAllMatches(true);
    try {
      // جلب جميع المباريات بدون فلتر تاريخ
      const response = await matchApi.getAll();
      if (response.data.success) {
        setAllMatches(response.data.data);
      }
      
      await Promise.all([
        fetchFeaturedMatch(),
        fetchLiveMatches(),
        fetchActiveCompetitions(),
        getUnreadCount().then(count => setUnreadCount(count)),
        sliderApi.getActive().then(res => {
          setSliders(res.data.data || []);
        }).catch(() => {}),
      ]);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
    setLoadingAllMatches(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // دالة تنسيق التاريخ حسب اللغة
  const formatDateByLanguage = useCallback((date: Date): string => {
    if (language === 'ku') {
      // الكردية
      const dayName = format(date, 'EEEE', { locale: enUS });
      const dayNum = format(date, 'd');
      const monthName = format(date, 'MMMM', { locale: enUS });
      return `${KURDISH_DAYS[dayName]} ${dayNum} ${KURDISH_MONTHS[monthName]}`;
    } else if (language === 'ar') {
      // العربية
      return format(date, 'EEEE d MMMM', { locale: ar });
    } else {
      // الإنجليزية
      return format(date, 'EEEE, MMMM d', { locale: enUS });
    }
  }, [language]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.welcome');
    if (hour < 18) return t('home.welcome');
    return t('home.welcome');
  };

  // Shimmer animation — only while loading
  const waveAnim = useRef(new Animated.Value(-150)).current;
  const shimmerRef = useRef<Animated.CompositeAnimation | null>(null);
  
  useEffect(() => {
    if (loadingAllMatches) {
      shimmerRef.current = Animated.loop(
        Animated.timing(waveAnim, {
          toValue: SCREEN_WIDTH + 150,
          duration: 3000,
          useNativeDriver: true,
        })
      );
      shimmerRef.current.start();
    } else {
      shimmerRef.current?.stop();
      shimmerRef.current = null;
    }
    return () => { shimmerRef.current?.stop(); };
  }, [loadingAllMatches]);

  const waveTranslate = waveAnim;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PageHeader
        title={t('home.title')}
        logo={colorScheme === 'dark' ? require('@/assets/logo-white.png') : require('@/assets/logo-black.png')}
        rightContent={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity 
              style={styles.headerBtn}
              onPress={() => router.push('/search' as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="search-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerBtn}
              onPress={() => router.push('/notifications' as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifCount}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, !loadingAllMatches && dayMatchesList.length === 0 && { flexGrow: 1 }]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Competitions/Categories Section */}
        {competitions.length > 0 && (
          <View style={styles.competitionsSection}>
            <View style={[styles.competitionsRow, { flexDirection }]}>
              {/* Fixed: Clubs & National Teams button */}
              <TouchableOpacity
                style={[
                  styles.competitionItem,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.push('/clubs' as any)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="shield" 
                  size={18} 
                  color={colors.textSecondary} 
                />
                <Text style={[
                  styles.competitionName, 
                  { color: colors.text }
                ]} numberOfLines={1}>
                  {t('clubs.title')}
                </Text>
              </TouchableOpacity>

              {/* Scrollable: All + competitions */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.competitionsScroll}
                style={{ flex: 1 }}
              >
                {/* All Button */}
                <TouchableOpacity
                  style={[
                    styles.competitionItem,
                    { 
                      backgroundColor: !selectedCompetition ? colors.accent : colors.surface,
                      borderColor: !selectedCompetition ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedCompetition(null)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="grid" 
                    size={18} 
                    color={!selectedCompetition ? '#fff' : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.competitionName, 
                    { color: !selectedCompetition ? '#fff' : colors.text }
                  ]}>
                    {t('common.all')}
                  </Text>
                </TouchableOpacity>

                {competitions.map((competition) => {
                  const isSelected = selectedCompetition === competition.id;
                  const iconName = competition.icon || 'trophy';
                  
                  return (
                    <TouchableOpacity
                      key={competition.id}
                      style={[
                        styles.competitionItem,
                        { 
                          backgroundColor: isSelected ? colors.accent : colors.surface,
                          borderColor: isSelected ? colors.accent : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedCompetition(isSelected ? null : competition.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={iconName as any} 
                        size={18} 
                        color={isSelected ? '#fff' : colors.textSecondary} 
                      />
                      <Text 
                        style={[
                          styles.competitionName, 
                          { color: isSelected ? '#fff' : colors.text }
                        ]}
                        numberOfLines={1}
                      >
                        {competition.shortName || competition.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Home Slider */}
        {sliders.length > 0 && (
          <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.md }}>
            <NewsBanner articles={sliders} colors={colors} isDark={colorScheme === 'dark'} />
          </View>
        )}

        {/* Live Matches Section (filtered by competition) */}
        {(() => {
          const filteredLiveMatches = (selectedCompetition 
            ? liveMatches.filter(m => m.competitionId === selectedCompetition)
            : liveMatches
          ).filter(m => !featuredMatch || m.id !== featuredMatch.id);
          
          return filteredLiveMatches.length > 0 ? (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { flexDirection }]}>
              <View style={[styles.sectionTitleRow, { flexDirection }]}>
                <View style={[styles.sectionIconBg, { backgroundColor: colors.liveBackground }]}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live }} />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]} numberOfLines={1}>
                  {t('home.liveNow')}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.seeAllBtn, { backgroundColor: colors.surface }]}
                onPress={() => router.push('/live')}
              >
                <Text style={[styles.seeAllText, { color: colors.accent }]}>
                  {t('common.seeAll')}
                </Text>
                <Ionicons 
                  name={isRTL ? "chevron-forward" : "chevron-back"} 
                  size={14} 
                  color={colors.accent} 
                />
              </TouchableOpacity>
            </View>
            <View style={styles.matchList}>
              {filteredLiveMatches.slice(0, 3).map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onPress={() => router.push(`/match/${match.id}`)}
                  liveTime={liveTimesMap.get(match.id)}
                  countdown={countdownsMap.get(match.id)}
                />
              ))}
            </View>
          </View>
          ) : null;
        })()}

        {/* All Matches - Infinite Scroll by Days */}
        {dayMatchesList.map((dayData, dayIndex) => {
          const isTodayDay = isToday(dayData.date);
          const dayLabel = isTodayDay 
            ? t('home.today') 
            : formatDateByLanguage(dayData.date);
          
          return (
            <View key={dayIndex} style={styles.section}>
              <View style={[styles.sectionHeader, { flexDirection }]}>
                <View style={[styles.sectionTitleRow, { flexDirection }]}>
                  <View style={[styles.sectionIconBg, { backgroundColor: isTodayDay ? colors.accent + '15' : colors.info + '15' }]}>
                    <Ionicons 
                      name={isTodayDay ? "today" : "calendar"} 
                      size={16} 
                      color={isTodayDay ? colors.accent : colors.info} 
                    />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]} numberOfLines={1}>
                    {dayLabel}
                  </Text>
                </View>
                <View style={[styles.matchCountPill, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.matchCountText, { color: colors.textSecondary }]}>
                    {dayData.matches.length} {t('tabs.matches')}
                  </Text>
                </View>
              </View>
              
              <View style={styles.matchList}>
                {dayData.isLoading ? (
                  <>
                    <MatchCardSkeleton />
                    <MatchCardSkeleton />
                  </>
                ) : dayData.matches.length > 0 ? (
                  dayData.matches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onPress={() => router.push(`/match/${match.id}`)}
                      liveTime={liveTimesMap.get(match.id)}
                      countdown={countdownsMap.get(match.id)}
                    />
                  ))
                ) : (
                  <View style={[styles.noDayMatches, { backgroundColor: colors.surface }]}>
                    <Ionicons name="football-outline" size={20} color={colors.textTertiary} />
                    <Text style={[styles.noDayMatchesText, { color: colors.textTertiary }]}>
                      {t('home.noUpcomingMatches')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Loading Skeletons */}
        {loadingAllMatches && dayMatchesList.length === 0 && (
          <View style={styles.matchList}>
            <MatchCardSkeleton />
            <MatchCardSkeleton />
            <MatchCardSkeleton />
            <MatchCardSkeleton />
          </View>
        )}

        {/* Empty State - No Matches */}
        {!loadingAllMatches && dayMatchesList.length === 0 && (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <EmptyState
              icon="football-outline"
              title={t('home.noUpcomingMatches')}
              subtitle={t('home.checkBackLater')}
              actionLabel={t('common.refresh')}
              actionIcon="refresh"
              onAction={onRefresh}
            />
          </View>
        )}

        {/* Bottom Safe Area */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    overflow: 'hidden',
  },
  shimmerEffect: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 150,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.headlineMedium,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  headerSubtitleStatic: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(128,128,128,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.1)',
  },
  notifBadge: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifCount: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.md,
  },
  competitionsSection: {
    marginBottom: SPACING.xl,
    paddingTop: SPACING.xs,
  },
  competitionsRow: {
    alignItems: 'center',
    paddingLeft: SPACING.md,
    gap: SPACING.sm,
  },
  competitionsScroll: {
    gap: SPACING.sm,
    paddingRight: SPACING.md,
  },
  competitionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 6,
    ...SHADOWS.sm,
  },
  competitionName: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
    minWidth: 0,
  },
  sectionIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sectionTitle: {
    ...TYPOGRAPHY.titleLarge,
    fontWeight: '800',
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  seeAllText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  matchCountPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  matchCountText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
    opacity: 0.8,
  },
  matchList: {
    paddingHorizontal: SPACING.lg,
  },
  // Styles for infinite scroll
  noDayMatches: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  noDayMatchesText: {
    ...TYPOGRAPHY.bodyMedium,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  loadingMoreText: {
    ...TYPOGRAPHY.bodyMedium,
  },
});
