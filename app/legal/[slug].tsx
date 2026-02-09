import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { legalApi } from '@/services/api';

interface LegalPageData {
  id: string;
  slug: string;
  title: string;
  titleAr: string;
  titleKu: string;
  content: string;
  contentAr: string;
  contentKu: string;
  updatedAt: string;
}

export default function LegalPageScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection, languageInfo } = useRTL();

  const [page, setPage] = useState<LegalPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (slug) {
      loadPage();
    }
  }, [slug]);

  const loadPage = async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await legalApi.getBySlug(slug!);
      setPage(res.data.data);
    } catch (err) {
      console.error('Load legal page error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedTitle = () => {
    if (!page) return '';
    const lang = languageInfo?.code || 'ar';
    if (lang === 'ku') return page.titleKu || page.titleAr || page.title;
    if (lang === 'ar') return page.titleAr || page.title;
    return page.title;
  };

  const getLocalizedContent = () => {
    if (!page) return '';
    const lang = languageInfo?.code || 'ar';
    if (lang === 'ku') return page.contentKu || page.contentAr || page.content;
    if (lang === 'ar') return page.contentAr || page.content;
    return page.content;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {loading ? '' : getLocalizedTitle()}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error || !page ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {t('common.error') || 'حدث خطأ'}
          </Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.accent }]} onPress={loadPage}>
            <Text style={styles.retryBtnText}>{t('common.retry') || 'إعادة المحاولة'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Card */}
          <View style={[styles.titleCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.titleIcon, { backgroundColor: colors.accent + '15' }]}>
              <Ionicons name="document-text" size={24} color={colors.accent} />
            </View>
            <Text style={[styles.pageTitle, { color: colors.text }]}>
              {getLocalizedTitle()}
            </Text>
            {page.updatedAt && (
              <Text style={[styles.updatedAt, { color: colors.textTertiary }]}>
                {t('common.lastUpdated') || 'آخر تحديث'}: {formatDate(page.updatedAt)}
              </Text>
            )}
          </View>

          {/* Content */}
          <View style={[styles.contentCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.pageContent, { color: colors.text, textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
              {getLocalizedContent()}
            </Text>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </View>
  );
}

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24) + 10;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: STATUS_BAR_HEIGHT,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '500',
  },
  retryBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: SPACING.md,
  },
  titleCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  titleIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  updatedAt: {
    fontSize: 12,
    fontWeight: '500',
  },
  contentCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  pageContent: {
    fontSize: 15,
    lineHeight: 26,
    fontWeight: '400',
  },
});
