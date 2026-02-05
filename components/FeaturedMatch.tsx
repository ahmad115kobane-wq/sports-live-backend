import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Match } from '@/types';
import { MATCH_STATUS } from '@/constants/config';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import TeamLogo from './ui/TeamLogo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FeaturedMatchProps {
  match: Match;
}

function FeaturedMatch({ match }: FeaturedMatchProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();
  const statusInfo = MATCH_STATUS[match.status];
  const isLive = match.status === 'live' || match.status === 'halftime';
  const isUpcoming = match.status === 'scheduled';

  const getGradientColors = (): readonly [string, string, ...string[]] => {
    if (isLive) {
      return ['#0F172A', '#1E293B', '#334155'] as const;
    }
    return isDark 
      ? ['#1E293B', '#334155', '#475569'] as const
      : ['#1E293B', '#334155', '#475569'] as const;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push(`/match/${match.id}`)}
      activeOpacity={0.92}
    >
      <View>
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Live Glow Effect */}
          {isLive && (
            <View style={[styles.liveGlow, { opacity: 0.6 }]}>
              <LinearGradient
                colors={[colors.live, 'transparent']}
                style={StyleSheet.absoluteFill}
              />
            </View>
          )}

          {/* Header Row */}
          <View style={[styles.header, { flexDirection }]}>
            <View style={[styles.competitionBadge, { flexDirection }]}>
              <View style={styles.competitionIcon}>
                <Ionicons name="trophy" size={12} color="#FFD700" />
              </View>
              <Text style={styles.competition} numberOfLines={1}>
                {match.competition?.name || t('home.featuredMatches')}
              </Text>
            </View>
            
            {isLive ? (
              <View style={styles.liveBadgeContainer}>
                <View style={[styles.liveBadge, { backgroundColor: colors.live }]}>
                  <View style={styles.liveDotInner} />
                  <Text style={styles.liveText}>LIVE</Text>
                  {match.currentMinute && (
                    <>
                      <View style={styles.liveDivider} />
                      <Text style={styles.liveMinute}>{match.currentMinute}'</Text>
                    </>
                  )}
                </View>
              </View>
            ) : isUpcoming ? (
              <View style={styles.timeBadge}>
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.timeText}>
                  {format(new Date(match.startTime), 'HH:mm', { locale: isRTL ? ar : enUS })}
                </Text>
              </View>
            ) : (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{statusInfo.label}</Text>
              </View>
            )}
          </View>

          {/* Teams Row - Main Content */}
          <View style={styles.teamsContainer}>
            {/* Home Team */}
            <View style={styles.teamInfo}>
              <View style={styles.teamLogoWrapper}>
                <TeamLogo 
                  team={{ 
                    name: match.homeTeam.name, 
                    shortName: match.homeTeam.shortName,
                    logoUrl: match.homeTeam.logoUrl 
                  }} 
                  size="large" 
                />
                {match.homeScore > match.awayScore && !isUpcoming && (
                  <View style={[styles.winIndicator, { backgroundColor: colors.success }]} />
                )}
              </View>
              <Text style={styles.teamName} numberOfLines={1}>
                {match.homeTeam.name}
              </Text>
            </View>

            {/* Scores / VS */}
            <View style={styles.scoreContainer}>
              {isUpcoming ? (
                <View style={styles.vsContainer}>
                  <Text style={styles.vsText}>VS</Text>
                </View>
              ) : (
                <View style={styles.scoreWrapper}>
                  <View style={styles.scoreBox}>
                    <Text style={[
                      styles.score, 
                      match.homeScore > match.awayScore && styles.winningScore
                    ]}>
                      {match.homeScore}
                    </Text>
                  </View>
                  <View style={styles.scoreDividerContainer}>
                    <View style={styles.scoreDividerLine} />
                    <Text style={styles.scoreDividerText}>:</Text>
                    <View style={styles.scoreDividerLine} />
                  </View>
                  <View style={styles.scoreBox}>
                    <Text style={[
                      styles.score, 
                      match.awayScore > match.homeScore && styles.winningScore
                    ]}>
                      {match.awayScore}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Away Team */}
            <View style={styles.teamInfo}>
              <View style={styles.teamLogoWrapper}>
                <TeamLogo 
                  team={{ 
                    name: match.awayTeam.name, 
                    shortName: match.awayTeam.shortName,
                    logoUrl: match.awayTeam.logoUrl 
                  }} 
                  size="large" 
                />
                {match.awayScore > match.homeScore && !isUpcoming && (
                  <View style={[styles.winIndicator, { backgroundColor: colors.success }]} />
                )}
              </View>
              <Text style={styles.teamName} numberOfLines={1}>
                {match.awayTeam.name}
              </Text>
            </View>
          </View>

          {/* Footer Stats (for live matches) */}
          {isLive && match.events && match.events.length > 0 && (
            <View style={styles.footer}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                    <Ionicons name="football" size={14} color={colors.success} />
                  </View>
                  <Text style={styles.statValue}>
                    {match.events.filter(e => e.type === 'goal').length} {t('match.goals')}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: 'rgba(251, 191, 36, 0.2)' }]}>
                    <View style={styles.cardMini} />
                  </View>
                  <Text style={styles.statValue}>
                    {match.events.filter(e => e.type === 'yellow_card').length} {t('match.cards')}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Bottom CTA */}
          <View style={styles.ctaRow}>
            <Text style={styles.ctaText}>{t('common.seeAll')}</Text>
            <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color="rgba(255,255,255,0.6)" />
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  gradient: {
    padding: SPACING.md,
    minHeight: 160,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
  },
  liveGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  competitionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  competitionIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  competition: {
    color: 'rgba(255,255,255,0.9)',
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
    maxWidth: 120,
  },
  liveBadgeContainer: {
    position: 'relative',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  livePulseRing: {
    position: 'absolute',
    left: SPACING.sm - 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    opacity: 0.5,
  },
  liveDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700',
    marginLeft: 2,
  },
  liveDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  liveMinute: {
    color: '#fff',
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  timeText: {
    color: 'rgba(255,255,255,0.9)',
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  statusText: {
    color: 'rgba(255,255,255,0.7)',
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamInfo: {
    flex: 1,
    alignItems: 'center',
  },
  teamLogoWrapper: {
    position: 'relative',
    marginBottom: SPACING.xs,
  },
  teamLogo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  teamLogoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  winIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  teamName: {
    color: '#fff',
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 80,
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  vsContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  vsText: {
    color: 'rgba(255,255,255,0.5)',
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '700',
  },
  scoreWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBox: {
    width: 30,
    alignItems: 'center',
  },
  score: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  scoreDividerContainer: {
    alignItems: 'center',
    marginHorizontal: SPACING.xxs,
  },
  scoreDividerLine: {
    width: 6,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 1,
  },
  scoreDividerText: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '300',
    marginVertical: -4,
  },
  winningScore: {
    color: '#34D399',
  },
  footer: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardMini: {
    width: 8,
    height: 12,
    backgroundColor: '#FBBF24',
    borderRadius: 1,
  },
  statValue: {
    color: 'rgba(255,255,255,0.8)',
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: SPACING.md,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    gap: 3,
  },
  ctaText: {
    color: 'rgba(255,255,255,0.6)',
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '500',
  },
});

export default memo(FeaturedMatch);