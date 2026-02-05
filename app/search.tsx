// Search Page - Find teams, players, and matches
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
  Platform,
  Keyboard,
  Animated,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/Theme';
import { teamApi, playerApi, matchApi } from '@/services/api';
import { Team, Player, Match } from '@/types';
import TeamLogo from '@/components/ui/TeamLogo';
import MatchCard from '@/components/MatchCard';
import { MatchCardSkeleton } from '@/components/ui/Skeleton';
import { useRTL } from '@/contexts/RTLContext';

type SearchCategory = 'all' | 'teams' | 'players' | 'matches';

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { t, isRTL, flexDirection } = useRTL();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Auto-focus on search input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch();
      } else {
        setTeams([]);
        setPlayers([]);
        setMatches([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeCategory]);

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const promises: Promise<any>[] = [];
      
      if (activeCategory === 'all' || activeCategory === 'teams') {
        promises.push(teamApi.getAll().then(res => ({ type: 'teams', data: res.data })));
      }
      if (activeCategory === 'all' || activeCategory === 'players') {
        promises.push(playerApi.getAll({ search: searchQuery }).then(res => ({ type: 'players', data: res.data })));
      }
      if (activeCategory === 'all' || activeCategory === 'matches') {
        promises.push(matchApi.getAll().then(res => ({ type: 'matches', data: res.data })));
      }

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        if (result.type === 'teams') {
          setTeams(
            result.data?.filter((t: Team) => 
              t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.shortName?.toLowerCase().includes(searchQuery.toLowerCase())
            ) || []
          );
        }
        if (result.type === 'players') {
          setPlayers(
            result.data?.filter((p: Player) =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase())
            ) || []
          );
        }
        if (result.type === 'matches') {
          setMatches(
            result.data?.filter((m: Match) =>
              m.homeTeam?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              m.awayTeam?.name.toLowerCase().includes(searchQuery.toLowerCase())
            ) || []
          );
        }
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories: { key: SearchCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'all', label: t('search.all'), icon: 'search' },
    { key: 'teams', label: t('search.teams'), icon: 'shield-outline' },
    { key: 'players', label: t('search.players'), icon: 'people-outline' },
    { key: 'matches', label: t('search.matches'), icon: 'calendar-outline' },
  ];

  const hasResults = teams.length > 0 || players.length > 0 || matches.length > 0;
  const showNoResults = searchQuery.length >= 2 && !isLoading && !hasResults;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons 
              name={isRTL ? "arrow-forward" : "arrow-back"} 
              size={24} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
          
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.categories, isRTL && { flexDirection: 'row-reverse' }]}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryTab,
                { backgroundColor: activeCategory === cat.key ? colors.accent : colors.surface },
              ]}
              onPress={() => setActiveCategory(cat.key)}
            >
              <Ionicons name={cat.icon} size={16} color={activeCategory === cat.key ? colors.primaryDark : colors.text} style={{ marginRight: isRTL ? 0 : 6, marginLeft: isRTL ? 6 : 0 }} />
              <Text
                style={[
                  styles.categoryLabel,
                  { color: activeCategory === cat.key ? colors.primaryDark : colors.text },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingSection}>
            <MatchCardSkeleton />
            <MatchCardSkeleton />
          </View>
        )}

        {/* Teams Results */}
        {(activeCategory === 'all' || activeCategory === 'teams') && teams.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { flexDirection }]}>
              <Ionicons name="shield-outline" size={18} color={colors.accent} style={{ marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('search.teams')} ({teams.length})
              </Text>
            </View>
            {teams.map(team => (
              <TouchableOpacity
                key={team.id}
                style={[styles.teamCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                onPress={() => router.push(`/team/${team.id}` as any)}
              >
                <TeamLogo team={team} size="medium" />
                <View style={[styles.teamInfo, { marginLeft: isRTL ? 0 : SPACING.md, marginRight: isRTL ? SPACING.md : 0 }]}>
                  <Text style={[styles.teamName, { color: colors.text }]}>{team.name}</Text>
                  <Text style={[styles.teamCountry, { color: colors.textSecondary }]}>
                    {team.country} • {team.shortName}
                  </Text>
                </View>
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Players Results */}
        {(activeCategory === 'all' || activeCategory === 'players') && players.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { flexDirection }]}>
              <Ionicons name="people-outline" size={18} color={colors.accent} style={{ marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('search.players')} ({players.length})
              </Text>
            </View>
            {players.map(player => (
              <TouchableOpacity
                key={player.id}
                style={[styles.playerCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                onPress={() => router.push(`/player/${player.id}` as any)}
              >
                <View style={[styles.playerNumber, { backgroundColor: player.team?.primaryColor || colors.accent }]}>
                  <Text style={styles.playerNumberText}>{player.shirtNumber || '-'}</Text>
                </View>
                <View style={[styles.playerInfo, { marginLeft: isRTL ? 0 : SPACING.md, marginRight: isRTL ? SPACING.md : 0 }]}>
                  <Text style={[styles.playerName, { color: colors.text }]}>{player.name}</Text>
                  <Text style={[styles.playerDetails, { color: colors.textSecondary }]}>
                    {player.position} • {player.team?.name || 'Free Agent'}
                  </Text>
                </View>
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Matches Results */}
        {(activeCategory === 'all' || activeCategory === 'matches') && matches.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { flexDirection }]}>
              <Ionicons name="calendar-outline" size={18} color={colors.accent} style={{ marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('search.matches')} ({matches.length})
              </Text>
            </View>
            {matches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                onPress={() => router.push(`/match/${match.id}`)}
              />
            ))}
          </View>
        )}

        {/* No Results */}
        {showNoResults && (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Ionicons name="search" size={48} color={colors.textTertiary} style={{ marginBottom: SPACING.md }} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t('search.noResults')}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('search.noResultsFor')} "{searchQuery}"
            </Text>
          </View>
        )}

        {/* Initial State */}
        {searchQuery.length < 2 && !isLoading && (
          <View style={[styles.initialState, { backgroundColor: colors.surface }]}>
            <Ionicons name="search-outline" size={48} color={colors.textTertiary} style={{ marginBottom: SPACING.md }} />
            <Text style={[styles.initialTitle, { color: colors.text }]}>
              {t('search.startSearching')}
            </Text>
            <Text style={[styles.initialText, { color: colors.textSecondary }]}>
              {t('search.searchHint')}
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.bodyMedium,
    paddingVertical: SPACING.xs,
  },
  categories: {
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: SPACING.xxs,
  },
  categoryIcon: {
    fontSize: 12,
  },
  categoryLabel: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.lg,
  },
  loadingSection: {
    marginTop: SPACING.lg,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '700',
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '600',
  },
  teamCountry: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: 2,
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
  playerDetails: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: 2,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    marginTop: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 40,
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
  initialState: {
    padding: SPACING.xl,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    marginTop: SPACING.xl,
  },
  initialIcon: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  initialTitle: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '700',
    marginBottom: SPACING.xxs,
  },
  initialText: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
  },
});
