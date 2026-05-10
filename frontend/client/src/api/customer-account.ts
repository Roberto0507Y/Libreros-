import { authRequest } from './client';
import type { CustomerAccountDashboard, CustomerAccountProfile } from '../domain/types';

export async function fetchCustomerDashboard(token: string) {
  return authRequest<CustomerAccountDashboard>('/api/customers/me/dashboard', token);
}

export async function updateCustomerProfile(
  token: string,
  input: {
    fullName: string;
    email: string;
    phone: string;
    nit: string;
  },
) {
  return authRequest<{
    message: string;
    profile: CustomerAccountProfile;
  }>('/api/customers/me', token, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
