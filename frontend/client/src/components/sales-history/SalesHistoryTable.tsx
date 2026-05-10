import { CalendarClock, CreditCard, ReceiptText } from 'lucide-react';

import type { SalesHistorySale } from '../../domain/types';
import { currency, dateTime, timeOnly } from '../../lib/format';

type SalesHistoryTableProps = {
  onSelectSale: (sale: SalesHistorySale) => void;
  sales: SalesHistorySale[];
};

const paymentBadgeClass = {
  efectivo: 'bg-emerald-50 text-emerald-700',
  tarjeta: 'bg-blue-50 text-blue-700',
  transferencia: 'bg-amber-50 text-amber-700',
} as const;

export function SalesHistoryTable({ onSelectSale, sales }: SalesHistoryTableProps) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)] lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/90">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Hora</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cliente</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">NIT / CF</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Método</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Productos</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sales.map((sale) => (
                <tr className="align-top transition hover:bg-blue-50/30" key={sale.id}>
                  <td className="px-5 py-5 text-sm font-semibold text-slate-900">
                    {timeOnly.format(new Date(sale.fecha))}
                  </td>
                  <td className="px-5 py-5">
                    <strong className="block text-sm text-slate-950">{sale.clienteNombre}</strong>
                    <span className="mt-1 block text-xs text-slate-500">Venta #{sale.id}</span>
                  </td>
                  <td className="px-5 py-5 text-sm text-slate-600">{sale.nit || 'CF'}</td>
                  <td className="px-5 py-5">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${paymentBadgeClass[sale.metodoPago]}`}>
                      {sale.metodoPago}
                    </span>
                  </td>
                  <td className="px-5 py-5">
                    <div className="space-y-2">
                      {sale.productos.map((product) => (
                        <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm" key={`${sale.id}-${product.productoId}`}>
                          <strong className="block text-slate-900">{product.nombre}</strong>
                          <span className="mt-1 block text-slate-500">
                            Cantidad: {product.cantidad} · Subtotal: {currency.format(product.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-5 text-sm font-black text-slate-950">{currency.format(sale.total)}</td>
                  <td className="px-5 py-5">
                    <button
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      onClick={() => onSelectSale(sale)}
                      type="button"
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:hidden">
        {sales.map((sale) => (
          <article
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)]"
            key={sale.id}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Venta #{sale.id}</span>
                <h3 className="mt-2 text-lg font-bold text-slate-950">{sale.clienteNombre}</h3>
              </div>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${paymentBadgeClass[sale.metodoPago]}`}>
                {sale.metodoPago}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <CalendarClock className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">Fecha</span>
                </div>
                <strong className="mt-2 block text-sm text-slate-950">{dateTime.format(new Date(sale.fecha))}</strong>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">NIT</span>
                </div>
                <strong className="mt-2 block text-sm text-slate-950">{sale.nit || 'CF'}</strong>
              </div>
            </div>

            <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-center gap-2 text-slate-400">
                <ReceiptText className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.16em]">Productos</span>
              </div>
              <div className="mt-3 space-y-3">
                {sale.productos.map((product) => (
                  <div className="rounded-2xl bg-white px-3 py-3 shadow-sm" key={`${sale.id}-${product.productoId}`}>
                    <strong className="block text-sm text-slate-900">{product.nombre}</strong>
                    <span className="mt-1 block text-sm text-slate-500">
                      {product.cantidad} × {currency.format(product.precioUnitario)}
                    </span>
                    <strong className="mt-2 block text-sm text-slate-950">{currency.format(product.subtotal)}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <strong className="text-2xl font-black text-slate-950">{currency.format(sale.total)}</strong>
              <button
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => onSelectSale(sale)}
                type="button"
              >
                Ver detalle
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
