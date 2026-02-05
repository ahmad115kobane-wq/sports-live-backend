import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import { operatorApi } from '@/services/api';
import { Match } from '@/types';
import { MATCH_STATUS } from '@/constants/config';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useRTL } from '@/contexts/RTLContext';

export default function OperatorScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { t, isRTL, flexDirection } = useRTL();
  const [matches, setMatches] = useState<Match[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const response = await operatorApi.getMatches();
      setMatches(response.data.data);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const liveMatches = matches.filter((m) => m.status === 'live' || m.status === 'halftime');
  const scheduledMatches = matches.filter((m) => m.status === 'scheduled');
  const finishedMatches = matches.filter((m) => m.status === 'finished');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={colors.gradients.premium}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerDecor1} />
        <View style={styles.headerDecor2} />
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.headerIconBg}>
            <Ionicons name="radio" size={28} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>{t('match.live')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('home.welcome')}, {user?.name}
          </Text>
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
          />
        }
      >
        {/* Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface, flexDirection }]}>
          <View style={styles.statItem}>
            <View style={[styles.statIconBg, { backgroundColor: colors.liveLight }]}>
              <Ionicons name="radio" size={20} color={colors.live} />
            </View>
            <Text style={[styles.statValue, { color: colors.live }]}>
              {liveMatches.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t('match.live')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <View style={[styles.statIconBg, { backgroundColor: colors.infoLight }]}>
              <Ionicons name="time" size={20} color={colors.info} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {scheduledMatches.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t('match.upcoming')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <View style={[styles.statIconBg, { backgroundColor: colors.successLight }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {finishedMatches.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t('match.finished')}</Text>
          </View>
        </View>

        {/* Live Matches */}
        {liveMatches.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { flexDirection }]}>
              <View style={[styles.sectionTitleRow, { flexDirection }]}>
                <View style={[styles.liveDot, { backgroundColor: colors.live }]} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.liveNow')}</Text>
              </View>
              <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>
                {liveMatches.length} {t('tabs.matches')}
              </Text>
            </View>
            {liveMatches.map((match) => (
              <TouchableOpacity
                key={match.id}
                style={[styles.matchCard, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.live,
                  borderWidth: 2,
                }]}
                onPress={() => router.push(`/operator/match/${match.id}`)}
              >
                <View style={[styles.matchHeader, { flexDirection }]}>
                  <View style={[styles.minuteBadge, { backgroundColor: colors.liveLight }]}>
                    <Text style={[styles.minuteText, { color: colors.live }]}>
                      {match.currentMinute ? `${match.currentMinute}'` : t('match.live')}
                    </Text>
                  </View>
                  <LinearGradient
                    colors={['#E63946', '#C1121F']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.statusBadge}
                  >
                    <Text style={styles.statusText}>
                      {MATCH_STATUS[match.status].label}
                    </Text>
                  </LinearGradient>
                </View>
                
                <View style={[styles.teamsRow, { flexDirection }]}>
                  <View style={styles.teamInfo}>
                    <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
                      {match.homeTeam.name}
                    </Text>
                  </View>
                  <View style={styles.scoreContainer}>
                    <Text style={[styles.score, { color: colors.text }]}>
                      {match.homeScore}
                    </Text>
                    <Text style={[styles.scoreDivider, { color: colors.textTertiary }]}>-</Text>
                    <Text style={[styles.score, { color: colors.text }]}>
                      {match.awayScore}
                    </Text>
                  </View>
                  <View style={[styles.teamInfo, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
                    <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
                      {match.awayTeam.name}
                    </Text>
                  </View>
                </View>
                
                <LinearGradient
                  colors={['#E63946', '#C1121F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionButton}
                >
                  <Ionicons name="radio" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>{t('match.live')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Scheduled Matches */}
        {scheduledMatches.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { flexDirection }]}>
              <View style={[styles.sectionTitleRow, { flexDirection }]}>
                <Ionicons name="time-outline" size={18} color={colors.info} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.upcoming')}</Text>
              </View>
              <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>
                {scheduledMatches.length} {t('tabs.matches')}
              </Text>
            </View>
            {scheduledMatches.map((match) => (
              <TouchableOpacity
                key={match.id}
                style={[styles.matchCard, { backgroundColor: colors.surface }]}
                onPress={() => router.push(`/operator/match/${match.id}`)}
              >
                <View style={[styles.matchHeader, { flexDirection }]}>
                  <Text style={[styles.matchDate, { color: colors.textSecondary }]}>
                    {format(new Date(match.startTime), 'MMM d, HH:mm', { locale: isRTL ? ar : enUS })}
                  </Text>
                  <View style={[styles.scheduledBadge, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.scheduledText, { color: colors.textSecondary }]}>
                      {t('match.scheduled')}
                    </Text>
                  </View>
                </View>
                
                <View style={[styles.teamsRow, { flexDirection }]}>
                  <View style={styles.teamInfo}>
                    <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
                      {match.homeTeam.name}
                    </Text>
                  </View>
                  <View style={[styles.vsContainer, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.vsText, { color: colors.textTertiary }]}>VS</Text>
                  </View>
                  <View style={[styles.teamInfo, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
                    <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
                      {match.awayTeam.name}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={[styles.startButton, { backgroundColor: colors.success }]}
                  onPress={() => router.push(`/operator/match/${match.id}`)}
                >
                  <Ionicons name="play" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>{t('common.ok')}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {matches.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBg, { backgroundColor: colors.surface }]}>
              <Ionicons name="clipboard-outline" size={48} color={colors.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t('common.noResults')}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('home.noUpcomingMatches')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 46 : (StatusBar.currentHeight || 24) + SPACING.xs,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerDecor2: {
    position: 'absolute',
    bottom: -15,
    left: -15,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIconBg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.headlineSmall,
    color: '#fff',
    fontWeight: '700',
    marginBottom: SPACING.xxs,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255,255,255,0.8)',
  },
  scrollView: {
    flex: 1,
    marginTop: -SPACING.md,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
    marginBottom: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xxs,
  },
  statValue: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '700',
  },
  statLabel: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    marginVertical: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '700',
  },
  sectionCount: {
    ...TYPOGRAPHY.labelSmall,
  },
  matchCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  minuteBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.sm,
  },
  minuteText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.full,
  },
  statusText: {
    ...TYPOGRAPHY.labelSmall,
    color: '#fff',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  matchDate: {
    ...TYPOGRAPHY.labelSmall,
  },
  scheduledBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.sm,
  },
  scheduledText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  score: {
    ...TYPOGRAPHY.headlineSmall,
    fontWeight: '700',
  },
  scoreDivider: {
    ...TYPOGRAPHY.titleSmall,
    marginHorizontal: SPACING.xs,
  },
  vsContainer: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.sm,
  },
  vsText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  actionButtonText: {
    ...TYPOGRAPHY.labelMedium,
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.xs,
  },
  emptyTitle: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  emptyText: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
  },
});
