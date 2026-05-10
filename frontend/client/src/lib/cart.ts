import type { CartItem } from '../domain/types';

const storageKey = 'libreria-cart';

export const readStoredCart = () => {
  const rawValue = window.localStorage.getItem(storageKey);

  if (!rawValue) return [] as CartItem[];

  try {
    const parsed = JSON.parse(rawValue) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(storageKey);
    return [] as CartItem[];
  }
};

export const storeCart = (cart: CartItem[]) => {
  window.localStorage.setItem(storageKey, JSON.stringify(cart));
};

export const clearStoredCart = () => {
  window.localStorage.removeItem(storageKey);
};
