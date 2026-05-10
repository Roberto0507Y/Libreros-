import { Plus, Package2 } from 'lucide-react';

import type { ProductItem } from '../../domain/types';
import { currency } from '../../lib/format';

type ProductCardProps = {
  product: ProductItem;
  quantityInCart: number;
  onAdd: (productId: number) => void;
};

export function ProductCard({ product, quantityInCart, onAdd }: ProductCardProps) {
  const stockAvailable = Math.max(product.stock - quantityInCart, 0);
  const isOutOfStock = stockAvailable <= 0;

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-[28px] border bg-white transition duration-200 ${
        isOutOfStock
          ? 'border-slate-200/80 opacity-85'
          : 'border-slate-200 shadow-[0_18px_40px_rgba(15,23,42,0.06)] hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_22px_48px_rgba(37,99,235,0.15)]'
      }`}
    >
      <button
        className="flex h-full flex-col text-left"
        disabled={isOutOfStock}
        onClick={() => onAdd(product.id)}
        type="button"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.12),_transparent_55%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)]">
          {product.primaryImage ? (
            <img
              alt={product.nombre}
              className="h-full w-full object-contain p-5 transition duration-300 group-hover:scale-[1.04]"
              loading="lazy"
              src={product.primaryImage}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300">
              <Package2 className="h-12 w-12" />
            </div>
          )}

          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span className="rounded-full border border-white/70 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm">
              {product.brandName || 'Sin marca'}
            </span>
          </div>

          {quantityInCart > 0 ? (
            <span className="absolute right-4 top-4 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)]">
              En carrito: {quantityInCart}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="space-y-2">
            <h3 className="line-clamp-2 text-base font-bold text-slate-950">{product.nombre}</h3>
            <p className="line-clamp-1 text-sm text-slate-500">
              {product.categoryName} · {product.subcategoryName}
            </p>
          </div>

          <div className="mt-auto grid gap-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Precio
                </span>
                <strong className="mt-1 block text-2xl font-black tracking-tight text-slate-950">
                  {currency.format(product.salePrice)}
                </strong>
              </div>

              <div
                className={`rounded-2xl px-3 py-2 text-right text-xs font-semibold ${
                  isOutOfStock
                    ? 'bg-rose-50 text-rose-600'
                    : stockAvailable <= 5
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                <span className="block uppercase tracking-[0.16em]">Stock</span>
                <span className="mt-1 block text-base">{stockAvailable}</span>
              </div>
            </div>

            <div
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isOutOfStock
                  ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                  : 'bg-slate-950 text-white group-hover:bg-blue-600'
              }`}
            >
              <Plus className="h-4 w-4" />
              {isOutOfStock ? 'Sin existencia' : 'Agregar'}
            </div>
          </div>
        </div>
      </button>
    </article>
  );
}
