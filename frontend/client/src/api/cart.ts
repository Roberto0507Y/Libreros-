import type { CartItem } from '../domain/types';

import { authRequest } from './client';

export async function fetchCart(token: string) {
  return authRequest<{ items: CartItem[] }>('/api/cart', token);
}

export async function replaceCart(token: string, items: CartItem[]) {
  return authRequest<{ message: string; items: CartItem[] }>('/api/cart', token, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
}

export async function clearRemoteCart(token: string) {
  return authRequest<{ message: string }>('/api/cart', token, {
    method: 'DELETE',
  });
}
