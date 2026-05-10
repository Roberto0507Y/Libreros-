import type { CatalogOption } from '../domain/types';
import { authRequest } from './client';

export async function createBrand(token: string, input: { name: string; image: string }) {
  return authRequest<{ message: string; brand: CatalogOption }>('/api/catalog/brands', token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateBrand(
  token: string,
  brandId: number,
  input: { name: string; image?: string },
) {
  return authRequest<{ message: string; brand: CatalogOption }>(
    `/api/catalog/brands/${brandId}`,
    token,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export async function deleteBrand(token: string, brandId: number) {
  return authRequest<{ message: string }>(`/api/catalog/brands/${brandId}`, token, {
    method: 'DELETE',
  });
}
