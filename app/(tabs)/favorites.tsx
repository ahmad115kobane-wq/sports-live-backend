import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  StatusBar,
  Platform,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/components/ui/BlurView';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import { matchApi, competitionApi, teamApi, userApi } from '@/services/api';
import { Match, Competition, Team } from '@/types';
import MatchCard from '@/components/MatchCard';
import EmptyState from '@/components/ui/EmptyState';
import { MatchCardSkeleton } from '@/components/ui/Skeleton';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useCountdowns } from '@/hooks/useLiveMinute';
import Button from '@/components/ui/Button';
import { useRTL } from '@/contexts/RTLContext';
import PageHeader from '@/components/ui/PageHeader';
import { matchUpdateEmitter } from '@/utils/matchEvents';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Match[]>([]);
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all');
  const countdownsMap = useCountdowns(favorites);

  // Favorite teams and competitions
  const [favoriteTeamIds, setFavoriteTeamIds] = useState<string[]>([]);
  const [favoriteCompetitionIds, setFavoriteCompetitionIds] = useState<string[]>([]);
  
  // Edit Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [allCompetitions, setAllCompetitions] = useState<Competition[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Subscribe to real-time match updates (goals, status changes, etc.)
  useEffect(() => {
    const unsubscribe = matchUpdateEmitter.subscribe((updated) => {
      setFavorites(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
    });
    return unsubscribe;
  }, []);

  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);
  const shimmerRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Animations start immediately (lightweight, native driver)
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();

    pulseRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulseRef.current.start();

    shimmerRef.current = Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
    );
    shimmerRef.current.start();

    // Defer data loading after transition completes
    const task = InteractionManager.runAfterInteractions(() => {
      if (isAuthenticated) {
        loadFavoritePreferences();
      } else {
        setLoading(false);
      }
    });

    return () => { task.cancel(); pulseRef.current?.stop(); shimmerRef.current?.stop(); };
  }, [isAuthenticated]);

  // Stop looping animations once loading finishes
  useEffect(() => {
    if (!loading) {
      pulseRef.current?.stop();
      shimmerRef.current?.stop();
    }
  }, [loading]);

  const loadFavoritePreferences = async () => {
    try {
      // Try to load from backend first
      try {
        const response = await userApi.getPreferences();
        const preferences = response.data.data;
        
        const teamIds = preferences.favoriteTeams || [];
        const compIds = preferences.favoriteCompetitions || [];
        
        
        setFavoriteTeamIds(teamIds);
        setFavoriteCompetitionIds(compIds);
        
        // Also save to local storage as backup
        await AsyncStorage.setItem('favoriteTeams', JSON.stringify(teamIds));
        await AsyncStorage.setItem('favoriteCompetitions', JSON.stringify(compIds));
        
        await loadFavorites(teamIds);
      } catch (backendError) {
        // Fallback to local storage
        const teamsJson = await AsyncStorage.getItem('favoriteTeams');
        const competitionsJson = await AsyncStorage.getItem('favoriteCompetitions');
        
        const teamIds = teamsJson ? JSON.parse(teamsJson) : [];
        const compIds = competitionsJson ? JSON.parse(competitionsJson) : [];
        
        setFavoriteTeamIds(teamIds);
        setFavoriteCompetitionIds(compIds);
        
        await loadFavorites(teamIds);
      }
    } catch (error) {
      console.error('Error loading favorite preferences:', error);
      setLoading(false);
    }
  };

  const loadFavorites = async (teamIds?: string[]) => {
    try {
      setLoading(true);
      const teamsToFilter = teamIds || favoriteTeamIds;
      
      if (teamsToFilter.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }
      
      // Get all matches and filter by favorite teams
      const response = await matchApi.getAll();
      const allMatches: Match[] = response.data.data || [];
      
      // Filter matches where homeTeam or awayTeam is in favorites
      const filteredMatches = allMatches.filter(match => 
        teamsToFilter.includes(match.homeTeamId) || teamsToFilter.includes(match.awayTeamId)
      );
      
      setFavorites(filteredMatches);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const openEditModal = async () => {
    setShowEditModal(true);
    setLoadingModal(true);
    setSelectedCompetitions([...favoriteCompetitionIds]);
    setSelectedTeams([...favoriteTeamIds]);
    
    try {
      const compsRes = await competitionApi.getActive();
      setAllCompetitions(compsRes.data.data || []);
      
      // Load teams based on currently selected competitions
      if (favoriteCompetitionIds.length > 0) {
        await fetchTeamsForCompetitions(favoriteCompetitionIds);
      } else {
        setAllTeams([]);
      }
    } catch (error) {
      console.error('Error loading data for edit:', error);
    } finally {
      setLoadingModal(false);
    }
  };

  const fetchTeamsForCompetitions = async (compIds: string[]) => {
    try {
      
      if (compIds.length === 0) {
        setAllTeams([]);
        return;
      }
      
      // Get teams for each selected competition using the new API
      const teamsPromises = compIds.map(compId =>
        teamApi.getByCompetition(compId)
      );
      
      const teamsResponses = await Promise.all(teamsPromises);
      
      // Combine and deduplicate teams
      const allTeamsMap = new Map<string, Team>();
      teamsResponses.forEach(response => {
        const teams: Team[] = response.data.data || [];
        teams.forEach(team => {
          allTeamsMap.set(team.id, team);
        });
      });
      
      const uniqueTeams = Array.from(allTeamsMap.values());
      
      
      setAllTeams(uniqueTeams);
    } catch (error) {
      console.error('❌ Error fetching teams for competitions:', error);
      setAllTeams([]);
    }
  };

  const toggleCompetition = async (id: string) => {
    const newSelected = selectedCompetitions.includes(id) 
      ? selectedCompetitions.filter(c => c !== id) 
      : [...selectedCompetitions, id];
    
    setSelectedCompetitions(newSelected);
    
    // Refresh teams based on new competition selection
    if (newSelected.length > 0) {
      await fetchTeamsForCompetitions(newSelected);
      // Clear selected teams that are no longer in the filtered list
      setSelectedTeams(prev => prev.filter(teamId => 
        allTeams.some(t => t.id === teamId)
      ));
    } else {
      setAllTeams([]);
      setSelectedTeams([]);
    }
  };

  const toggleTeam = (id: string) => {
    setSelectedTeams(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const saveFavorites = async () => {
    try {
      // Save to backend first
      try {
        await userApi.savePreferences({
          favoriteTeams: selectedTeams,
          favoriteCompetitions: selectedCompetitions,
        });
      } catch (backendError) {
        console.error('⚠️ Failed to save to backend:', backendError);
      }
      
      // Also save locally
      await AsyncStorage.setItem('favoriteTeams', JSON.stringify(selectedTeams));
      await AsyncStorage.setItem('favoriteCompetitions', JSON.stringify(selectedCompetitions));
      
      setFavoriteTeamIds(selectedTeams);
      setFavoriteCompetitionIds(selectedCompetitions);
      setShowEditModal(false);
      
      // Reload matches with new favorites
      await loadFavorites(selectedTeams);
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  // Sort: live → upcoming → finished, then filter by tab
  const sortedMatches = useMemo(() => {
    const statusOrder = (s: string) => {
      if (s === 'live' || s === 'halftime') return 0;
      if (s === 'scheduled') return 1;
      return 2; // finished
    };
    const sorted = [...favorites].sort((a, b) => {
      const diff = statusOrder(a.status) - statusOrder(b.status);
      if (diff !== 0) return diff;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
    if (activeTab === 'all') return sorted;
    if (activeTab === 'live') return sorted.filter(m => m.status === 'live' || m.status === 'halftime');
    if (activeTab === 'upcoming') return sorted.filter(m => m.status === 'scheduled');
    return sorted.filter(m => m.status === 'finished');
  }, [favorites, activeTab]);

  const tabs = useMemo(() => [
    { key: 'all' as const, label: t('common.all') || 'الكل' },
    { key: 'live' as const, label: t('match.live') || 'مباشر' },
    { key: 'upcoming' as const, label: t('match.upcoming') || 'القادمة' },
    { key: 'finished' as const, label: t('match.finished') || 'المنتهية' },
  ], [t]);

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <PageHeader
          title={t('favorites.title')}
          logo={isDark ? require('@/assets/logo-white.png') : require('@/assets/logo-black.png')}
        />

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.guestContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[
            styles.loginCard,
            { 
              backgroundColor: colors.surface,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            {/* Heart Animation */}
            <View style={styles.heartWrapper}>
              <LinearGradient
                colors={colors.gradients.live}
                style={styles.heartBg}
              >
                <Ionicons name="heart" size={44} color="#fff" />
              </LinearGradient>
              <View style={[styles.heartGlow, { backgroundColor: colors.live + '30' }]} />
            </View>
            
            <Text style={[styles.loginTitle, { color: colors.text }]}>
              {t('favorites.title')} ❤️
            </Text>
            <Text style={[styles.loginSubtitle, { color: colors.textSecondary }]}>
              {t('favorites.loginSubtitle')}
            </Text>
            
            <View style={styles.loginButtons}>
              <Button
                title={t('auth.login')}
                onPress={() => router.push('/auth/login')}
                variant="primary"
                size="large"
                fullWidth
              />
              <Button
                title={t('auth.register')}
                onPress={() => router.push('/auth/register')}
                variant="ghost"
                size="medium"
              />
            </View>
          </Animated.View>

          {/* Features List */}
          <View style={[styles.featuresCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.featureRow, { flexDirection }]}>
              <View style={[styles.featureIconBg, { backgroundColor: colors.liveLight }]}>
                <Ionicons name="notifications" size={20} color={colors.live} />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  {t('favorites.liveNotifications')}
                </Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  {t('favorites.liveNotificationsDesc')}
                </Text>
              </View>
            </View>
            
            <View style={[styles.featureDivider, { backgroundColor: colors.border }]} />
            
            <View style={[styles.featureRow, { flexDirection }]}>
              <View style={[styles.featureIconBg, { backgroundColor: colors.successLight }]}>
                <Ionicons name="football" size={20} color={colors.success} />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  {t('favorites.followTeams')}
                </Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  {t('favorites.trackTeams')}
                </Text>
              </View>
            </View>
            
            <View style={[styles.featureDivider, { backgroundColor: colors.border }]} />
            
            <View style={[styles.featureRow, { flexDirection }]}>
              <View style={[styles.featureIconBg, { backgroundColor: colors.infoLight }]}>
                <Ionicons name="bookmark" size={20} color={colors.info} />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  {t('favorites.quickAccess')}
                </Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  {t('favorites.saveMatches')}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PageHeader
        title={t('favorites.title')}
        logo={isDark ? require('@/assets/logo-white.png') : require('@/assets/logo-black.png')}
        rightContent={
          <TouchableOpacity 
            style={styles.editButton}
            onPress={openEditModal}
          >
            <Ionicons name="settings-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === tab.key
                  ? colors.accent
                  : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              },
            ]}
          >
            <Text style={[
              styles.tabText,
              {
                color: activeTab === tab.key ? '#fff' : colors.textSecondary,
              },
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={[styles.scrollContent, styles.matchList]}>
          <MatchCardSkeleton />
          <MatchCardSkeleton />
          <MatchCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={sortedMatches}
          keyExtractor={(item) => item.id}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, sortedMatches.length === 0 && { flexGrow: 1 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          renderItem={({ item: match }) => (
            <MatchCard
              match={match}
              onPress={() => router.push(`/match/${match.id}`)}
              showLiveIndicator={match.status === 'live' || match.status === 'halftime'}
              countdown={countdownsMap.get(match.id)}
            />
          )}
          ListEmptyComponent={
            favorites.length > 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', paddingVertical: SPACING.xxl }}>
                <EmptyState
                  icon={activeTab === 'live' ? 'radio-outline' : activeTab === 'upcoming' ? 'time-outline' : 'flag-outline'}
                  title={activeTab === 'live' ? (t('favorites.noLive') || 'لا توجد مباريات مباشرة') : activeTab === 'upcoming' ? (t('favorites.noUpcoming') || 'لا توجد مباريات قادمة') : (t('favorites.noFinished') || 'لا توجد مباريات منتهية')}
                  subtitle={''}
                />
              </View>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <EmptyState
                  icon="heart-outline"
                  title={t('favorites.noFavorites')}
                  subtitle={t('favorites.tapHeartIcon')}
                  actionLabel={t('favorites.editFavorites')}
                  actionIcon="add-circle-outline"
                  onAction={openEditModal}
                />
              </View>
            )
          }
          ListFooterComponent={<View style={{ height: 120 }} />}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
        />
      )}

      {/* Edit Favorites Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('favorites.editFavorites')}
              </Text>
              <TouchableOpacity onPress={saveFavorites}>
                <Text style={[styles.saveButton, { color: colors.accent }]}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>

            {loadingModal ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            ) : (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Competitions Section */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('favorites.selectCompetitions')}
                </Text>
                <View style={styles.selectionGrid}>
                  {allCompetitions.map((comp) => (
                    <TouchableOpacity
                      key={comp.id}
                      style={[
                        styles.selectionItem,
                        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                        selectedCompetitions.includes(comp.id) && { borderColor: colors.accent, backgroundColor: colors.accentGlow }
                      ]}
                      onPress={() => toggleCompetition(comp.id)}
                      activeOpacity={0.7}
                    >
                      {comp.logoUrl ? (
                        <Image source={{ uri: comp.logoUrl }} style={styles.selectionLogo} contentFit="contain" cachePolicy="memory-disk" />
                      ) : (
                        <View style={[styles.selectionLogoPlaceholder, { backgroundColor: colors.surface }]}>
                          <Ionicons name="trophy" size={24} color={colors.textTertiary} />
                        </View>
                      )}
                      <Text 
                        style={[styles.selectionName, { color: colors.text }]} 
                        numberOfLines={2}
                      >
                        {comp.name}
                      </Text>
                      {selectedCompetitions.includes(comp.id) && (
                        <View style={[styles.checkBadge, { backgroundColor: colors.accent }]}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Teams Section */}
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
                  {t('favorites.selectTeams')}
                </Text>
                <View style={styles.selectionGrid}>
                  {allTeams.map((team) => (
                    <TouchableOpacity
                      key={team.id}
                      style={[
                        styles.selectionItem,
                        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                        selectedTeams.includes(team.id) && { borderColor: colors.accent, backgroundColor: colors.accentGlow }
                      ]}
                      onPress={() => toggleTeam(team.id)}
                      activeOpacity={0.7}
                    >
                      {team.logoUrl ? (
                        <Image source={{ uri: team.logoUrl }} style={styles.selectionLogo} contentFit="contain" cachePolicy="memory-disk" />
                      ) : (
                        <View style={[styles.selectionLogoPlaceholder, { backgroundColor: team.primaryColor || colors.surface }]}>
                          <Ionicons name="shield" size={24} color="#fff" />
                        </View>
                      )}
                      <Text style={[styles.selectionName, { color: colors.text }]} numberOfLines={2}>
                        {team.name}
                      </Text>
                      {selectedTeams.includes(team.id) && (
                        <View style={[styles.checkBadge, { backgroundColor: colors.accent }]}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    ...TYPOGRAPHY.labelMedium,
    marginTop: 2,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  headerBadgeText: {
    ...TYPOGRAPHY.labelLarge,
    fontWeight: '700',
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: SPACING.xl,
    backgroundColor: 'rgba(128,128,128,0.1)',
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatValue: {
    ...TYPOGRAPHY.titleLarge,
    fontWeight: '800',
  },
  quickStatLabel: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  guestContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  matchList: {
    gap: SPACING.sm,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    marginTop: SPACING.md,
    ...SHADOWS.xs,
  },
  emptyIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 18,
    paddingHorizontal: SPACING.sm,
  },
  // Guest/Login Prompt
  loginCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  heartWrapper: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  heartBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 40,
    zIndex: -1,
  },
  loginTitle: {
    ...TYPOGRAPHY.titleLarge,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  loginSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 18,
  },
  loginButtons: {
    width: '100%',
    gap: SPACING.xs,
  },
  featuresCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  featureIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
  },
  featureDesc: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: 1,
  },
  featureDivider: {
    height: 1,
    marginVertical: SPACING.xs,
  },
  // Header Actions
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(128,128,128,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.1)',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '700',
  },
  saveButton: {
    ...TYPOGRAPHY.labelLarge,
    fontWeight: '700',
  },
  modalLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  selectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  selectionItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectionLogo: {
    width: 36,
    height: 36,
    marginBottom: 6,
  },
  selectionLogoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  selectionName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: FONTS.semiBold,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});