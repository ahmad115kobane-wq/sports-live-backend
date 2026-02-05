import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useColorScheme,
  TouchableOpacity,
  StatusBar,
  Animated,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/Theme';
import { useMatchStore } from '@/store/matchStore';
import { useAuthStore } from '@/store/authStore';
import { useCompetitionStore } from '@/store/competitionStore';
import { useSocket } from '@/services/socket';
import MatchCard from '@/components/MatchCard';
import FeaturedMatch from '@/components/FeaturedMatch';
import { MatchCardSkeleton, FeaturedMatchSkeleton } from '@/components/ui/Skeleton';
import LiveBadge from '@/components/ui/LiveBadge';
import { format, isToday } from 'date-fns';
import { ar, enUS, arSA } from 'date-fns/locale';
import { useRTL } from '@/contexts/RTLContext';
import { Match } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const colors = Colors[colorScheme ?? 'dark'];
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { t, isRTL, flexDirection, language } = useRTL();
  
  // قائمة المباريات مجمعة حسب الأيام
  const [dayMatchesList, setDayMatchesList] = useState<DayMatches[]>([]);
  
  const { 
    featuredMatch, 
    liveMatches,
    fetchFeaturedMatch,
    fetchLiveMatches,
    isLoading
  } = useMatchStore();

  const { competitions, fetchActiveCompetitions } = useCompetitionStore();
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);
  
  // جميع المباريات المجمعة حسب التاريخ
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loadingAllMatches, setLoadingAllMatches] = useState(true);

  const { user } = useAuthStore();
  const { joinLiveFeed } = useSocket();

  useEffect(() => {
    loadData();
    joinLiveFeed();
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
      matches: grouped[dateKey].sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ),
      isLoading: false,
    }));
  }, []);

  // تحديث قائمة الأيام عند تغير المباريات أو البطولة المختارة
  useEffect(() => {
    if (allMatches.length > 0) {
      // فلترة المباريات حسب البطولة المختارة
      const filteredMatches = selectedCompetition 
        ? allMatches.filter(match => match.competitionId === selectedCompetition)
        : allMatches;
      
      const grouped = groupMatchesByDate(filteredMatches);
      setDayMatchesList(grouped);
    } else if (!loadingAllMatches && allMatches.length === 0) {
      setDayMatchesList([]);
    }
  }, [allMatches, loadingAllMatches, groupMatchesByDate, selectedCompetition]);

  const loadData = async () => {
    setLoadingAllMatches(true);
    try {
      // جلب جميع المباريات بدون فلتر تاريخ
      const response = await fetch(`${require('@/constants/config').API_URL}/matches`);
      const data = await response.json();
      
      if (data.success) {
        setAllMatches(data.data);
      }
      
      await Promise.all([
        fetchFeaturedMatch(),
        fetchLiveMatches(),
        fetchActiveCompetitions(),
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

  // Header animations
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  const compactHeaderOpacity = scrollY.interpolate({
    inputRange: [40, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent"
        translucent
      />
      
      {/* Premium Header */}
      <View style={styles.headerWrapper}>
        {/* Main Header Content */}
        <Animated.View 
          style={[
            styles.header, 
            { 
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslate }]
            }
          ]}
        >
          <LinearGradient
            colors={isDark 
              ? [colors.background, 'transparent'] 
              : [colors.background, 'transparent']
            }
            style={styles.headerGradient}
          >
            <View style={[styles.headerContent, { flexDirection }]}>
              <View style={[styles.headerLeft, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text style={[styles.greeting, { color: colors.text, fontSize: 20, fontWeight: '700' }]}>
                  {getGreeting()} 👋
                </Text>
              </View>
              <View style={[styles.headerActions, { flexDirection }]}>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: colors.surface }]}
                  onPress={() => router.push('/search' as any)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="search" size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: colors.surface }]}
                  onPress={() => router.push('/notifications' as any)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="notifications" size={20} color={colors.text} />
                  <View style={[styles.notifBadge, { backgroundColor: colors.live }]}>
                    <Text style={styles.notifCount}>3</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>


          </LinearGradient>
        </Animated.View>

        {/* Compact Header (shown on scroll) */}
        <Animated.View 
          style={[
            styles.compactHeader, 
            { 
              backgroundColor: colors.surface,
              opacity: compactHeaderOpacity,
              borderBottomColor: colors.border,
            }
          ]}
        >
          <Text style={[styles.compactTitle, { color: colors.text }]}>
            {t('app.name')}
          </Text>
          {liveMatches.length > 0 && (
            <View style={[styles.compactLive, { backgroundColor: colors.liveBackground }]}>
              <View style={[styles.compactLiveDot, { backgroundColor: colors.live }]} />
              <Text style={[styles.compactLiveText, { color: colors.live }]}>
                {liveMatches.length}
              </Text>
            </View>
          )}
        </Animated.View>
      </View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.accent}
            progressViewOffset={120}
          />
        }
        onScroll={(event) => {
          // تحديث الرسوم المتحركة
          scrollY.setValue(event.nativeEvent.contentOffset.y);
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Competitions/Categories Section */}
        {competitions.length > 0 && (
          <View style={styles.competitionsSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.competitionsScroll}
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
        )}

        {/* Featured Match - Premium Card (only show if matches selected competition or no filter) */}
        {isLoading ? (
          <View style={styles.section}>
            <FeaturedMatchSkeleton />
          </View>
        ) : featuredMatch && (!selectedCompetition || featuredMatch.competitionId === selectedCompetition) ? (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { flexDirection }]}>
              <View style={[styles.sectionTitleRow, { flexDirection }]}>
                <View style={[styles.sectionIconBg, { backgroundColor: colors.accent + '15' }]}>
                  <Ionicons name="star" size={16} color={colors.accent} />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('home.featuredMatches')}
                </Text>
              </View>
            </View>
            <FeaturedMatch match={featuredMatch} />
          </View>
        ) : null}

        {/* Live Matches Section (filtered by competition) */}
        {(() => {
          const filteredLiveMatches = selectedCompetition 
            ? liveMatches.filter(m => m.competitionId === selectedCompetition)
            : liveMatches;
          
          return filteredLiveMatches.length > 0 ? (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { flexDirection }]}>
              <View style={[styles.sectionTitleRow, { flexDirection }]}>
                <View style={[styles.sectionIconBg, { backgroundColor: colors.liveBackground }]}>
                  <LiveBadge size="small" showPulse />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
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
                  name={isRTL ? "chevron-back" : "chevron-forward"} 
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
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
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

        {/* Loading Indicator */}
        {loadingAllMatches && dayMatchesList.length === 0 && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={[styles.loadingMoreText, { color: colors.textSecondary }]}>
              {t('common.loading')}
            </Text>
          </View>
        )}

        {/* Empty State - No Matches */}
        {!loadingAllMatches && dayMatchesList.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: colors.surface, marginHorizontal: SPACING.lg }]}>
            <View style={[styles.emptyIconWrapper, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="football-outline" size={32} color={colors.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t('home.noUpcomingMatches')}
            </Text>
          </View>
        )}

        {/* Bottom Safe Area */}
        <View style={{ height: 120 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  header: {
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 48 : (StatusBar.currentHeight || 24) + 8,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {},
  greeting: {
    ...TYPOGRAPHY.bodyMedium,
    marginBottom: 2,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  appName: {
    ...TYPOGRAPHY.headlineMedium,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  betaBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  betaText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifCount: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
  },
  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 46 : (StatusBar.currentHeight || 24) + 6,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    ...SHADOWS.xs,
  },
  compactTitle: {
    ...TYPOGRAPHY.titleLarge,
    fontWeight: '700',
  },
  compactLive: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  compactLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  compactLiveText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 150 : 130,
  },
  competitionsSection: {
    marginBottom: SPACING.lg,
  },
  competitionsScroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  competitionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.xs,
    ...SHADOWS.xs,
  },
  competitionName: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.xl,
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
  },
  sectionIconBg: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    ...TYPOGRAPHY.titleLarge,
    fontWeight: '700',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: 4,
    ...SHADOWS.xs,
  },
  seeAllText: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '600',
  },
  matchCountPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    ...SHADOWS.xs,
  },
  matchCountText: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '500',
  },
  matchList: {
    paddingHorizontal: SPACING.lg,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    ...SHADOWS.xs,
  },
  emptyIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.bodySmall,
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
