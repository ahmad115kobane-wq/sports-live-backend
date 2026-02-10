import React, { memo } from 'react';
import { MatchTime } from '@/hooks/useLiveMinute';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
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
  liveMinute?: number | null;
  liveTime?: MatchTime | null;
}

function FeaturedMatch({ match, liveMinute, liveTime }: FeaturedMatchProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
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
                <Ionicons name="trophy" size={10} color="#FFD700" />
              </View>
              <Text style={styles.competition} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                {match.competition?.name || t('home.featuredMatches')}
              </Text>
            </View>
            
            {isLive ? (
              <View style={styles.liveBadgeContainer}>
                <View style={[styles.liveBadge, { backgroundColor: colors.live }]}>
                  <View style={styles.liveDotInner} />
                  <Text style={styles.liveText}>LIVE</Text>
                  {(liveTime || liveMinute || match.currentMinute) ? (
                    <>
                      <View style={styles.liveDivider} />
                      <Text style={styles.liveMinute}>{liveTime ? liveTime.display : `${liveMinute ?? match.currentMinute}'`}</Text>
                    </>
                  ) : null}
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
          <View style={[styles.teamsContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
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
              <Text style={styles.teamName} numberOfLines={2}>
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
                    <Text style={styles.scoreDividerText}>-</Text>
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
              <Text style={styles.teamName} numberOfLines={2}>
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
                    <Ionicons name="football" size={12} color={colors.success} />
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
            <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={14} color="rgba(255,255,255,0.6)" />
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
    transform: [{ scale: 1 }], // Force layer render
  },
  gradient: {
    padding: SPACING.lg,
    minHeight: 170,
  },
  liveGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  competitionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  competitionIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  competition: {
    color: 'rgba(255,255,255,0.95)',
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '700',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  liveBadgeContainer: {
    position: 'relative',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    gap: 6,
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
    fontWeight: '800',
    letterSpacing: 1,
  },
  liveDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  liveMinute: {
    color: '#fff',
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  timeText: {
    color: 'rgba(255,255,255,0.9)',
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  statusText: {
    color: 'rgba(255,255,255,0.8)',
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
  },
  teamInfo: {
    flex: 1,
    alignItems: 'center',
  },
  teamLogoWrapper: {
    position: 'relative',
    marginBottom: SPACING.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  winIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  teamName: {
    color: '#fff',
    ...TYPOGRAPHY.labelLarge,
    fontWeight: '700',
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  vsContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  vsText: {
    color: 'rgba(255,255,255,0.6)',
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '800',
  },
  scoreWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  scoreBox: {
    minWidth: 32,
    alignItems: 'center',
  },
  score: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fff',
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scoreDividerContainer: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  scoreDividerText: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '300',
    marginTop: -4,
  },
  winningScore: {
    color: '#34D399',
    textShadowColor: 'rgba(52, 211, 153, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  footer: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardMini: {
    width: 8,
    height: 11,
    backgroundColor: '#FBBF24',
    borderRadius: 2,
  },
  statValue: {
    color: 'rgba(255,255,255,0.9)',
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: SPACING.lg,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    gap: 4,
    opacity: 0.8,
  },
  ctaText: {
    color: '#fff',
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default memo(FeaturedMatch);