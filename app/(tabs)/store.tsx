import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  InteractionManager,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Product, Category } from '@/constants/storeData';
import { storeApi } from '@/services/api';
import { useCartStore } from '@/store/cartStore';
import { useStoreStore, mapApiProduct, Banner } from '@/store/storeStore';
import { formatPrice } from '@/utils/currency';
import { ProductGridSkeleton, HorizontalSectionSkeleton } from '@/components/ui/Skeleton';
import { router } from 'expo-router';


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.xl * 2 - SPACING.md) / 2;
const H_CARD_WIDTH = (SCREEN_WIDTH - SPACING.xl * 2) * 0.42;

function getLocalizedName(item: { name: string; nameAr: string; nameKu: string }, lang: string) {
  if (lang === 'ar') return item.nameAr;
  if (lang === 'ku') return item.nameKu;
  return item.name;
}

// ─── Badge Component ───
function ProductBadge({ badge, isDark, language }: { badge: string; isDark: boolean; language?: string }) {
  const bgColor = badge === 'sale' ? '#e94560' : badge === 'hot' ? '#ff6b35' : '#10b981';
  const labels: Record<string, Record<string, string>> = {
    sale: { en: 'SALE', ar: 'تخفيض', ku: 'داشکاندن' },
    hot: { en: 'HOT', ar: 'رائج', ku: 'گەرم' },
    new: { en: 'NEW', ar: 'جديد', ku: 'نوێ' },
  };
  const lang = language || 'en';
  const label = labels[badge]?.[lang] || labels[badge]?.en || badge.toUpperCase();
  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

// ─── Star Rating ───
function StarRating({ rating, size = 10 }: { rating: number; size?: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Ionicons
        key={i}
        name={i <= Math.floor(rating) ? 'star' : i - 0.5 <= rating ? 'star-half' : 'star-outline'}
        size={size}
        color="#f59e0b"
        style={{ marginRight: 1 }}
      />
    );
  }
  return <View style={{ flexDirection: 'row', alignItems: 'center' }}>{stars}</View>;
}

// ─── Product Card ───
const ProductCard = React.memo(function ProductCard({
  product,
  colors,
  isDark,
  language,
  onPress,
}: {
  product: Product;
  colors: any;
  isDark: boolean;
  language: string;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, tension: 300, friction: 20 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 20 }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        style={[
          styles.productCard,
          {
            backgroundColor: colors.card,
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            shadowColor: isDark ? '#000' : '#64748b',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowRadius: 12,
            elevation: 4,
          },
        ]}
      >
        {product.badge && <ProductBadge badge={product.badge} isDark={isDark} language={language} />}
        {/* Discount badge top-right */}
        {product.discount && (
          <View style={styles.cardDiscountBadge}>
            <Text style={styles.cardDiscountText}>-{product.discount}%</Text>
          </View>
        )}
        <View style={[styles.productImageContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }]}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <Text style={styles.productEmoji}>{product.image}</Text>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
            {getLocalizedName(product, language)}
          </Text>
          <View style={styles.ratingRow}>
            <StarRating rating={product.rating} />
            <Text style={[styles.reviewCount, { color: colors.textTertiary }]}>({product.reviews})</Text>
          </View>
          <View style={[styles.priceRow, { marginTop: SPACING.xs + 2 }]}>
            <Text style={[styles.productPrice, { color: colors.text }]}>
              {formatPrice(product.price)}
            </Text>
            {product.originalPrice && (
              <Text style={[styles.originalPrice, { color: colors.textTertiary }]}>
                {formatPrice(product.originalPrice)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Horizontal Product Card (for "All" view) ───
const HorizontalProductCard = React.memo(function HorizontalProductCard({
  product,
  colors,
  isDark,
  language,
  onPress,
}: {
  product: Product;
  colors: any;
  isDark: boolean;
  language: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.hProductCard,
        {
          backgroundColor: colors.card,
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          shadowColor: isDark ? '#000' : '#64748b',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isDark ? 0.25 : 0.06,
          shadowRadius: 8,
          elevation: 3,
        },
      ]}
    >
      {product.badge && <ProductBadge badge={product.badge} isDark={isDark} language={language} />}
      {product.discount && (
        <View style={styles.hCardDiscountBadge}>
          <Text style={styles.hCardDiscountText}>-{product.discount}%</Text>
        </View>
      )}
      <View style={[styles.hProductImage, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }]}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <Text style={{ fontSize: 36 }}>{product.image}</Text>
        )}
      </View>
      <View style={styles.hProductInfo}>
        <Text style={[styles.hProductName, { color: colors.text }]} numberOfLines={2}>
          {getLocalizedName(product, language)}
        </Text>
        <View style={styles.ratingRow}>
          <StarRating rating={product.rating} size={9} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <Text style={[styles.hProductPrice, { color: colors.text }]}>
            {formatPrice(product.price)}
          </Text>
          {product.originalPrice && (
            <Text style={{ fontSize: 10, textDecorationLine: 'line-through', color: colors.textTertiary }}>
              {formatPrice(product.originalPrice)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Rotating Banners ───
const BANNER_WIDTH = SCREEN_WIDTH - SPACING.xl * 2;
const BANNER_HEIGHT = 180;

const RotatingBanners = React.memo(function RotatingBanners({ banners, colors, isDark, t, language }: { banners: Banner[]; colors: any; isDark: boolean; t: any; language: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<any>(null);

  const getLocalText = (en?: string, ar?: string, ku?: string) => {
    if (language === 'ar') return ar || en || '';
    if (language === 'ku') return ku || en || '';
    return en || '';
  };

  // Start / restart auto-scroll
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (banners.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % banners.length;
        scrollRef.current?.scrollTo({ x: next * BANNER_WIDTH, animated: true });
        return next;
      });
    }, 4000);
  }, [banners.length]);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  // Sync index on manual swipe
  const onScrollEnd = useCallback((e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
    if (idx >= 0 && idx < banners.length) {
      setActiveIndex(idx);
      startTimer();
    }
  }, [banners.length, startTimer]);

  if (banners.length === 0) return null;

  return (
    <View style={styles.bannerContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        snapToInterval={BANNER_WIDTH}
        decelerationRate="fast"
        bounces={false}
        scrollEventThrottle={16}
      >
        {banners.map((banner) => {
          const title = getLocalText(banner.title, banner.titleAr, banner.titleKu);
          const subtitle = getLocalText(banner.subtitle, banner.subtitleAr, banner.subtitleKu);
          const hasText = !!(title || subtitle || banner.discount);
          return (
            <View key={banner.id} style={[styles.bannerSlide, { width: BANNER_WIDTH }]}>
              {banner.imageUrl ? (
                <Image source={{ uri: banner.imageUrl }} style={styles.bannerFullImage} contentFit="cover" cachePolicy="memory-disk" />
              ) : (
                <LinearGradient
                  colors={[banner.gradientStart || (isDark ? '#1a1a2e' : '#667eea'), banner.gradientEnd || (isDark ? '#0f3460' : '#764ba2')]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.bannerFullImage}
                />
              )}
              {/* Gradient overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
                locations={[0, 0.35, 1]}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Text */}
              {hasText && (
                <View style={styles.bannerTextOverlay}>
                  {banner.discount && (
                    <View style={styles.bannerBadge}>
                      <Ionicons name="pricetag" size={10} color="#fff" />
                      <Text style={styles.bannerBadgeText}>{banner.discount}</Text>
                    </View>
                  )}
                  {!!title && <Text style={styles.bannerTitle} numberOfLines={2}>{title}</Text>}
                  {!!subtitle && <Text style={styles.bannerSubtitle} numberOfLines={2}>{subtitle}</Text>}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Dots */}
      {banners.length > 1 && (
        <View style={styles.dotsRow}>
          {banners.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
});

// ─── Main Store Screen ───
export default function StoreScreen() {
  const { colorScheme, isDark } = useTheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, language } = useRTL();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const categoryScrollRef = useRef<ScrollView>(null);
  const categoryLayoutsRef = useRef<{ [key: string]: { x: number; width: number } }>({});
  const { addItem, getItemCount } = useCartStore();
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  // ── Zustand store (cached data) ──
  const categories = useStoreStore(s => s.categories);
  const overviewProducts = useStoreStore(s => s.overviewProducts);
  const featuredProducts = useStoreStore(s => s.featuredProducts);
  const newProducts = useStoreStore(s => s.newProducts);
  const saleProducts = useStoreStore(s => s.saleProducts);
  const banners = useStoreStore(s => s.banners);
  const hasCache = useStoreStore(s => s.hasCache);
  const shellLoading = useStoreStore(s => s.shellLoading);
  const overviewLoading = useStoreStore(s => s.overviewLoading);
  const fetchAll = useStoreStore(s => s.fetchAll);

  // ── Local state (grid pagination + UI) ──
  const [gridProducts, setGridProducts] = useState<Product[]>([]);
  const loading = !hasCache && (shellLoading || overviewLoading);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [gridPage, setGridPage] = useState(1);
  const [gridHasMore, setGridHasMore] = useState(true);
  const [gridTotal, setGridTotal] = useState(0);
  const [filterType, setFilterType] = useState<'featured' | 'new' | 'sale' | null>(null);
  const PAGE_SIZE = 10;
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCategoryRef = useRef('all');
  const prevSearchRef = useRef('');
  const prevFilterRef = useRef<string | null>(null);

  // ── Load paginated grid products (for category/search/filter view) ──
  const loadGridPage = useCallback(async (params: { categoryId?: string; search?: string; filter?: 'featured' | 'new' | 'sale' | null; page: number; reset: boolean }) => {
    if (params.reset) {
      setLoadingGrid(true);
      setGridProducts([]);
    } else {
      setLoadingMore(true);
    }
    try {
      const apiParams: any = { page: params.page, limit: PAGE_SIZE };
      if (params.categoryId && params.categoryId !== 'all') apiParams.categoryId = params.categoryId;
      if (params.search) apiParams.search = params.search;
      if (params.filter === 'featured') apiParams.featured = true;
      if (params.filter === 'sale') apiParams.badge = 'sale';
      if (params.filter === 'new') apiParams.badge = 'new';
      const res = await storeApi.getProducts(apiParams);
      const newProducts = (res.data.data || []).map(mapApiProduct);
      const pagination = res.data.pagination;
      setGridProducts(prev => params.reset ? newProducts : [...prev, ...newProducts]);
      setGridPage(params.page);
      setGridHasMore(pagination?.hasMore ?? newProducts.length >= PAGE_SIZE);
      setGridTotal(pagination?.total ?? 0);
    } catch (error) {
      
    } finally {
      setLoadingMore(false);
      setLoadingGrid(false);
    }
  }, []);

  // ── Initial load — stale-while-revalidate via InteractionManager ──
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      fetchAll();
    });
    return () => task.cancel();
  }, [fetchAll]);

  // ── React to category/search/filter changes ──
  useEffect(() => {
    const isGrid = selectedCategory !== 'all' || !!searchQuery || !!filterType;
    const catChanged = prevCategoryRef.current !== selectedCategory;
    const searchChanged = prevSearchRef.current !== searchQuery;
    const filterChanged = prevFilterRef.current !== filterType;
    prevCategoryRef.current = selectedCategory;
    prevSearchRef.current = searchQuery;
    prevFilterRef.current = filterType;

    if (!catChanged && !searchChanged && !filterChanged) return;

    if (isGrid) {
      if (searchChanged && !catChanged && !filterChanged) {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
          loadGridPage({ categoryId: selectedCategory, search: searchQuery, filter: filterType, page: 1, reset: true });
        }, 400);
      } else {
        loadGridPage({ categoryId: selectedCategory, search: searchQuery, filter: filterType, page: 1, reset: true });
      }
    }
  }, [selectedCategory, searchQuery, filterType, loadGridPage]);

  // ── Refresh ──
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (selectedCategory === 'all' && !searchQuery && !filterType) {
      await fetchAll(true);
    } else {
      await Promise.all([
        fetchAll(true),
        loadGridPage({ categoryId: selectedCategory, search: searchQuery, filter: filterType, page: 1, reset: true }),
      ]);
    }
    setRefreshing(false);
  }, [selectedCategory, searchQuery, filterType, fetchAll, loadGridPage]);

  // ── Load more (infinite scroll) ──
  const handleLoadMore = useCallback(() => {
    if (loadingMore || !gridHasMore) return;
    loadGridPage({ categoryId: selectedCategory, search: searchQuery, filter: filterType, page: gridPage + 1, reset: false });
  }, [loadingMore, gridHasMore, gridPage, selectedCategory, searchQuery, filterType, loadGridPage]);

  // ── Current view ──
  const isGridView = selectedCategory !== 'all' || !!searchQuery || !!filterType;

  // ── Get grid title based on filter type ──
  const getGridTitle = useCallback(() => {
    if (filterType === 'featured') return t('store.featuredProducts');
    if (filterType === 'new') return t('store.newlyAdded');
    if (filterType === 'sale') return t('store.discounts');
    if (selectedCategory !== 'all') {
      const cat = categories.find((c: Category) => c.id === selectedCategory);
      return cat ? getLocalizedName(cat, language) : t('store.allProducts');
    }
    return t('store.allProducts');
  }, [filterType, selectedCategory, categories, language, t]);

  // ── Handle "View More" for filter sections ──
  const handleViewMore = useCallback((type: 'featured' | 'new' | 'sale') => {
    setSelectedCategory('all');
    setFilterType(type);
  }, []);

  // ── Scroll category strip to selected category ──
  const scrollCategoryIntoView = useCallback((categoryId: string) => {
    const layout = categoryLayoutsRef.current[categoryId];
    if (layout && categoryScrollRef.current) {
      const scrollTo = Math.max(0, layout.x - SCREEN_WIDTH / 2 + layout.width / 2);
      categoryScrollRef.current.scrollTo({ x: scrollTo, animated: true });
    }
  }, []);

  // ── Select category handler ──
  const handleSelectCategory = useCallback((categoryId: string) => {
    if (categoryId === 'all' && (selectedCategory !== 'all' || filterType)) {
      setLoadingOverview(true);
      setSelectedCategory('all');
      setFilterType(null);
      setTimeout(() => scrollCategoryIntoView('all'), 50);
      InteractionManager.runAfterInteractions(() => {
        setLoadingOverview(false);
      });
      return;
    }
    setFilterType(null);
    setSelectedCategory(categoryId);
    setTimeout(() => scrollCategoryIntoView(categoryId), 50);
  }, [scrollCategoryIntoView, selectedCategory, filterType]);

  const renderCategoryItem = useCallback(
    ({ item }: { item: Category }) => {
      const isActive = selectedCategory === item.id;
      return (
        <TouchableOpacity
          key={item.id}
          onPress={() => handleSelectCategory(item.id)}
          onLayout={(e) => {
            categoryLayoutsRef.current[item.id] = {
              x: e.nativeEvent.layout.x,
              width: e.nativeEvent.layout.width,
            };
          }}
          style={[
            styles.categoryChip,
            {
              backgroundColor: isActive
                ? isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'
                : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderColor: isActive ? colors.accent : 'transparent',
              borderWidth: 1,
            },
          ]}
        >
          <Ionicons
            name={(item.icon + (isActive ? '' : '-outline')) as any}
            size={16}
            color={isActive ? colors.text : colors.textTertiary}
          />
          <Text
            style={[
              styles.categoryLabel,
              { color: isActive ? colors.text : colors.textTertiary, fontWeight: isActive ? '600' : '400' },
            ]}
          >
            {getLocalizedName(item, language)}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedCategory, isDark, colors, language, handleSelectCategory]
  );

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize(product.sizes ? product.sizes[0] : null);
    setSelectedColor(product.colors ? product.colors[0] : null);
    setQuantity(1);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <Image source={isDark ? require('@/assets/logo-white.png') : require('@/assets/logo-black.png')} style={{ width: 130, height: 32 }} contentFit="contain" />
          <TouchableOpacity
            style={[styles.cartBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
            onPress={() => router.push('/cart' as any)}
          >
            <Ionicons name="cart-outline" size={22} color={colors.text} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        {/* Search Bar */}
        <View style={[
          styles.searchBar,
          {
            flexDirection: isRTL ? 'row-reverse' : 'row',
            backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#f2f3f5',
            borderColor: searchQuery ? colors.accent : 'transparent',
          },
        ]}>
          <View style={[styles.searchIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
            <Ionicons name="search" size={16} color={searchQuery ? colors.accent : colors.textTertiary} />
          </View>
          <TextInput
            style={[styles.searchInput, { color: colors.text, textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}
            placeholder={t('store.searchProducts')}
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={[styles.searchClearBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}
            >
              <Ionicons name="close" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Content ── */}
      {isGridView ? (
        /* ── Grid view: single FlatList with header for true virtualization ── */
        <FlatList
          data={loadingGrid ? [] : gridProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={gridProducts.length > 0 ? { gap: SPACING.md, paddingHorizontal: SPACING.xl } : undefined}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
          ListHeaderComponent={
            <>
              {/* Banner */}
              <View style={{ paddingHorizontal: SPACING.xl, paddingTop: SPACING.md }}>
                <RotatingBanners banners={banners} colors={colors} isDark={isDark} t={t} language={language} />
              </View>
              {/* Categories with back button */}
              <View style={{ paddingTop: SPACING.lg }}>
                <View style={[styles.sectionHeader, { paddingHorizontal: SPACING.xl }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('store.categories')}</Text>
                </View>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginTop: SPACING.sm }}>
                  <TouchableOpacity
                    onPress={() => handleSelectCategory('all')}
                    style={[styles.gridBackBtn, { backgroundColor: colors.accent, marginStart: SPACING.xl }]}
                  >
                    <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={16} color="#fff" />
                  </TouchableOpacity>
                  <ScrollView
                    ref={categoryScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: SPACING.sm, gap: SPACING.sm }}
                  >
                    {categories.map((item) => renderCategoryItem({ item }))}
                  </ScrollView>
                </View>
              </View>
              {/* Section title */}
              <View style={{ paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.sm }}>
                <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {getGridTitle()}
                  </Text>
                  {!loadingGrid && (
                    <Text style={[styles.productCount, { color: colors.textTertiary }]}>
                      {gridTotal > 0 ? `${gridTotal} ${t('store.items')}` : `${gridProducts.length} ${t('store.items')}`}
                    </Text>
                  )}
                </View>
              </View>
              {loadingGrid && <ProductGridSkeleton />}
            </>
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              colors={colors}
              isDark={isDark}
              language={language}
              onPress={() => openProductDetail(item)}
            />
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: SPACING.xl, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loadingGrid ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                  <Ionicons name="bag-outline" size={40} color={colors.textTertiary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('store.noProducts')}</Text>
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>{t('store.searchProducts')}</Text>
              </View>
            ) : null
          }
        />
      ) : (
        /* ── "All" view: horizontal sections (few items each) ── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={{ paddingHorizontal: SPACING.xl, paddingTop: SPACING.md }}>
            <RotatingBanners banners={banners} colors={colors} isDark={isDark} t={t} language={language} />
          </View>
          {/* Category Strip */}
          <View style={{ paddingTop: SPACING.lg }}>
            <ScrollView
              ref={categoryScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: SPACING.xl, gap: SPACING.sm }}
            >
              {categories.map((item) => renderCategoryItem({ item }))}
            </ScrollView>
          </View>
          <View style={{ paddingTop: SPACING.lg }}>
            {loading || loadingOverview ? (
              <HorizontalSectionSkeleton count={3} />
            ) : (
              <>
                {/* Featured Products */}
                {featuredProducts.length > 0 && (
                  <View style={{ marginBottom: SPACING.xl }}>
                    <View style={[styles.catSectionHeader, { paddingHorizontal: SPACING.xl }]}>
                      <View style={[styles.catSectionLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.catIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                          <Ionicons name="star" size={16} color="#f59e0b" />
                        </View>
                        <Text style={[styles.catSectionTitle, { color: colors.text }]}>
                          {t('store.featuredProducts')}
                        </Text>
                      </View>
                      {featuredProducts.length > 4 && (
                        <TouchableOpacity
                          style={[styles.viewMoreBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
                          onPress={() => handleViewMore('featured')}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.viewMoreText, { color: colors.accent }]}>{t('store.viewMore')}</Text>
                          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={14} color={colors.accent} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: SPACING.xl, gap: SPACING.md, paddingTop: SPACING.sm }}
                    >
                      {featuredProducts.slice(0, 4).map((product: Product) => (
                        <HorizontalProductCard
                          key={product.id}
                          product={product}
                          colors={colors}
                          isDark={isDark}
                          language={language}
                          onPress={() => openProductDetail(product)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Newly Added */}
                {newProducts.length > 0 && (
                  <View style={{ marginBottom: SPACING.xl }}>
                    <View style={[styles.catSectionHeader, { paddingHorizontal: SPACING.xl }]}>
                      <View style={[styles.catSectionLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.catIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                          <Ionicons name="sparkles" size={16} color="#10b981" />
                        </View>
                        <Text style={[styles.catSectionTitle, { color: colors.text }]}>
                          {t('store.newlyAdded')}
                        </Text>
                      </View>
                      {newProducts.length > 4 && (
                        <TouchableOpacity
                          style={[styles.viewMoreBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
                          onPress={() => handleViewMore('new')}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.viewMoreText, { color: colors.accent }]}>{t('store.viewMore')}</Text>
                          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={14} color={colors.accent} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: SPACING.xl, gap: SPACING.md, paddingTop: SPACING.sm }}
                    >
                      {newProducts.slice(0, 4).map((product: Product) => (
                        <HorizontalProductCard
                          key={product.id}
                          product={product}
                          colors={colors}
                          isDark={isDark}
                          language={language}
                          onPress={() => openProductDetail(product)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Discounts */}
                {saleProducts.length > 0 && (
                  <View style={{ marginBottom: SPACING.xl }}>
                    <View style={[styles.catSectionHeader, { paddingHorizontal: SPACING.xl }]}>
                      <View style={[styles.catSectionLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.catIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                          <Ionicons name="pricetag" size={16} color="#e94560" />
                        </View>
                        <Text style={[styles.catSectionTitle, { color: colors.text }]}>
                          {t('store.discounts')}
                        </Text>
                      </View>
                      {saleProducts.length > 4 && (
                        <TouchableOpacity
                          style={[styles.viewMoreBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
                          onPress={() => handleViewMore('sale')}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.viewMoreText, { color: colors.accent }]}>{t('store.viewMore')}</Text>
                          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={14} color={colors.accent} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: SPACING.xl, gap: SPACING.md, paddingTop: SPACING.sm }}
                    >
                      {saleProducts.slice(0, 4).map((product: Product) => (
                        <HorizontalProductCard
                          key={product.id}
                          product={product}
                          colors={colors}
                          isDark={isDark}
                          language={language}
                          onPress={() => openProductDetail(product)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          colors={colors}
          isDark={isDark}
          language={language}
          t={t}
          isRTL={isRTL}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          quantity={quantity}
          setQuantity={setQuantity}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={() => {
            addItem({
              productId: selectedProduct.id,
              name: selectedProduct.name,
              nameAr: selectedProduct.nameAr,
              nameKu: selectedProduct.nameKu,
              price: selectedProduct.price,
              originalPrice: selectedProduct.originalPrice,
              discount: selectedProduct.discount,
              image: selectedProduct.image,
              imageUrl: selectedProduct.imageUrl,
              quantity,
              selectedSize,
              selectedColor,
            });
            setSelectedProduct(null);
          }}
        />
      )}
    </View>
  );
}

// ─── Product Detail Modal ───
function ProductDetailModal({
  product, colors, isDark, language, t, isRTL,
  selectedSize, setSelectedSize, selectedColor, setSelectedColor,
  quantity, setQuantity, onClose, onAddToCart,
}: {
  product: Product; colors: any; isDark: boolean; language: string; t: any; isRTL: boolean;
  selectedSize: string | null; setSelectedSize: (s: string | null) => void;
  selectedColor: string | null; setSelectedColor: (c: string | null) => void;
  quantity: number; setQuantity: (q: number) => void; onClose: () => void;
  onAddToCart: () => void;
}) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.modalContent, { backgroundColor: colors.background }]}>
        {/* Handle Indicator */}
        <View style={styles.modalHandle}>
          <View style={[styles.modalHandleBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />
        </View>
        {/* Close Button */}
        <TouchableOpacity onPress={onClose} style={[styles.modalClose, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Product Image */}
          <View style={[styles.modalImageContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f5f7fa' }]}>
            {product.badge && <ProductBadge badge={product.badge} isDark={isDark} language={language} />}
            {product.discount && (
              <View style={styles.modalDiscountBadge}>
                <Text style={styles.modalDiscountText}>-{product.discount}%</Text>
              </View>
            )}
            {product.imageUrl ? (
              <Image source={{ uri: product.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="memory-disk" />
            ) : (
              <Text style={styles.modalEmoji}>{product.image}</Text>
            )}
          </View>

          <View style={{ padding: SPACING.lg }}>
            {/* Name & Rating */}
            <Text style={[styles.modalProductName, { color: colors.text }]}>
              {getLocalizedName(product, language)}
            </Text>
            <View style={[styles.ratingRow, { marginTop: SPACING.xs }]}>
              <StarRating rating={product.rating} size={14} />
              <Text style={[styles.modalReviews, { color: colors.textSecondary }]}>
                {product.rating} ({product.reviews} {t('store.reviews')})
              </Text>
            </View>

            {/* Price */}
            <View style={[styles.modalPriceRow, { marginTop: SPACING.md, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: SPACING.sm }}>
                <Text style={[styles.modalPrice, { color: colors.text }]}>{formatPrice(product.price)}</Text>
                {product.originalPrice && (
                  <Text style={[styles.modalOriginalPrice, { color: colors.textTertiary }]}>
                    {formatPrice(product.originalPrice)}
                  </Text>
                )}
              </View>
              {product.discount && (
                <View style={styles.modalDiscountTag}>
                  <Ionicons name="pricetag" size={11} color="#fff" />
                  <Text style={styles.modalDiscountTagText}>-{product.discount}%</Text>
                </View>
              )}
            </View>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <View style={{ marginTop: SPACING.md }}>
                <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>{t('store.color')}</Text>
                <View style={styles.colorsRow}>
                  {product.colors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setSelectedColor(color)}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: color, borderColor: selectedColor === color ? colors.accent : colors.border },
                        selectedColor === color && styles.colorCircleActive,
                      ]}
                    >
                      {selectedColor === color && (
                        <Ionicons name="checkmark" size={16} color={color === '#ffffff' || color === '#fff' ? '#000' : '#fff'} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <View style={{ marginTop: SPACING.md }}>
                <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>{t('store.size')}</Text>
                <View style={styles.sizesRow}>
                  {product.sizes.map((size) => (
                    <TouchableOpacity
                      key={size}
                      onPress={() => setSelectedSize(size)}
                      style={[
                        styles.sizeChip,
                        {
                          backgroundColor: selectedSize === size
                            ? isDark ? colors.accent + '20' : colors.accent + '12'
                            : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                          borderColor: selectedSize === size ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.sizeText, { color: selectedSize === size ? colors.accent : colors.textSecondary, fontWeight: selectedSize === size ? '700' : '500' }]}>
                        {size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Quantity & Stock */}
            <View style={[styles.quantityStockRow, { marginTop: SPACING.md }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>{t('store.quantity')}</Text>
                <View style={styles.quantityRow}>
                  <TouchableOpacity
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    style={[styles.quantityBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.border }]}
                  >
                    <Ionicons name="remove" size={18} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.quantityText, { color: colors.text }]}>{quantity}</Text>
                  <TouchableOpacity
                    onPress={() => setQuantity(quantity + 1)}
                    style={[styles.quantityBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.border }]}
                  >
                    <Ionicons name="add" size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.stockPill, { backgroundColor: product.inStock ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                <Ionicons name={product.inStock ? 'checkmark-circle' : 'close-circle'} size={14} color={product.inStock ? '#10b981' : '#ef4444'} />
                <Text style={[styles.stockText, { color: product.inStock ? '#10b981' : '#ef4444' }]}>
                  {product.inStock ? t('store.inStock') : t('store.outOfStock')}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action */}
        <View style={[styles.modalBottom, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <View>
            <Text style={[styles.totalLabel, { color: colors.textTertiary }]}>{t('store.total')}</Text>
            <Text style={[styles.totalPrice, { color: colors.text }]}>{formatPrice(product.price * quantity)}</Text>
          </View>
          <TouchableOpacity style={styles.addToCartBtn} activeOpacity={0.8} onPress={onAddToCart}>
            <LinearGradient
              colors={isDark ? ['#4a4a4a', '#3a3a3a'] : ['#333333', '#1a1a1a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addToCartGradient}
            >
              <Ionicons name="cart" size={18} color="#fff" />
              <Text style={styles.addToCartText}>{t('store.addToCart')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24) + 14,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 0.5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.displaySmall,
    fontWeight: '700',
  },
  cartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#e94560',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  searchBar: {
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.sm,
    height: 44,
    borderWidth: 1.5,
    gap: SPACING.sm,
  },
  searchIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    paddingVertical: 0,
    fontWeight: '400',
    fontFamily: FONTS.regular,
  },
  searchClearBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContainer: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    height: BANNER_HEIGHT,
  },
  bannerSlide: {
    height: BANNER_HEIGHT,
    overflow: 'hidden',
  },
  bannerFullImage: {
    width: '100%',
    height: '100%',
  },
  bannerTextOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    paddingBottom: SPACING.lg + 4,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
    marginBottom: SPACING.xs,
  },
  bannerBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: FONTS.extraBold,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: 2,
    fontFamily: FONTS.regular,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  dotsRow: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 20,
    elevation: 10,
  },
  dot: {
    borderRadius: 4,
  },
  dotActive: {
    width: 18,
    height: 7,
    backgroundColor: '#fff',
  },
  dotInactive: {
    width: 7,
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.headlineSmall,
    fontWeight: '700',
  },
  productCount: {
    ...TYPOGRAPHY.bodySmall,
  },
  gridBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md + 2,
    paddingVertical: SPACING.sm + 1,
    borderRadius: RADIUS.full,
    gap: SPACING.xs + 1,
  },
  categoryLabel: {
    fontSize: 12.5,
    fontFamily: FONTS.semiBold,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  productCard: {
    width: CARD_WIDTH,
    borderRadius: RADIUS.lg + 2,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  productImageContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  productEmoji: {
    fontSize: 48,
  },
  productInfo: {
    padding: SPACING.md,
  },
  productName: {
    ...TYPOGRAPHY.titleSmall,
    marginBottom: SPACING.xxs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewCount: {
    fontSize: 10,
    fontFamily: FONTS.regular,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  productPrice: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '700',
  },
  originalPrice: {
    fontSize: 11,
    textDecorationLine: 'line-through',
    fontFamily: FONTS.regular,
  },
  badge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    zIndex: 10,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: FONTS.extraBold,
  },
  cardDiscountBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    zIndex: 10,
    backgroundColor: '#e94560',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  cardDiscountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: SPACING.sm,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '600',
  },
  emptyText: {
    ...TYPOGRAPHY.bodySmall,
  },
  // Modal Styles
  modalOverlay: {
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    maxHeight: '90%',
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    overflow: 'hidden',
  },
  modalClose: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHandle: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  modalHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  modalImageContainer: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modalDiscountBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    zIndex: 10,
    backgroundColor: '#e94560',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  modalDiscountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  modalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  modalDiscountTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#e94560',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  modalDiscountTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  modalEmoji: {
    fontSize: 60,
  },
  modalProductName: {
    ...TYPOGRAPHY.titleLarge,
    fontWeight: '700',
  },
  modalReviews: {
    fontSize: 11,
    marginLeft: 4,
  },
  modalPrice: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: FONTS.extraBold,
  },
  modalOriginalPrice: {
    fontSize: 13,
    textDecorationLine: 'line-through',
    fontFamily: FONTS.regular,
  },
  optionLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONTS.semiBold,
  },
  colorsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleActive: {
    borderWidth: 2.5,
  },
  sizesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  sizeChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    minWidth: 38,
    alignItems: 'center',
  },
  sizeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  quantityBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 26,
    textAlign: 'center',
    fontFamily: FONTS.bold,
  },
  quantityStockRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  stockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  modalBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 80 : 70,
    borderTopWidth: 0.5,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  totalPrice: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: FONTS.extraBold,
  },
  addToCartBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  addToCartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.xs,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  // ── Horizontal Product Card styles ──
  hProductCard: {
    width: H_CARD_WIDTH,
    borderRadius: RADIUS.lg + 2,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  hProductImage: {
    width: '100%',
    height: H_CARD_WIDTH * 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  hProductInfo: {
    padding: SPACING.sm + 1,
  },
  hProductName: {
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 3,
    lineHeight: 17,
    fontFamily: FONTS.semiBold,
  },
  hProductPrice: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: FONTS.extraBold,
  },
  hCardDiscountBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    zIndex: 10,
    backgroundColor: '#e94560',
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
  },
  hCardDiscountText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  // ── Category Section styles (All view) ──
  catSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  catSectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  catIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    fontFamily: FONTS.bold,
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  viewMoreText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
});
