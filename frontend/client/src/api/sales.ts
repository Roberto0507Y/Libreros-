import { authRequest } from './client';

export async function registerSale(
  token: string,
  input: {
    customerId?: number | null;
    discount?: number;
    paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
    amountReceived?: number | null;
    paymentReference?: string;
    items: Array<{ productId: number; quantity: number }>;
  },
) {
  return authRequest<{
    message: string;
    sale: {
      id: number;
      subtotal: number;
      discount: number;
      total: number;
      paymentMethod: string;
      change: number;
      customer: {
        id: number;
        name: string;
        nit: string;
      };
    };
  }>('/api/sales/presenciales', token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
