import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Animated,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { newsApi } from '@/services/api';
import EmptyState from '@/components/ui/EmptyState';
import { NewsSkeleton } from '@/components/ui/Skeleton';
import { useRTL } from '@/contexts/RTLContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore } from '@/store/authStore';
import { router } from 'expo-router';
import PageHeader from '@/components/ui/PageHeader';
import { SOCKET_URL } from '@/constants/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_PADDING = SPACING.md * 2;
const IMAGE_WIDTH = SCREEN_WIDTH - (SPACING.md * 2) - IMAGE_PADDING;

// مكوّن صورة مرنة — يقرأ أبعاد الصورة الحقيقية ويعرضها بنسبتها الأصلية
function AutoImage({ uri, colors }: { uri: string; colors: any }) {
  const [ratio, setRatio] = useState(4 / 3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (error) return null;

  return (
    <View style={[autoImgStyles.container, { backgroundColor: colors.backgroundSecondary }]}>
      {loading && (
        <View style={autoImgStyles.placeholder}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      )}
      <Image
        source={{ uri }}
        style={[autoImgStyles.image, { aspectRatio: ratio }]}
        contentFit="cover"
        cachePolicy="memory-disk"
        onLoad={(e: any) => {
          if (e?.source?.width && e?.source?.height) {
            setRatio(e.source.width / e.source.height);
          }
          setLoading(false);
        }}
        onError={() => setError(true)}
      />
    </View>
  );
}

const autoImgStyles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  placeholder: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    borderRadius: RADIUS.lg,
  },
});

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  isPublished: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export default function NewsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();
  const { user } = useAuthStore();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const waveAnim = useRef(new Animated.Value(0)).current;

  const isPublisher = user?.role === 'publisher';
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(waveAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
    );
    shimmer.start();
    const task = InteractionManager.runAfterInteractions(() => {
      loadNews();
    });
    return () => { task.cancel(); shimmer.stop(); };
  }, []);

  const loadNews = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      const response = await newsApi.getAll(pageNum, 10);
      const data = response.data?.data || [];
      if (pageNum === 1) {
        setArticles(data);
      } else {
        setArticles(prev => [...prev, ...data]);
      }
      setHasMore(data.length >= 10);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNews(1);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      await loadNews(page + 1);
      setLoadingMore(false);
    }
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return t('time.justNow');
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return t('time.minutesAgo', { count: minutes });
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return t('time.hoursAgo', { count: hours });
    }
    const days = Math.floor(seconds / 86400);
    return t('time.daysAgo', { count: days });
  };

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${SOCKET_URL}${imageUrl}`;
  };

  const waveTranslate = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  const toggleExpanded = (articleId: string) => {
    setExpandedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };

  const renderArticle = ({ item }: { item: NewsArticle }) => {
    const imgUrl = getImageUrl(item.imageUrl);
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.articleCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      >
        {/* Author Row - Top */}
        <View style={styles.authorSection}>
          <View style={[styles.authorRow, { flexDirection }]}>
            <View style={[styles.authorAvatar, { backgroundColor: colors.accent + '20' }]}>
              {item.author.avatar ? (
                <Image source={{ uri: `${SOCKET_URL}${item.author.avatar}` }} style={styles.authorAvatarImg} />
              ) : (
                <Ionicons name="person" size={26} color={colors.accent} />
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text 
                style={[styles.authorName, { color: colors.text, flex: 1 }]} 
                numberOfLines={1} 
                ellipsizeMode="tail"
              >
                {item.author.name}
              </Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={11} color="#fff" />
              </View>
            </View>
            <View style={{ flex: 1 }} />
            <Text style={[styles.articleTime, { color: colors.textTertiary }]}>
              {getTimeAgo(item.createdAt)}
            </Text>
            <View style={[styles.newsBadge, { backgroundColor: colors.accent + '15' }]}>
              <Ionicons name="newspaper-outline" size={12} color={colors.accent} />
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.articleTitle, { color: colors.text }]} numberOfLines={3}>
          {item.title}
        </Text>

        {/* Content Preview */}
        <View>
          <Text
            style={[styles.articleContent, { color: colors.textSecondary }]}
            numberOfLines={expandedArticles.has(item.id) ? undefined : 5}
          >
            {item.content}
          </Text>
          {item.content.split('\n').length > 5 && (
            <TouchableOpacity
              onPress={() => toggleExpanded(item.id)}
              style={styles.expandButton}
              activeOpacity={0.7}
            >
              <Text style={[styles.expandText, { color: colors.accent }]}>
                {expandedArticles.has(item.id) ? 'عرض أقل' : 'عرض المزيد'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Image */}
        {imgUrl && <AutoImage uri={imgUrl} colors={colors} />}

      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PageHeader
        title={t('news.title')}
        logo={colorScheme === 'dark' ? require('@/assets/logo-white.png') : require('@/assets/logo-black.png')}
        rightContent={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isPublisher && (
              <TouchableOpacity
                style={styles.headerBtn}
                onPress={() => router.push('/publisher' as any)}
              >
                <Ionicons name="create-outline" size={18} color={colors.text} />
              </TouchableOpacity>
            )}
            <View style={[styles.headerBtn, { backgroundColor: colors.accent + '15' }]}>
              <Ionicons name="newspaper-outline" size={18} color={colors.accent} />
            </View>
          </View>
        }
      />

      {/* News Feed */}
      {loading && articles.length === 0 ? (
        <View style={styles.listContent}>
          <NewsSkeleton />
          <NewsSkeleton />
          <NewsSkeleton />
        </View>
      ) : (
        <FlatList
          data={articles}
          renderItem={renderArticle}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            articles.length === 0 && { flexGrow: 1 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <EmptyState
                icon="newspaper-outline"
                title={t('news.empty')}
                subtitle={t('news.emptySubtitle')}
                actionLabel={t('common.refresh')}
                actionIcon="refresh"
                onAction={onRefresh}
              />
            </View>
          }
          ListFooterComponent={
            <View style={{ paddingBottom: 120 }}>
              {hasMore && articles.length > 0 && (
                <TouchableOpacity
                  style={[styles.loadMoreBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  onPress={loadMore}
                  disabled={loadingMore}
                  activeOpacity={0.7}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <>
                      <Ionicons name="chevron-down" size={18} color={colors.accent} />
                      <Text style={[styles.loadMoreText, { color: colors.accent }]}>
                        {t('news.loadMore')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    overflow: 'hidden',
  },
  shimmerEffect: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 150,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.headlineMedium,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(128,128,128,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.1)',
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(128,128,128,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.lg,
  },
  articleCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  authorSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  authorInitial: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  authorName: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '800',
    letterSpacing: -0.3,
    flex: 1,
    fontSize: 17,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  articleTime: {
    ...TYPOGRAPHY.labelSmall,
    opacity: 0.6,
    fontWeight: '500',
    fontSize: 11,
    paddingHorizontal: SPACING.xs,
  },
  newsBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  articleTitle: {
    ...TYPOGRAPHY.headlineSmall,
    fontWeight: '900',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  articleContent: {
    ...TYPOGRAPHY.bodyMedium,
    lineHeight: 24,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    fontSize: 15,
  },
  expandButton: {
    marginTop: SPACING.sm,
    marginLeft: SPACING.lg,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderRadius: RADIUS.sm,
  },
  expandText: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '700',
    fontSize: 13,
  },
  articleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.lg,
    borderTopWidth: 1,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  footerText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '500',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  loadMoreText: {
    ...TYPOGRAPHY.labelLarge,
    fontWeight: '600',
  },
});
