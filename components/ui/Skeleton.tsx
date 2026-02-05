import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ViewStyle,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { RADIUS, SPACING, SHADOWS } from '@/constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'default' | 'wave' | 'pulse';
}

export function Skeleton({ 
  width = '100%', 
  height = 20, 
  borderRadius = RADIUS.md,
  style,
  variant = 'wave'
}: SkeletonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const isDark = colorScheme === 'dark';
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (variant === 'wave') {
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    } else {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.8,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [variant]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  const baseColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const shimmerColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.04)';

  if (variant === 'pulse') {
    return (
      <Animated.View
        style={[
          {
            width: width as any,
            height,
            borderRadius,
            backgroundColor: baseColor,
            opacity: pulseAnim,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: baseColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View 
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX: shimmerTranslate }] }
        ]}
      >
        <LinearGradient
          colors={['transparent', shimmerColor, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

// Match Card Skeleton - Premium Design
export function MatchCardSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  return (
    <View style={[styles.matchCardSkeleton, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.matchCardHeader}>
        <View style={styles.matchCardHeaderLeft}>
          <Skeleton width={16} height={16} borderRadius={RADIUS.sm} />
          <Skeleton width={100} height={14} style={{ marginLeft: SPACING.sm }} />
        </View>
        <Skeleton width={52} height={24} borderRadius={RADIUS.full} />
      </View>
      
      {/* Teams & Score */}
      <View style={styles.matchCardBody}>
        {/* Home Team */}
        <View style={styles.matchCardTeam}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <Skeleton width={80} height={14} style={{ marginTop: SPACING.sm }} />
        </View>
        
        {/* Score */}
        <View style={styles.matchCardCenter}>
          <Skeleton width={70} height={36} borderRadius={RADIUS.lg} />
          <Skeleton width={50} height={12} borderRadius={RADIUS.sm} style={{ marginTop: SPACING.sm }} />
        </View>
        
        {/* Away Team */}
        <View style={styles.matchCardTeam}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <Skeleton width={80} height={14} style={{ marginTop: SPACING.sm }} />
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.matchCardFooter, { borderTopColor: colors.border }]}>
        <Skeleton width={60} height={10} />
        <Skeleton width={80} height={10} />
      </View>
    </View>
  );
}

// Featured Match Skeleton - Premium Design
export function FeaturedMatchSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  return (
    <View style={[styles.featuredSkeleton, { backgroundColor: colors.primaryLight }]}>
      {/* Header */}
      <View style={styles.featuredHeader}>
        <View style={styles.featuredHeaderLeft}>
          <Skeleton width={24} height={24} borderRadius={12} />
          <Skeleton width={120} height={14} style={{ marginLeft: SPACING.sm }} />
        </View>
        <Skeleton width={80} height={28} borderRadius={RADIUS.full} />
      </View>
      
      {/* Teams & Score */}
      <View style={styles.featuredBody}>
        <View style={styles.featuredTeam}>
          <Skeleton width={68} height={68} borderRadius={34} />
          <Skeleton width={90} height={16} style={{ marginTop: SPACING.md }} />
        </View>
        
        <View style={styles.featuredCenter}>
          <Skeleton width={100} height={52} borderRadius={RADIUS.xl} />
          <Skeleton width={60} height={12} style={{ marginTop: SPACING.sm }} />
        </View>
        
        <View style={styles.featuredTeam}>
          <Skeleton width={68} height={68} borderRadius={34} />
          <Skeleton width={90} height={16} style={{ marginTop: SPACING.md }} />
        </View>
      </View>

      {/* Stats Footer */}
      <View style={styles.featuredFooter}>
        <Skeleton width={60} height={32} borderRadius={RADIUS.lg} />
        <Skeleton width={60} height={32} borderRadius={RADIUS.lg} />
        <Skeleton width={60} height={32} borderRadius={RADIUS.lg} />
      </View>
    </View>
  );
}

// Event Item Skeleton
export function EventItemSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  return (
    <View style={[styles.eventSkeleton, { backgroundColor: colors.surface }]}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={styles.eventContent}>
        <Skeleton width={140} height={15} />
        <Skeleton width={100} height={12} style={{ marginTop: SPACING.xs }} />
      </View>
      <Skeleton width={40} height={22} borderRadius={RADIUS.md} />
    </View>
  );
}

// Profile Header Skeleton
export function ProfileHeaderSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  return (
    <View style={[styles.profileHeader, { backgroundColor: colors.primaryLight }]}>
      <Skeleton width={88} height={88} borderRadius={44} />
      <Skeleton width={140} height={20} style={{ marginTop: SPACING.md }} />
      <Skeleton width={180} height={14} style={{ marginTop: SPACING.sm }} />
      <Skeleton width={80} height={28} borderRadius={RADIUS.full} style={{ marginTop: SPACING.md }} />
    </View>
  );
}

// List Skeleton
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <MatchCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Match Card Skeleton
  matchCardSkeleton: {
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
    overflow: 'hidden',
  },
  matchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  matchCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  matchCardTeam: {
    flex: 1,
    alignItems: 'center',
  },
  matchCardCenter: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  matchCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
  },
  // Featured Skeleton
  featuredSkeleton: {
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  featuredHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  featuredTeam: {
    flex: 1,
    alignItems: 'center',
  },
  featuredCenter: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  // Event Skeleton
  eventSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  eventContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
  },
  // List
  listContainer: {
    gap: SPACING.md,
  },
});

export default Skeleton;
