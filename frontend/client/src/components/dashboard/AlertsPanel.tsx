import type { LowStockProduct } from '../../domain/types';

type AlertsPanelProps = {
  alerts: LowStockProduct[];
  onGoToInventory: () => void;
};

export function AlertsPanel({ alerts, onGoToInventory }: AlertsPanelProps) {
  const outOfStock = alerts.filter((product) => product.stock <= 0);
  const lowStock = alerts.filter((product) => product.stock > 0);

  return (
    <article className="flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
            Alertas
          </p>
          <h3 className="mt-2 text-xl font-bold text-slate-900">Inventario critico</h3>
        </div>

        <div className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
          {alerts.length} alertas
        </div>
      </div>

      {alerts.length ? (
        <div className="grid gap-3">
          <div className="rounded-[24px] border border-rose-200 bg-rose-50/70 p-4">
            <strong className="block text-sm text-slate-900">Productos sin stock</strong>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {outOfStock.length ? (
                outOfStock.map((product) => (
                  <span
                    className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm"
                    key={product.id}
                  >
                    {product.nombre}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">No hay productos agotados.</span>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-amber-200 bg-amber-50/70 p-4">
            <strong className="block text-sm text-slate-900">Productos con stock bajo</strong>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {lowStock.length ? (
                lowStock.map((product) => (
                  <span
                    className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-amber-700 shadow-sm"
                    key={product.id}
                  >
                    {product.nombre} · {product.stock}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">No hay productos con stock bajo.</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
          <strong className="block text-lg text-slate-900">No hay alertas activas.</strong>
          <span className="mt-2 block text-sm text-slate-500">
            Tu inventario se encuentra en buen estado por ahora.
          </span>
        </div>
      )}

      <button
        className="mt-4 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        onClick={onGoToInventory}
        type="button"
      >
        Ir a inventario
      </button>
    </article>
  );
}
