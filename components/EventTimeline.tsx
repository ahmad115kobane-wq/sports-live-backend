import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/Theme';
import { MatchEvent, Match } from '@/types';
import { useRTL } from '@/contexts/RTLContext';
import EventIcon from '@/components/ui/EventIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EventTimelineProps {
  events: MatchEvent[];
  match: Match;
}

// Get event color
function getEventColor(type: string): string {
  switch (type) {
    case 'goal': return '#22C55E';
    case 'yellow_card': return '#EAB308';
    case 'red_card': return '#EF4444';
    case 'substitution': return '#3B82F6';
    case 'penalty': return '#EC4899';
    case 'var_review': return '#A855F7';
    case 'corner': return '#06B6D4';
    case 'offside': return '#64748B';
    case 'injury': return '#F97316';
    case 'start_half': return '#22C55E';
    case 'end_half': return '#F59E0B';
    case 'end_match': return '#6B7280';
    default: return '#64748B';
  }
}

// Check if event is a "section" event (half start/end, match end)
function isSectionEvent(type: string) {
  return ['start_half', 'end_half', 'end_match'].includes(type);
}

function TimelineSectionBadge({ event, match, colors }: { event: MatchEvent; match: Match; colors: any }) {
  const getLabel = () => {
    switch (event.type) {
      case 'end_match':
        return `نهاية الـ 90 دقيقة ${match.homeScore}–${match.awayScore}`;
      case 'end_half':
        return 'نهاية الشوط الأول';
      case 'start_half':
        return event.minute <= 1 ? 'بداية المباراة' : 'بداية الشوط الثاني';
      default:
        return event.description || '';
    }
  };

  return (
    <View style={[sectionStyles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[sectionStyles.text, { color: colors.textSecondary }]}>
        {getLabel()}
      </Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginVertical: SPACING.md,
  },
  text: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
  },
});

function TimelineEventRow({ event, match, colors, isRTL }: { event: MatchEvent; match: Match; colors: any; isRTL: boolean }) {
  const isHomeTeam = event.teamId === match.homeTeamId;
  const eventColor = getEventColor(event.type);

  const minuteText = event.extraTime
    ? `${event.minute}'+${event.extraTime}`
    : `${event.minute}'`;

  // Build player info
  const getPlayerInfo = () => {
    switch (event.type) {
      case 'substitution':
        return {
          primary: event.secondaryPlayer?.name || '',
          secondary: event.player?.name || '',
          isSub: true,
        };
      case 'goal':
      case 'penalty':
        return {
          primary: event.player?.name || '',
          secondary: event.description || '',
          isSub: false,
        };
      default:
        return {
          primary: event.player?.name || event.description || '',
          secondary: '',
          isSub: false,
        };
    }
  };

  const playerInfo = getPlayerInfo();

  // In LTR: home=right, away=left. In RTL: home=left, away=right
  const showOnRight = isRTL ? !isHomeTeam : isHomeTeam;

  const renderPlayerContent = () => (
    <View style={[styles.playerContent, showOnRight ? styles.playerContentRight : styles.playerContentLeft]}>
      {playerInfo.isSub ? (
        <>
          <View style={[styles.subRow, { flexDirection: showOnRight ? 'row-reverse' : 'row' }]}>  
            <Ionicons name="arrow-up" size={12} color="#22C55E" style={{ marginHorizontal: 3 }} />
            <Text style={[styles.playerName, { color: colors.text, textAlign: showOnRight ? 'right' : 'left' }]} numberOfLines={2}>
              {playerInfo.primary}
            </Text>
          </View>
          <View style={[styles.subRow, { flexDirection: showOnRight ? 'row-reverse' : 'row' }]}>
            <Ionicons name="arrow-down" size={12} color="#EF4444" style={{ marginHorizontal: 3 }} />
            <Text style={[styles.playerNameSecondary, { color: colors.textSecondary, textAlign: showOnRight ? 'right' : 'left' }]} numberOfLines={2}>
              {playerInfo.secondary}
            </Text>
          </View>
        </>
      ) : (
        <>
          <Text style={[styles.playerName, { color: colors.text, textAlign: showOnRight ? 'right' : 'left' }]} numberOfLines={2}>
            {playerInfo.primary}
          </Text>
          {playerInfo.secondary ? (
            <Text style={[styles.playerNameSecondary, { color: colors.textSecondary, textAlign: showOnRight ? 'right' : 'left' }]} numberOfLines={2}>
              {playerInfo.secondary}
            </Text>
          ) : null}
        </>
      )}
    </View>
  );

  return (
    <View style={styles.eventRow}>
      {/* Left side */}
      <View style={styles.sideContainer}>
        {!showOnRight && renderPlayerContent()}
      </View>

      {/* Center timeline */}
      <View style={styles.centerColumn}>
        <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
        <View style={[styles.minuteBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <EventIcon type={event.type} size={18} color={eventColor} />
        </View>
        <View style={[styles.minuteContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.minuteText, { color: colors.textSecondary }]}>{minuteText}</Text>
        </View>
      </View>

      {/* Right side */}
      <View style={styles.sideContainer}>
        {showOnRight && renderPlayerContent()}
      </View>
    </View>
  );
}

export default function EventTimeline({ events, match }: EventTimelineProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { t, isRTL } = useRTL();

  if (!events || events.length === 0) {
    return null;
  }

  // Sort events by minute descending (newest first)
  const sortedEvents = [...events].sort((a, b) => {
    const minuteA = a.minute + (a.extraTime || 0) * 0.01;
    const minuteB = b.minute + (b.extraTime || 0) * 0.01;
    return minuteB - minuteA;
  });

  return (
    <View style={styles.container}>
      {/* Vertical center line */}
      <View style={[styles.verticalLine, { backgroundColor: colors.border }]} />

      {sortedEvents.map((event, index) => (
        <View key={event.id || index}>
          {isSectionEvent(event.type) ? (
            <TimelineSectionBadge event={event} match={match} colors={colors} />
          ) : (
            <TimelineEventRow
              event={event}
              match={match}
              colors={colors}
              isRTL={isRTL}
            />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingVertical: SPACING.sm,
  },
  verticalLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    marginLeft: -0.5,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: SPACING.xs,
  },
  sideContainer: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
  },
  centerColumn: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  minuteBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  eventIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  minuteContainer: {
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 1,
    borderRadius: RADIUS.sm,
    marginTop: 2,
    zIndex: 2,
  },
  minuteText: {
    fontSize: 10,
    fontWeight: '700',
  },
  playerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  playerContentRight: {
    alignItems: 'flex-end',
  },
  playerContentLeft: {
    alignItems: 'flex-start',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 1,
  },
  playerName: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    flex: 1,
  },
  playerNameSecondary: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '400',
    marginTop: 1,
  },
});
