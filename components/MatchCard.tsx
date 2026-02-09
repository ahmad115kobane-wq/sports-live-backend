import React, { memo, useState, useEffect } from 'react';
import { MatchTime } from '@/hooks/useLiveMinute';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Match } from '@/types';
import { MATCH_STATUS } from '@/constants/config';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/Theme';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import TeamLogo from './ui/TeamLogo';
import LiveBadge from './ui/LiveBadge';
import StatusBadge from './ui/StatusBadge';
import { useRTL } from '@/contexts/RTLContext';

interface MatchCardProps {
  match: Match;
  onPress: () => void;
  showLiveIndicator?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  liveMinute?: number | null;
  liveTime?: MatchTime | null;
}

function MatchCard({ 
  match, 
  onPress, 
  showLiveIndicator = true,
  variant = 'default',
  liveMinute,
  liveTime,
}: MatchCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();
  const statusInfo = MATCH_STATUS[match.status];
  const isLive = match.status === 'live' || match.status === 'halftime';
  const isFinished = match.status === 'finished';
  const isUpcoming = match.status === 'scheduled';

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return t('home.today');
    if (isTomorrow(date)) return t('home.tomorrow');
    if (isYesterday(date)) return t('home.yesterday');
    return format(date, 'EEE, MMM d', { locale: isRTL ? ar : enUS });
  };

  const matchDate = new Date(match.startTime);

  // Countdown for matches within 24 hours
  const [countdown, setCountdown] = useState('');
  useEffect(() => {
    if (!isUpcoming) return;
    const updateCountdown = () => {
      const diff = matchDate.getTime() - Date.now();
      if (diff <= 0 || diff > 24 * 60 * 60 * 1000) {
        setCountdown('');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isUpcoming, matchDate.getTime()]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View 
        style={[
          styles.container,
          { 
            backgroundColor: colors.card,
            borderColor: isLive ? 'rgba(239, 68, 68, 0.35)' : colors.cardBorder,
          },
          isLive && styles.liveContainer,
        ]}
      >
        {/* Live Top Accent */}
        {isLive && (
          <LinearGradient
            colors={['rgba(239, 68, 68, 0.8)', 'rgba(239, 68, 68, 0.2)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.liveAccent}
          />
        )}

        {/* Header: Competition + Status */}
        <View style={[styles.header, { flexDirection }]}>
          <View style={[styles.competitionRow, { flexDirection }]}>
            <View style={[styles.competitionDot, { backgroundColor: isLive ? colors.live : colors.accent }]} />
            <Text style={[styles.competition, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {match.competition?.name || t('match.match')}
            </Text>
          </View>
          
          {isLive && showLiveIndicator ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>
                {liveTime ? liveTime.display : (liveMinute ?? match.currentMinute) ? `${liveMinute ?? match.currentMinute}'` : 'LIVE'}
              </Text>
            </View>
          ) : isUpcoming ? (
            countdown ? (
              <View style={styles.countdownBadge}>
                <Ionicons name="time-outline" size={11} color="#3B82F6" />
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            ) : (
              <View style={[styles.timeBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                  {format(matchDate, 'HH:mm')}
                </Text>
              </View>
            )
          ) : (
            <View style={[styles.finishedBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
              <Text style={[styles.finishedText, { color: colors.textTertiary }]}>{t('match.finished')}</Text>
            </View>
          )}
        </View>

        {/* Teams & Score */}
        <View style={[styles.matchContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {/* Home Team */}
          <View style={styles.teamSection}>
            <TeamLogo 
              team={{ 
                name: match.homeTeam.name, 
                shortName: match.homeTeam.shortName,
                logoUrl: match.homeTeam.logoUrl 
              }} 
              size="medium" 
            />
            <Text 
              style={[
                styles.teamName, 
                { color: colors.text },
                match.homeScore > match.awayScore && isFinished && styles.winnerName
              ]} 
              numberOfLines={2}
            >
              {match.homeTeam.name}
            </Text>
          </View>

          {/* Score / VS */}
          <View style={styles.scoreSection}>
            {isUpcoming ? (
              <View style={styles.vsContainer}>
                <View style={[styles.vsBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                  <Text style={[styles.vsText, { color: colors.textTertiary }]}>VS</Text>
                </View>
                <Text style={[styles.matchDateText, { color: colors.textTertiary }]}>
                  {getDateLabel(matchDate)}
                </Text>
              </View>
            ) : (
              <View style={styles.scoreContainer}>
                <View style={[styles.scoreBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  <Text style={[
                    styles.score,
                    { color: colors.text },
                    match.homeScore > match.awayScore && isFinished && { color: colors.success },
                    isLive && { color: colors.live }
                  ]}>
                    {match.homeScore}
                  </Text>
                  <View style={[styles.scoreSeparator, { backgroundColor: colors.textTertiary }]} />
                  <Text style={[
                    styles.score,
                    { color: colors.text },
                    match.awayScore > match.homeScore && isFinished && { color: colors.success },
                    isLive && { color: colors.live }
                  ]}>
                    {match.awayScore}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Away Team */}
          <View style={styles.teamSection}>
            <TeamLogo 
              team={{ 
                name: match.awayTeam.name, 
                shortName: match.awayTeam.shortName,
                logoUrl: match.awayTeam.logoUrl 
              }} 
              size="medium" 
            />
            <Text 
              style={[
                styles.teamName, 
                { color: colors.text },
                match.awayScore > match.homeScore && isFinished && styles.winnerName
              ]} 
              numberOfLines={2}
            >
              {match.awayTeam.name}
            </Text>
          </View>
        </View>

        {/* Live Events Footer */}
        {isLive && match.events && match.events.length > 0 && (
          <View style={[styles.eventsPreview, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
             <View style={styles.eventItem}>
                <Ionicons name="football" size={13} color={colors.textTertiary} />
                <Text style={[styles.eventText, { color: colors.textTertiary }]}>
                  {match.events.filter(e => e.type === 'goal').length} {t('match.goals')}
                </Text>
             </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  liveContainer: {
    borderWidth: 1.5,
  },
  liveAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  competitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  competitionDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  competition: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    letterSpacing: 0.2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.3,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    gap: 4,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3B82F6',
    fontVariant: ['tabular-nums'],
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  finishedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  finishedText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  teamName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  winnerName: {
    fontWeight: '800',
  },
  scoreSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    minWidth: 80,
  },
  vsContainer: {
    alignItems: 'center',
    gap: 3,
  },
  vsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
  },
  vsText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  matchDateText: {
    fontSize: 10,
    fontWeight: '500',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.lg,
    gap: 8,
  },
  score: {
    fontSize: 24,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  scoreSeparator: {
    width: 3,
    height: 3,
    borderRadius: 2,
    opacity: 0.4,
  },
  eventsPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  eventText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
export default memo(MatchCard);