import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useColorScheme,
  Animated,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/components/ui/BlurView';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/Theme';
import { useMatchStore } from '@/store/matchStore';
import { useSocket } from '@/services/socket';
import MatchCard from '@/components/MatchCard';
import { MatchCardSkeleton } from '@/components/ui/Skeleton';
import { useRTL } from '@/contexts/RTLContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LiveScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();
  const [refreshing, setRefreshing] = useState(false);
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  
  const { liveMatches, isLoading, fetchLiveMatches } = useMatchStore();
  const { joinLiveFeed } = useSocket();

  useEffect(() => {
    fetchLiveMatches();
    joinLiveFeed();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Wave animation
    Animated.loop(
      Animated.timing(waveAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
    ).start();

    // Auto refresh
    const interval = setInterval(() => fetchLiveMatches(), 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLiveMatches();
    setRefreshing(false);
  };

  const waveTranslate = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Premium Header - Same as Favorites */}
      <LinearGradient
        colors={colors.gradients.dark}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Shimmer Effect */}
        <Animated.View style={[styles.shimmerEffect, { transform: [{ translateX: waveTranslate }] }]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <View style={[styles.headerContent, { flexDirection }]}>
          <View>
            <Text style={styles.headerTitle}>{t('match.live')}</Text>
            <Text style={styles.headerSubtitle}>
              {liveMatches.length > 0 
                ? `${liveMatches.length} ${t('tabs.matches')} ${t('match.live')}`
                : t('home.noUpcomingMatches')
              }
            </Text>
          </View>
          <Animated.View style={[styles.headerIcon, { transform: [{ scale: pulseAnim }] }]}>
            <View style={[styles.liveDot, { backgroundColor: liveMatches.length > 0 ? '#fff' : 'rgba(255,255,255,0.5)' }]} />
            <Ionicons name="pulse" size={28} color="#fff" />
          </Animated.View>
        </View>
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
            progressViewOffset={Platform.OS === 'ios' ? 180 : 160}
          />
        }
      >
        {isLoading ? (
          <View style={styles.matchList}>
            <MatchCardSkeleton />
            <MatchCardSkeleton />
            <MatchCardSkeleton />
          </View>
        ) : liveMatches.length > 0 ? (
          <View style={styles.matchList}>
            {liveMatches.map((match, index) => (
              <Animated.View 
                key={match.id}
                style={{
                  opacity: 1,
                  transform: [{ translateY: 0 }],
                }}
              >
                <MatchCard
                  match={match}
                  onPress={() => router.push(`/match/${match.id}`)}
                  showLiveIndicator
                />
              </Animated.View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <View style={[styles.emptyIconWrapper, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="tv-outline" size={40} color={colors.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t('home.noUpcomingMatches')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {t('home.checkBackLater')}
            </Text>
            <TouchableOpacity 
              style={[styles.refreshBtn, { backgroundColor: colors.accent }]}
              onPress={onRefresh}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.refreshBtnText}>{t('common.refresh')}</Text>
            </TouchableOpacity>
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
  liveDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.md,
  },
  matchList: {
    paddingHorizontal: SPACING.md,
  },
  emptyState: {
    margin: SPACING.md,
    padding: SPACING.xl,
    alignItems: 'center',
    borderRadius: RADIUS.xl,
    ...SHADOWS.xs,
  },
  emptyIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  refreshBtnText: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '700',
    color: '#fff',
  },
});
