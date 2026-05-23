import { useEffect, useState } from 'react';
import { CalendarDays, CreditCard, Filter, Search, Wallet } from 'lucide-react';

import { fetchSalesHistory } from '../api/sales-history';
import { SaleDetailModal } from '../components/sales-history/SaleDetailModal';
import { SalesHistoryTable } from '../components/sales-history/SalesHistoryTable';
import { SalesSummaryCards } from '../components/sales-history/SalesSummaryCards';
import type { SalesHistoryResponse, SalesHistorySale, SessionData } from '../domain/types';
import { getGuatemalaDateInputValue } from '../lib/format';

type SalesHistoryPageProps = {
  session: SessionData;
};

const formatToday = () => getGuatemalaDateInputValue();

const emptyHistory: SalesHistoryResponse = {
  fecha: formatToday(),
  resumen: {
    totalVendido: 0,
    cantidadVentas: 0,
    productosVendidos: 0,
    ventasEfectivo: 0,
    ventasTarjeta: 0,
  },
  ventas: [],
};

export function SalesHistoryPage({ session }: SalesHistoryPageProps) {
  const [filters, setFilters] = useState({
    fecha: formatToday(),
    metodoPago: 'todos',
    query: '',
  });
  const [history, setHistory] = useState<SalesHistoryResponse>(emptyHistory);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedSale, setSelectedSale] = useState<SalesHistorySale | null>(null);

  const loadHistory = async (nextFilters = filters) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const payload = await fetchSalesHistory(session.token, nextFilters);
      setHistory(payload);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo cargar el historial de ventas.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory({
      fecha: formatToday(),
      metodoPago: 'todos',
      query: '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.token]);

  const handleSearch = () => {
    void loadHistory(filters);
  };

  const handleResetToday = () => {
    const next = {
      fecha: formatToday(),
      metodoPago: 'todos',
      query: '',
    };
    setFilters(next);
    void loadHistory(next);
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:px-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
              Cuadre diario
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Historial de ventas</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-600">
              Fecha
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  onChange={(event) => setFilters((current) => ({ ...current, fecha: event.target.value }))}
                  type="date"
                  value={filters.fecha}
                />
              </div>
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-600">
              Método de pago
              <div className="relative">
                <Wallet className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, metodoPago: event.target.value }))
                  }
                  value={filters.metodoPago}
                >
                  <option value="todos">Todos</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-600 xl:col-span-2">
              Cliente, NIT o producto
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                  placeholder="Ej. CF, Juan Pérez, cuaderno..."
                  type="search"
                  value={filters.query}
                />
              </div>
            </label>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            onClick={handleSearch}
            type="button"
          >
            <Search className="mr-2 h-4 w-4" />
            Buscar
          </button>
          <button
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={handleResetToday}
            type="button"
          >
            <Filter className="mr-2 h-4 w-4" />
            Hoy
          </button>
        </div>
      </section>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                className="h-32 animate-pulse rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
                key={index}
              />
            ))}
          </div>
          <div className="h-[420px] animate-pulse rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]" />
        </div>
      ) : (
        <>
          <SalesSummaryCards summary={history.resumen} />

          {history.ventas.length ? (
            <section className="grid gap-4">
              <div className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:px-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600">
                      Ventas encontradas
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-950">
                      {history.ventas.length} ventas para {history.fecha}
                    </h3>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                    <CreditCard className="h-4 w-4" />
                    {session.user.role.name}
                  </div>
                </div>
              </div>

              <SalesHistoryTable onSelectSale={setSelectedSale} sales={history.ventas} />
            </section>
          ) : (
            <section className="grid min-h-[360px] place-items-center rounded-[30px] border border-dashed border-slate-200 bg-white px-8 text-center shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div>
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-slate-100 text-slate-400">
                  <CalendarDays className="h-7 w-7" />
                </span>
                <strong className="mt-4 block text-2xl text-slate-950">No hay ventas en esta fecha</strong>
                <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  No encontramos ventas con los filtros actuales. Intenta cambiar la fecha, el método
                  de pago o el texto de búsqueda.
                </p>
              </div>
            </section>
          )}
        </>
      )}

      <SaleDetailModal isOpen={Boolean(selectedSale)} onClose={() => setSelectedSale(null)} sale={selectedSale} />
    </div>
  );
}
