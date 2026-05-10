import type { ProductItem } from '../domain/types';
import { authRequest } from './client';

export async function createProduct(
  token: string,
  input: {
    name: string;
    description: string;
    brandId: number | null;
    subcategoryId: number;
    purchasePrice: number;
    salePrice: number;
    initialStock: number;
    primaryImage: string;
    secondaryImage: string;
  },
) {
  return authRequest<{ message: string; product: ProductItem }>('/api/products', token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateProduct(
  token: string,
  productId: number,
  input: {
    name: string;
    description: string;
    brandId: number | null;
    subcategoryId: number;
    purchasePrice: number;
    salePrice: number;
    initialStock: number;
    primaryImage: string;
    secondaryImage: string;
  },
) {
  return authRequest<{ message: string; product: ProductItem }>(`/api/products/${productId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteProduct(token: string, productId: number) {
  return authRequest<{ message: string }>(`/api/products/${productId}`, token, {
    method: 'DELETE',
  });
}
