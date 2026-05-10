import type { SalesHistoryResponse } from '../domain/types';
import { authRequest } from './client';

type SalesHistoryApiResponse = {
  fecha: string;
  resumen: {
    total_vendido: number;
    cantidad_ventas: number;
    productos_vendidos: number;
    ventas_efectivo: number;
    ventas_tarjeta: number;
  };
  ventas: Array<{
    id: number;
    fecha: string;
    cliente_nombre: string;
    nit: string;
    metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia';
    subtotal: number;
    descuento: number;
    total: number;
    monto_recibido: number | null;
    cambio: number;
    referencia_pago: string | null;
    estado: string;
    cajero: string;
    productos: Array<{
      producto_id: number;
      nombre: string;
      cantidad: number;
      precio_unitario: number;
      subtotal: number;
    }>;
  }>;
};

export async function fetchSalesHistory(
  token: string,
  params: {
    fecha: string;
    metodoPago?: string;
    query?: string;
  },
): Promise<SalesHistoryResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('fecha', params.fecha);

  if (params.metodoPago && params.metodoPago !== 'todos') {
    searchParams.set('metodo_pago', params.metodoPago);
  }

  if (params.query?.trim()) {
    searchParams.set('q', params.query.trim());
  }

  const payload = await authRequest<SalesHistoryApiResponse>(
    `/api/ventas/historial?${searchParams.toString()}`,
    token,
  );

  return {
    fecha: payload.fecha,
    resumen: {
      totalVendido: Number(payload.resumen.total_vendido ?? 0),
      cantidadVentas: Number(payload.resumen.cantidad_ventas ?? 0),
      productosVendidos: Number(payload.resumen.productos_vendidos ?? 0),
      ventasEfectivo: Number(payload.resumen.ventas_efectivo ?? 0),
      ventasTarjeta: Number(payload.resumen.ventas_tarjeta ?? 0),
    },
    ventas: payload.ventas.map((sale) => ({
      id: Number(sale.id),
      fecha: sale.fecha,
      clienteNombre: sale.cliente_nombre,
      nit: sale.nit,
      metodoPago: sale.metodo_pago,
      subtotal: Number(sale.subtotal ?? 0),
      descuento: Number(sale.descuento ?? 0),
      total: Number(sale.total ?? 0),
      montoRecibido: sale.monto_recibido !== null ? Number(sale.monto_recibido) : null,
      cambio: Number(sale.cambio ?? 0),
      referenciaPago: sale.referencia_pago,
      estado: sale.estado,
      cajero: sale.cajero,
      productos: sale.productos.map((product) => ({
        productoId: Number(product.producto_id),
        nombre: product.nombre,
        cantidad: Number(product.cantidad ?? 0),
        precioUnitario: Number(product.precio_unitario ?? 0),
        subtotal: Number(product.subtotal ?? 0),
      })),
    })),
  };
}
