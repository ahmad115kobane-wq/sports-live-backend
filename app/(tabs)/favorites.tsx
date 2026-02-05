import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useColorScheme,
  StatusBar,
  Platform,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/components/ui/BlurView';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import { matchApi, competitionApi, teamApi, userApi } from '@/services/api';
import { Match, Competition, Team } from '@/types';
import MatchCard from '@/components/MatchCard';
import { MatchCardSkeleton } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import { useRTL } from '@/contexts/RTLContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Match[]>([]);
  const { isAuthenticated } = useAuthStore();

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

  useEffect(() => {
    if (isAuthenticated) {
      loadFavoritePreferences();
    } else {
      setLoading(false);
    }

    // Animations
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
    ).start();
  }, [isAuthenticated]);

  const loadFavoritePreferences = async () => {
    try {
      // Try to load from backend first
      try {
        const response = await userApi.getPreferences();
        const preferences = response.data.data;
        
        const teamIds = preferences.favoriteTeams || [];
        const compIds = preferences.favoriteCompetitions || [];
        
        console.log('✅ Loaded preferences from backend:', { teamIds, compIds });
        
        setFavoriteTeamIds(teamIds);
        setFavoriteCompetitionIds(compIds);
        
        // Also save to local storage as backup
        await AsyncStorage.setItem('favoriteTeams', JSON.stringify(teamIds));
        await AsyncStorage.setItem('favoriteCompetitions', JSON.stringify(compIds));
        
        await loadFavorites(teamIds);
      } catch (backendError) {
        console.log('⚠️ Backend failed, loading from local storage:', backendError);
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
      console.log('🔍 Fetching teams for competitions:', compIds);
      
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
      
      console.log('✅ Teams loaded for favorites:', uniqueTeams.length);
      console.log('📊 Team names:', uniqueTeams.map(t => t.name));
      
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
        console.log('✅ Preferences saved to backend');
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

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        
        {/* Premium Header */}
        <LinearGradient
          colors={colors.gradients.dark}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Animated.View style={[styles.shimmerEffect, { transform: [{ translateX: shimmerTranslate }] }]}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <View style={[styles.headerContent, { flexDirection }]}>
            <View>
              <Text style={styles.headerTitle}>{t('favorites.title')}</Text>
              <Text style={styles.headerSubtitle}>{t('favorites.addFavorites')}</Text>
            </View>
            <Animated.View style={[styles.headerIcon, { transform: [{ scale: pulseAnim }] }]}>
              <Ionicons name="heart" size={28} color="#fff" />
            </Animated.View>
          </View>
        </LinearGradient>

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
              Sign in to save your favorite matches and teams
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
                  Live Notifications
                </Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  Get instant score alerts
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
                  Follow Teams
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
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={colors.gradients.dark}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Animated.View style={[styles.shimmerEffect, { transform: [{ translateX: shimmerTranslate }] }]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.08)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <View style={[styles.headerContent, { flexDirection }]}>
          <View>
            <Text style={styles.headerTitle}>{t('favorites.title')}</Text>
            <Text style={styles.headerSubtitle}>
              {favorites.length > 0 
                ? `${favorites.length} ${t('tabs.matches')}` 
                : t('favorites.addFavorites')
              }
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={openEditModal}
            >
              <Ionicons name="settings-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerBadge}>
              <Ionicons name="heart" size={18} color="#fff" />
              <Text style={styles.headerBadgeText}>{favorites.length}</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        {favorites.length > 0 && (
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>
                {favorites.filter(m => m.status === 'live').length}
              </Text>
              <Text style={styles.quickStatLabel}>{t('match.live')}</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>
                {favorites.filter(m => m.status === 'scheduled').length}
              </Text>
              <Text style={styles.quickStatLabel}>{t('match.upcoming')}</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>
                {favorites.filter(m => m.status === 'finished').length}
              </Text>
              <Text style={styles.quickStatLabel}>{t('match.finished')}</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {loading ? (
          <View style={styles.matchList}>
            <MatchCardSkeleton />
            <MatchCardSkeleton />
            <MatchCardSkeleton />
          </View>
        ) : favorites.length > 0 ? (
          <View style={styles.matchList}>
            {favorites.map((match, index) => (
              <Animated.View 
                key={match.id}
                style={{
                  opacity: fadeAnim,
                  transform: [{ 
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 30],
                      outputRange: [0, 30 * (index + 1) * 0.1],
                    })
                  }],
                }}
              >
                <MatchCard
                  match={match}
                  onPress={() => router.push(`/match/${match.id}`)}
                  showLiveIndicator={match.status === 'live'}
                />
              </Animated.View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <View style={[styles.emptyIconBg, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="heart-outline" size={44} color={colors.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t('favorites.noFavorites')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {t('favorites.tapHeartIcon')}
            </Text>
            <Button
              title={t('favorites.editFavorites')}
              onPress={openEditModal}
              variant="primary"
              size="medium"
              icon={<Ionicons name="add-circle-outline" size={18} color="#fff" />}
            />
          </View>
        )}
        
        <View style={{ height: 120 }} />
      </ScrollView>

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
                        <Image source={{ uri: comp.logoUrl }} style={styles.selectionLogo} resizeMode="contain" />
                      ) : (
                        <View style={[styles.selectionLogoPlaceholder, { backgroundColor: colors.surface }]}>
                          <Ionicons name="trophy" size={24} color={colors.textTertiary} />
                        </View>
                      )}
                      <Text style={[styles.selectionName, { color: colors.text }]} numberOfLines={2}>
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
                        <Image source={{ uri: team.logoUrl }} style={styles.selectionLogo} resizeMode="contain" />
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
    color: '#fff',
    fontWeight: '800',
  },
  headerSubtitle: {
    ...TYPOGRAPHY.labelMedium,
    color: 'rgba(255,255,255,0.75)',
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  headerBadgeText: {
    ...TYPOGRAPHY.labelLarge,
    color: '#fff',
    fontWeight: '700',
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: SPACING.xl,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatValue: {
    ...TYPOGRAPHY.titleLarge,
    color: '#fff',
    fontWeight: '800',
  },
  quickStatLabel: {
    ...TYPOGRAPHY.labelSmall,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    width: 64,
    height: 64,
    borderRadius: 32,
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
    width: 64,
    height: 64,
    borderRadius: 32,
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 40,
    height: 40,
    marginBottom: 6,
  },
  selectionLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  selectionName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
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