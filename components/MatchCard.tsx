import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
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
}

function MatchCard({ 
  match, 
  onPress, 
  showLiveIndicator = true,
  variant = 'default' 
}: MatchCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
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

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View 
        style={[
          styles.container,
          { 
            backgroundColor: colors.card,
            borderColor: isLive ? colors.live : colors.cardBorder,
          },
          isLive && styles.liveContainer,
        ]}
      >
        {/* Live Gradient Border Effect */}
        {isLive && (
          <View style={styles.liveGlow}>
            <LinearGradient
              colors={colors.gradients.live}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        )}

        {/* Header Row */}
        <View style={[styles.header, { flexDirection }]}>
          <View style={[styles.competitionRow, { flexDirection, marginRight: isRTL ? 0 : SPACING.md, marginLeft: isRTL ? SPACING.md : 0 }]}>
            <View style={[styles.competitionDot, { backgroundColor: colors.accent, marginRight: isRTL ? 0 : SPACING.xs, marginLeft: isRTL ? SPACING.xs : 0 }]} />
            <Text style={[styles.competition, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {match.competition?.name || 'Football'}
            </Text>
          </View>
          
          {isLive && showLiveIndicator ? (
            <View style={[styles.liveBadge, { backgroundColor: colors.liveBackground }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.live }]} />
              <Text style={[styles.liveText, { color: colors.live }]}>
                {match.currentMinute ? `${match.currentMinute}'` : t('match.live')}
              </Text>
            </View>
          ) : isUpcoming ? (
            <View style={[styles.timeBadge, { backgroundColor: colors.surface }]}>
              <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                {format(matchDate, 'HH:mm')}
              </Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.statusText, { color: colors.textTertiary }]}>{t('match.finished')}</Text>
            </View>
          )}
        </View>

        {/* Main Content - Teams & Score */}
        <View style={styles.matchContent}>
          {/* Home Team */}
          <View style={styles.teamSection}>
            <TeamLogo 
              team={{ 
                name: match.homeTeam.name, 
                shortName: match.homeTeam.shortName,
                logoUrl: match.homeTeam.logoUrl 
              }} 
              size="small" 
            />
            <Text 
              style={[
                styles.teamName, 
                { color: colors.text },
                match.homeScore > match.awayScore && isFinished && styles.winnerName
              ]} 
              numberOfLines={1}
            >
              {match.homeTeam.name}
            </Text>
          </View>

          {/* Score Center */}
          <View style={styles.scoreSection}>
            {isUpcoming ? (
              <View style={styles.vsContainer}>
                <Text style={[styles.vsText, { color: colors.textTertiary }]}>VS</Text>
                <Text style={[styles.matchDateText, { color: colors.textSecondary }]}>
                  {getDateLabel(matchDate)}
                </Text>
              </View>
            ) : (
              <View style={styles.scoreRow}>
                <Text style={[
                  styles.score,
                  { color: colors.text },
                  match.homeScore > match.awayScore && { color: colors.success }
                ]}>
                  {match.homeScore}
                </Text>
                <View style={[styles.scoreDivider, { backgroundColor: colors.border }]}>
                  <Text style={[styles.scoreDash, { color: colors.textTertiary }]}>-</Text>
                </View>
                <Text style={[
                  styles.score,
                  { color: colors.text },
                  match.awayScore > match.homeScore && { color: colors.success }
                ]}>
                  {match.awayScore}
                </Text>
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
              size="small" 
            />
            <Text 
              style={[
                styles.teamName, 
                { color: colors.text },
                match.awayScore > match.homeScore && isFinished && styles.winnerName
              ]} 
              numberOfLines={1}
            >
              {match.awayTeam.name}
            </Text>
          </View>
        </View>

        {/* Live Match Events Preview */}
        {isLive && match.events && match.events.length > 0 && (
          <View style={[styles.eventsPreview, { borderTopColor: colors.divider }]}>
            <View style={styles.eventItem}>
              <View style={[styles.eventIcon, { backgroundColor: colors.goalBackground }]}>
                <Ionicons name="football" size={12} color={colors.goal} />
              </View>
              <Text style={[styles.eventCount, { color: colors.text }]}>
                {match.events.filter(e => e.type === 'goal').length}
              </Text>
            </View>
            <View style={styles.eventItem}>
              <View style={[styles.eventIcon, { backgroundColor: colors.yellowCardBackground }]}>
                <View style={[styles.cardIcon, { backgroundColor: colors.yellowCard }]} />
              </View>
              <Text style={[styles.eventCount, { color: colors.text }]}>
                {match.events.filter(e => e.type === 'yellow_card').length}
              </Text>
            </View>
            {match.events.some(e => e.type === 'red_card') && (
              <View style={styles.eventItem}>
                <View style={[styles.eventIcon, { backgroundColor: colors.redCardBackground }]}>
                  <View style={[styles.cardIcon, { backgroundColor: colors.redCard }]} />
                </View>
                <Text style={[styles.eventCount, { color: colors.text }]}>
                  {match.events.filter(e => e.type === 'red_card').length}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.xs,
  },
  liveContainer: {
    borderWidth: 1.5,
  },
  liveGlow: {
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
    marginBottom: SPACING.sm,
  },
  competitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
  },
  competitionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: SPACING.xs,
  },
  competition: {
    ...TYPOGRAPHY.labelSmall,
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    gap: 4,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  liveText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    gap: 3,
  },
  timeText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  statusText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
  },
  teamLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  teamInitials: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '700',
  },
  teamName: {
    ...TYPOGRAPHY.labelSmall,
    textAlign: 'center',
    maxWidth: 70,
  },
  winnerName: {
    fontWeight: '700',
  },
  scoreSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    minWidth: 70,
  },
  vsContainer: {
    alignItems: 'center',
  },
  vsText: {
    ...TYPOGRAPHY.titleLarge,
    fontWeight: '700',
  },
  matchDateText: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  score: {
    fontSize: 20,
    fontWeight: '700',
    minWidth: 22,
    textAlign: 'center',
  },
  scoreDivider: {
    width: 18,
    height: 2,
    borderRadius: 1,
    marginHorizontal: SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreDash: {
    fontSize: 14,
    fontWeight: '300',
  },
  eventsPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    gap: SPACING.md,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
  },
  eventIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    width: 8,
    height: 11,
    borderRadius: 1,
  },
  eventCount: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '600',
  },
});
export default memo(MatchCard);