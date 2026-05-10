import type { ProductItem } from '../../domain/types';
import { currency } from '../../lib/format';
import { StockBadge, type StockStatus } from './StockBadge';

type InventoryTableProps = {
  getStatus: (product: ProductItem) => StockStatus;
  onAdjustStock: (productId: number) => void;
  onEdit: (productId: number) => void;
  onViewDetail: (product: ProductItem) => void;
  products: ProductItem[];
};

export function InventoryTable({
  getStatus,
  onAdjustStock,
  onEdit,
  onViewDetail,
  products,
}: InventoryTableProps) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Imagen</th>
              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Producto</th>
              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Categoria</th>
              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Marca</th>
              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Compra</th>
              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Venta</th>
              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Stock</th>
              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Estado</th>
              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {products.map((product) => (
              <tr className="transition hover:bg-blue-50/30" key={product.id}>
                <td className="px-4 py-4">
                  <button
                    className="inline-flex h-16 w-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300"
                    onClick={() => onViewDetail(product)}
                    type="button"
                  >
                    {product.primaryImage ? (
                      <img alt={product.nombre} className="h-full w-full object-cover" src={product.primaryImage} />
                    ) : (
                      <span className="px-1 text-center text-[11px] font-semibold text-slate-400">Sin foto</span>
                    )}
                  </button>
                </td>
                <td className="px-4 py-4">
                  <strong className="block text-sm text-slate-900">{product.nombre}</strong>
                  <span className="mt-1 block text-xs text-slate-500">{product.subcategoryName}</span>
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">{product.categoryName}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{product.brandName}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{currency.format(product.purchasePrice)}</td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-900">{currency.format(product.salePrice)}</td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-900">{product.stock}</td>
                <td className="px-4 py-4">
                  <StockBadge status={getStatus(product)} stock={product.stock} />
                </td>
                <td className="px-4 py-4">
                  <div className="grid gap-2">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
