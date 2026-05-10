import type { CatalogOption, ProductItem } from '../domain/types';
import { publicRequest } from './client';

export async function fetchStorefront() {
  return publicRequest<{ brands: CatalogOption[]; categories: CatalogOption[]; products: ProductItem[] }>(
    '/api/catalog/storefront',
  );
}
