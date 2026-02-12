import { create } from 'zustand';
import { storeApi } from '@/services/api';
import { Product, Category } from '@/constants/storeData';
import { getImageUrl } from '@/constants/config';

interface Banner {
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
}

function mapApiCategory(c: any): Category {
  return { id: c.id, name: c.name, nameAr: c.nameAr, nameKu: c.nameKu, icon: c.icon || 'grid' };
}

function mapApiProduct(p: any): Product {
  return {
    id: p.id, name: p.name, nameAr: p.nameAr, nameKu: p.nameKu,
    price: p.price, originalPrice: p.originalPrice || undefined,
    discount: p.discount || undefined, image: p.emoji || '📦', imageUrl: getImageUrl(p.imageUrl) || undefined,
    category: p.categoryId, rating: p.rating || 0, reviews: p.reviewsCount || 0,
    badge: p.badge || undefined, inStock: p.inStock !== false,
    colors: p.colors ? (typeof p.colors === 'string' ? JSON.parse(p.colors) : p.colors) : undefined,
    sizes: p.sizes ? (typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes) : undefined,
  };
}

const CACHE_COOLDOWN_MS = 60_000; // 60 seconds

interface StoreState {
  // Data
  categories: Category[];
  overviewProducts: Product[];
  featuredProducts: Product[];
  newProducts: Product[];
  saleProducts: Product[];
  banners: Banner[];

  // Loading flags
  shellLoading: boolean;
  overviewLoading: boolean;

  // Cache timestamps
  shellFetchedAt: number;
  overviewFetchedAt: number;

  // Whether we have ANY cached data (for stale-while-revalidate)
  hasCache: boolean;

  // Actions
  fetchShell: (force?: boolean) => Promise<void>;
  fetchOverview: (force?: boolean) => Promise<void>;
  fetchAll: (force?: boolean) => Promise<void>;
  reset: () => void;
}

const ALL_CATEGORY: Category = { id: 'all', name: 'All', nameAr: 'الكل', nameKu: 'هەموو', icon: 'grid' };

export const useStoreStore = create<StoreState>((set, get) => ({
  categories: [ALL_CATEGORY],
  overviewProducts: [],
  featuredProducts: [],
  newProducts: [],
  saleProducts: [],
  banners: [],

  shellLoading: false,
  overviewLoading: false,

  shellFetchedAt: 0,
  overviewFetchedAt: 0,
  hasCache: false,

  fetchShell: async (force = false) => {
    const { shellFetchedAt, shellLoading } = get();
    if (shellLoading) return;
    if (!force && Date.now() - shellFetchedAt < CACHE_COOLDOWN_MS) return;

    set({ shellLoading: true });
    try {
      const [catRes, bannerRes] = await Promise.all([
        storeApi.getCategories(),
        storeApi.getBanners(),
      ]);
      const apiCats = (catRes.data.data || []).map(mapApiCategory);
      set({
        categories: [ALL_CATEGORY, ...apiCats],
        banners: (bannerRes.data.data || []).map((b: any) => ({ ...b, imageUrl: getImageUrl(b.imageUrl) || undefined })),
        shellFetchedAt: Date.now(),
        hasCache: true,
      });
    } catch (error) {
      
    } finally {
      set({ shellLoading: false });
    }
  },

  fetchOverview: async (force = false) => {
    const { overviewFetchedAt, overviewLoading } = get();
    if (overviewLoading) return;
    if (!force && Date.now() - overviewFetchedAt < CACHE_COOLDOWN_MS) return;

    set({ overviewLoading: true });
    try {
      const [featuredRes, saleRes, newRes] = await Promise.all([
        storeApi.getProducts({ page: 1, limit: 10, featured: true }),
        storeApi.getProducts({ page: 1, limit: 10, badge: 'sale' }),
        storeApi.getProducts({ page: 1, limit: 10 }),
      ]);

      const featured = (featuredRes.data.data || []).map(mapApiProduct);
      const sale = (saleRes.data.data || []).map(mapApiProduct);
      const newProducts = (newRes.data.data || []).map(mapApiProduct);

      set({
        overviewProducts: newProducts,
        featuredProducts: featured,
        newProducts,
        saleProducts: sale,
        overviewFetchedAt: Date.now(),
        hasCache: true,
      });
    } catch (error) {
      
    } finally {
      set({ overviewLoading: false });
    }
  },

  fetchAll: async (force = false) => {
    const { fetchShell, fetchOverview } = get();
    await Promise.all([fetchShell(force), fetchOverview(force)]);
  },

  reset: () => {
    set({
      categories: [ALL_CATEGORY],
      overviewProducts: [],
      featuredProducts: [],
      newProducts: [],
      saleProducts: [],
      banners: [],
      shellFetchedAt: 0,
      overviewFetchedAt: 0,
      hasCache: false,
    });
  },
}));

export type { Banner };
export { mapApiProduct, mapApiCategory };
