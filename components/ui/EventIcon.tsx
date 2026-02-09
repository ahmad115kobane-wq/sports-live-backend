import React from 'react';
import Svg, { Path, Rect, Circle, G, Line } from 'react-native-svg';

interface EventIconProps {
  type: string;
  size?: number;
  color?: string;
}

export default function EventIcon({ type, size = 20, color }: EventIconProps) {
  const iconColor = color || getDefaultColor(type);

  switch (type) {
    case 'goal':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" stroke={iconColor} strokeWidth="1.5" />
          <Path d="M12 2 L14 8 L20 8 L15 12 L17 18 L12 14 L7 18 L9 12 L4 8 L10 8 Z" fill={iconColor} opacity={0.3} />
          <Circle cx="12" cy="12" r="4" stroke={iconColor} strokeWidth="1.5" />
          <Line x1="12" y1="2" x2="12" y2="8" stroke={iconColor} strokeWidth="1" />
          <Line x1="12" y1="16" x2="12" y2="22" stroke={iconColor} strokeWidth="1" />
          <Line x1="2" y1="12" x2="8" y2="12" stroke={iconColor} strokeWidth="1" />
          <Line x1="16" y1="12" x2="22" y2="12" stroke={iconColor} strokeWidth="1" />
        </Svg>
      );

    case 'yellow_card':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="5" y="2" width="14" height="20" rx="2" fill={iconColor} />
        </Svg>
      );

    case 'red_card':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="5" y="2" width="14" height="20" rx="2" fill={iconColor} />
        </Svg>
      );

    case 'substitution':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M7 4L3 8L7 12" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Line x1="3" y1="8" x2="16" y2="8" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
          <Path d="M17 12L21 16L17 20" stroke="#F44336" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Line x1="21" y1="16" x2="8" y2="16" stroke="#F44336" strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );

    case 'penalty':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" stroke={iconColor} strokeWidth="1.5" />
          <Circle cx="12" cy="12" r="3" fill={iconColor} />
          <Path d="M12 5V2M12 22V19M5 12H2M22 12H19" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
      );

    case 'var_review':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="2" y="4" width="20" height="14" rx="2" stroke={iconColor} strokeWidth="1.5" />
          <Path d="M8 20H16" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
          <Path d="M12 18V20" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
          <Path d="M8 9L11 12L8 15" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <Line x1="12" y1="9" x2="16" y2="9" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
          <Line x1="12" y1="12" x2="16" y2="12" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
          <Line x1="12" y1="15" x2="16" y2="15" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
      );

    case 'corner':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M5 3V21" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
          <Path d="M5 5C9 5 13 7 15 11" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <Path d="M5 3L9 5L5 8" fill={iconColor} opacity={0.4} />
          <Path d="M5 3L9 5L5 8" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    case 'offside':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="12" y1="2" x2="12" y2="22" stroke={iconColor} strokeWidth="1.5" strokeDasharray="3 2" />
          <Circle cx="7" cy="10" r="3" stroke={iconColor} strokeWidth="1.5" />
          <Circle cx="17" cy="14" r="3" stroke={iconColor} strokeWidth="1.5" fill={iconColor} opacity={0.3} />
          <Path d="M4 18L20 6" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
      );

    case 'foul':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2L14.5 9H22L16 13.5L18 21L12 16.5L6 21L8 13.5L2 9H9.5L12 2Z" stroke={iconColor} strokeWidth="1.5" strokeLinejoin="round" />
          <Line x1="8" y1="8" x2="16" y2="16" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
          <Line x1="16" y1="8" x2="8" y2="16" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );

    case 'injury':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="7" width="18" height="10" rx="2" stroke={iconColor} strokeWidth="1.5" />
          <Path d="M10 7V17" stroke={iconColor} strokeWidth="1.5" />
          <Path d="M14 7V17" stroke={iconColor} strokeWidth="1.5" />
          <Rect x="10" y="10" width="4" height="4" fill={iconColor} />
        </Svg>
      );

    case 'stop':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" stroke={iconColor} strokeWidth="1.5" />
          <Rect x="8" y="8" width="8" height="8" rx="1" fill={iconColor} />
        </Svg>
      );

    case 'start_half':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" stroke={iconColor} strokeWidth="1.5" />
          <Path d="M10 8L16 12L10 16V8Z" fill={iconColor} />
        </Svg>
      );

    case 'end_half':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" stroke={iconColor} strokeWidth="1.5" />
          <Rect x="8" y="7" width="3" height="10" rx="1" fill={iconColor} />
          <Rect x="13" y="7" width="3" height="10" rx="1" fill={iconColor} />
        </Svg>
      );

    case 'end_match':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 5V19L8 17L12 19L16 17L20 19V5L16 7L12 5L8 7L4 5Z" stroke={iconColor} strokeWidth="1.5" strokeLinejoin="round" />
          <Rect x="6" y="8" width="4" height="3" fill={iconColor} opacity={0.4} />
          <Rect x="10" y="11" width="4" height="3" fill={iconColor} opacity={0.4} />
          <Rect x="14" y="8" width="4" height="3" fill={iconColor} opacity={0.4} />
        </Svg>
      );

    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" stroke={iconColor} strokeWidth="1.5" />
          <Circle cx="12" cy="12" r="3" fill={iconColor} />
        </Svg>
      );
  }
}

function getDefaultColor(type: string): string {
  switch (type) {
    case 'goal': return '#4CAF50';
    case 'yellow_card': return '#FFEB3B';
    case 'red_card': return '#F44336';
    case 'substitution': return '#2196F3';
    case 'penalty': return '#E91E63';
    case 'var_review': return '#9C27B0';
    case 'corner': return '#00BCD4';
    case 'offside': return '#607D8B';
    case 'foul': return '#FF9800';
    case 'injury': return '#FF5722';
    case 'stop': return '#795548';
    case 'start_half': return '#4CAF50';
    case 'end_half': return '#FF9800';
    case 'end_match': return '#9E9E9E';
    default: return '#607D8B';
  }
}
