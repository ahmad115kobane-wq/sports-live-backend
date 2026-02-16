import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, FONTS, TYPOGRAPHY } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { competitionApi } from '@/services/api';
import TeamLogo from '@/components/ui/TeamLogo';

interface StandingsViewProps {
  competitionId?: string;
  competitionName?: string;
}

export default function StandingsView({ competitionId, competitionName }: StandingsViewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();

  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (competitionId) {
      loadStandings();
    }
  }, [competitionId]);

  const loadStandings = async () => {
    if (!competitionId) return;
    setLoading(true);
    setError(false);
    try {
      const response = await competitionApi.getStandings(competitionId);
      setStandings(response.data?.data || []);
    } catch (err) {
      console.error('Error loading standings:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  if (error || standings.length === 0) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor: colors.surface }]}>
        <Ionicons name="podium-outline" size={48} color={colors.textTertiary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {t('match.noStandings')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Competition Name Header */}
      {competitionName && (
        <View style={[styles.compHeader, { backgroundColor: colors.surface }]}>
          <View style={[styles.compBadge, { backgroundColor: colors.accent + '15' }]}>
            <Ionicons name="trophy" size={16} color={colors.accent} />
          </View>
          <Text style={[styles.compName, { color: colors.text }]} numberOfLines={1}>
            {competitionName}
          </Text>
        </View>
      )}

      {/* Table */}
      <View style={[styles.tableContainer, { backgroundColor: colors.surface }]}>
        {/* Table Header */}
        <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: colors.accent + '10' }]}>
          <Text style={[styles.rankCell, styles.headerText, { color: colors.textSecondary }]}>#</Text>
          <Text style={[styles.teamCell, styles.headerText, { color: colors.textSecondary }]}>
            {t('standings.team')}
          </Text>
          <Text style={[styles.statCell, styles.headerText, { color: colors.textSecondary }]}>
            {t('standings.played')}
          </Text>
          <Text style={[styles.statCell, styles.headerText, { color: '#10B981' }]}>
            {t('standings.won')}
          </Text>
          <Text style={[styles.statCell, styles.headerText, { color: colors.textSecondary }]}>
            {t('standings.drawn')}
          </Text>
          <Text style={[styles.statCell, styles.headerText, { color: '#DC2626' }]}>
            {t('standings.lost')}
          </Text>
          <Text style={[styles.statCell, styles.headerText, { color: colors.textSecondary }]}>+/-</Text>
          <Text style={[styles.ptsCell, styles.headerText, { color: colors.accent }]}>
            {t('standings.points')}
          </Text>
        </View>

        {/* Table Body */}
        {standings.map((item: any, index: number) => {
          const isTop3 = index < 3;
          const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
          return (
            <View
              key={item.teamId || index}
              style={[
                styles.tableRow,
                {
                  borderBottomColor: colors.border,
                  borderBottomWidth: index < standings.length - 1 ? StyleSheet.hairlineWidth : 0,
                },
                isTop3 && { backgroundColor: medalColors[index] + '08' },
              ]}
            >
              {/* Rank */}
              <View style={styles.rankCell}>
                {isTop3 ? (
                  <View style={[styles.rankBadge, { backgroundColor: medalColors[index] + '25' }]}>
                    <Text style={[styles.rankText, { color: medalColors[index], fontWeight: '800' }]}>
                      {item.rank}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.rankText, { color: colors.text }]}>{item.rank}</Text>
                )}
              </View>

              {/* Team */}
              <View style={[styles.teamCell, { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }]}>
                <TeamLogo team={item.team} size="small" showName={false} />
                <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
                  {item.team?.shortName || item.team?.name}
                </Text>
              </View>

              {/* Stats */}
              <Text style={[styles.statCell, styles.statText, { color: colors.text }]}>{item.played}</Text>
              <Text style={[styles.statCell, styles.statText, { color: '#10B981' }]}>{item.won}</Text>
              <Text style={[styles.statCell, styles.statText, { color: colors.textSecondary }]}>{item.drawn}</Text>
              <Text style={[styles.statCell, styles.statText, { color: '#DC2626' }]}>{item.lost}</Text>
              <Text style={[styles.statCell, styles.statText, {
                color: item.goalDifference > 0 ? '#10B981' : item.goalDifference < 0 ? '#DC2626' : colors.textSecondary,
              }]}>
                {item.goalDifference > 0 ? '+' : ''}{item.goalDifference}
              </Text>
              <Text style={[styles.ptsCell, styles.ptsText, { color: colors.accent }]}>
                {item.points}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    marginTop: SPACING.xs,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  compHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  compBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compName: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    flex: 1,
  },
  tableContainer: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    minHeight: 44,
  },
  tableHeader: {
    borderRadius: 0,
    minHeight: 36,
  },
  headerText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  rankCell: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  teamCell: {
    flex: 1,
    paddingHorizontal: SPACING.xs,
  },
  teamName: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    flex: 1,
  },
  statCell: {
    width: 28,
    textAlign: 'center',
  },
  statText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  ptsCell: {
    width: 34,
    textAlign: 'center',
  },
  ptsText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONTS.extraBold,
    textAlign: 'center',
  },
});
