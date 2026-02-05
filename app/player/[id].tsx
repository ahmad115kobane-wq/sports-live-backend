// Player Profile Page
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
  Platform,
  RefreshControl,
  Animated,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/Theme';
import { playerApi } from '@/services/api';
import { Player } from '@/types';
import TeamLogo from '@/components/ui/TeamLogo';
import GlassCard from '@/components/ui/GlassCard';
import { useRTL } from '@/contexts/RTLContext';

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { t, isRTL, flexDirection } = useRTL();
  
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = new Animated.Value(0);

  useEffect(() => {
    loadPlayerData();
  }, [id]);

  const loadPlayerData = async () => {
    try {
      setIsLoading(true);
      const response = await playerApi.getById(id as string);
      setPlayer(response.data);
    } catch (error) {
      console.error('Error loading player:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlayerData();
    setRefreshing(false);
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const getPositionColor = (position?: string) => {
    switch (position?.toLowerCase()) {
      case 'goalkeeper':
        return '#FBBF24';
      case 'defender':
        return '#3B82F6';
      case 'midfielder':
        return '#10B981';
      case 'forward':
        return '#EF4444';
      default:
        return colors.accent;
    }
  };

  const getPositionIcon = (position?: string): keyof typeof Ionicons.glyphMap => {
    switch (position?.toLowerCase()) {
      case 'goalkeeper':
        return 'hand-left-outline';
      case 'defender':
        return 'shield-outline';
      case 'midfielder':
        return 'settings-outline';
      case 'forward':
        return 'flash-outline';
      default:
        return 'football-outline';
    }
  };

  if (!player && !isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          {t('common.error')}
        </Text>
      </View>
    );
  }

  const teamColor = player?.team?.primaryColor || colors.accent;

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
          { opacity: headerOpacity, backgroundColor: teamColor },
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
          colors={[teamColor, colors.background]}
          style={styles.heroHeader}
        >
          <View style={styles.heroContent}>
            {/* Player Number */}
            <View style={[styles.playerNumberLarge, { borderColor: 'rgba(255,255,255,0.3)' }]}>
              <Text style={styles.playerNumberText}>
                {player?.shirtNumber || '?'}
              </Text>
            </View>
            
            <Text style={[styles.playerName, { color: '#fff' }]}>
              {player?.name}
            </Text>
            
            {/* Position Badge */}
            <View style={[styles.positionBadge, { backgroundColor: getPositionColor(player?.position) }]}>
              <Ionicons name={getPositionIcon(player?.position)} size={16} color="#fff" style={{ marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }} />
              <Text style={styles.positionText}>{player?.position || 'Player'}</Text>
            </View>
            
            {/* Team Info */}
            {player?.team && (
              <TouchableOpacity 
                style={[styles.teamBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                onPress={() => router.push(`/team/${player.team?.id}` as any)}
              >
                <TeamLogo team={player.team} size="small" />
                <Text style={[styles.teamName, { color: '#fff' }]}>
                  {player.team.name}
                </Text>
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* Player Info Cards */}
        <View style={styles.infoSection}>
          {/* Basic Info */}
          <GlassCard variant="default" style={styles.infoCard}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t('player.basicInfo')}
            </Text>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {t('player.nationality')}
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {player?.nationality || 'International'}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {t('player.number')}
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  #{player?.shirtNumber || '-'}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {t('player.position')}
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {player?.position || '-'}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {t('player.team')}
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {player?.team?.shortName || '-'}
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Season Stats - Placeholder for future */}
          <GlassCard variant="accent" style={styles.statsCard}>
            <View style={[styles.statsHeader, { flexDirection }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t('player.seasonStats')}
              </Text>
              <Text style={[styles.seasonLabel, { color: colors.accent }]}>
                2025/26
              </Text>
            </View>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.text }]}>0</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {t('player.matches')}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.success }]}>0</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {t('player.goals')}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.info }]}>0</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {t('player.assists')}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.warning }]}>0</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {t('player.cards')}
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Recent Performance - Placeholder */}
          <View style={[styles.placeholderCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Ionicons name="stats-chart-outline" size={40} color={colors.textTertiary} style={{ marginBottom: SPACING.sm }} />
            <Text style={[styles.placeholderTitle, { color: colors.text }]}>
              {t('player.recentPerformance')}
            </Text>
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
              {t('player.statsComingSoon')}
            </Text>
          </View>
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
  playerNumberLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  playerNumberText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  playerName: {
    ...TYPOGRAPHY.headlineMedium,
    fontWeight: '800',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  positionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm,
  },
  positionIcon: {
    fontSize: 14,
  },
  positionText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700',
    color: '#fff',
  },
  teamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  teamName: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '600',
  },
  infoSection: {
    paddingHorizontal: SPACING.md,
    marginTop: -SPACING.lg,
  },
  infoCard: {
    marginBottom: SPACING.md,
  },
  cardTitle: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: SPACING.md,
  },
  infoLabel: {
    ...TYPOGRAPHY.labelSmall,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '600',
  },
  statsCard: {
    marginBottom: SPACING.md,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  seasonLabel: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...TYPOGRAPHY.headlineSmall,
    fontWeight: '800',
  },
  statLabel: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: 2,
  },
  placeholderCard: {
    padding: SPACING.xl,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    fontSize: 36,
    marginBottom: SPACING.sm,
  },
  placeholderTitle: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '700',
    marginBottom: SPACING.xxs,
  },
  placeholderText: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
  },
  errorText: {
    ...TYPOGRAPHY.titleSmall,
    textAlign: 'center',
    marginTop: 100,
  },
});
