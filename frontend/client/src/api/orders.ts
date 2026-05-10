import { authRequest } from './client';

export async function createOrder(
  token: string,
  input: {
    items: Array<{ productId: number; quantity: number }>;
    delivery?: {
      recipientName?: string;
      phone?: string;
      zone?: string;
      address?: string;
      reference?: string;
      shippingCost?: number;
      estimatedMinutes?: number;
    };
  },
) {
  return authRequest<{
    message: string;
    order: { id: number; total: number; trackingCode: string; status: string };
  }>('/api/orders', token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
