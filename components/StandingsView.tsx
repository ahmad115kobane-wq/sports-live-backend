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
  competitionFormat?: string;
}

const STAGE_LABELS: Record<string, string> = {
  QUARTER_FINAL: 'ربع النهائي',
  SEMI_FINAL: 'نصف النهائي',
  FINAL: 'النهائي',
};

const STAGE_ICONS: Record<string, string> = {
  QUARTER_FINAL: 'git-branch-outline',
  SEMI_FINAL: 'git-merge-outline',
  FINAL: 'trophy',
};

const STAGE_COLORS: Record<string, string> = {
  QUARTER_FINAL: '#6366F1',
  SEMI_FINAL: '#F59E0B',
  FINAL: '#10B981',
};

export default function StandingsView({ competitionId, competitionName, competitionFormat }: StandingsViewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();

  const [standings, setStandings] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [groupStandings, setGroupStandings] = useState<Record<string, any[]>>({});
  const [knockout, setKnockout] = useState<Record<string, any[]>>({});
  const [topScorers, setTopScorers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isGroups = competitionFormat === 'GROUPS';

  useEffect(() => {
    if (competitionId) {
      loadData();
    }
  }, [competitionId, competitionFormat]);

  const loadData = async () => {
    if (!competitionId) return;
    setLoading(true);
    setError(false);
    try {
      const scorersPromise = competitionApi.getTopScorers(competitionId, 5);

      if (isGroups) {
        const [groupsRes, knockoutRes, scorersRes] = await Promise.all([
          competitionApi.getGroups(competitionId),
          competitionApi.getKnockout(competitionId),
          scorersPromise,
        ]);
        const groupsData = groupsRes.data?.data || [];
        setGroups(groupsData);
        setKnockout(knockoutRes.data?.data || {});
        setTopScorers(scorersRes.data?.data || []);

        // Fetch standings per group
        const standingsMap: Record<string, any[]> = {};
        await Promise.all(
          groupsData.map(async (g: any) => {
            try {
              const res = await competitionApi.getStandings(competitionId, g.id);
              standingsMap[g.id] = res.data?.data || [];
            } catch {
              standingsMap[g.id] = [];
            }
          })
        );
        setGroupStandings(standingsMap);
      } else {
        const [standingsRes, scorersRes] = await Promise.all([
          competitionApi.getStandings(competitionId),
          scorersPromise,
        ]);
        setStandings(standingsRes.data?.data || []);
        setTopScorers(scorersRes.data?.data || []);
      }
    } catch (err) {
      console.error('Error loading standings:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

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

  if (error || (!isGroups && standings.length === 0 && topScorers.length === 0)) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor: colors.surface }]}>
        <Ionicons name="podium-outline" size={48} color={colors.textTertiary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {t('match.noStandings')}
        </Text>
      </View>
    );
  }

  // ── Render a standings table (reused for league & per-group) ──
  const renderStandingsTable = (data: any[], title?: string) => (
    <View style={{ marginBottom: SPACING.lg }}>
      {title && (
        <View style={[styles.groupHeader, { backgroundColor: colors.accent + '12' }]}>
          <View style={[styles.groupBadge, { backgroundColor: colors.accent + '20' }]}>
            <Ionicons name="people" size={14} color={colors.accent} />
          </View>
          <Text style={[styles.groupTitle, { color: colors.accent }]}>{title}</Text>
          <Text style={[styles.groupCount, { color: colors.textTertiary }]}>{data.length} فريق</Text>
        </View>
      )}
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
        {data.map((item: any, index: number) => {
          const isTop3 = index < 3;
          return (
            <View
              key={item.teamId || index}
              style={[
                styles.tableRow,
                {
                  borderBottomColor: colors.border,
                  borderBottomWidth: index < data.length - 1 ? StyleSheet.hairlineWidth : 0,
                },
                isTop3 && { backgroundColor: medalColors[index] + '08' },
              ]}
            >
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
              <View style={[styles.teamCell, { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }]}>
                <TeamLogo team={item.team} size="small" showName={false} />
                <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
                  {item.team?.shortName || item.team?.name}
                </Text>
              </View>
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

  // ── Render knockout match card ──
  const renderKnockoutMatch = (match: any) => (
    <View
      key={match.id}
      style={[styles.knockoutMatch, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      {/* Home Team */}
      <View style={[styles.knockoutTeamRow, { flexDirection }]}>
        <TeamLogo team={match.homeTeam || {}} size="small" />
        <Text style={[styles.knockoutTeamName, { color: colors.text }]} numberOfLines={1}>
          {match.homeTeam?.shortName || match.homeTeam?.name || '—'}
        </Text>
        <Text style={[styles.knockoutScore, {
          color: match.status === 'finished' && match.homeScore > match.awayScore ? colors.accent : colors.text,
          fontWeight: match.status === 'finished' && match.homeScore > match.awayScore ? '800' : '600',
        }]}>
          {match.status !== 'scheduled' ? match.homeScore : '-'}
        </Text>
      </View>

      {/* Divider */}
      <View style={[styles.knockoutDivider, { backgroundColor: colors.border }]} />

      {/* Away Team */}
      <View style={[styles.knockoutTeamRow, { flexDirection }]}>
        <TeamLogo team={match.awayTeam || {}} size="small" />
        <Text style={[styles.knockoutTeamName, { color: colors.text }]} numberOfLines={1}>
          {match.awayTeam?.shortName || match.awayTeam?.name || '—'}
        </Text>
        <Text style={[styles.knockoutScore, {
          color: match.status === 'finished' && match.awayScore > match.homeScore ? colors.accent : colors.text,
          fontWeight: match.status === 'finished' && match.awayScore > match.homeScore ? '800' : '600',
        }]}>
          {match.status !== 'scheduled' ? match.awayScore : '-'}
        </Text>
      </View>

      {/* Status badge */}
      {match.status === 'finished' && (
        <View style={[styles.knockoutStatusBadge, { backgroundColor: '#10B981' + '20' }]}>
          <Text style={[styles.knockoutStatusText, { color: '#10B981' }]}>انتهت</Text>
        </View>
      )}
      {(match.status === 'live' || match.status === 'halftime') && (
        <View style={[styles.knockoutStatusBadge, { backgroundColor: '#EF4444' + '20' }]}>
          <Text style={[styles.knockoutStatusText, { color: '#EF4444' }]}>مباشر</Text>
        </View>
      )}
      {match.status === 'scheduled' && (
        <View style={[styles.knockoutStatusBadge, { backgroundColor: colors.accent + '15' }]}>
          <Text style={[styles.knockoutStatusText, { color: colors.accent }]}>قادمة</Text>
        </View>
      )}
    </View>
  );

  // ── Render knockout bracket section ──
  const renderKnockoutBracket = () => {
    const stages = ['FINAL', 'SEMI_FINAL', 'QUARTER_FINAL'];
    const hasKnockout = stages.some(s => (knockout[s] || []).length > 0);
    if (!hasKnockout) return null;

    return (
      <View style={{ marginBottom: SPACING.lg }}>
        {/* Bracket Header */}
        <View style={[styles.compHeader, { backgroundColor: colors.surface }]}>
          <View style={[styles.compBadge, { backgroundColor: '#6366F1' + '20' }]}>
            <Ionicons name="git-network-outline" size={16} color="#6366F1" />
          </View>
          <Text style={[styles.compName, { color: colors.text }]}>الأدوار الإقصائية</Text>
        </View>

        {stages.map((stage) => {
          const matches = knockout[stage] || [];
          if (matches.length === 0) return null;
          const stageColor = STAGE_COLORS[stage] || colors.accent;

          return (
            <View key={stage} style={{ marginBottom: SPACING.md }}>
              {/* Stage label */}
              <View style={[styles.stageHeader, { borderLeftColor: stageColor, borderRightColor: stageColor }]}>
                <View style={[styles.stageIconWrap, { backgroundColor: stageColor + '18' }]}>
                  <Ionicons name={STAGE_ICONS[stage] as any} size={16} color={stageColor} />
                </View>
                <Text style={[styles.stageLabel, { color: stageColor }]}>
                  {STAGE_LABELS[stage] || stage}
                </Text>
                <View style={[styles.stageCountBadge, { backgroundColor: stageColor + '15' }]}>
                  <Text style={[styles.stageCountText, { color: stageColor }]}>
                    {matches.length} {matches.length === 1 ? 'مباراة' : 'مباريات'}
                  </Text>
                </View>
              </View>

              {/* Matches grid */}
              <View style={styles.knockoutGrid}>
                {matches.map((m: any) => renderKnockoutMatch(m))}
              </View>

              {/* Connector line between stages */}
              {stage !== 'QUARTER_FINAL' && (
                <View style={styles.bracketConnector}>
                  <View style={[styles.bracketLine, { backgroundColor: colors.border }]} />
                  <View style={[styles.bracketArrow, { backgroundColor: colors.border }]}>
                    <Ionicons name="chevron-down" size={12} color={colors.textTertiary} />
                  </View>
                  <View style={[styles.bracketLine, { backgroundColor: colors.border }]} />
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

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
          {isGroups && (
            <View style={[styles.formatBadge, { backgroundColor: '#6366F1' + '15' }]}>
              <Text style={[styles.formatBadgeText, { color: '#6366F1' }]}>مجموعات + إقصائي</Text>
            </View>
          )}
        </View>
      )}

      {/* ── GROUPS FORMAT ── */}
      {isGroups ? (
        <>
          {/* Knockout bracket */}
          {renderKnockoutBracket()}

          {/* Group standings */}
          {groups.map((group: any) => {
            const gStandings = groupStandings[group.id] || [];
            return (
              <View key={group.id}>
                {renderStandingsTable(gStandings, group.name)}
              </View>
            );
          })}
        </>
      ) : (
        /* ── LEAGUE FORMAT ── */
        renderStandingsTable(standings)
      )}

      {/* ── TOP SCORERS ── */}
      {topScorers.length > 0 && (
        <View style={styles.scorersSection}>
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
                  <View style={styles.scorerRank}>
                    {isTop3 ? (
                      <View style={[styles.scorerRankBadge, { backgroundColor: medalColors[idx] + '20' }]}>
                        <Text style={[styles.scorerRankText, { color: medalColors[idx] }]}>{scorer.rank}</Text>
                      </View>
                    ) : (
                      <Text style={[styles.scorerRankText, { color: colors.textTertiary }]}>{scorer.rank}</Text>
                    )}
                  </View>

                  <View style={styles.scorerImageWrap}>
                    {player?.imageUrl ? (
                      <Image source={{ uri: player.imageUrl }} style={styles.scorerImage} />
                    ) : (
                      <View style={[styles.scorerImageFallback, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                        <Ionicons name="person" size={18} color={colors.textTertiary} />
                      </View>
                    )}
                    {team?.logoUrl && (
                      <View style={[styles.scorerTeamBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Image source={{ uri: team.logoUrl }} style={{ width: 14, height: 14, borderRadius: 7 }} resizeMode="contain" />
                      </View>
                    )}
                  </View>

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

  // ── Group Header ──
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  groupBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    flex: 1,
  },
  groupCount: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },

  // ── Format Badge ──
  formatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  formatBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
  },

  // ── Knockout Bracket ──
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderLeftWidth: 3,
    borderRightWidth: 0,
    marginBottom: SPACING.sm,
  },
  stageIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageLabel: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    flex: 1,
  },
  stageCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  stageCountText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
  knockoutGrid: {
    gap: SPACING.sm,
  },
  knockoutMatch: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  knockoutTeamRow: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 4,
  },
  knockoutTeamName: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  knockoutScore: {
    fontSize: 16,
    fontFamily: FONTS.extraBold,
    minWidth: 24,
    textAlign: 'center',
  },
  knockoutDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  knockoutStatusBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  knockoutStatusText: {
    fontSize: 9,
    fontFamily: FONTS.bold,
  },
  bracketConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    gap: 4,
  },
  bracketLine: {
    height: 1,
    width: 30,
  },
  bracketArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
