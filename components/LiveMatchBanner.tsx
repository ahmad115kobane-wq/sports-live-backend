import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, FONTS, Z_INDEX } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { useLiveMatchBanner, LiveMatchBannerData } from '@/contexts/LiveMatchBannerContext';
import { API_URL } from '@/constants/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_TOP = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 24) + 8;

function getLogoUri(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith('/')) {
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}${url}`;
  }
  return url;
}

function getEventIcon(type: string): { name: string; color: string } {
  switch (type) {
    case 'goal':
      return { name: 'football', color: '#22C55E' };
    case 'match_start':
    case 'start_half':
      return { name: 'play-circle', color: '#3B82F6' };
    case 'match_end':
    case 'end_match':
      return { name: 'flag', color: '#8B5CF6' };
    case 'halftime':
    case 'end_half':
      return { name: 'pause-circle', color: '#F59E0B' };
    case 'red_card':
      return { name: 'square', color: '#EF4444' };
    case 'penalty':
      return { name: 'alert-circle', color: '#F97316' };
    case 'pre_match':
      return { name: 'time', color: '#06B6D4' };
    default:
      return { name: 'notifications', color: '#6B7280' };
  }
}

function getEventAccentColor(type: string): readonly [string, string] {
  switch (type) {
    case 'goal':
      return ['#22C55E', '#16A34A'] as const;
    case 'match_start':
    case 'start_half':
      return ['#3B82F6', '#2563EB'] as const;
    case 'match_end':
    case 'end_match':
      return ['#8B5CF6', '#7C3AED'] as const;
    case 'halftime':
    case 'end_half':
      return ['#F59E0B', '#D97706'] as const;
    case 'red_card':
      return ['#EF4444', '#DC2626'] as const;
    case 'penalty':
      return ['#F97316', '#EA580C'] as const;
    case 'pre_match':
      return ['#06B6D4', '#0891B2'] as const;
    default:
      return ['#6B7280', '#4B5563'] as const;
  }
}

export default function LiveMatchBanner() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();
  const { bannerData, isVisible, hideBanner } = useLiveMatchBanner();

  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isVisible && bannerData) {
      // Slide in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse for live events
      if (bannerData.type === 'goal' || bannerData.type === 'red_card') {
        pulseRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.02, duration: 600, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          ])
        );
        pulseRef.current.start();
      }
    } else {
      // Slide out
      pulseRef.current?.stop();
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -200,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, bannerData]);

  if (!bannerData) return null;

  const eventIcon = getEventIcon(bannerData.type);
  const accentColors = getEventAccentColor(bannerData.type);
  const homeLogoUri = getLogoUri(bannerData.homeTeamLogo);
  const awayLogoUri = getLogoUri(bannerData.awayTeamLogo);
  const hasScore = bannerData.homeScore !== undefined && bannerData.awayScore !== undefined;
  const hasPossession = bannerData.homePossession && bannerData.awayPossession;

  const handlePress = () => {
    hideBanner();
    if (bannerData.matchId) {
      router.push(`/match/${bannerData.matchId}` as any);
    }
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: BANNER_TOP,
          transform: [{ translateY }, { scale: Animated.multiply(scale, pulseAnim) }],
          opacity,
        },
      ]}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handlePress}
        style={[
          styles.container,
          {
            backgroundColor: isDark ? 'rgba(20, 20, 20, 0.97)' : 'rgba(255, 255, 255, 0.97)',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        {/* Accent Top Bar */}
        <LinearGradient
          colors={accentColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentBar}
        />

        {/* Header: Event Type + Close */}
        <View style={[styles.header, { flexDirection }]}>
          <View style={[styles.eventBadge, { backgroundColor: `${eventIcon.color}15` }]}>
            <Ionicons name={eventIcon.name as any} size={14} color={eventIcon.color} />
            <Text style={[styles.eventText, { color: eventIcon.color }]}>
              {bannerData.title}
            </Text>
          </View>

          <TouchableOpacity
            onPress={hideBanner}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Match Content */}
        <View style={[styles.matchRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {/* Home Team */}
          <View style={styles.teamCol}>
            {homeLogoUri ? (
              <Image
                source={{ uri: homeLogoUri }}
                style={styles.teamLogo}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[styles.teamLogoPlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                <Ionicons name="shield" size={18} color={colors.textTertiary} />
              </View>
            )}
            <Text
              style={[styles.teamName, { color: colors.text }]}
              numberOfLines={1}
            >
              {bannerData.homeTeamName}
            </Text>
          </View>

          {/* Score / VS / Minute */}
          <View style={styles.scoreCol}>
            {hasScore ? (
              <View style={styles.scoreContainer}>
                <View style={[styles.scoreBox, { backgroundColor: `${accentColors[0]}15` }]}>
                  <Text style={[styles.scoreText, { color: accentColors[0] }]}>
                    {bannerData.homeScore}
                  </Text>
                  <View style={[styles.scoreDot, { backgroundColor: accentColors[0] }]} />
                  <Text style={[styles.scoreText, { color: accentColors[0] }]}>
                    {bannerData.awayScore}
                  </Text>
                </View>
                {bannerData.minute && (
                  <View style={[styles.minuteBadge, { backgroundColor: colors.liveLight }]}>
                    <View style={[styles.liveDot, { backgroundColor: colors.live }]} />
                    <Text style={[styles.minuteText, { color: colors.live }]}>
                      {bannerData.minute}'
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.vsBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                <Text style={[styles.vsText, { color: colors.textTertiary }]}>VS</Text>
              </View>
            )}
          </View>

          {/* Away Team */}
          <View style={styles.teamCol}>
            {awayLogoUri ? (
              <Image
                source={{ uri: awayLogoUri }}
                style={styles.teamLogo}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[styles.teamLogoPlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                <Ionicons name="shield" size={18} color={colors.textTertiary} />
              </View>
            )}
            <Text
              style={[styles.teamName, { color: colors.text }]}
              numberOfLines={1}
            >
              {bannerData.awayTeamName}
            </Text>
          </View>
        </View>

        {/* Possession Bar */}
        {hasPossession && (
          <View style={styles.possessionSection}>
            <View style={[styles.possessionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.possessionValue, { color: colors.possession }]}>
                {bannerData.homePossession}%
              </Text>
              <Text style={[styles.possessionLabel, { color: colors.textTertiary }]}>
                {t('match.possession') || 'الاستحواذ'}
              </Text>
              <Text style={[styles.possessionValue, { color: colors.awayTeam }]}>
                {bannerData.awayPossession}%
              </Text>
            </View>
            <View style={styles.possessionBarContainer}>
              <View
                style={[
                  styles.possessionBarHome,
                  {
                    flex: parseInt(bannerData.homePossession || '50'),
                    backgroundColor: colors.possession,
                    borderTopLeftRadius: isRTL ? 0 : 4,
                    borderBottomLeftRadius: isRTL ? 0 : 4,
                    borderTopRightRadius: isRTL ? 4 : 0,
                    borderBottomRightRadius: isRTL ? 4 : 0,
                  },
                ]}
              />
              <View style={styles.possessionBarGap} />
              <View
                style={[
                  styles.possessionBarAway,
                  {
                    flex: parseInt(bannerData.awayPossession || '50'),
                    backgroundColor: colors.awayTeam,
                    borderTopRightRadius: isRTL ? 0 : 4,
                    borderBottomRightRadius: isRTL ? 0 : 4,
                    borderTopLeftRadius: isRTL ? 4 : 0,
                    borderBottomLeftRadius: isRTL ? 4 : 0,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Event Description */}
        {bannerData.body ? (
          <Text
            style={[styles.bodyText, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {bannerData.body}
          </Text>
        ) : null}

        {/* Competition Name */}
        {bannerData.competitionName ? (
          <View style={[styles.competitionRow, { flexDirection }]}>
            <View style={[styles.compDot, { backgroundColor: accentColors[0] }]} />
            <Text style={[styles.competitionText, { color: colors.textTertiary }]} numberOfLines={1}>
              {bannerData.competitionName}
            </Text>
          </View>
        ) : null}

        {/* Tap hint */}
        <View style={styles.tapHint}>
          <Ionicons name="chevron-forward" size={10} color={colors.textQuaternary} />
          <Text style={[styles.tapHintText, { color: colors.textQuaternary }]}>
            {t('notifications.tapToView') || 'اضغط للتفاصيل'}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    zIndex: Z_INDEX.toast,
    elevation: 20,
  },
  container: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.xxl,
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm + 2,
    paddingBottom: SPACING.xs,
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 5,
  },
  eventText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  teamLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  teamLogoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: FONTS.semiBold,
    maxWidth: 90,
  },
  scoreCol: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    minWidth: 70,
  },
  scoreContainer: {
    alignItems: 'center',
    gap: 3,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.lg,
    gap: 8,
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    fontFamily: FONTS.extraBold,
    minWidth: 20,
    textAlign: 'center',
  },
  scoreDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
  minuteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  minuteText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: FONTS.extraBold,
  },
  vsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
  },
  vsText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: FONTS.extraBold,
  },
  possessionSection: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  possessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  possessionValue: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    fontVariant: ['tabular-nums'],
  },
  possessionLabel: {
    fontSize: 9,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  possessionBarContainer: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  possessionBarHome: {
    height: 4,
  },
  possessionBarGap: {
    width: 2,
  },
  possessionBarAway: {
    height: 4,
  },
  bodyText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xs,
    lineHeight: 16,
  },
  competitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xs,
    gap: 5,
  },
  compDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  competitionText: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: SPACING.sm,
    gap: 3,
  },
  tapHintText: {
    fontSize: 9,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
});
