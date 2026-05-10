import { currency } from '../../lib/format';

type SaleCartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  subtotal: number;
  brandName: string;
};

type SaleCartProps = {
  items: SaleCartItem[];
  onRemove: (productId: number) => void;
};

export function SaleCart({ items, onRemove }: SaleCartProps) {
  if (!items.length) {
    return (
      <section className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path
              d="M3 3h2l.4 2M7 13h10l4-8H6.4m.6 8L5.3 5M7 13l-1.2 6.2a1 1 0 0 0 1 .8H19m-12 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm11 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </span>
        <strong className="mt-4 block text-lg text-slate-900">Aun no hay productos en la venta.</strong>
        <span className="mt-2 block text-sm text-slate-500">
          Agrega articulos desde el buscador para comenzar a cobrar.
        </span>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">Carrito</p>
          <h3 className="mt-2 text-xl font-bold text-slate-900">Productos agregados</h3>
        </div>
        <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
          {items.length} {items.length === 1 ? 'producto' : 'productos'}
        </span>
      </div>

      <div className="hidden lg:block">
        <div className="overflow-hidden rounded-[24px] border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Producto
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Cantidad
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Precio
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Subtotal
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Accion
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((item) => (
                <tr className="transition hover:bg-blue-50/30" key={item.id}>
                  <td className="px-4 py-4">
                    <strong className="block text-sm text-slate-900">{item.name}</strong>
                    <span className="mt-1 block text-xs text-slate-500">
                      #{item.id} • {item.brandName || 'Sin marca'} • stock {item.stock}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-slate-700">{item.quantity}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{currency.format(item.price)}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                    {currency.format(item.subtotal)}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                      onClick={() => onRemove(item.id)}
                      type="button"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:hidden">
        {items.map((item) => (
          <article
            className="rounded-[24px] border border-slate-200 bg-slate-50/60 p-4 shadow-sm"
            key={item.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <strong className="block text-sm text-slate-900">{item.name}</strong>
                <span className="mt-1 block text-xs text-slate-500">
                  #{item.id} • {item.brandName || 'Sin marca'}
                </span>
              </div>
              <button
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                onClick={() => onRemove(item.id)}
                type="button"
              >
                Eliminar
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-2xl bg-white p-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Cantidad</p>
                <strong className="mt-2 block text-slate-900">{item.quantity}</strong>
              </div>
              <div className="rounded-2xl bg-white p-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Precio</p>
                <strong className="mt-2 block text-slate-900">{currency.format(item.price)}</strong>
              </div>
              <div className="rounded-2xl bg-white p-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Subtotal</p>
                <strong className="mt-2 block text-slate-900">{currency.format(item.subtotal)}</strong>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export type { SaleCartItem };
