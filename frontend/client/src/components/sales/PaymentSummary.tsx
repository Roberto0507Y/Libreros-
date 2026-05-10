import type { CustomerItem } from '../../domain/types';
import { currency } from '../../lib/format';
import { PaymentMethodSelector, type PaymentMethod } from './PaymentMethodSelector';

type PaymentSummaryProps = {
  amountReceived: string;
  cartCount: number;
  change: number;
  discount: string;
  isSaving: boolean;
  paymentReference: string;
  selectedCustomer: CustomerItem | null;
  onAmountReceivedChange: (value: string) => void;
  onClear: () => void;
  onDiscountChange: (value: string) => void;
  onFinalize: () => void;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onPaymentReferenceChange: (value: string) => void;
  paymentMethod: PaymentMethod;
  subtotal: number;
  total: number;
};

export function PaymentSummary({
  amountReceived,
  cartCount,
  change,
  discount,
  isSaving,
  paymentReference,
  selectedCustomer,
  onAmountReceivedChange,
  onClear,
  onDiscountChange,
  onFinalize,
  onPaymentMethodChange,
  onPaymentReferenceChange,
  paymentMethod,
  subtotal,
  total,
}: PaymentSummaryProps) {
  return (
    <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] lg:sticky lg:top-24">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
          Resumen de cobro
        </p>
        <h3 className="mt-2 text-xl font-bold text-slate-900">Pago en caja</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Revisa el total y confirma la venta solo cuando el cobro este listo.
        </p>
      </div>

      <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
          <span>Productos</span>
          <strong className="text-slate-900">{cartCount}</strong>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
          <span>Subtotal</span>
          <strong className="text-slate-900">{currency.format(subtotal)}</strong>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Cliente
          </span>
          <strong className="mt-2 block text-slate-900">
            {selectedCustomer
              ? selectedCustomer.nit?.toUpperCase() === 'CF'
                ? 'Consumidor Final - NIT CF'
                : selectedCustomer.name
              : 'Sin cliente seleccionado'}
          </strong>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-600" htmlFor="sale-discount">
            Descuento
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            id="sale-discount"
            min="0"
            onChange={(event) => onDiscountChange(event.target.value)}
            step="0.01"
            type="number"
            value={discount}
          />
        </div>
        <div className="mt-1 rounded-[22px] bg-slate-900 px-4 py-4 text-white">
          <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
            Total a pagar
          </span>
          <strong className="mt-2 block text-3xl">{currency.format(total)}</strong>
        </div>
      </div>

      <div className="mt-5">
        <PaymentMethodSelector onChange={onPaymentMethodChange} value={paymentMethod} />
      </div>

      {paymentMethod === 'efectivo' ? (
        <div className="mt-5 grid gap-4 rounded-[24px] border border-emerald-200 bg-emerald-50/60 p-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="sale-amount-received">
              Monto recibido
            </label>
            <input
              className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              id="sale-amount-received"
              min="0"
              onChange={(event) => onAmountReceivedChange(event.target.value)}
              step="0.01"
              type="number"
              value={amountReceived}
            />
          </div>

          <div className="rounded-[22px] bg-white px-4 py-4 shadow-sm">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Cambio</span>
            <strong className="mt-2 block text-2xl text-emerald-600">{currency.format(change)}</strong>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-2 rounded-[24px] border border-blue-200 bg-blue-50/60 p-4">
          <label className="text-sm font-medium text-slate-700" htmlFor="sale-payment-reference">
            Referencia de pago
          </label>
          <input
            className="w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            id="sale-payment-reference"
            onChange={(event) => onPaymentReferenceChange(event.target.value)}
            placeholder={
              paymentMethod === 'tarjeta'
                ? 'Autorización POS, últimos 4 dígitos, voucher...'
                : 'No. de transferencia o referencia bancaria'
            }
            type="text"
            value={paymentReference}
          />
        </div>
      )}

      <div className="mt-6 grid gap-3">
        <button
          className="rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!cartCount || isSaving}
          onClick={onFinalize}
          type="button"
        >
          {isSaving ? 'Finalizando...' : 'Finalizar venta'}
        </button>

        <button
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          onClick={onClear}
          type="button"
        >
          Limpiar venta
        </button>
      </div>
    </aside>
  );
}
