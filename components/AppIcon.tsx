import React from 'react';
import Svg, { Rect, Circle, G, Path, Line } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';

interface AppIconProps {
  size?: number;
  showBackground?: boolean;
}

const AppIcon: React.FC<AppIconProps> = ({ size = 100, showBackground = true }) => {
  const { isDark } = useTheme();

  const bg = isDark ? '#080808' : '#FFFFFF';
  const strokeColor = isDark ? '#F5F5F5' : '#111111';

  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      {/* Background */}
      {showBackground && (
        <Rect width="512" height="512" rx="112" fill={bg} />
      )}

      {/* Ball Circle */}
      <Circle cx="256" cy="256" r="144" stroke={strokeColor} strokeWidth="12" fill="none" />

      {/* Pentagon Pattern */}
      <G stroke={strokeColor} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round">
        {/* Center Pentagon */}
        <Path d="M256 206 L305 242 L287 305 L225 305 L207 242 Z" fill="none" />

        {/* Lines from pentagon to edge */}
        <Line x1="256" y1="206" x2="256" y2="134" />
        <Line x1="305" y1="242" x2="368" y2="222" />
        <Line x1="287" y1="305" x2="332" y2="358" />
        <Line x1="225" y1="305" x2="180" y2="358" />
        <Line x1="207" y1="242" x2="144" y2="222" />
      </G>
    </Svg>
  );
};

export default AppIcon;
