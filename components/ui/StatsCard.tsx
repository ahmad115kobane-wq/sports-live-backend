// Professional Stats Card Component
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/Theme';
import AnimatedNumber from './AnimatedNumber';

interface StatItem {
  label: string;
  value: number;
  icon?: string;
  color?: string;
}

interface StatsCardProps {
  stats: StatItem[];
  title?: string;
  variant?: 'horizontal' | 'grid';
}

export default function StatsCard({ stats, title, variant = 'horizontal' }: StatsCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {title && (
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      )}
      <View style={[styles.statsRow, variant === 'grid' && styles.statsGrid]}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            {stat.icon && <Text style={styles.statIcon}>{stat.icon}</Text>}
            <AnimatedNumber
              value={stat.value}
              style={{ ...styles.statValue, color: stat.color || colors.text }}
            />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  title: {
    ...TYPOGRAPHY.titleMedium,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statsGrid: {
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
  },
  statLabel: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: 2,
  },
});
