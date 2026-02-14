import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { MatchEvent, Match } from '@/types';
import { useRTL } from '@/contexts/RTLContext';
import EventIcon from '@/components/ui/EventIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EventTimelineProps {
  events: MatchEvent[];
  match: Match;
}

// Get event color
function getEventColor(type: string, colors: any): string {
  switch (type) {
    case 'goal': return colors.goal || '#22C55E';
    case 'yellow_card': return colors.yellowCard || '#EAB308';
    case 'red_card': return colors.redCard || '#EF4444';
    case 'substitution': return colors.substitution || '#3B82F6';
    case 'penalty': return colors.error || '#EC4899';
    case 'var_review': return colors.var || '#A855F7';
    case 'corner': return colors.info || '#06B6D4';
    case 'offside': return colors.secondary || '#64748B';
    case 'injury': return colors.warning || '#F97316';
    case 'start_half': return colors.pitch || '#059669';
    case 'end_half': return colors.warning || '#F59E0B';
    case 'end_match': return colors.textSecondary || '#6B7280';
    default: return colors.textTertiary || '#64748B';
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
        return `نهاية المباراة ${match.homeScore} - ${match.awayScore}`;
      case 'end_half':
        return 'نهاية الشوط الأول';
      case 'start_half':
        return event.minute <= 1 ? 'بداية المباراة' : 'بداية الشوط الثاني';
      default:
        return event.description || '';
    }
  };

  return (
    <View style={[sectionStyles.container, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
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
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginVertical: SPACING.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
      android: { elevation: 1 }
    }),
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
});

function TimelineEventRow({ event, match, colors, isRTL }: { event: MatchEvent; match: Match; colors: any; isRTL: boolean }) {
  const isHomeTeam = event.teamId === match.homeTeamId;
  const eventColor = getEventColor(event.type, colors);

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
            <Ionicons name="arrow-up-circle" size={16} color={colors.success} style={{ marginHorizontal: 4 }} />
            <Text style={[styles.playerName, { color: colors.text, textAlign: showOnRight ? 'right' : 'left' }]} numberOfLines={1}>
              {playerInfo.primary}
            </Text>
          </View>
          <View style={[styles.subRow, { flexDirection: showOnRight ? 'row-reverse' : 'row' }]}>
            <Ionicons name="arrow-down-circle" size={16} color={colors.error} style={{ marginHorizontal: 4 }} />
            <Text style={[styles.playerNameSecondary, { color: colors.textSecondary, textAlign: showOnRight ? 'right' : 'left' }]} numberOfLines={1}>
              {playerInfo.secondary}
            </Text>
          </View>
        </>
      ) : (
        <>
          <Text style={[styles.playerName, { color: colors.text, textAlign: showOnRight ? 'right' : 'left' }]} numberOfLines={1}>
            {playerInfo.primary}
          </Text>
          {playerInfo.secondary ? (
            <Text style={[styles.playerNameSecondary, { color: colors.textSecondary, textAlign: showOnRight ? 'right' : 'left' }]} numberOfLines={1}>
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
        
        {/* Minute Bubble */}
        <View style={[styles.minuteBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.minuteText, { color: colors.text }]}>{event.minute}</Text>
          {event.extraTime && (
            <Text style={[styles.extraTimeText, { color: colors.accent }]}>+{event.extraTime}</Text>
          )}
        </View>

        {/* Event Icon Bubble (Overlapping) */}
        <View style={[styles.iconBadge, { backgroundColor: colors.surface, borderColor: eventColor }]}>
          <EventIcon type={event.type} size={14} color={eventColor} />
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
    fontFamily: FONTS.bold,
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
  extraTimeText: {
    fontSize: 8,
    fontWeight: '700',
    position: 'absolute',
    top: -4,
    right: -4,
  },
  iconBadge: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    bottom: -6,
    right: -6,
    zIndex: 3,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
      android: { elevation: 1 }
    }),
  },
});
