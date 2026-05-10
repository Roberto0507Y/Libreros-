import { Minus, Plus, Trash2 } from 'lucide-react';

import { currency } from '../../lib/format';

export type PosCartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  subtotal: number;
  brandName: string;
  image?: string | null;
};

type CartItemRowProps = {
  item: PosCartItem;
  onDecrease: (productId: number) => void;
  onIncrease: (productId: number) => void;
  onRemove: (productId: number) => void;
};

export function CartItemRow({ item, onDecrease, onIncrease, onRemove }: CartItemRowProps) {
  const canIncrease = item.quantity < item.stock;

  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
          {item.image ? (
            <img alt={item.name} className="h-full w-full object-contain p-2" loading="lazy" src={item.image} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">
              SIN IMG
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="line-clamp-2 text-sm font-bold text-slate-950">{item.name}</h4>
              <p className="mt-1 text-xs text-slate-500">{item.brandName || 'Sin marca'}</p>
            </div>

            <button
              className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100"
              onClick={() => onRemove(item.id)}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-700 transition hover:bg-white"
                onClick={() => onDecrease(item.id)}
                type="button"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-10 text-center text-sm font-bold text-slate-900">{item.quantity}</span>
              <button
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-slate-300"
                disabled={!canIncrease}
                onClick={() => onIncrease(item.id)}
                type="button"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="text-right">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Subtotal
              </span>
              <strong className="mt-1 block text-base font-black text-slate-950">
                {currency.format(item.subtotal)}
              </strong>
              <span className="text-xs text-slate-500">{currency.format(item.price)} c/u</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
