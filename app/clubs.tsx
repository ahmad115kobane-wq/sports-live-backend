import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Animated,
  Dimensions,
  InteractionManager,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { teamApi } from '@/services/api';
import TeamLogo from '@/components/ui/TeamLogo';
import { ClubsGridSkeleton } from '@/components/ui/Skeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Player {
  id: string;
  name: string;
  shirtNumber: number;
  position?: string;
  nationality?: string;
}

interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  primaryColor?: string;
  coach?: string;
  stadium?: string;
  city?: string;
  country?: string;
  players?: Player[];
  _count?: {
    players: number;
    homeMatches: number;
    awayMatches: number;
  };
}

export default function ClubsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      loadTeams();
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    });
    return () => task.cancel();
  }, []);


  const waveTranslate = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, SCREEN_WIDTH + 150],
  });

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await teamApi.getAllWithPlayers();
      const teamsData = response.data?.data || response.data || [];
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeams();
    setRefreshing(false);
  };

  const filteredTeams = teams.filter(team => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return team.name.toLowerCase().includes(q) || team.shortName.toLowerCase().includes(q) || (team.coach || '').toLowerCase().includes(q);
  });

  const renderTeamCard = useCallback(({ item: team }: { item: Team }) => {
    const playerCount = team._count?.players || team.players?.length || 0;

    return (
      <TouchableOpacity
        style={[styles.teamCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push(`/team/${team.id}` as any)}
        activeOpacity={0.8}
      >
        {/* Top color accent bar */}
        <LinearGradient
          colors={[team.primaryColor || colors.accent, (team.primaryColor || colors.accent) + '40', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.teamCardAccent}
        />

        <View style={[styles.teamCardBody, { flexDirection }]}>
          {/* Logo */}
          <View style={[styles.teamLogoWrap, { backgroundColor: (team.primaryColor || colors.accent) + '15', borderColor: (team.primaryColor || colors.accent) + '30' }]}>
            <TeamLogo team={team} size="medium" />
          </View>

          {/* Info */}
          <View style={styles.teamInfo}>
            <Text style={[styles.teamName, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {team.name}
            </Text>
            <View style={[styles.teamMetaRow, { flexDirection, alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
              <View style={[styles.shortNameBadge, { backgroundColor: (team.primaryColor || colors.accent) + '15' }]}>
                <Text style={[styles.shortNameText, { color: team.primaryColor || colors.accent }]}>
                  {team.shortName}
                </Text>
              </View>
              {playerCount > 0 && (
                <View style={[styles.playerCountBadge, { backgroundColor: colors.accent + '10' }]}>
                  <Ionicons name="people" size={11} color={colors.accent} />
                  <Text style={[styles.playerCountText, { color: colors.accent }]}>{playerCount}</Text>
                </View>
              )}
            </View>
            <View style={[styles.teamDetails, { flexDirection, alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
              {team.coach && (
                <View style={[styles.detailItem, { flexDirection }]}>
                  <Ionicons name="person-outline" size={11} color={colors.textTertiary} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={2}>
                    {team.coach}
                  </Text>
                </View>
              )}
              {team.stadium && (
                <View style={[styles.detailItem, { flexDirection }]}>
                  <Ionicons name="location-outline" size={11} color={colors.textTertiary} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={2}>
                    {team.stadium}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Arrow */}
          <View style={[styles.arrowWrap, { backgroundColor: colors.accent + '10' }]}>
            <Ionicons
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={18}
              color={colors.accent}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [colors, isRTL, flexDirection]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header - News style */}
      <LinearGradient
        colors={colors.gradients.dark}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Animated.View style={[styles.shimmerEffect, { transform: [{ translateX: waveTranslate }] }]}>
          <LinearGradient
            colors={['transparent', colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <View style={[styles.headerContent, { flexDirection }]}>
          <View style={[styles.headerLeft, { flexDirection }]}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <Ionicons
                name={isRTL ? 'chevron-forward' : 'chevron-back'}
                size={22}
                color={colors.text}
              />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>{t('clubs.title')}</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                جميع الأندية والمنتخبات بكل أصنافها
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('clubs.searchPlaceholder', 'بحث عن نادي أو منتخب...')}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign={isRTL ? 'right' : 'left'}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Teams List */}
      {loading ? (
        <ClubsGridSkeleton count={6} />
      ) : (
        <FlatList
          data={filteredTeams}
          renderItem={renderTeamCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            teams.length === 0 && { flexGrow: 1 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.accent + '10' }]}>
                <Ionicons name="shield-outline" size={48} color={colors.accent} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {t('clubs.noClubs')}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {t('clubs.noClubsDesc')}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header - News style
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 16,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(128,128,128,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.headlineMedium,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    marginTop: 3,
    fontWeight: '500',
    opacity: 0.7,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(128,128,128,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Search
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.medium,
    paddingVertical: 0,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // List
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  // Team Card
  teamCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  teamCardAccent: {
    height: 3,
  },
  teamCardBody: {
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.md,
  },
  teamLogoWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamInfo: {
    flex: 1,
    gap: 3,
  },
  teamName: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  teamMetaRow: {
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: 2,
  },
  shortNameBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  shortNameText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  playerCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 3,
  },
  playerCountText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  teamDetails: {
    marginTop: 4,
    gap: SPACING.md,
  },
  detailItem: {
    alignItems: 'center',
    gap: 3,
  },
  detailText: {
    ...TYPOGRAPHY.labelSmall,
  },
  arrowWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 3,
    gap: SPACING.md,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    ...TYPOGRAPHY.titleLarge,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.bodyMedium,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    opacity: 0.6,
    lineHeight: 22,
  },
});
