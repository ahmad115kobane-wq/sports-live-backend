import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
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
  const colors = Colors[colorScheme];
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
  const colors = Colors[colorScheme];

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
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width={70} height={12} style={{ marginTop: SPACING.sm }} />
        </View>
        
        {/* Score */}
        <View style={styles.matchCardCenter}>
          <Skeleton width={64} height={32} borderRadius={RADIUS.lg} />
          <Skeleton width={44} height={10} borderRadius={RADIUS.sm} style={{ marginTop: SPACING.sm }} />
        </View>
        
        {/* Away Team */}
        <View style={styles.matchCardTeam}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width={70} height={12} style={{ marginTop: SPACING.sm }} />
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
  const colors = Colors[colorScheme];

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
          <Skeleton width={56} height={56} borderRadius={28} />
          <Skeleton width={80} height={14} style={{ marginTop: SPACING.md }} />
        </View>
        
        <View style={styles.featuredCenter}>
          <Skeleton width={90} height={44} borderRadius={RADIUS.xl} />
          <Skeleton width={50} height={10} style={{ marginTop: SPACING.sm }} />
        </View>
        
        <View style={styles.featuredTeam}>
          <Skeleton width={56} height={56} borderRadius={28} />
          <Skeleton width={80} height={14} style={{ marginTop: SPACING.md }} />
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
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.eventSkeleton, { backgroundColor: colors.surface }]}>
      <Skeleton width={36} height={36} borderRadius={18} />
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
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.profileHeader, { backgroundColor: colors.primaryLight }]}>
      <Skeleton width={72} height={72} borderRadius={36} />
      <Skeleton width={140} height={20} style={{ marginTop: SPACING.md }} />
      <Skeleton width={180} height={14} style={{ marginTop: SPACING.sm }} />
      <Skeleton width={80} height={28} borderRadius={RADIUS.full} style={{ marginTop: SPACING.md }} />
    </View>
  );
}

// Product Card Skeleton (Store)
export function ProductCardSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.productCardSkeleton, { backgroundColor: colors.surface }]}>
      <Skeleton width={'100%' as any} height={140} borderRadius={RADIUS.md} />
      <View style={styles.productSkeletonInfo}>
        <Skeleton width={'80%' as any} height={13} />
        <Skeleton width={'50%' as any} height={10} style={{ marginTop: SPACING.sm }} />
        <Skeleton width={'40%' as any} height={15} style={{ marginTop: SPACING.sm }} />
      </View>
    </View>
  );
}

// Product Grid Skeleton (2 columns × 3 rows)
export function ProductGridSkeleton() {
  return (
    <View style={styles.productGridSkeleton}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={styles.productGridRow}>
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </View>
      ))}
    </View>
  );
}

// Horizontal Product Section Skeleton (for "All" view)
export function HorizontalSectionSkeleton({ count = 3 }: { count?: number }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ marginBottom: SPACING.xl }}>
          {/* Section header skeleton */}
          <View style={styles.hSectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Skeleton width={32} height={32} borderRadius={10} />
              <Skeleton width={100} height={16} />
            </View>
            <Skeleton width={70} height={28} borderRadius={RADIUS.full} />
          </View>
          {/* Horizontal cards skeleton */}
          <View style={styles.hSectionCards}>
            {[0, 1, 2, 3].map((j) => (
              <View key={j} style={[styles.hCardSkeleton, { backgroundColor: colors.surface }]}>
                <Skeleton width={'100%' as any} height={100} borderRadius={RADIUS.md} />
                <View style={{ padding: SPACING.sm }}>
                  <Skeleton width={'75%' as any} height={12} />
                  <Skeleton width={'50%' as any} height={10} style={{ marginTop: SPACING.xs }} />
                  <Skeleton width={'40%' as any} height={14} style={{ marginTop: SPACING.xs }} />
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </>
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

// News Article Skeleton
export function NewsSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.newsCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {/* Author Section */}
      <View style={styles.newsAuthorSection}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Skeleton width={42} height={42} borderRadius={21} />
          <View style={{ flex: 1 }}>
            <Skeleton width="40%" height={16} borderRadius={4} />
            <View style={{ height: 4 }} />
            <Skeleton width="30%" height={12} borderRadius={4} />
          </View>
        </View>
      </View>

      {/* Title */}
      <View style={{ paddingHorizontal: 16 }}>
        <Skeleton width="90%" height={20} borderRadius={4} />
        <View style={{ height: 8 }} />
        <Skeleton width="70%" height={20} borderRadius={4} />
      </View>

      {/* Content Preview */}
      <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
        <Skeleton width="100%" height={14} borderRadius={4} />
        <View style={{ height: 6 }} />
        <Skeleton width="85%" height={14} borderRadius={4} />
      </View>

      {/* Image */}
      <View style={{ marginTop: 16, marginHorizontal: 16, marginBottom: 16 }}>
        <Skeleton width="100%" height={200} borderRadius={12} />
      </View>
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
  // Product Card Skeleton
  productCardSkeleton: {
    flex: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  productSkeletonInfo: {
    padding: SPACING.sm + 2,
    gap: 2,
  },
  // Product Grid Skeleton
  productGridSkeleton: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  productGridRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  // Horizontal Section Skeleton
  hSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  hSectionCards: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
    paddingTop: SPACING.sm,
  },
  hCardSkeleton: {
    width: 140,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  // List
  listContainer: {
    gap: SPACING.md,
  },
  // News Card Skeleton
  newsCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  newsAuthorSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
});

export default Skeleton;
