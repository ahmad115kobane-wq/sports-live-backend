import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line, Circle, G, Text as SvgText } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MatchEvent } from '@/types';
import { EVENT_TYPES } from '@/constants/config';

interface FootballFieldProps {
  events: MatchEvent[];
  onFieldPress?: (x: number, y: number) => void;
}

const { width } = Dimensions.get('window');
const FIELD_WIDTH = width - 32;
const FIELD_HEIGHT = FIELD_WIDTH * 0.65;

export default function FootballField({ events, onFieldPress }: FootballFieldProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  // Filter events that have positions
  const positionedEvents = events.filter((e) => e.posX !== undefined && e.posY !== undefined);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 8,
      overflow: 'hidden',
    },
  });

  return (
    <View style={styles.container}>
      <Svg width={FIELD_WIDTH} height={FIELD_HEIGHT} viewBox="0 0 100 65">
        {/* Field Background */}
        <Rect x="0" y="0" width="100" height="65" fill="#2d8a4e" rx="2" />
        
        {/* Field Lines */}
        <G stroke="#fff" strokeWidth="0.3" fill="none">
          {/* Outer boundary */}
          <Rect x="2" y="2" width="96" height="61" />
          
          {/* Center line */}
          <Line x1="50" y1="2" x2="50" y2="63" />
          
          {/* Center circle */}
          <Circle cx="50" cy="32.5" r="9" />
          <Circle cx="50" cy="32.5" r="0.5" fill="#fff" />
          
          {/* Left penalty area */}
          <Rect x="2" y="15" width="16" height="35" />
          <Rect x="2" y="22" width="6" height="21" />
          <Circle cx="12" cy="32.5" r="0.5" fill="#fff" />
          
          {/* Right penalty area */}
          <Rect x="82" y="15" width="16" height="35" />
          <Rect x="92" y="22" width="6" height="21" />
          <Circle cx="88" cy="32.5" r="0.5" fill="#fff" />
          
          {/* Goals */}
          <Rect x="0" y="27" width="2" height="11" fill="#fff" />
          <Rect x="98" y="27" width="2" height="11" fill="#fff" />
          
          {/* Corner arcs */}
          <Circle cx="2" cy="2" r="2" />
          <Circle cx="98" cy="2" r="2" />
          <Circle cx="2" cy="63" r="2" />
          <Circle cx="98" cy="63" r="2" />
        </G>

        {/* Event Markers */}
        {positionedEvents.map((event, index) => {
          const eventConfig = EVENT_TYPES[event.type];
          const color = eventConfig?.color || '#fff';
          
          return (
            <G key={event.id || index}>
              {/* Event marker */}
              <Circle
                cx={event.posX}
                cy={event.posY}
                r="3"
                fill={color}
                opacity={0.9}
              />
              {/* Event type indicator */}
              {event.type === 'goal' && (
                <SvgText x={event.posX} y={(event.posY || 0) + 1.5} fontSize="3.5" textAnchor="middle" fill="#fff" fontWeight="bold">G</SvgText>
              )}
              {event.type === 'yellow_card' && (
                <Rect x={(event.posX || 0) - 1} y={(event.posY || 0) - 1.5} width="2" height="3" fill="#EAB308" rx="0.3" />
              )}
              {event.type === 'red_card' && (
                <Rect x={(event.posX || 0) - 1} y={(event.posY || 0) - 1.5} width="2" height="3" fill="#EF4444" rx="0.3" />
              )}
              {event.type === 'substitution' && (
                <SvgText x={event.posX} y={(event.posY || 0) + 1.5} fontSize="3.5" textAnchor="middle" fill="#fff" fontWeight="bold">S</SvgText>
              )}
              {event.type === 'penalty' && (
                <SvgText x={event.posX} y={(event.posY || 0) + 1.5} fontSize="3.5" textAnchor="middle" fill="#fff" fontWeight="bold">P</SvgText>
              )}
              {!['goal', 'yellow_card', 'red_card', 'substitution', 'penalty'].includes(event.type) && (
                <Circle cx={event.posX} cy={event.posY} r="1.2" fill="#fff" />
              )}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
