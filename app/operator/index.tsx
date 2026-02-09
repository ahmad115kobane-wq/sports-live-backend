import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import { operatorApi } from '@/services/api';
import { Match } from '@/types';
import { MATCH_STATUS } from '@/constants/config';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useRTL } from '@/contexts/RTLContext';
import EmptyState from '@/components/ui/EmptyState';

type FilterTab = 'live' | 'scheduled' | 'finished' | 'all';

export default function OperatorScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();
  const [matches, setMatches] = useState<Match[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
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
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const liveMatches = matches.filter((m) => m.status === 'live' || m.status === 'halftime' || m.status === 'extra_time' || m.status === 'extra_time_halftime' || m.status === 'penalties');
  const scheduledMatches = matches.filter((m) => m.status === 'scheduled');
  const finishedMatches = matches.filter((m) => m.status === 'finished');

  const filteredMatches = activeTab === 'all' ? [...liveMatches, ...scheduledMatches, ...finishedMatches]
    : activeTab === 'live' ? liveMatches
    : activeTab === 'scheduled' ? scheduledMatches
    : finishedMatches;

  const tabs: { key: FilterTab; label: string; count: number; color: string; icon: string }[] = [
    { key: 'all', label: t('operator.allMatches'), count: matches.length, color: colors.accent, icon: 'grid' },
    { key: 'live', label: t('match.live'), count: liveMatches.length, color: '#E63946', icon: 'radio' },
    { key: 'scheduled', label: t('operator.upcoming'), count: scheduledMatches.length, color: colors.info, icon: 'time' },
    { key: 'finished', label: t('operator.done'), count: finishedMatches.length, color: colors.success, icon: 'checkmark-circle' },
  ];

  const renderMatchCard = ({ item: match }: { item: Match }) => {
    const isLive = match.status === 'live' || match.status === 'halftime' || match.status === 'extra_time' || match.status === 'extra_time_halftime' || match.status === 'penalties';
    const isScheduled = match.status === 'scheduled';
    const statusInfo = MATCH_STATUS[match.status] || { label: match.status, color: '#9E9E9E' };

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.matchCard,
          { backgroundColor: colors.surface },
          isLive && { borderLeftWidth: 3, borderLeftColor: '#E63946' },
        ]}
        onPress={() => router.push(`/operator/match/${match.id}`)}
      >
        <View style={[styles.matchCardRow, { flexDirection }]}>
          {/* Home Team */}
          <View style={styles.matchTeam}>
            <Text style={[styles.matchTeamName, { color: colors.text }]} numberOfLines={1}>
              {match.homeTeam.shortName || match.homeTeam.name}
            </Text>
          </View>

          {/* Score / VS */}
          <View style={styles.matchCenter}>
            {isScheduled ? (
              <View style={[styles.matchTimeBadge, { backgroundColor: colors.info + '20' }]}>
                <Text style={[styles.matchTimeText, { color: colors.info }]}>
                  {format(new Date(match.startTime), 'HH:mm')}
                </Text>
              </View>
            ) : (
              <View style={styles.matchScoreBox}>
                <Text style={[styles.matchScore, { color: colors.text }]}>
                  {match.homeScore}
                </Text>
                <Text style={[styles.matchScoreSep, { color: colors.textTertiary }]}>:</Text>
                <Text style={[styles.matchScore, { color: colors.text }]}>
                  {match.awayScore}
                </Text>
              </View>
            )}
            <View style={[styles.matchStatusChip, { backgroundColor: statusInfo.color + '20' }]}>
              {isLive && <View style={[styles.pulseDot, { backgroundColor: statusInfo.color }]} />}
              <Text style={[styles.matchStatusText, { color: statusInfo.color }]}>
                {isLive && match.currentMinute ? `${match.currentMinute}'` : statusInfo.label}
              </Text>
            </View>
          </View>

          {/* Away Team */}
          <View style={[styles.matchTeam, { alignItems: 'flex-end' }]}>
            <Text style={[styles.matchTeamName, { color: colors.text, textAlign: 'right' }]} numberOfLines={1}>
              {match.awayTeam.shortName || match.awayTeam.name}
            </Text>
          </View>
        </View>

        {/* Quick Action */}
        <View style={[styles.matchAction, { backgroundColor: isLive ? '#E63946' + '15' : colors.backgroundSecondary }]}>
          <Ionicons
            name={isLive ? 'radio' : isScheduled ? 'play-circle' : 'eye'}
            size={14}
            color={isLive ? '#E63946' : isScheduled ? colors.success : colors.textSecondary}
          />
          <Text style={[styles.matchActionText, { color: isLive ? '#E63946' : isScheduled ? colors.success : colors.textSecondary }]}>
            {isLive ? t('operator.manage') : isScheduled ? t('operator.start') : t('operator.view')}
          </Text>
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={14} color={colors.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Compact Header */}
      <LinearGradient
        colors={colors.gradients.premium}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={[styles.headerRow, { flexDirection }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{t('operator.panel')}</Text>
            <Text style={styles.headerSubtitle}>{user?.name}</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.tabsRow, { flexDirection }]}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  isActive && { backgroundColor: tab.color + '18' },
                ]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={isActive ? tab.color : colors.textTertiary}
                />
                <Text style={[
                  styles.tabLabel,
                  { color: isActive ? tab.color : colors.textTertiary },
                  isActive && { fontWeight: '700' },
                ]}>
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: isActive ? tab.color : colors.border }]}>
                    <Text style={[styles.tabBadgeText, { color: isActive ? '#fff' : colors.textTertiary }]}>
                      {tab.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Match List */}
      <FlatList
        data={filteredMatches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatchCard}
        contentContainerStyle={[styles.listContent, filteredMatches.length === 0 && { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <EmptyState
              icon="clipboard-outline"
              title={t('common.noResults')}
              subtitle={t('home.noUpcomingMatches')}
              actionLabel={t('common.refresh')}
              actionIcon="refresh"
              onAction={onRefresh}
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 24) + SPACING.xs,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.headlineMedium,
    color: '#fff',
    fontWeight: '700',
  },
  headerSubtitle: {
    ...TYPOGRAPHY.labelMedium,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    ...SHADOWS.xs,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: 5,
  },
  tabLabel: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '600',
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  matchCard: {
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  matchCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  matchTeam: {
    flex: 1,
  },
  matchTeamName: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '700',
  },
  matchCenter: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    minWidth: 80,
  },
  matchScoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchScore: {
    fontSize: 22,
    fontWeight: '800',
  },
  matchScoreSep: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '400',
  },
  matchTimeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.sm,
  },
  matchTimeText: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '700',
  },
  matchStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
    marginTop: 3,
    gap: 3,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  matchStatusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  matchAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.15)',
  },
  matchActionText: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
});
