import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  productId: string;
  name: string;
  nameAr: string;
  nameKu: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  imageUrl?: string;
  quantity: number;
  selectedSize?: string | null;
  selectedColor?: string | null;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size?: string | null, color?: string | null) => void;
  updateQuantity: (productId: string, quantity: number, size?: string | null, color?: string | null) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item: CartItem) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) =>
              i.productId === item.productId &&
              i.selectedSize === item.selectedSize &&
              i.selectedColor === item.selectedColor
          );

          if (existingIndex >= 0) {
            const updated = [...state.items];
            updated[existingIndex].quantity += item.quantity;
            return { items: updated };
          }

          return { items: [...state.items, item] };
        });
      },

      removeItem: (productId, size, color) => {
        set((state) => ({
          items: state.items.filter(
            (i) =>
              !(i.productId === productId &&
                i.selectedSize === size &&
                i.selectedColor === color)
          ),
        }));
      },

      updateQuantity: (productId, quantity, size, color) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (i) =>
                  !(i.productId === productId &&
                    i.selectedSize === size &&
                    i.selectedColor === color)
              ),
            };
          }
          return {
            items: state.items.map((i) =>
              i.productId === productId &&
              i.selectedSize === size &&
              i.selectedColor === color
                ? { ...i, quantity }
                : i
            ),
          };
        });
      },

      clearCart: () => set({ items: [] }),

      getItemCount: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      getTotal: () => {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
