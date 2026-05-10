import type { CatalogOption } from '../domain/types';
import { authRequest } from './client';

export async function createCategory(token: string, input: { name: string; image: string }) {
  return authRequest<{ message: string; category: CatalogOption }>('/api/catalog/categories', token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateCategory(
  token: string,
  categoryId: number,
  input: { name: string; image?: string },
) {
  return authRequest<{ message: string; category: CatalogOption }>(
    `/api/catalog/categories/${categoryId}`,
    token,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export async function deleteCategory(token: string, categoryId: number) {
  return authRequest<{ message: string }>(`/api/catalog/categories/${categoryId}`, token, {
    method: 'DELETE',
  });
}
