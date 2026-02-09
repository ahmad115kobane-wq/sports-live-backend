export interface Product {
  id: string;
  name: string;
  nameAr: string;
  nameKu: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  imageUrl?: string;
  category: string;
  rating: number;
  reviews: number;
  badge?: 'new' | 'hot' | 'sale';
  colors?: string[];
  sizes?: string[];
  inStock: boolean;
}

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  nameKu: string;
  icon: string;
}

// Data is now fetched from the database via API
// These types are used by the mobile store screen
