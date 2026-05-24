import { ReceiptText, ShoppingCart } from 'lucide-react';

import { currency } from '../../lib/format';
import { CartItemRow, type PosCartItem } from './CartItemRow';

type PosCartProps = {
  cartCount: number;
  discount: string;
  isCompact?: boolean;
  isSaving: boolean;
  items: PosCartItem[];
  onDecrease: (productId: number) => void;
  onDiscountChange: (value: string) => void;
  onIncrease: (productId: number) => void;
  onOpenCheckout: () => void;
  onRemove: (productId: number) => void;
  subtotal: number;
  total: number;
};

export function PosCart({
  cartCount,
  discount,
  isCompact = false,
  isSaving,
  items,
  onDecrease,
  onDiscountChange,
  onIncrease,
  onOpenCheckout,
  onRemove,
  subtotal,
  total,
}: PosCartProps) {
  return (
    <aside
      className={`relative flex flex-col overflow-y-auto rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_54px_rgba(15,23,42,0.08)] ${
        isCompact ? 'h-[72vh]' : 'max-h-[calc(100vh-4rem)]'
      }`}
    >
      <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]">
            <ShoppingCart className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600">Carrito activo</p>
            <h3 className="mt-1 text-lg font-bold text-slate-950">Resumen de la venta</h3>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span>{cartCount} {cartCount === 1 ? 'artículo' : 'artículos'}</span>
          <strong className="text-base font-bold text-slate-950">{currency.format(total)}</strong>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 px-5 py-4">
        {!items.length ? (
          <div className="grid min-h-[240px] place-items-center rounded-[26px] border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
            <div>
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white text-slate-400 shadow-sm">
                <ReceiptText className="h-7 w-7" />
              </span>
              <strong className="mt-4 block text-lg text-slate-900">Tu venta todavía está vacía</strong>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Toca productos del catálogo para agregarlos al cobro en caja.
              </p>
            </div>
          </div>
        ) : (
          items.map((item) => (
            <CartItemRow
              item={item}
              key={item.id}
              onDecrease={onDecrease}
              onIncrease={onIncrease}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      <div className="sticky bottom-0 shrink-0 border-t border-slate-200 bg-slate-50/90 px-5 py-3 backdrop-blur-md">
        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-2.5">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <strong className="text-slate-900">{currency.format(subtotal)}</strong>
            </div>

            <label className="grid gap-2 text-sm font-medium text-slate-600">
              Descuento
              <input
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                min="0"
                onChange={(event) => onDiscountChange(event.target.value)}
                step="0.01"
                type="number"
                value={discount}
              />
            </label>

            <div className="flex items-center justify-between rounded-[22px] bg-slate-950 px-4 py-3.5 text-white">
              <span className="text-sm font-semibold">Total</span>
              <strong className="text-[1.85rem] font-black">{currency.format(total)}</strong>
            </div>

            <button
              className="inline-flex w-full items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#f59e0b,#f97316)] px-5 py-3.5 text-[15px] font-bold text-white shadow-[0_18px_34px_rgba(249,115,22,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(249,115,22,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!cartCount || isSaving}
              onClick={onOpenCheckout}
              type="button"
            >
              {isSaving ? 'Procesando...' : 'Finalizar compra'}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
