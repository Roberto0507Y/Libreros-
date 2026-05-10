import type { SubcategoryOption } from '../domain/types';
import { authRequest } from './client';

export async function createSubcategory(
  token: string,
  input: { name: string; categoryId: number },
) {
  return authRequest<{ message: string; subcategory: SubcategoryOption }>(
    '/api/catalog/subcategories',
    token,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}
