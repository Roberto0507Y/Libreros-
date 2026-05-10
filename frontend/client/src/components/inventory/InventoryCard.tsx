import type { ProductItem } from '../../domain/types';
import { currency } from '../../lib/format';
import { StockBadge, type StockStatus } from './StockBadge';

type InventoryCardProps = {
  getStatus: (product: ProductItem) => StockStatus;
  onAdjustStock: (productId: number) => void;
  onEdit: (productId: number) => void;
  onViewDetail: (product: ProductItem) => void;
  product: ProductItem;
};

export function InventoryCard({
  getStatus,
  onAdjustStock,
  onEdit,
  onViewDetail,
  product,
}: InventoryCardProps) {
  return (
    <article className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_20px_36px_rgba(15,23,42,0.08)]">
      <div className="grid h-48 place-items-center border-b border-slate-100 bg-slate-50 p-5">
        {product.primaryImage ? (
          <img alt={product.nombre} className="max-h-full w-full object-contain" src={product.primaryImage} />
        ) : (
          <span className="text-sm font-medium text-slate-400">Sin imagen</span>
        )}
      </div>

      <div className="grid gap-4 p-5">
        <div>
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span>{product.categoryName}</span>
            <span>•</span>
            <span>{product.brandName}</span>
          </div>
          <h3 className="mt-3 text-lg font-bold leading-7 text-slate-900">{product.nombre}</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Compra</p>
            <strong className="mt-2 block text-sm text-slate-900">{currency.format(product.purchasePrice)}</strong>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Venta</p>
            <strong className="mt-2 block text-sm text-slate-900">{currency.format(product.salePrice)}</strong>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <StockBadge status={getStatus(product)} stock={product.stock} />
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            #{product.id}
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <button
            className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
            onClick={() => onViewDetail(product)}
            type="button"
          >
            Ver detalle
          </button>
          <button
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={() => onEdit(product.id)}
            type="button"
          >
            Editar
          </button>
          <button
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
            onClick={() => onAdjustStock(product.id)}
            type="button"
          >
            Ajustar stock
          </button>
        </div>
      </div>
    </article>
  );
}
