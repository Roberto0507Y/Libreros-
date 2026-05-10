import type {
  DeliveryOrder,
  DeliveryTrackingHistoryItem,
  DeliveryTrackingResponse,
} from '../domain/types';
import { authRequest, publicRequest } from './client';

type DeliveryOrderApi = {
  id: number;
  trackingCode: string | null;
  fecha: string;
  updatedAt?: string | null;
  deliveredAt?: string | null;
  cliente: {
    nombre: string;
    nit: string;
    telefono: string;
  };
  repartidor: {
    id: number;
    nombre: string;
  } | null;
  direccionEntrega: string;
  referenciaEntrega: string;
  zonaEntrega: string;
  nombreRecibe: string;
  telefonoEntrega: string;
  tiempoEstimadoMinutos: number | null;
  costoEnvio: number;
  total: number;
  estadoPedido: DeliveryOrder['estadoPedido'];
  estadoEntrega: DeliveryOrder['estadoEntrega'];
  estado: DeliveryOrder['estado'];
  productos: DeliveryOrder['productos'];
};

const normalizeOrder = (order: DeliveryOrderApi): DeliveryOrder => ({
  ...order,
  costoEnvio: Number(order.costoEnvio ?? 0),
  tiempoEstimadoMinutos:
    order.tiempoEstimadoMinutos !== null ? Number(order.tiempoEstimadoMinutos) : null,
  total: Number(order.total ?? 0),
  productos: order.productos.map((product) => ({
    ...product,
    cantidad: Number(product.cantidad ?? 0),
    precioUnitario: Number(product.precioUnitario ?? 0),
    subtotal: Number(product.subtotal ?? 0),
  })),
});

export async function fetchAdminDeliveryOrders(
  token: string,
  params?: { q?: string; status?: string },
) {
  const searchParams = new URLSearchParams();

  if (params?.q?.trim()) {
    searchParams.set('q', params.q.trim());
  }

  if (params?.status?.trim()) {
    searchParams.set('status', params.status.trim());
  }

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const payload = await authRequest<{ orders: DeliveryOrderApi[] }>(`/api/admin/pedidos${suffix}`, token);

  return {
    orders: payload.orders.map(normalizeOrder),
  };
}

export async function assignDeliveryUser(token: string, orderId: number, repartidorId: number) {
  return authRequest<{ message: string }>(`/api/admin/pedidos/${orderId}/asignar-repartidor`, token, {
    method: 'PATCH',
    body: JSON.stringify({ repartidorId }),
  });
}

export async function fetchCourierOrders(token: string) {
  const payload = await authRequest<{ orders: DeliveryOrderApi[] }>('/api/repartidor/pedidos', token);

  return {
    orders: payload.orders.map(normalizeOrder),
  };
}

export async function updateCourierOrderStatus(
  token: string,
  orderId: number,
  estado: DeliveryOrder['estadoPedido'],
) {
  return authRequest<{ message: string }>(`/api/repartidor/pedidos/${orderId}/estado`, token, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
}

export async function fetchTracking(trackingCode: string): Promise<DeliveryTrackingResponse> {
  const payload = await publicRequest<{
    order: DeliveryOrderApi & {
      historial: DeliveryTrackingHistoryItem[];
    };
  }>(`/api/tracking/${encodeURIComponent(trackingCode)}`);

  return {
    order: {
      ...normalizeOrder(payload.order),
      historial: payload.order.historial,
    },
  };
}
