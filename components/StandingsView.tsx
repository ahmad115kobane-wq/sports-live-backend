import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  Image,
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
  const [topScorers, setTopScorers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (competitionId) {
      loadData();
    }
  }, [competitionId]);

  const loadData = async () => {
    if (!competitionId) return;
    setLoading(true);
    setError(false);
    try {
      const [standingsRes, scorersRes] = await Promise.all([
        competitionApi.getStandings(competitionId),
        competitionApi.getTopScorers(competitionId, 5),
      ]);
      setStandings(standingsRes.data?.data || []);
      setTopScorers(scorersRes.data?.data || []);
    } catch (err) {
      console.error('Error loading standings:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const rankEmojis = ['🥇', '🥈', '🥉'];

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

      {/* ── TOP SCORERS ── */}
      {topScorers.length > 0 && (
        <View style={styles.scorersSection}>
          {/* Section Header */}
          <View style={[styles.scorersHeader, { backgroundColor: colors.surface }]}>
            <View style={[styles.compBadge, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="football" size={16} color="#F59E0B" />
            </View>
            <Text style={[styles.compName, { color: colors.text }]}>هدافو البطولة</Text>
          </View>

          <View style={[styles.scorersCard, { backgroundColor: colors.surface }]}>
            {topScorers.map((scorer: any, idx: number) => {
              const isTop3 = idx < 3;
              const player = scorer.player;
              const team = player?.team;

              return (
                <View
                  key={player?.id || idx}
                  style={[
                    styles.scorerRow,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: idx < topScorers.length - 1 ? StyleSheet.hairlineWidth : 0,
                    },
                    isTop3 && { backgroundColor: medalColors[idx] + '06' },
                  ]}
                >
                  {/* Rank */}
                  <View style={styles.scorerRank}>
                    {isTop3 ? (
                      <View style={[styles.scorerRankBadge, { backgroundColor: medalColors[idx] + '20' }]}>
                        <Text style={[styles.scorerRankText, { color: medalColors[idx] }]}>{scorer.rank}</Text>
                      </View>
                    ) : (
                      <Text style={[styles.scorerRankText, { color: colors.textTertiary }]}>{scorer.rank}</Text>
                    )}
                  </View>

                  {/* Player Image */}
                  <View style={styles.scorerImageWrap}>
                    {player?.imageUrl ? (
                      <Image source={{ uri: player.imageUrl }} style={styles.scorerImage} />
                    ) : (
                      <View style={[styles.scorerImageFallback, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                        <Ionicons name="person" size={18} color={colors.textTertiary} />
                      </View>
                    )}
                    {/* Team logo mini overlay */}
                    {team?.logoUrl && (
                      <View style={[styles.scorerTeamBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Image source={{ uri: team.logoUrl }} style={{ width: 14, height: 14, borderRadius: 7 }} resizeMode="contain" />
                      </View>
                    )}
                  </View>

                  {/* Player Info */}
                  <View style={styles.scorerInfo}>
                    <Text style={[styles.scorerName, { color: colors.text }]} numberOfLines={1}>
                      {player?.name || '—'}
                    </Text>
                    <View style={[styles.scorerMeta, { flexDirection }]}>
                      {team && (
                        <Text style={[styles.scorerTeamName, { color: colors.textSecondary }]} numberOfLines={1}>
                          {team.shortName || team.name}
                        </Text>
                      )}
                      {player?.shirtNumber && (
                        <Text style={[styles.scorerShirt, { color: colors.textTertiary }]}>#{player.shirtNumber}</Text>
                      )}
                    </View>
                  </View>

                  {/* Goals */}
                  <View style={[styles.scorerGoals, { backgroundColor: isTop3 ? medalColors[idx] + '15' : colors.accent + '12' }]}>
                    <Ionicons name="football" size={12} color={isTop3 ? medalColors[idx] : colors.accent} />
                    <Text style={[styles.scorerGoalsText, { color: isTop3 ? medalColors[idx] : colors.accent }]}>
                      {scorer.goals}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
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

  // ── Top Scorers ──
  scorersSection: {
    marginTop: SPACING.lg,
  },
  scorersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  scorersCard: {
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
  scorerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  scorerRank: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorerRankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scorerRankText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONTS.extraBold,
  },
  scorerImageWrap: {
    width: 42,
    height: 42,
    position: 'relative',
  },
  scorerImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  scorerImageFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scorerTeamBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  scorerInfo: {
    flex: 1,
    gap: 2,
  },
  scorerName: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  scorerMeta: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  scorerTeamName: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  scorerShirt: {
    fontSize: 10,
    fontFamily: FONTS.medium,
  },
  scorerGoals: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scorerGoalsText: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: FONTS.extraBold,
  },
});
