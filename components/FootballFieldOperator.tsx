import React from 'react';
import { View, StyleSheet, useColorScheme, Dimensions, TouchableWithoutFeedback } from 'react-native';
import Svg, { Rect, Line, Circle, G, Text as SvgText } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { MatchEvent } from '@/types';
import { EVENT_TYPES } from '@/constants/config';

interface FootballFieldOperatorProps {
  events: MatchEvent[];
  onFieldPress: (x: number, y: number) => void;
  selectedPosition: { x: number; y: number } | null;
}

const { width } = Dimensions.get('window');
const FIELD_WIDTH = width - 32;
const FIELD_HEIGHT = FIELD_WIDTH * 0.65;

export default function FootballFieldOperator({
  events,
  onFieldPress,
  selectedPosition,
}: FootballFieldOperatorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const handlePress = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    // Convert to percentage coordinates (0-100)
    const x = (locationX / FIELD_WIDTH) * 100;
    const y = (locationY / FIELD_HEIGHT) * 65;
    onFieldPress(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  };

  // Filter recent events (last 5)
  const recentEvents = events.filter((e) => e.posX && e.posY).slice(0, 5);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 8,
      overflow: 'hidden',
    },
  });

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
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

          {/* Recent Event Markers (faded) */}
          {recentEvents.map((event, index) => {
            const eventConfig = EVENT_TYPES[event.type];
            const color = eventConfig?.color || '#fff';
            
            return (
              <G key={event.id || index} opacity={0.5}>
                <Circle
                  cx={event.posX}
                  cy={event.posY}
                  r="2.5"
                  fill={color}
                />
              </G>
            );
          })}

          {/* Selected Position Marker */}
          {selectedPosition && (
            <G>
              {/* Outer ring */}
              <Circle
                cx={selectedPosition.x}
                cy={selectedPosition.y}
                r="5"
                fill="none"
                stroke={colors.accent}
                strokeWidth="0.5"
              />
              {/* Inner dot */}
              <Circle
                cx={selectedPosition.x}
                cy={selectedPosition.y}
                r="2.5"
                fill={colors.accent}
              />
              {/* Crosshair */}
              <Line
                x1={selectedPosition.x - 6}
                y1={selectedPosition.y}
                x2={selectedPosition.x + 6}
                y2={selectedPosition.y}
                stroke={colors.accent}
                strokeWidth="0.3"
              />
              <Line
                x1={selectedPosition.x}
                y1={selectedPosition.y - 6}
                x2={selectedPosition.x}
                y2={selectedPosition.y + 6}
                stroke={colors.accent}
                strokeWidth="0.3"
              />
            </G>
          )}

          {/* Instructions */}
          <SvgText
            x="50"
            y="60"
            fontSize="3"
            textAnchor="middle"
            fill="rgba(255,255,255,0.5)"
          >
            Tap to select event position
          </SvgText>
        </Svg>
      </View>
    </TouchableWithoutFeedback>
  );
}
