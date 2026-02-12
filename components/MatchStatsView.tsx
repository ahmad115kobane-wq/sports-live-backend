import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/Theme';
import { MatchStats, Match } from '@/types';
import { useRTL } from '@/contexts/RTLContext';
import api from '@/services/api';

interface MatchStatsViewProps {
  match: Match;
}

interface StatRowProps {
  label: string;
  homeValue: number;
  awayValue: number;
  colors: any;
  isPercentage?: boolean;
  highlight?: boolean;
}

function StatRow({ label, homeValue, awayValue, colors, isPercentage, highlight }: StatRowProps) {
  const total = homeValue + awayValue;
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPercent = total > 0 ? (awayValue / total) * 100 : 50;
  const homeWins = homeValue > awayValue;
  const awayWins = awayValue > homeValue;

  return (
    <View style={[statStyles.row, { borderBottomColor: colors.border }]}>
      {/* Home value */}
      <View style={statStyles.valueContainer}>
        {highlight && homeWins ? (
          <View style={[statStyles.highlightBadge, { backgroundColor: colors.accent + '20' }]}>
            <Text style={[statStyles.value, statStyles.valueBold, { color: colors.accent }]}>
              {isPercentage ? `${homeValue}%` : homeValue}
            </Text>
          </View>
        ) : (
          <Text style={[statStyles.value, { color: colors.text }]}>
            {isPercentage ? `${homeValue}%` : homeValue}
          </Text>
        )}
      </View>

      {/* Label */}
      <View style={statStyles.labelContainer}>
        <Text style={[statStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      </View>

      {/* Away value */}
      <View style={statStyles.valueContainer}>
        {highlight && awayWins ? (
          <View style={[statStyles.highlightBadge, { backgroundColor: colors.accent + '20' }]}>
            <Text style={[statStyles.value, statStyles.valueBold, { color: colors.accent }]}>
              {isPercentage ? `${awayValue}%` : awayValue}
            </Text>
          </View>
        ) : (
          <Text style={[statStyles.value, { color: colors.text }]}>
            {isPercentage ? `${awayValue}%` : awayValue}
          </Text>
        )}
      </View>
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  valueContainer: {
    width: 60,
    alignItems: 'center',
  },
  value: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '500',
    fontSize: 14,
  },
  valueBold: {
    fontWeight: '700',
  },
  highlightBadge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xxs + 1,
    borderRadius: RADIUS.full,
  },
  labelContainer: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default function MatchStatsView({ match }: MatchStatsViewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { t } = useRTL();
  const [stats, setStats] = useState<MatchStats | null>(match.stats || null);
  const [loading, setLoading] = useState(!match.stats);
  const [showAllShots, setShowAllShots] = useState(false);
  const [showAllPasses, setShowAllPasses] = useState(false);

  useEffect(() => {
    if (match.stats) {
      setStats(match.stats);
      setLoading(false);
    } else {
      fetchStats();
    }
  }, [match.id, match.stats]);

  const fetchStats = async () => {
    try {
      const res = await api.get(`/stats/match/${match.id}`);
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('common.loading')}</Text>
      </View>
    );
  }

  const s = stats || {} as any;

  // Key stats section
  const keyStats = [
    { label: 'الاستحواذ', home: s.homePossession || 50, away: s.awayPossession || 50, pct: true, hl: true },
    { label: 'إجمالي التسديدات', home: s.homeShots || 0, away: s.awayShots || 0, hl: true },
    { label: 'تسديدات على المرمى', home: s.homeShotsOnTarget || 0, away: s.awayShotsOnTarget || 0, hl: true },
    { label: 'الضربات الركنية', home: s.homeCorners || 0, away: s.awayCorners || 0, hl: true },
    { label: 'حالات التسلل', home: s.homeOffsides || 0, away: s.awayOffsides || 0, hl: true },
    { label: 'البطاقات الحمراء', home: s.homeRedCards || 0, away: s.awayRedCards || 0 },
    { label: 'هجمات', home: s.homePasses || 0, away: s.awayPasses || 0, hl: true },
  ];

  // Shots section
  const shotStats = [
    { label: 'إجمالي التسديدات', home: s.homeShots || 0, away: s.awayShots || 0, hl: true },
    { label: 'تسديدات على المرمى', home: s.homeShotsOnTarget || 0, away: s.awayShotsOnTarget || 0, hl: true },
    { label: 'تسديدات خارج المرمى', home: Math.max(0, (s.homeShots || 0) - (s.homeShotsOnTarget || 0)), away: Math.max(0, (s.awayShots || 0) - (s.awayShotsOnTarget || 0)), hl: false },
  ];

  // Passes section
  const passStats = [
    { label: 'رميات التماس', home: s.homeFouls || 0, away: s.awayFouls || 0, hl: false },
  ];

  return (
    <View style={styles.container}>
      {/* Key Stats Section */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>أبرز الإحصائيات</Text>
        {keyStats.map((stat, index) => (
          <StatRow
            key={index}
            label={stat.label}
            homeValue={stat.home}
            awayValue={stat.away}
            colors={colors}
            isPercentage={stat.pct}
            highlight={stat.hl}
          />
        ))}
      </View>

      {/* Shots Section */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>التسديدات</Text>
        {shotStats.map((stat, index) => (
          <StatRow
            key={index}
            label={stat.label}
            homeValue={stat.home}
            awayValue={stat.away}
            colors={colors}
            highlight={stat.hl}
          />
        ))}
        {!showAllShots && (
          <TouchableOpacity onPress={() => setShowAllShots(true)} style={styles.showMoreBtn}>
            <Text style={[styles.showMoreText, { color: colors.textTertiary }]}>إظهار المزيد</Text>
          </TouchableOpacity>
        )}
        {showAllShots && (
          <StatRow
            label="تصديات الحارس"
            homeValue={s.homeSaves || 0}
            awayValue={s.awaySaves || 0}
            colors={colors}
          />
        )}
      </View>

      {/* Passes Section */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>التمريرات</Text>
        {passStats.map((stat, index) => (
          <StatRow
            key={index}
            label={stat.label}
            homeValue={stat.home}
            awayValue={stat.away}
            colors={colors}
          />
        ))}
        {s.homePassAccuracy != null && (
          <StatRow
            label="دقة التمرير"
            homeValue={s.homePassAccuracy || 0}
            awayValue={s.awayPassAccuracy || 0}
            colors={colors}
            isPercentage
            highlight
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  section: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    ...SHADOWS.xs,
  },
  sectionTitle: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  loadingContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.bodySmall,
  },
  showMoreBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  showMoreText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '500',
  },
});
