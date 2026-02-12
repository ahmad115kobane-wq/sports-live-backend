import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/Theme';
import { API_URL } from '@/constants/config';

interface TeamLogoProps {
  team: {
    name: string;
    shortName?: string;
    logo?: string;
    logoUrl?: string;
  };
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  showName?: boolean;
  namePosition?: 'bottom' | 'right';
  style?: any;
}

function TeamLogo({
  team,
  size = 'medium',
  showName = false,
  namePosition = 'bottom',
  style,
}: TeamLogoProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const sizeMap = {
    small: { logo: 28, fontSize: 10, nameSize: 11 },
    medium: { logo: 40, fontSize: 14, nameSize: 13 },
    large: { logo: 56, fontSize: 20, nameSize: 15 },
    xlarge: { logo: 72, fontSize: 26, nameSize: 17 },
  };

  const currentSize = sizeMap[size];
  const initials = team.shortName?.substring(0, 2) || team.name.substring(0, 2);

  // Generate a consistent color based on team name
  const getTeamColor = (name: string) => {
    const teamColors: { [key: string]: string } = {
      // Iraqi Teams
      'القوة الجوية': '#1E3A8A',
      'الشرطة': '#166534',
      'الزوراء': '#0EA5E9',
      'الطلبة': '#FACC15',
      'زاخو': '#06B6D4',
      'القاسم': '#3B82F6',
      'نوروز': '#22C55E',
      'الكرخ': '#F97316',
      'دهوك': '#1D4ED8',
      'النفط': '#EAB308',
      'النجف': '#1E40AF',
      'الكهرباء': '#F59E0B',
      'اربيل': '#FBBF24',
      'نفط ميسان': '#7C2D12',
      'أمانة بغداد': '#0284C7',
      'الغراف': '#15803D',
      'الموصل': '#1E3A8A',
      'ديالى': '#7C3AED',
      'الميناء': '#0D9488',
      // English Teams
      liverpool: '#C8102E',
      'man city': '#6CABDD',
      'manchester city': '#6CABDD',
      arsenal: '#EF0107',
      chelsea: '#034694',
      'man united': '#DA291C',
      'manchester united': '#DA291C',
      tottenham: '#132257',
      newcastle: '#241F20',
      'west ham': '#7A263A',
      brighton: '#0057B8',
      'aston villa': '#95BFE5',
      'crystal palace': '#1B458F',
      brentford: '#E30613',
      fulham: '#000000',
      wolverhampton: '#FDB913',
      everton: '#003399',
      nottingham: '#DD0000',
      bournemouth: '#DA291C',
      default: colors.accent,
    };

    // Check exact match first (for Arabic names)
    if (teamColors[name]) {
      return teamColors[name];
    }

    const lowerName = name.toLowerCase();
    for (const [key, value] of Object.entries(teamColors)) {
      if (lowerName.includes(key)) {
        return value;
      }
    }
    return teamColors.default;
  };

  const teamColor = useMemo(() => getTeamColor(team.name), [team.name]);

  const containerStyle = namePosition === 'right' ? styles.containerRow : styles.containerColumn;

  // Get the logo URL - handle both logo and logoUrl, and relative paths
  const getLogoUrl = () => {
    const url = team.logo || team.logoUrl;
    if (!url) return null;
    // If it's a relative path, prepend the API base URL
    if (url.startsWith('/')) {
      // Remove /api from API_URL if present and add the path
      const baseUrl = API_URL.replace('/api', '');
      return `${baseUrl}${url}`;
    }
    return url;
  };

  const logoUrl = getLogoUrl();

  return (
    <View style={[containerStyle, style]}>
      {logoUrl ? (
        <Image
          source={{ uri: logoUrl }}
          style={[
            styles.logo,
            {
              width: currentSize.logo,
              height: currentSize.logo,
              borderRadius: currentSize.logo / 2,
            },
          ]}
          contentFit="contain"
          cachePolicy="memory-disk"
          recyclingKey={logoUrl}
        />
      ) : (
        <View
          style={[
            styles.logoPlaceholder,
            {
              width: currentSize.logo,
              height: currentSize.logo,
              borderRadius: currentSize.logo / 2,
              backgroundColor: `${teamColor}15`,
              borderColor: `${teamColor}40`,
            },
          ]}
        >
          <Text
            style={[
              styles.initials,
              {
                fontSize: currentSize.fontSize,
                color: teamColor,
              },
            ]}
          >
            {initials}
          </Text>
        </View>
      )}
      
      {showName && (
        <Text
          style={[
            styles.teamName,
            {
              fontSize: currentSize.nameSize,
              color: colors.text,
              marginTop: namePosition === 'bottom' ? SPACING.sm : 0,
              marginLeft: namePosition === 'right' ? SPACING.md : 0,
            },
          ]}
          numberOfLines={2} ellipsizeMode="tail"
        >
          {team.name}
        </Text>
      )}
    </View>
  );
}

export default React.memo(TeamLogo);

const styles = StyleSheet.create({
  containerColumn: {
    alignItems: 'center',
  },
  containerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    backgroundColor: 'transparent',
  },
  logoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  initials: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  teamName: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
