type QuickActionsProps = {
  onAdjustStock: () => void;
  onNewProduct: () => void;
  onNewSale: () => void;
};

export function QuickActions({ onAdjustStock, onNewProduct, onNewSale }: QuickActionsProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
            Acciones rapidas
          </p>
          <h3 className="mt-2 text-xl font-bold text-slate-900">Atajos del sistema</h3>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(37,99,235,0.22)] transition hover:bg-blue-700"
            onClick={onNewSale}
            type="button"
          >
            Nueva venta
          </button>
          <button
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={onNewProduct}
            type="button"
          >
            Nuevo producto
          </button>
          <button
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            onClick={onAdjustStock}
            type="button"
          >
            Ajustar stock
          </button>
        </div>
      </div>
    </section>
  );
}
