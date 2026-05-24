import type { CustomerItem } from '../domain/types';
import { authRequest } from './client';

export type CustomerSearchMode = 'all' | 'nit';

export async function searchCustomers(
  token: string,
  query: string,
  mode: CustomerSearchMode = 'all',
) {
  const params = new URLSearchParams();
  params.set('q', query);
  if (mode !== 'all') {
    params.set('mode', mode);
  }

  return authRequest<{ customers: CustomerItem[] }>(`/api/customers/search?${params.toString()}`, token);
}

export async function createCustomer(
  token: string,
  input: {
    fullName: string;
    nit: string;
    phone?: string;
    email?: string;
  },
) {
  return authRequest<{ customer: CustomerItem; message: string }>('/api/customers', token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
