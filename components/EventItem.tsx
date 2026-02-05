import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/Theme';
import { MatchEvent } from '@/types';
import { EVENT_TYPES } from '@/constants/config';
import { useRTL } from '@/contexts/RTLContext';

interface EventItemProps {
  event: MatchEvent;
  isLastEvent?: boolean;
}

export default function EventItem({ event, isLastEvent }: EventItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { t, isRTL, flexDirection } = useRTL();
  const eventConfig = EVENT_TYPES[event.type] || { icon: 'pin', label: event.type, color: colors.textSecondary };

  const getEventDescription = () => {
    switch (event.type) {
      case 'goal':
        return `${event.player?.name || 'Goal scored'}`;
      case 'yellow_card':
        return `${event.player?.name || 'Yellow card'}`;
      case 'red_card':
        return `${event.player?.name || 'Red card'}`;
      case 'substitution':
        return `${event.secondaryPlayer?.name || 'IN'} ↔ ${event.player?.name || 'OUT'}`;
      case 'penalty':
        return 'Penalty awarded';
      case 'var_review':
        return 'VAR Review';
      case 'corner':
        return 'Corner kick';
      case 'offside':
        return `${event.player?.name || 'Offside'}`;
      case 'foul':
        return `${event.player?.name || 'Foul'}`;
      case 'injury':
        return `${event.player?.name || 'Injury'}`;
      case 'start_half':
        return event.minute <= 45 ? 'First half kicked off' : 'Second half started';
      case 'end_half':
        return 'Half time whistle';
      case 'end_match':
        return 'Full time';
      default:
        return event.description || eventConfig.label;
    }
  };

  const isHighlightEvent = ['goal', 'red_card', 'penalty'].includes(event.type);
  const isYellowCard = event.type === 'yellow_card';
  const isGoal = event.type === 'goal';

  const getEventColors = () => {
    switch (event.type) {
      case 'goal':
        return { bg: colors.goalBackground, border: colors.goal, text: colors.goal };
      case 'yellow_card':
        return { bg: colors.yellowCardBackground, border: colors.yellowCard, text: colors.yellowCard };
      case 'red_card':
        return { bg: colors.redCardBackground, border: colors.redCard, text: colors.redCard };
      case 'substitution':
        return { bg: colors.substitutionBackground, border: colors.substitution, text: colors.substitution };
      default:
        return { bg: colors.surface, border: colors.border, text: colors.textSecondary };
    }
  };

  const eventColors = getEventColors();

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: eventColors.bg, 
        borderLeftColor: isRTL ? 'transparent' : eventColors.border,
        borderRightColor: isRTL ? eventColors.border : 'transparent',
        borderLeftWidth: isRTL ? 0 : 3,
        borderRightWidth: isRTL ? 3 : 0,
        flexDirection,
      },
      isHighlightEvent && styles.highlightContainer,
      !isLastEvent && { marginBottom: SPACING.sm },
    ]}>
      {/* Timeline connector */}
      <View style={styles.timelineSection}>
        <View style={[styles.timelineDot, { backgroundColor: eventColors.border }]} />
        {!isLastEvent && (
          <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
        )}
        <View style={styles.minuteBox}>
          <Text style={[styles.minute, { color: eventColors.text }]}>{event.minute}'</Text>
          {event.extraTime && (
            <Text style={[styles.extraTime, { color: colors.accent }]}>+{event.extraTime}</Text>
          )}
        </View>
      </View>

      {/* Event Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${eventColors.border}25` }]}>
        <Text style={styles.icon}>{eventConfig.icon}</Text>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <Text style={[styles.eventType, { color: eventColors.text }]}>
          {eventConfig.label}
        </Text>
        <Text style={[styles.description, { color: colors.text }]} numberOfLines={2}>
          {getEventDescription()}
        </Text>
        
        {/* Team indicator */}
        {event.team && (
          <View style={[styles.teamBadge, { backgroundColor: colors.surface }]}>
            <Text style={[styles.teamName, { color: colors.textSecondary }]}>
              {event.team.shortName || event.team.name}
            </Text>
          </View>
        )}
      </View>

      {/* Goal celebration effect */}
      {isGoal && (
        <View style={styles.goalDecor}>
          <Ionicons name="football" size={18} color={colors.success} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    position: 'relative',
    overflow: 'hidden',
  },
  highlightContainer: {
    ...SHADOWS.xs,
  },
  timelineSection: {
    alignItems: 'center',
    position: 'relative',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 6,
    left: 12,
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    position: 'absolute',
    top: 16,
    bottom: -SPACING.sm - SPACING.xs,
    left: 15,
  },
  minuteBox: {
    alignItems: 'center',
    minWidth: 34,
  },
  minute: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '800',
  },
  extraTime: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  icon: {
    fontSize: 18,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 2,
  },
  eventType: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  description: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '500',
  },
  teamBadge: {
    marginTop: SPACING.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.xs,
  },
  teamName: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
  },
  goalDecor: {
    position: 'absolute',
    right: -10,
    top: '50%',
    marginTop: -16,
    opacity: 0.15,
  },
  goalEmoji: {
    fontSize: 48,
  },
});
