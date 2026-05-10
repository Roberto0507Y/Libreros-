import type { RecentSale } from '../../domain/types';
import { currency, dateTime } from '../../lib/format';

type RecentSalesProps = {
  onGoToSales: () => void;
  onViewSale: (saleId: number) => void;
  sales: RecentSale[];
};

export function RecentSales({ onGoToSales, onViewSale, sales }: RecentSalesProps) {
  return (
    <article className="flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
            Ventas recientes
          </p>
          <h3 className="mt-2 text-xl font-bold text-slate-900">Ultimos movimientos de caja</h3>
        </div>

        <button
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          onClick={onGoToSales}
          type="button"
        >
          Ver todas
        </button>
      </div>

      {sales.length ? (
        <div className="overflow-hidden rounded-[24px] border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Cliente
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Total
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Fecha
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Accion
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sales.map((sale) => (
                <tr className="transition hover:bg-blue-50/30" key={sale.id}>
                  <td className="px-4 py-3.5">
                    <strong className="block text-sm text-slate-900">{sale.customerName}</strong>
                    <span className="mt-1 block text-xs text-slate-500">Venta #{sale.id}</span>
                  </td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-slate-900">
                    {currency.format(sale.total)}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">
                    {dateTime.format(new Date(sale.fecha))}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                      onClick={() => onViewSale(sale.id)}
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
      ) : (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
          <strong className="block text-lg text-slate-900">Aun no hay ventas registradas.</strong>
          <span className="mt-2 block text-sm text-slate-500">
            Comienza registrando tu primera venta desde el panel.
          </span>
          <button
            className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(37,99,235,0.22)] transition hover:bg-blue-700"
            onClick={onGoToSales}
            type="button"
          >
            Registrar venta
          </button>
        </div>
      )}
    </article>
  );
}
