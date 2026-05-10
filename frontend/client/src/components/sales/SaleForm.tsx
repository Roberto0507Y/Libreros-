import type { CustomerItem } from '../../domain/types';

type SaleFormProps = {
  customerQuery: string;
  customers: CustomerItem[];
  isSearching?: boolean;
  onCustomerQueryChange: (value: string) => void;
  onCustomerSelect: (customerId: number) => void;
  onNewCustomerClick: () => void;
  selectedCustomer: CustomerItem | null;
};

export function SaleForm({
  customerQuery,
  customers,
  isSearching = false,
  onCustomerQueryChange,
  onCustomerSelect,
  onNewCustomerClick,
  selectedCustomer,
}: SaleFormProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">Cliente</p>
          <h3 className="mt-2 text-xl font-bold text-slate-900">Atiende rapido en caja</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Usa consumidor final por defecto o busca un cliente por nombre, NIT o telefono.
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          onClick={onNewCustomerClick}
          type="button"
        >
          + Nuevo cliente
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-1.5">
          <label
            className="flex items-center gap-3 rounded-[18px] bg-white px-4 py-3 shadow-sm"
            htmlFor="sale-customer-search"
          >
            <span className="text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                <path
                  d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </span>
            <input
              className="w-full border-0 bg-transparent p-0 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0"
              id="sale-customer-search"
              onChange={(event) => onCustomerQueryChange(event.target.value)}
              placeholder="Buscar por nombre, NIT o telefono..."
              type="search"
              value={customerQuery}
            />
            {isSearching ? (
              <span className="text-xs font-semibold text-blue-600">Buscando...</span>
            ) : null}
          </label>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600" htmlFor="sale-customer-select">
            Cliente seleccionado
          </label>
          <select
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            id="sale-customer-select"
            onChange={(event) => onCustomerSelect(Number(event.target.value))}
            value={selectedCustomer ? String(selectedCustomer.id) : ''}
          >
            <option value="">
              {customers.length ? 'Selecciona un cliente' : 'No hay clientes disponibles'}
            </option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
                {customer.nit ? ` • NIT ${customer.nit}` : ''}
                {customer.telefono ? ` • ${customer.telefono}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCustomer ? (
        <div className="mt-4 rounded-[22px] border border-emerald-200 bg-emerald-50/70 px-4 py-4 text-sm text-emerald-900">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Cliente actual</p>
          <strong className="mt-2 block text-base">
            {selectedCustomer.nit?.toUpperCase() === 'CF'
              ? 'Consumidor Final - NIT CF'
              : selectedCustomer.name}
          </strong>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-emerald-700/90">
            {selectedCustomer.nit && selectedCustomer.nit.toUpperCase() !== 'CF' ? (
              <span>NIT: {selectedCustomer.nit}</span>
            ) : null}
            {selectedCustomer.telefono ? <span>Tel: {selectedCustomer.telefono}</span> : null}
            {selectedCustomer.correo ? <span>{selectedCustomer.correo}</span> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
