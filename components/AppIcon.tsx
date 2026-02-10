import React from 'react';
import Svg, { Rect, Circle, G, Path, Defs, LinearGradient, RadialGradient, Stop, ClipPath, Ellipse } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';

interface AppIconProps {
  size?: number;
}

const AppIcon: React.FC<AppIconProps> = ({ size = 100 }) => {
  const { isDark } = useTheme();

  const bg = isDark ? '#0A0A0A' : '#F0F0F0';
  const patchFill = isDark ? '#1A1A1A' : '#D8D8D8';
  const patchStroke = isDark ? '#2A2A2A' : '#C0C0C0';
  const seamColor = isDark ? '#C0C0C0' : '#A0A0A0';
  const pulseColor = isDark ? '#A8A8A8' : '#5C5C5C';
  const edgeColor = isDark ? '#FFFFFF' : '#000000';

  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" fill="none">
      <Defs>
        <RadialGradient id="bs" cx="420" cy="340" r="380" fx="420" fy="340" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={isDark ? '#FFFFFF' : '#FAFAFA'} />
          <Stop offset="0.5" stopColor={isDark ? '#E0E0E0' : '#E8E8E8'} />
          <Stop offset="0.8" stopColor={isDark ? '#B0B0B0' : '#C8C8C8'} />
          <Stop offset="1" stopColor={isDark ? '#707070' : '#A0A0A0'} />
        </RadialGradient>
        <RadialGradient id="bh" cx="380" cy="300" r="200" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.5" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="sg" cx="530" cy="800" rx="220" ry="40" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#000000" stopOpacity={isDark ? '0.5' : '0.15'} />
          <Stop offset="1" stopColor="#000000" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="pg" x1="80" y1="720" x2="944" y2="720" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={pulseColor} stopOpacity="0" />
          <Stop offset="0.15" stopColor={pulseColor} stopOpacity="1" />
          <Stop offset="0.85" stopColor={pulseColor} stopOpacity="1" />
          <Stop offset="1" stopColor={pulseColor} stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="pgw" x1="80" y1="720" x2="944" y2="720" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={pulseColor} stopOpacity="0" />
          <Stop offset="0.15" stopColor={pulseColor} stopOpacity="0.2" />
          <Stop offset="0.85" stopColor={pulseColor} stopOpacity="0.2" />
          <Stop offset="1" stopColor={pulseColor} stopOpacity="0" />
        </LinearGradient>
        <ClipPath id="bc">
          <Circle cx="512" cy="440" r="300" />
        </ClipPath>
      </Defs>

      <Rect width="1024" height="1024" rx="224" fill={bg} />
      <Ellipse cx="530" cy="800" rx="200" ry="30" fill="url(#sg)" />
      <Circle cx="512" cy="440" r="300" fill="url(#bs)" />

      <G clipPath="url(#bc)">
        <Path d="M512 370L564 400L548 460H476L460 400Z" fill={patchFill} stroke={patchStroke} strokeWidth="3" />
        <Path d="M512 170L560 198L546 254H478L464 198Z" fill={patchFill} stroke={patchStroke} strokeWidth="3" />
        <Path d="M700 260L744 292L726 348H670L656 292Z" fill={patchFill} stroke={patchStroke} strokeWidth="3" />
        <Path d="M324 260L368 292L354 348H298L280 292Z" fill={patchFill} stroke={patchStroke} strokeWidth="3" />
        <Path d="M670 530L714 562L698 618H644L628 562Z" fill={patchFill} stroke={patchStroke} strokeWidth="3" />
        <Path d="M354 530L396 562L380 618H326L310 562Z" fill={patchFill} stroke={patchStroke} strokeWidth="3" />
        <Path d="M512 650L558 678L544 734H480L466 678Z" fill={patchFill} stroke={patchStroke} strokeWidth="3" />
        <Path d="M512 254L512 370M546 254L564 400M478 254L460 400M464 198L368 292M560 198L656 292M656 292L700 260M368 292L324 260M564 400L670 530M460 400L354 530M548 460L670 530M476 460L354 530M548 460L558 678M476 460L466 678M628 562L714 562M310 562L396 562" stroke={seamColor} strokeWidth="4" strokeOpacity="0.4" strokeLinecap="round" />
      </G>

      <Circle cx="380" cy="300" r="180" fill="url(#bh)" />
      <Circle cx="512" cy="440" r="300" stroke={edgeColor} strokeWidth="4" strokeOpacity="0.06" fill="none" />

      <Path
        d="M80 720L280 720C300 720 310 720 330 690C350 660 360 640 380 600C400 560 410 550 420 580C430 610 440 660 460 720C480 780 490 790 500 760C510 730 520 660 530 600C540 540 550 530 560 570C570 610 580 660 590 690C600 720 610 720 630 720L944 720"
        stroke="url(#pgw)"
        strokeWidth="36"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M80 720L280 720C300 720 310 720 330 690C350 660 360 640 380 600C400 560 410 550 420 580C430 610 440 660 460 720C480 780 490 790 500 760C510 730 520 660 530 600C540 540 550 530 560 570C570 610 580 660 590 690C600 720 610 720 630 720L944 720"
        stroke="url(#pg)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
};

export default AppIcon;
