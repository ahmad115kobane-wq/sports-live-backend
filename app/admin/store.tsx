import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice } from '@/utils/currency';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { storeApi, orderApi } from '@/services/api';
import AppDialog from '@/components/ui/AppDialog';
import AppModal from '@/components/ui/AppModal';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '@/constants/config';

// ─── Types ───
interface StoreCategory {
  id: string;
  name: string;
  nameAr: string;
  nameKu: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
}

interface StoreProduct {
  id: string;
  categoryId: string;
  name: string;
  nameAr: string;
  nameKu: string;
  description?: string;
  descriptionAr?: string;
  descriptionKu?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  imageUrl?: string;
  emoji?: string;
  badge?: string;
  rating: number;
  reviewsCount: number;
  colors?: string;
  sizes?: string;
  inStock: boolean;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  category?: StoreCategory;
}

interface StoreBanner {
  id: string;
  title: string;
  titleAr: string;
  titleKu: string;
  subtitle?: string;
  subtitleAr?: string;
  subtitleKu?: string;
  imageUrl?: string;
  gradientStart?: string;
  gradientEnd?: string;
  discount?: string;
  isActive: boolean;
  sortOrder: number;
}

const ICON_OPTIONS = [
  'grid', 'shirt', 'footsteps', 'football', 'watch',
  'fitness', 'basketball', 'trophy', 'medal', 'ribbon',
  'bag-handle', 'gift', 'pricetag', 'cart', 'storefront',
];

const BADGE_OPTIONS = [
  { value: '', label: 'بدون' },
  { value: 'new', label: 'جديد' },
  { value: 'hot', label: 'رائج' },
  { value: 'sale', label: 'تخفيض' },
];

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];

const COLOR_OPTIONS = [
  { hex: '#000000', name: 'أسود' },
  { hex: '#FFFFFF', name: 'أبيض' },
  { hex: '#EF4444', name: 'أحمر' },
  { hex: '#3B82F6', name: 'أزرق' },
  { hex: '#10B981', name: 'أخضر' },
  { hex: '#F59E0B', name: 'أصفر' },
  { hex: '#8B5CF6', name: 'بنفسجي' },
  { hex: '#EC4899', name: 'وردي' },
  { hex: '#F97316', name: 'برتقالي' },
  { hex: '#6B7280', name: 'رمادي' },
  { hex: '#92400E', name: 'بني' },
  { hex: '#1E3A5F', name: 'كحلي' },
];

// ─── Main Screen ───
export default function AdminStoreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();

  const [activeTab, setActiveTab] = useState<'categories' | 'products' | 'banners' | 'orders'>('categories');
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [banners, setBanners] = useState<StoreBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [editingBanner, setEditingBanner] = useState<StoreBanner | null>(null);

  // Dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<any>({ type: 'error', title: '', message: '' });

  // Category form
  const [catName, setCatName] = useState('');
  const [catNameAr, setCatNameAr] = useState('');
  const [catNameKu, setCatNameKu] = useState('');
  const [catIcon, setCatIcon] = useState('grid');
  const [catSortOrder, setCatSortOrder] = useState('0');
  const [catIsActive, setCatIsActive] = useState(true);

  // Product form
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodNameAr, setProdNameAr] = useState('');
  const [prodNameKu, setProdNameKu] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodDescAr, setProdDescAr] = useState('');
  const [prodDescKu, setProdDescKu] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodOriginalPrice, setProdOriginalPrice] = useState('');
  const [prodDiscount, setProdDiscount] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodEmoji, setProdEmoji] = useState('📦');
  const [prodBadge, setProdBadge] = useState('');
  const [prodSizes, setProdSizes] = useState<string[]>([]);
  const [prodColors, setProdColors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [prodInStock, setProdInStock] = useState(true);
  const [prodIsFeatured, setProdIsFeatured] = useState(false);
  const [prodIsActive, setProdIsActive] = useState(true);
  const [prodSortOrder, setProdSortOrder] = useState('0');

  // Orders
  const [orders, setOrders] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderNote, setOrderNote] = useState('');
  const [orderDeliveryTime, setOrderDeliveryTime] = useState('');
  const [orderDeliveryFee, setOrderDeliveryFee] = useState('5000');
  const [orderCounts, setOrderCounts] = useState({ pending: 0, approved: 0, rejected: 0, delivered: 0, total: 0 });

  // Banner form
  const [banTitle, setBanTitle] = useState('');
  const [banTitleAr, setBanTitleAr] = useState('');
  const [banTitleKu, setBanTitleKu] = useState('');
  const [banSubtitle, setBanSubtitle] = useState('');
  const [banSubtitleAr, setBanSubtitleAr] = useState('');
  const [banSubtitleKu, setBanSubtitleKu] = useState('');
  const [banImageUrl, setBanImageUrl] = useState('');
  const [banDiscount, setBanDiscount] = useState('');
  const [banIsActive, setBanIsActive] = useState(true);
  const [banSortOrder, setBanSortOrder] = useState('0');

  // ─── Load Data ───
  const loadData = useCallback(async () => {
    try {
      const [catRes, prodRes, banRes, ordRes, countRes] = await Promise.all([
        storeApi.adminGetCategories(),
        storeApi.adminGetProducts(),
        storeApi.adminGetBanners(),
        orderApi.adminGetAllOrders(),
        orderApi.adminGetOrderCounts(),
      ]);
      setCategories(catRes.data.data || []);
      setProducts(prodRes.data.data || []);
      setBanners(banRes.data.data || []);
      setOrders(ordRes.data.data || []);
      setOrderCounts(countRes.data.data || { pending: 0, approved: 0, rejected: 0, delivered: 0, total: 0 });
    } catch (error) {
      console.error('Load store data error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const showError = (title: string, message: string) => {
    setDialogConfig({ type: 'error', title, message });
    setDialogVisible(true);
  };

  // ─── Category CRUD ───
  const openCategoryModal = (cat?: StoreCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.name);
      setCatNameAr(cat.nameAr);
      setCatNameKu(cat.nameKu);
      setCatIcon(cat.icon);
      setCatSortOrder(String(cat.sortOrder));
      setCatIsActive(cat.isActive);
    } else {
      setEditingCategory(null);
      setCatName(''); setCatNameAr(''); setCatNameKu('');
      setCatIcon('grid'); setCatSortOrder('0'); setCatIsActive(true);
    }
    setShowCategoryModal(true);
  };

  const saveCategory = async () => {
    if (!catName || !catNameAr || !catNameKu) {
      showError('خطأ', 'يرجى ملء جميع حقول الاسم');
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: catName, nameAr: catNameAr, nameKu: catNameKu,
        icon: catIcon, sortOrder: parseInt(catSortOrder) || 0, isActive: catIsActive,
      };
      if (editingCategory) {
        await storeApi.adminUpdateCategory(editingCategory.id, data);
      } else {
        await storeApi.adminCreateCategory(data);
      }
      setShowCategoryModal(false);
      loadData();
    } catch (error) {
      showError('خطأ', 'فشل في حفظ الفئة');
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = (cat: StoreCategory) => {
    Alert.alert('حذف الفئة', `هل أنت متأكد من حذف "${cat.nameAr}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف', style: 'destructive',
        onPress: async () => {
          try {
            await storeApi.adminDeleteCategory(cat.id);
            loadData();
          } catch (error) {
            showError('خطأ', 'فشل في حذف الفئة');
          }
        },
      },
    ]);
  };

  // ─── Product CRUD ───
  const openProductModal = (prod?: StoreProduct) => {
    if (prod) {
      setEditingProduct(prod);
      setProdCategoryId(prod.categoryId);
      setProdName(prod.name); setProdNameAr(prod.nameAr); setProdNameKu(prod.nameKu);
      setProdDesc(prod.description || ''); setProdDescAr(prod.descriptionAr || ''); setProdDescKu(prod.descriptionKu || '');
      setProdPrice(String(prod.price)); setProdOriginalPrice(prod.originalPrice ? String(prod.originalPrice) : '');
      setProdDiscount(prod.discount ? String(prod.discount) : '');
      setProdImageUrl(prod.imageUrl || '');
      setProdEmoji(prod.emoji || '📦'); setProdBadge(prod.badge || '');
      setProdSizes(prod.sizes ? (typeof prod.sizes === 'string' ? JSON.parse(prod.sizes) : Array.isArray(prod.sizes) ? prod.sizes : []) : []);
      setProdColors(prod.colors ? (typeof prod.colors === 'string' ? JSON.parse(prod.colors) : Array.isArray(prod.colors) ? prod.colors : []) : []);
      setProdInStock(prod.inStock); setProdIsFeatured(prod.isFeatured);
      setProdIsActive(prod.isActive); setProdSortOrder(String(prod.sortOrder));
    } else {
      setEditingProduct(null);
      setProdCategoryId(categories.length > 0 ? categories[0].id : '');
      setProdName(''); setProdNameAr(''); setProdNameKu('');
      setProdDesc(''); setProdDescAr(''); setProdDescKu('');
      setProdPrice(''); setProdOriginalPrice(''); setProdDiscount('');
      setProdImageUrl(''); setProdEmoji('📦'); setProdBadge('');
      setProdSizes([]); setProdColors([]);
      setProdInStock(true); setProdIsFeatured(false);
      setProdIsActive(true); setProdSortOrder('0');
    }
    setShowProductModal(true);
  };

  const saveProduct = async () => {
    if (!prodCategoryId || !prodName || !prodNameAr || !prodNameKu || !prodPrice) {
      showError('خطأ', 'يرجى ملء الحقول المطلوبة');
      return;
    }
    setSaving(true);
    try {
      const data = {
        categoryId: prodCategoryId,
        name: prodName, nameAr: prodNameAr, nameKu: prodNameKu,
        description: prodDesc || null, descriptionAr: prodDescAr || null, descriptionKu: prodDescKu || null,
        price: parseFloat(prodPrice),
        originalPrice: prodOriginalPrice ? parseFloat(prodOriginalPrice) : null,
        discount: prodDiscount ? parseInt(prodDiscount) : null,
        imageUrl: prodImageUrl || null,
        emoji: prodEmoji, badge: prodBadge || null,
        sizes: prodSizes.length > 0 ? prodSizes : null,
        colors: prodColors.length > 0 ? prodColors : null,
        inStock: prodInStock, isFeatured: prodIsFeatured,
        isActive: prodIsActive, sortOrder: parseInt(prodSortOrder) || 0,
      };
      if (editingProduct) {
        await storeApi.adminUpdateProduct(editingProduct.id, data);
      } else {
        await storeApi.adminCreateProduct(data);
      }
      setShowProductModal(false);
      loadData();
    } catch (error) {
      showError('خطأ', 'فشل في حفظ المنتج');
    } finally {
      setSaving(false);
    }
  };

  // ─── Image Picker ───
  const pickImage = async (target: 'product' | 'banner') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: target === 'banner' ? [16, 9] : [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setUploading(true);
    try {
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('image', {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || `store-${Date.now()}.jpg`,
      } as any);
      const res = await storeApi.adminUploadImage(formData);
      const imageUrl = `${API_URL.replace('/api', '')}${res.data.data.imageUrl}`;
      if (target === 'product') setProdImageUrl(imageUrl);
      else setBanImageUrl(imageUrl);
    } catch (error) {
      console.error('Upload error:', error);
      showError('خطأ', 'فشل في رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  // ─── Size/Color Toggle Helpers ───
  const toggleSize = (size: string) => {
    setProdSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };
  const toggleColor = (hex: string) => {
    setProdColors(prev => prev.includes(hex) ? prev.filter(c => c !== hex) : [...prev, hex]);
  };

  const deleteProduct = (prod: StoreProduct) => {
    Alert.alert('حذف المنتج', `هل أنت متأكد من حذف "${prod.nameAr}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف', style: 'destructive',
        onPress: async () => {
          try {
            await storeApi.adminDeleteProduct(prod.id);
            loadData();
          } catch (error) {
            showError('خطأ', 'فشل في حذف المنتج');
          }
        },
      },
    ]);
  };

  // ─── Banner CRUD ───
  const openBannerModal = (ban?: StoreBanner) => {
    if (ban) {
      setEditingBanner(ban);
      setBanTitle(ban.title); setBanTitleAr(ban.titleAr); setBanTitleKu(ban.titleKu);
      setBanSubtitle(ban.subtitle || ''); setBanSubtitleAr(ban.subtitleAr || ''); setBanSubtitleKu(ban.subtitleKu || '');
      setBanImageUrl(ban.imageUrl || '');
      setBanDiscount(ban.discount || '');
      setBanIsActive(ban.isActive); setBanSortOrder(String(ban.sortOrder));
    } else {
      setEditingBanner(null);
      setBanTitle(''); setBanTitleAr(''); setBanTitleKu('');
      setBanSubtitle(''); setBanSubtitleAr(''); setBanSubtitleKu('');
      setBanImageUrl('');
      setBanDiscount(''); setBanIsActive(true); setBanSortOrder('0');
    }
    setShowBannerModal(true);
  };

  const saveBanner = async () => {
    if (!banImageUrl) {
      showError('خطأ', 'يرجى رفع صورة للإعلان');
      return;
    }
    setSaving(true);
    try {
      const data = {
        title: banTitle || 'إعلان', titleAr: banTitleAr || 'إعلان', titleKu: banTitleKu || 'ڕیکلام',
        subtitle: banSubtitle || null, subtitleAr: banSubtitleAr || null, subtitleKu: banSubtitleKu || null,
        imageUrl: banImageUrl,
        gradientStart: null, gradientEnd: null,
        discount: banDiscount || null,
        isActive: banIsActive, sortOrder: parseInt(banSortOrder) || 0,
      };
      if (editingBanner) {
        await storeApi.adminUpdateBanner(editingBanner.id, data);
      } else {
        await storeApi.adminCreateBanner(data);
      }
      setShowBannerModal(false);
      loadData();
    } catch (error) {
      showError('خطأ', 'فشل في حفظ العرض');
    } finally {
      setSaving(false);
    }
  };

  const deleteBanner = (ban: StoreBanner) => {
    Alert.alert('حذف العرض', `هل أنت متأكد من حذف "${ban.titleAr}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف', style: 'destructive',
        onPress: async () => {
          try {
            await storeApi.adminDeleteBanner(ban.id);
            loadData();
          } catch (error) {
            showError('خطأ', 'فشل في حذف العرض');
          }
        },
      },
    ]);
  };

  // ─── Order Management ───
  const openOrderModal = (order: any) => {
    setSelectedOrder(order);
    setOrderNote('');
    setOrderDeliveryTime('');
    setOrderDeliveryFee(order.deliveryFee ? String(order.deliveryFee) : '5000');
    setShowOrderModal(true);
  };

  const updateOrderStatus = async (status: string) => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      await orderApi.adminUpdateOrderStatus(selectedOrder.id, {
        status,
        adminNote: orderNote.trim() || undefined,
        estimatedDelivery: orderDeliveryTime.trim() || undefined,
        deliveryFee: orderDeliveryFee ? parseFloat(orderDeliveryFee) : undefined,
      });
      setShowOrderModal(false);
      loadData();
    } catch (error) {
      showError('خطأ', 'فشل في تحديث حالة الطلب');
    } finally {
      setSaving(false);
    }
  };

  const filteredOrders = orderFilter === 'all' ? orders : orders.filter((o: any) => o.status === orderFilter);

  // ─── Render ───
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* Stats */}
        <View style={[styles.statsRow, { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md }]}>
          {[
            { icon: 'grid', count: categories.length, label: t('store.categories'), color: colors.accent },
            { icon: 'pricetag', count: products.length, label: t('store.items'), color: colors.textSecondary },
            { icon: 'images', count: banners.length, label: 'الإعلانات', color: colors.tertiary },
            { icon: 'receipt', count: orderCounts.pending, label: 'طلبات جديدة', color: colors.text },
          ].map((stat) => (
            <View key={stat.icon} style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
              <View style={[styles.statIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                <Ionicons name={stat.icon as any} size={16} color={stat.color} />
              </View>
              <Text style={[styles.statCount, { color: colors.text }]}>{stat.count}</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Tab Switcher - Sticky */}
        <View style={[styles.stickyTabWrapper, { backgroundColor: colors.background }]}>
          <View style={[styles.tabSwitcher, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
            {[
              { key: 'categories' as const, icon: 'grid', label: t('store.categories') },
              { key: 'products' as const, icon: 'pricetag', label: t('store.items') },
              { key: 'banners' as const, icon: 'images', label: 'الإعلانات' },
              { key: 'orders' as const, icon: 'receipt', label: 'الطلبات' },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabBtn, isActive && { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#fff' }]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={(tab.icon + (isActive ? '' : '-outline')) as any} size={16} color={isActive ? colors.text : colors.textTertiary} />
                  <Text style={[styles.tabBtnText, { color: isActive ? colors.text : colors.textTertiary, fontWeight: isActive ? '700' : '500' }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Tab Content */}
        <View style={{ padding: SPACING.lg }}>
        {activeTab === 'categories' ? (
          <>
            {/* Add Category Button */}
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
              onPress={() => openCategoryModal()}
            >
              <Ionicons name="add-circle" size={20} color={colors.accent} />
              <Text style={[styles.addBtnText, { color: colors.accent }]}>إضافة فئة جديدة</Text>
            </TouchableOpacity>

            {/* Categories List */}
            {categories.map((cat) => (
              <View key={cat.id} style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={[styles.listItemLeft, { flexDirection }]}>
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                    <Ionicons name={(cat.icon || 'grid') as any} size={18} color={colors.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listItemTitle, { color: colors.text }]}>{cat.nameAr}</Text>
                    <Text style={[styles.listItemSub, { color: colors.textTertiary }]}>
                      {cat.name} • {cat.productCount || 0} منتج
                    </Text>
                  </View>
                  {!cat.isActive && (
                    <View style={[styles.inactiveBadge, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                      <Text style={{ color: '#ef4444', fontSize: 10, fontWeight: '600' }}>معطل</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.listItemActions, { flexDirection }]}>
                  <TouchableOpacity onPress={() => openCategoryModal(cat)} style={styles.actionBtn}>
                    <Ionicons name="create-outline" size={18} color={colors.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteCategory(cat)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {categories.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>لا توجد فئات بعد</Text>
            )}
          </>
        ) : activeTab === 'products' ? (
          <>
            {/* Add Product Button */}
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
              onPress={() => openProductModal()}
            >
              <Ionicons name="add-circle" size={20} color={colors.accent} />
              <Text style={[styles.addBtnText, { color: colors.accent }]}>إضافة منتج جديد</Text>
            </TouchableOpacity>

            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.sm, gap: SPACING.xs }}>
              <TouchableOpacity
                style={[styles.catFilterTab, productCategoryFilter === 'all' && { backgroundColor: colors.accent }, { borderColor: colors.border }]}
                onPress={() => setProductCategoryFilter('all')}
              >
                <Text style={[styles.catFilterText, { color: productCategoryFilter === 'all' ? '#fff' : colors.textSecondary }]}>
                  الكل ({products.length})
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => {
                const count = products.filter(p => p.categoryId === cat.id).length;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catFilterTab, productCategoryFilter === cat.id && { backgroundColor: colors.accent }, { borderColor: colors.border }]}
                    onPress={() => setProductCategoryFilter(cat.id)}
                  >
                    <Text style={[styles.catFilterText, { color: productCategoryFilter === cat.id ? '#fff' : colors.textSecondary }]}>
                      {cat.nameAr} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Products List */}
            {products.filter(p => productCategoryFilter === 'all' || p.categoryId === productCategoryFilter).map((prod) => (
              <View key={prod.id} style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={[styles.listItemLeft, { flexDirection }]}>
                  {prod.imageUrl ? (
                    <Image source={{ uri: prod.imageUrl }} style={styles.prodImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.prodEmojiWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                      <Text style={{ fontSize: 26 }}>{prod.emoji || '📦'}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listItemTitle, { color: colors.text }]} numberOfLines={1}>{prod.nameAr}</Text>
                    <Text style={[styles.listItemSub, { color: colors.textTertiary }]} numberOfLines={1}>
                      {prod.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      <Text style={{ color: '#10b981', fontSize: 13, fontWeight: '800' }}>${prod.price}</Text>
                      {prod.originalPrice ? <Text style={{ color: colors.textTertiary, fontSize: 11, textDecorationLine: 'line-through' }}>${prod.originalPrice}</Text> : null}
                      {prod.discount ? <View style={[styles.inactiveBadge, { backgroundColor: 'rgba(239,68,68,0.1)' }]}><Text style={{ color: '#ef4444', fontSize: 10, fontWeight: '600' }}>-{prod.discount}%</Text></View> : null}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                      <View style={[styles.inactiveBadge, { backgroundColor: 'rgba(99,102,241,0.1)' }]}>
                        <Text style={{ color: '#6366f1', fontSize: 10, fontWeight: '600' }}>{prod.category?.nameAr || '—'}</Text>
                      </View>
                      {prod.badge ? <View style={[styles.inactiveBadge, { backgroundColor: prod.badge === 'new' ? 'rgba(16,185,129,0.1)' : prod.badge === 'hot' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)' }]}><Text style={{ color: prod.badge === 'new' ? '#10b981' : prod.badge === 'hot' ? '#f59e0b' : '#ef4444', fontSize: 10, fontWeight: '600' }}>{prod.badge}</Text></View> : null}
                      {prod.isFeatured && <View style={[styles.inactiveBadge, { backgroundColor: 'rgba(245,158,11,0.1)' }]}><Ionicons name="star" size={10} color="#f59e0b" /></View>}
                      {!prod.inStock && <View style={[styles.inactiveBadge, { backgroundColor: 'rgba(239,68,68,0.1)' }]}><Text style={{ color: '#ef4444', fontSize: 10, fontWeight: '600' }}>نفذ</Text></View>}
                      {!prod.isActive && <View style={[styles.inactiveBadge, { backgroundColor: 'rgba(239,68,68,0.1)' }]}><Text style={{ color: '#ef4444', fontSize: 10, fontWeight: '600' }}>معطل</Text></View>}
                    </View>
                  </View>
                </View>
                <View style={[styles.listItemActions, { flexDirection }]}>
                  <TouchableOpacity onPress={() => openProductModal(prod)} style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.08)' }]}>
                    <Ionicons name="create-outline" size={16} color="#6366f1" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteProduct(prod)} style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.08)' }]}>
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {products.filter(p => productCategoryFilter === 'all' || p.categoryId === productCategoryFilter).length === 0 && (
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                {productCategoryFilter === 'all' ? 'لا توجد منتجات بعد' : 'لا توجد منتجات في هذا القسم'}
              </Text>
            )}
          </>
        ) : activeTab === 'banners' ? (
          <>
            {/* Add Banner Button */}
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
              onPress={() => openBannerModal()}
            >
              <Ionicons name="add-circle" size={20} color={colors.accent} />
              <Text style={[styles.addBtnText, { color: colors.accent }]}>إضافة إعلان جديد</Text>
            </TouchableOpacity>

            {/* Banners List */}
            {banners.map((ban) => (
              <View key={ban.id} style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.cardBorder, overflow: 'hidden', padding: 0 }]}>
                {/* Banner Preview */}
                {ban.imageUrl ? (
                  <Image source={{ uri: ban.imageUrl }} style={styles.bannerPreview} resizeMode="cover" />
                ) : (
                  <View style={[styles.bannerPreview, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                    <Ionicons name="image-outline" size={24} color={colors.textTertiary} />
                  </View>
                )}
                <View style={{ padding: SPACING.md }}>
                  <Text style={[styles.listItemTitle, { color: colors.text }]}>{ban.titleAr}</Text>
                  <Text style={[styles.listItemSub, { color: colors.textTertiary }]}>
                    {ban.title}
                    {ban.discount ? ` • ${ban.discount}` : ''}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                    {!ban.isActive && (
                      <View style={[styles.inactiveBadge, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                        <Text style={{ color: '#ef4444', fontSize: 10, fontWeight: '600' }}>معطل</Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.listItemActions, { flexDirection, marginTop: SPACING.sm }]}>
                    <TouchableOpacity onPress={() => openBannerModal(ban)} style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.08)' }]}>
                      <Ionicons name="create-outline" size={16} color="#6366f1" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteBanner(ban)} style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.08)' }]}>
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            {banners.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>لا توجد إعلانات بعد</Text>
            )}
          </>
        ) : activeTab === 'orders' ? (
          <>
            {/* Order Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              {[
                { key: 'all', label: `الكل (${orderCounts.total})` },
                { key: 'pending', label: `جديد (${orderCounts.pending})` },
                { key: 'approved', label: `مقبول (${orderCounts.approved})` },
                { key: 'rejected', label: `مرفوض (${orderCounts.rejected})` },
                { key: 'delivered', label: `تم التوصيل (${orderCounts.delivered})` },
              ].map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.orderFilterChip,
                    { borderColor: orderFilter === f.key ? colors.accent : colors.border },
                    orderFilter === f.key && { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' },
                  ]}
                  onPress={() => setOrderFilter(f.key)}
                >
                  <Text style={[styles.orderFilterText, { color: orderFilter === f.key ? colors.text : colors.textTertiary }]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Orders List */}
            {filteredOrders.map((order: any) => {
              const statusLabels: Record<string, string> = { pending: 'قيد المراجعة', approved: 'مقبول', rejected: 'مرفوض', delivered: 'تم التوصيل' };
              const statusIcons: Record<string, string> = { pending: 'time', approved: 'checkmark-circle', rejected: 'close-circle', delivered: 'cube' };

              return (
                <TouchableOpacity
                  key={order.id}
                  style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  onPress={() => openOrderModal(order)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.orderCardHeader, { flexDirection }]}>
                    <View style={[styles.orderStatusBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                      <Ionicons name={(statusIcons[order.status] || 'ellipse') as any} size={18} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.listItemTitle, { color: colors.text }]}>{order.customerName}</Text>
                      <Text style={[styles.listItemSub, { color: colors.textTertiary }]}>
                        {order.customerPhone} {'\u2022'} {order.items?.length || 0} منتج
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.orderPrice, { color: colors.text }]}>{formatPrice(order.totalAmount)}</Text>
                      <Text style={[styles.orderStatusLabel, { color: colors.textSecondary }]}>{statusLabels[order.status]}</Text>
                    </View>
                  </View>
                  <View style={[styles.orderDetailRows]}>
                    <View style={[styles.orderDetailRow, { flexDirection }]}>
                      <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
                      <Text style={[styles.orderAddress, { color: colors.textTertiary }]} numberOfLines={1}>{order.customerAddress}</Text>
                    </View>
                    <Text style={[styles.orderDate, { color: colors.textTertiary }]}>
                      {new Date(order.createdAt).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  {order.status === 'pending' && (
                    <View style={[styles.orderQuickActions, { flexDirection }]}>
                      <TouchableOpacity
                        style={[styles.orderQuickBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
                        onPress={(e) => { e.stopPropagation(); openOrderModal(order); }}
                      >
                        <Ionicons name="checkmark" size={16} color={colors.text} />
                        <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>قبول</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.orderQuickBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
                        onPress={(e) => { e.stopPropagation(); openOrderModal(order); }}
                      >
                        <Ionicons name="close" size={16} color={colors.textSecondary} />
                        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>رفض</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
            {filteredOrders.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>لا توجد طلبات</Text>
            )}
          </>
        ) : null}
        </View>
      </ScrollView>

      {/* Category Modal */}
      <AppModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title={editingCategory ? 'تعديل الفئة' : 'فئة جديدة'}
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الاسم (English) *</Text>
          <TextInput style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]} value={catName} onChangeText={setCatName} placeholder="Category Name" placeholderTextColor={colors.textTertiary} />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الاسم (عربي) *</Text>
          <TextInput style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border, textAlign: 'right' }]} value={catNameAr} onChangeText={setCatNameAr} placeholder="اسم الفئة" placeholderTextColor={colors.textTertiary} />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الاسم (کوردی) *</Text>
          <TextInput style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border, textAlign: 'right' }]} value={catNameKu} onChangeText={setCatNameKu} placeholder="ناوی بەش" placeholderTextColor={colors.textTertiary} />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الأيقونة</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
            {ICON_OPTIONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                onPress={() => setCatIcon(icon)}
                style={[
                  styles.iconOption,
                  { backgroundColor: catIcon === icon ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)') : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'), borderColor: catIcon === icon ? colors.accent : 'transparent' },
                ]}
              >
                <Ionicons name={icon as any} size={20} color={catIcon === icon ? colors.text : colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الترتيب</Text>
          <TextInput style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]} value={catSortOrder} onChangeText={setCatSortOrder} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textTertiary} />

          <View style={[styles.switchRow, { flexDirection }]}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 0 }]}>مفعّل</Text>
            <Switch value={catIsActive} onValueChange={setCatIsActive} />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: isDark ? '#444' : '#222' }]}
            onPress={saveCategory}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{editingCategory ? 'تحديث' : 'إضافة'}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </AppModal>

      {/* Product Modal */}
      <AppModal
        visible={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={editingProduct ? 'تعديل المنتج' : 'منتج جديد'}
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}>
          {/* Category Picker */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الفئة *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setProdCategoryId(cat.id)}
                style={[
                  styles.catOption,
                  { backgroundColor: prodCategoryId === cat.id ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)') : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'), borderColor: prodCategoryId === cat.id ? colors.accent : 'transparent' },
                ]}
              >
                <Text style={{ color: prodCategoryId === cat.id ? colors.text : colors.textTertiary, fontSize: 12, fontWeight: '600' }}>{cat.nameAr}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الاسم (English) *</Text>
          <TextInput style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]} value={prodName} onChangeText={setProdName} placeholder="Product Name" placeholderTextColor={colors.textTertiary} />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الاسم (عربي) *</Text>
          <TextInput style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border, textAlign: 'right' }]} value={prodNameAr} onChangeText={setProdNameAr} placeholder="اسم المنتج" placeholderTextColor={colors.textTertiary} />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الاسم (کوردی) *</Text>
          <TextInput style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border, textAlign: 'right' }]} value={prodNameKu} onChangeText={setProdNameKu} placeholder="ناوی بەرهەم" placeholderTextColor={colors.textTertiary} />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الوصف (English)</Text>
          <TextInput style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]} value={prodDesc} onChangeText={setProdDesc} placeholder="Description" placeholderTextColor={colors.textTertiary} multiline numberOfLines={2} />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الوصف (عربي)</Text>
          <TextInput style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border, textAlign: 'right' }]} value={prodDescAr} onChangeText={setProdDescAr} placeholder="الوصف" placeholderTextColor={colors.textTertiary} multiline numberOfLines={2} />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الوصف (کوردی)</Text>
          <TextInput style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border, textAlign: 'right' }]} value={prodDescKu} onChangeText={setProdDescKu} placeholder="وەسف" placeholderTextColor={colors.textTertiary} multiline numberOfLines={2} />

          {/* Price Row */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>السعر *</Text>
              <TextInput style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]} value={prodPrice} onChangeText={setProdPrice} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.textTertiary} />
            </View>
            <View style={{ width: SPACING.sm }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>السعر الأصلي</Text>
              <TextInput style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]} value={prodOriginalPrice} onChangeText={setProdOriginalPrice} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.textTertiary} />
            </View>
            <View style={{ width: SPACING.sm }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الخصم %</Text>
              <TextInput style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]} value={prodDiscount} onChangeText={setProdDiscount} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textTertiary} />
            </View>
          </View>

          {/* Image Upload */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>صورة المنتج</Text>
          {prodImageUrl ? (
            <View style={{ marginBottom: SPACING.md }}>
              <View style={[styles.imagePreview, { borderColor: colors.border }]}>
                <Image source={{ uri: prodImageUrl }} style={styles.previewImg} resizeMode="cover" />
              </View>
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <TouchableOpacity onPress={() => pickImage('product')} style={[styles.imgBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.08)', flex: 1 }]} disabled={uploading}>
                  {uploading ? <ActivityIndicator size="small" color="#6366f1" /> : <><Ionicons name="camera-outline" size={16} color="#6366f1" /><Text style={{ color: '#6366f1', fontSize: 12, fontWeight: '600' }}>تغيير الصورة</Text></>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setProdImageUrl('')} style={[styles.imgBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.08)' }]}>
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => pickImage('product')} style={[styles.imgPickerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} disabled={uploading}>
              {uploading ? <ActivityIndicator size="small" color={colors.accent} /> : (
                <>
                  <Ionicons name="cloud-upload-outline" size={28} color={colors.textTertiary} />
                  <Text style={{ color: colors.textTertiary, fontSize: 13, fontWeight: '600', marginTop: 4 }}>اضغط لرفع صورة</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 10 }}>JPG, PNG — حتى 5MB</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Badge */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الشارة</Text>
          <View style={{ flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.md, flexWrap: 'wrap' }}>
            {BADGE_OPTIONS.map((b) => (
              <TouchableOpacity key={b.value} onPress={() => setProdBadge(b.value)}
                style={[styles.badgeOption, { backgroundColor: prodBadge === b.value ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(99,102,241,0.1)') : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'), borderColor: prodBadge === b.value ? '#6366f1' : 'transparent' }]}>
                <Text style={{ color: prodBadge === b.value ? '#6366f1' : colors.textTertiary, fontSize: 12, fontWeight: '600' }}>{b.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sizes - Selectable Chips */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>المقاسات المتوفرة</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.md }}>
            {SIZE_OPTIONS.map((size) => {
              const selected = prodSizes.includes(size);
              return (
                <TouchableOpacity key={size} onPress={() => toggleSize(size)}
                  style={[styles.sizeChip, { backgroundColor: selected ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(99,102,241,0.1)') : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'), borderColor: selected ? '#6366f1' : 'transparent' }]}>
                  <Text style={{ color: selected ? '#6366f1' : colors.textTertiary, fontSize: 12, fontWeight: '600' }}>{size}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Colors - Selectable Circles */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الألوان المتوفرة</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md }}>
            {COLOR_OPTIONS.map((c) => {
              const selected = prodColors.includes(c.hex);
              return (
                <TouchableOpacity key={c.hex} onPress={() => toggleColor(c.hex)} style={{ alignItems: 'center', gap: 3 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.hex, borderWidth: selected ? 3 : 2, borderColor: selected ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'), alignItems: 'center', justifyContent: 'center' }}>
                    {selected && <Ionicons name="checkmark" size={16} color={c.hex === '#FFFFFF' || c.hex === '#F59E0B' ? '#000' : '#fff'} />}
                  </View>
                  <Text style={{ fontSize: 9, color: colors.textTertiary }}>{c.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Switches */}
          <View style={[styles.switchRow, { flexDirection }]}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 0 }]}>متوفر</Text>
            <Switch value={prodInStock} onValueChange={setProdInStock} />
          </View>
          <View style={[styles.switchRow, { flexDirection }]}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 0 }]}>مميز</Text>
            <Switch value={prodIsFeatured} onValueChange={setProdIsFeatured} />
          </View>
          <View style={[styles.switchRow, { flexDirection }]}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 0 }]}>مفعّل</Text>
            <Switch value={prodIsActive} onValueChange={setProdIsActive} />
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الترتيب</Text>
          <TextInput style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]} value={prodSortOrder} onChangeText={setProdSortOrder} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textTertiary} />

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: isDark ? '#444' : '#222' }]}
            onPress={saveProduct}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{editingProduct ? 'تحديث' : 'إضافة'}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </AppModal>

      {/* Banner Modal */}
      <AppModal
        visible={showBannerModal}
        onClose={() => setShowBannerModal(false)}
        title={editingBanner ? 'تعديل الإعلان' : 'إعلان جديد'}
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}>
          {/* Image - Primary */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 0 }]}>الصورة *</Text>
          {banImageUrl ? (
            <View style={{ marginBottom: SPACING.md }}>
              <View style={[styles.bannerPreviewCard, { borderColor: colors.border }]}>
                <Image source={{ uri: banImageUrl }} style={styles.bannerPreviewImg} resizeMode="cover" />
              </View>
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm }}>
                <TouchableOpacity onPress={() => pickImage('banner')} style={[styles.imgBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.08)', flex: 1 }]} disabled={uploading}>
                  {uploading ? <ActivityIndicator size="small" color="#6366f1" /> : <><Ionicons name="camera-outline" size={16} color="#6366f1" /><Text style={{ color: '#6366f1', fontSize: 12, fontWeight: '600' }}>تغيير</Text></>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setBanImageUrl('')} style={[styles.imgBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.08)' }]}>
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => pickImage('banner')} style={[styles.imgPickerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', height: 140 }]} disabled={uploading}>
              {uploading ? <ActivityIndicator size="small" color={colors.accent} /> : (
                <>
                  <Ionicons name="image-outline" size={36} color={colors.textTertiary} />
                  <Text style={{ color: colors.textTertiary, fontSize: 14, fontWeight: '600', marginTop: 6 }}>ارفع صورة الإعلان</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 11 }}>يُفضل 16:9 — حتى 5MB</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Optional Text Section */}
          <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md }}>
            <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: '600', marginBottom: SPACING.sm }}>نص اختياري (يظهر فوق الصورة)</Text>

            <TextInput style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff', borderColor: colors.border, marginBottom: SPACING.xs }]} value={banTitleAr} onChangeText={setBanTitleAr} placeholder="العنوان بالعربي" placeholderTextColor={colors.textTertiary} textAlign="right" />
            <TextInput style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff', borderColor: colors.border, marginBottom: SPACING.xs }]} value={banTitle} onChangeText={setBanTitle} placeholder="Title in English" placeholderTextColor={colors.textTertiary} />
            <TextInput style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff', borderColor: colors.border, marginBottom: SPACING.xs }]} value={banTitleKu} onChangeText={setBanTitleKu} placeholder="سەردێر بە کوردی" placeholderTextColor={colors.textTertiary} textAlign="right" />

            <TextInput style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff', borderColor: colors.border, marginBottom: SPACING.xs }]} value={banSubtitleAr} onChangeText={setBanSubtitleAr} placeholder="وصف مختصر (اختياري)" placeholderTextColor={colors.textTertiary} textAlign="right" />
            <TextInput style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff', borderColor: colors.border, marginBottom: SPACING.xs }]} value={banSubtitle} onChangeText={setBanSubtitle} placeholder="Short description (optional)" placeholderTextColor={colors.textTertiary} />
            <TextInput style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff', borderColor: colors.border, marginBottom: 0 }]} value={banSubtitleKu} onChangeText={setBanSubtitleKu} placeholder="وەسفی کورت (ئارەزوومەندانە)" placeholderTextColor={colors.textTertiary} textAlign="right" />
          </View>

          <TextInput style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]} value={banDiscount} onChangeText={setBanDiscount} placeholder="نص الشارة مثل: خصم 50% (اختياري)" placeholderTextColor={colors.textTertiary} />

          <View style={[styles.switchRow, { flexDirection }]}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 0 }]}>مفعّل</Text>
            <Switch value={banIsActive} onValueChange={setBanIsActive} />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: isDark ? '#444' : '#222' }]}
            onPress={saveBanner}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{editingBanner ? 'تحديث' : 'نشر الإعلان'}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </AppModal>

      {/* Order Modal */}
      <AppModal
        visible={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="تفاصيل الطلب"
        maxHeight="85%"
      >
        {selectedOrder && (
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}>
            {/* Customer Info */}
            <View style={{ marginBottom: SPACING.lg }}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 0 }]}>معلومات العميل</Text>
              <View style={[{ padding: SPACING.lg, borderRadius: RADIUS.lg, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', gap: SPACING.sm }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <View style={[{ width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                    <Ionicons name="person-outline" size={15} color={colors.accent} />
                  </View>
                  <Text style={[{ fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 }]}>{selectedOrder.customerName}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <View style={[{ width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                    <Ionicons name="call-outline" size={15} color={colors.accent} />
                  </View>
                  <Text style={[{ fontSize: 14, color: colors.text, flex: 1 }]}>{selectedOrder.customerPhone}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm }}>
                  <View style={[{ width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                    <Ionicons name="location-outline" size={15} color={colors.accent} />
                  </View>
                  <Text style={[{ fontSize: 14, color: colors.text, flex: 1 }]}>{selectedOrder.customerAddress}</Text>
                </View>
              </View>
            </View>

            {/* Order Items */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>المنتجات ({selectedOrder.items?.length})</Text>
            {selectedOrder.items?.map((item: any) => {
              const imgSrc = item.imageUrl || item.product?.imageUrl;
              const emoji = item.product?.emoji || '📦';
              return (
                <View key={item.id} style={[styles.orderModalItem, { flexDirection }]}>
                  <View style={[styles.orderModalItemImg, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                    {imgSrc ? (
                      <Image source={{ uri: imgSrc }} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="cover" />
                    ) : (
                      <Text style={{ fontSize: 22 }}>{emoji}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[{ fontSize: 14, fontWeight: '700', color: colors.text }]} numberOfLines={2}>{item.productNameAr || item.productName}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[{ fontSize: 12, color: colors.textTertiary }]}>x{item.quantity}</Text>
                      {item.selectedSize && (
                        <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600' }}>{item.selectedSize}</Text>
                        </View>
                      )}
                      {item.selectedColor && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: item.selectedColor, borderWidth: 1, borderColor: 'rgba(128,128,128,0.3)' }} />
                        </View>
                      )}
                    </View>
                    <Text style={[{ fontSize: 12, fontWeight: '600', color: colors.accent }]}>{formatPrice(item.price)} × {item.quantity}</Text>
                  </View>
                  <Text style={[{ fontSize: 14, fontWeight: '800', color: colors.text }]}>{formatPrice(item.price * item.quantity)}</Text>
                </View>
              );
            })}

            {/* Total */}
            <View style={{ marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: colors.border, gap: 6 }}>
              {selectedOrder.deliveryFee > 0 && (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[{ fontSize: 13, color: colors.textTertiary }]}>المنتجات</Text>
                    <Text style={[{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }]}>{formatPrice(selectedOrder.totalAmount - selectedOrder.deliveryFee)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[{ fontSize: 13, color: colors.textTertiary }]}>التوصيل</Text>
                    <Text style={[{ fontSize: 13, fontWeight: '600', color: colors.accent }]}>{formatPrice(selectedOrder.deliveryFee)}</Text>
                  </View>
                </>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: selectedOrder.deliveryFee > 0 ? 6 : 0, borderTopWidth: selectedOrder.deliveryFee > 0 ? 0.5 : 0, borderTopColor: 'rgba(128,128,128,0.1)' }}>
                <Text style={[{ fontSize: 15, fontWeight: '700', color: colors.textSecondary }]}>المجموع الكلي</Text>
                <Text style={[{ fontSize: 18, fontWeight: '800', color: colors.text }]}>{formatPrice(selectedOrder.totalAmount)}</Text>
              </View>
            </View>

            {/* Admin Note */}
            {selectedOrder.status === 'pending' && (
              <>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>ملاحظة للعميل (اختياري)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
                  value={orderNote}
                  onChangeText={setOrderNote}
                  placeholder="مثال: تم قبول طلبك بنجاح"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                />

                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>مدة التوصيل المتوقعة (اختياري)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
                  value={orderDeliveryTime}
                  onChangeText={setOrderDeliveryTime}
                  placeholder="مثال: 2-3 أيام عمل"
                  placeholderTextColor={colors.textTertiary}
                />

                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>سعر التوصيل (د.ع)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
                  value={orderDeliveryFee}
                  onChangeText={setOrderDeliveryFee}
                  placeholder="5000"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />

                <View style={[styles.orderModalActions, { flexDirection }]}>
                  <TouchableOpacity
                    style={[styles.orderModalActionBtn, { backgroundColor: isDark ? '#444' : '#222' }]}
                    onPress={() => updateOrderStatus('approved')}
                    disabled={saving}
                  >
                    {saving ? <ActivityIndicator color="#fff" size="small" /> : (
                      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>قبول الطلب</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.orderModalActionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
                    onPress={() => updateOrderStatus('rejected')}
                    disabled={saving}
                  >
                    <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>رفض</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {selectedOrder.status === 'approved' && (
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: isDark ? '#444' : '#222', marginTop: SPACING.lg }]}
                onPress={() => updateOrderStatus('delivered')}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.saveBtnText}>تم التوصيل</Text>
                )}
              </TouchableOpacity>
            )}

            {(selectedOrder.status === 'approved' || selectedOrder.status === 'rejected' || selectedOrder.status === 'delivered') && (
              <View style={{ marginTop: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
                <Text style={[{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }]}>
                  الحالة: {selectedOrder.status === 'approved' ? 'مقبول' : selectedOrder.status === 'rejected' ? 'مرفوض' : 'تم التوصيل'}
                </Text>
                {selectedOrder.estimatedDelivery && (
                  <Text style={[{ fontSize: 12, color: colors.textTertiary, marginTop: 4 }]}>مدة التوصيل: {selectedOrder.estimatedDelivery}</Text>
                )}
                {selectedOrder.adminNote && (
                  <Text style={[{ fontSize: 12, color: colors.textTertiary, marginTop: 4 }]}>ملاحظة: {selectedOrder.adminNote}</Text>
                )}
              </View>
            )}
          </ScrollView>
        )}
      </AppModal>

      {/* Dialog */}
      <AppDialog
        visible={dialogVisible}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onConfirm={() => {
          setDialogVisible(false);
          if (dialogConfig.onConfirm) dialogConfig.onConfirm();
        }}
        onCancel={() => setDialogVisible(false)}
        showCancel={dialogConfig.showCancel}
      />
    </View>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Sticky tab wrapper
  stickyTabWrapper: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1, borderRadius: RADIUS.xl, padding: SPACING.md,
    alignItems: 'center', gap: 4,
  },
  statIconWrap: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  statCount: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },

  // Tabs
  tabSwitcher: {
    flexDirection: 'row',
    borderRadius: RADIUS.xl,
    padding: 4,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: RADIUS.lg,
    gap: SPACING.xs,
  },
  tabBtnText: { fontSize: 14, fontWeight: '600' },

  // Add Button
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  addBtnText: { fontSize: 15, fontWeight: '700' },

  // List Items
  listItem: {
    borderRadius: RADIUS.xl,
    borderWidth: 0.5,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  iconCircle: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  listItemTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  listItemSub: { fontSize: 13, marginTop: 2 },
  listItemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  actionBtn: {
    width: 40, height: 40, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  inactiveBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.md,
  },

  // Product specific
  prodImage: {
    width: 60, height: 60, borderRadius: 16,
  },
  prodEmojiWrap: {
    width: 60, height: 60, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  imagePreview: {
    height: 160, borderRadius: RADIUS.xl,
    marginBottom: SPACING.sm, overflow: 'hidden',
    borderWidth: 1,
  },
  previewImg: {
    width: '100%', height: '100%',
  },

  // Banner preview
  bannerPreview: {
    height: 100, alignItems: 'center', justifyContent: 'center',
  },
  bannerPreviewCard: {
    height: 160, borderRadius: RADIUS.xl, overflow: 'hidden',
    borderWidth: 1,
  },
  bannerPreviewImg: {
    width: '100%', height: '100%',
  },

  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 14 },

  // Form
  fieldLabel: {
    fontSize: 13, fontWeight: '700',
    marginBottom: 6, marginTop: SPACING.md,
    letterSpacing: -0.1,
  },
  input: {
    borderWidth: 1, borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
    fontSize: 15, marginBottom: SPACING.sm,
  },
  textArea: {
    minHeight: 80, textAlignVertical: 'top', paddingTop: 14,
  },
  row: {
    flexDirection: 'row', alignItems: 'flex-start',
  },
  switchRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: SPACING.md,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  iconOption: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.xs, borderWidth: 1.5,
  },
  catOption: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg, marginRight: SPACING.xs, borderWidth: 1.5,
  },
  badgeOption: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md, borderWidth: 1.5,
  },
  sizeChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg, borderWidth: 1.5, minWidth: 44,
    alignItems: 'center',
  },
  imgBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xs, paddingVertical: 12, paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  imgPickerBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.xl, borderRadius: RADIUS.xl,
    borderWidth: 1.5, borderStyle: 'dashed', marginBottom: SPACING.md,
  },
  saveBtn: {
    borderRadius: RADIUS.xl, paddingVertical: 16,
    alignItems: 'center', marginTop: SPACING.xl, marginBottom: SPACING.md,
  },
  saveBtnText: {
    color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: -0.2,
  },
  // ─── Order Styles ───
  orderFilterChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, borderWidth: 1.5, marginRight: SPACING.xs,
  },
  orderFilterText: {
    fontSize: 12, fontWeight: '700',
  },
  orderCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
  },
  orderStatusBadge: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  orderPrice: {
    fontSize: 15, fontWeight: '800',
  },
  orderStatusLabel: {
    fontSize: 11, fontWeight: '700', marginTop: 2,
  },
  orderDetailRows: {
    marginTop: SPACING.sm, gap: 3,
  },
  orderDetailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  orderAddress: {
    fontSize: 12, fontWeight: '500', flex: 1,
  },
  orderDate: {
    fontSize: 11, fontWeight: '500', marginTop: 2,
  },
  orderQuickActions: {
    flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md,
  },
  orderQuickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: SPACING.sm, borderRadius: RADIUS.lg, borderWidth: 1,
  },
  orderModalItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.sm, borderBottomWidth: 0.5, borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  orderModalItemImg: {
    width: 48, height: 48, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  orderModalActions: {
    flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg,
  },
  orderModalActionBtn: {
    flex: 1, paddingVertical: 14, borderRadius: RADIUS.xl,
    alignItems: 'center', justifyContent: 'center',
  },
  catFilterTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  catFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
