import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { matchApi } from '@/services/api';
import { Match } from '@/types';
import MatchCard from '@/components/MatchCard';
import { useRTL } from '@/contexts/RTLContext';
import { format, subDays, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';

type FilterPeriod = 'week' | 'month' | 'custom';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24) + 8;

export default function PreviousMatchesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activePeriod, setActivePeriod] = useState<FilterPeriod>('week');
  const [customFromDate, setCustomFromDate] = useState<Date>(subDays(new Date(), 7));
  const [customToDate, setCustomToDate] = useState<Date>(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const getDateRange = useCallback(() => {
    const today = new Date();
    const to = format(today, 'yyyy-MM-dd');

    switch (activePeriod) {
      case 'week':
        return { from: format(subDays(today, 7), 'yyyy-MM-dd'), to };
      case 'month':
        return { from: format(subMonths(today, 1), 'yyyy-MM-dd'), to };
      case 'custom':
        return { from: format(customFromDate, 'yyyy-MM-dd'), to: format(customToDate, 'yyyy-MM-dd') };
      default:
        return { from: format(subDays(today, 7), 'yyyy-MM-dd'), to };
    }
  }, [activePeriod, customFromDate, customToDate]);

  const loadMatches = useCallback(async () => {
    try {
      const { from, to } = getDateRange();
      const params: any = { status: 'finished', from, to };
      if (search.trim()) params.search = search.trim();

      const res = await matchApi.getAll(params);
      const data: Match[] = res.data.data || [];
      // Sort newest first
      data.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      setMatches(data);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getDateRange, search]);

  useEffect(() => {
    setLoading(true);
    loadMatches();
  }, [activePeriod, customFromDate, customToDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      loadMatches();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  const periods: { key: FilterPeriod; label: string; icon: string }[] = [
    { key: 'week', label: 'الأسبوع الماضي', icon: 'calendar-outline' },
    { key: 'month', label: 'الشهر الماضي', icon: 'calendar' },
    { key: 'custom', label: 'تحديد يدوي', icon: 'options-outline' },
  ];

  const formatMatchDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'EEEE d MMMM yyyy', { locale: ar });
    } catch {
      return dateStr;
    }
  };

  // Group matches by date
  const groupedMatches: { date: string; matches: Match[] }[] = [];
  const dateMap = new Map<string, Match[]>();
  for (const m of matches) {
    const key = format(new Date(m.startTime), 'yyyy-MM-dd');
    if (!dateMap.has(key)) dateMap.set(key, []);
    dateMap.get(key)!.push(m);
  }
  for (const [date, items] of dateMap) {
    groupedMatches.push({ date, matches: items });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.headerRow, { flexDirection }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>المباريات السابقة</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder="بحث باسم النادي..."
            placeholderTextColor={colors.textTertiary}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Period Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {periods.map((p) => {
            const active = activePeriod === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                style={[
                  styles.filterChip,
                  { backgroundColor: active ? colors.accent : colors.background, borderColor: active ? colors.accent : colors.border },
                ]}
                onPress={() => setActivePeriod(p.key)}
                activeOpacity={0.7}
              >
                <Ionicons name={p.icon as any} size={14} color={active ? '#fff' : colors.textSecondary} />
                <Text style={[styles.filterChipText, { color: active ? '#fff' : colors.textSecondary }]}>{p.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Custom Date Pickers */}
        {activePeriod === 'custom' && (
          <View style={[styles.customDateRow, { flexDirection }]}>
            <TouchableOpacity
              style={[styles.datePickerBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowFromPicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.accent} />
              <View>
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>من</Text>
                <Text style={[styles.dateValue, { color: colors.text }]}>{format(customFromDate, 'yyyy/MM/dd')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.datePickerBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowToPicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.accent} />
              <View>
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>إلى</Text>
                <Text style={[styles.dateValue, { color: colors.text }]}>{format(customToDate, 'yyyy/MM/dd')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {showFromPicker && (
          <DateTimePicker
            value={customFromDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={customToDate}
            onChange={(_, date) => {
              setShowFromPicker(false);
              if (date) setCustomFromDate(date);
            }}
          />
        )}
        {showToPicker && (
          <DateTimePicker
            value={customToDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={customFromDate}
            maximumDate={new Date()}
            onChange={(_, date) => {
              setShowToPicker(false);
              if (date) setCustomToDate(date);
            }}
          />
        )}
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="football-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>لا توجد مباريات سابقة</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
            {matches.length} مباراة
          </Text>

          {groupedMatches.map((group) => (
            <View key={group.date} style={styles.dateGroup}>
              <View style={[styles.dateHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="calendar-outline" size={14} color={colors.accent} />
                <Text style={[styles.dateHeaderText, { color: colors.text }]}>
                  {formatMatchDate(group.date)}
                </Text>
              </View>
              {group.matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onPress={() => router.push(`/match/${match.id}` as any)}
                />
              ))}
            </View>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: STATUS_BAR_HEIGHT,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    gap: SPACING.sm,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(128,128,128,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : SPACING.xs,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'right',
  },
  filterRow: {
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  customDateRow: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  datePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  dateLabel: {
    fontSize: 10,
    fontFamily: FONTS.medium,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  applyBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  resultsCount: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginBottom: SPACING.md,
    textAlign: 'right',
  },
  dateGroup: {
    marginBottom: SPACING.lg,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  dateHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
});
