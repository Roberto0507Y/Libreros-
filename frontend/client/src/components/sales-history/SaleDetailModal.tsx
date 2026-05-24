import { CreditCard, ReceiptText, UserRound, Wallet } from 'lucide-react';

import type { SalesHistorySale } from '../../domain/types';
import { currency, dateTime } from '../../lib/format';
import { Modal } from '../ui/Modal';

type SaleDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  sale: SalesHistorySale | null;
};

const paymentTone = {
  efectivo: 'bg-emerald-50 text-emerald-700',
  tarjeta: 'bg-blue-50 text-blue-700',
  transferencia: 'bg-amber-50 text-amber-700',
} as const;

const sourceTone = {
  caja: 'bg-slate-100 text-slate-700',
  en_linea: 'bg-violet-50 text-violet-700',
} as const;

export function SaleDetailModal({ isOpen, onClose, sale }: SaleDetailModalProps) {
  if (!sale) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      subtitle="Revisa el detalle completo de la venta seleccionada."
      title={`${sale.origen === 'en_linea' ? 'Pedido' : 'Venta'} #${sale.id}`}
    >
      <div className="grid gap-6 px-6 py-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-slate-700 shadow-sm">
                <UserRound className="h-4 w-4" />
              </span>
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Cliente</span>
                <strong className="mt-1 block text-sm text-slate-950">{sale.clienteNombre}</strong>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500">{sale.nit === 'CF' ? 'NIT CF' : `NIT ${sale.nit}`}</p>
          </article>

          <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-slate-700 shadow-sm">
                <CreditCard className="h-4 w-4" />
              </span>
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Pago</span>
                <strong className="mt-1 block text-sm capitalize text-slate-950">{sale.metodoPago}</strong>
              </div>
            </div>
            {sale.referenciaPago ? (
              <p className="mt-3 text-sm text-slate-500">Ref. {sale.referenciaPago}</p>
            ) : null}
          </article>

          <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-slate-700 shadow-sm">
                <ReceiptText className="h-4 w-4" />
              </span>
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Fecha</span>
                <strong className="mt-1 block text-sm text-slate-950">{dateTime.format(new Date(sale.fecha))}</strong>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span>{sale.origen === 'en_linea' ? 'Registrado desde tienda online' : `Cajero: ${sale.cajero}`}</span>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${sourceTone[sale.origen]}`}>
                {sale.origenLabel}
              </span>
            </div>
          </article>

          <article className="rounded-[24px] border border-slate-200 bg-slate-950 p-4 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-white">
                <Wallet className="h-4 w-4" />
              </span>
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Total</span>
                <strong className="mt-1 block text-xl font-black">{currency.format(sale.total)}</strong>
              </div>
            </div>
          </article>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Producto
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Cantidad
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Precio unitario
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sale.productos.map((product) => (
                  <tr key={`${sale.id}-${product.productoId}`}>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-950">{product.nombre}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{product.cantidad}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{currency.format(product.precioUnitario)}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-950">{currency.format(product.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-3 rounded-[28px] bg-slate-50 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Subtotal</span>
            <strong className="mt-2 block text-lg text-slate-950">{currency.format(sale.subtotal)}</strong>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Descuento</span>
            <strong className="mt-2 block text-lg text-slate-950">{currency.format(sale.descuento)}</strong>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Cambio</span>
            <strong className="mt-2 block text-lg text-slate-950">{currency.format(sale.cambio)}</strong>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Estado</span>
            <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${paymentTone[sale.metodoPago]}`}>
              {sale.estado}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
