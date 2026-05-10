import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Clock3, Search, Truck } from 'lucide-react';

import { fetchAdminDeliveryOrders } from '../api/delivery';
import type { DeliveryOrder, SessionData } from '../domain/types';
import { dateTime } from '../lib/format';

type DeliveryHistoryPageProps = {
  session: SessionData;
};

const PAGE_SIZE = 10;

function formatDuration(order: DeliveryOrder) {
  const start = new Date(order.fecha).getTime();
  const endSource = order.deliveredAt || order.updatedAt || order.fecha;
  const end = new Date(endSource).getTime();
  const diffMinutes = Math.max(0, Math.round((end - start) / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (!minutes) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
}

export function DeliveryHistoryPage({ session }: DeliveryHistoryPageProps) {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const payload = await fetchAdminDeliveryOrders(session.token, {
          q: query,
          status: 'entregado',
        });
        setOrders(payload.orders.filter((order) => order.estadoPedido === 'entregado'));
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'No se pudo cargar el historial de entregas.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadHistory();
  }, [query, session.token]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return orders.slice(start, start + PAGE_SIZE);
  }, [currentPage, orders]);

  const summary = useMemo(() => {
    const total = orders.length;
    const totalMinutes = orders.reduce((accumulator, order) => {
      const start = new Date(order.fecha).getTime();
      const end = new Date(order.deliveredAt || order.updatedAt || order.fecha).getTime();
      return accumulator + Math.max(0, Math.round((end - start) / 60000));
    }, 0);

    return {
      total,
      averageMinutes: total ? Math.round(totalMinutes / total) : 0,
      withCourier: orders.filter((order) => order.repartidor?.nombre).length,
    };
  }, [orders]);

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff,#f4f8ff)] px-5 py-5 shadow-[0_18px_44px_rgba(15,23,42,0.06)] md:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
              Delivery admin
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Historial de entregas
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 md:text-base">
              Consulta quién completó cada entrega, el número de pedido y el tiempo total que tomó.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                  <BadgeCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Completadas
                  </p>
                  <strong className="mt-1 block text-2xl font-black tracking-[-0.04em] text-slate-950">
                    {summary.total}
                  </strong>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                  <Clock3 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Tiempo promedio
                  </p>
                  <strong className="mt-1 block text-2xl font-black tracking-[-0.04em] text-slate-950">
                    {summary.averageMinutes} min
                  </strong>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <Truck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Con repartidor
                  </p>
                  <strong className="mt-1 block text-2xl font-black tracking-[-0.04em] text-slate-950">
                    {summary.withCourier}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          <input
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por pedido, tracking o repartidor..."
            type="search"
            value={query}
          />
        </div>
      </section>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="h-[150px] animate-pulse rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
              key={index}
            />
          ))}
        </div>
      ) : paginatedOrders.length ? (
        <div className="grid gap-4">
          {paginatedOrders.map((order) => (
            <article
              className="grid gap-4 rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:grid-cols-[1.2fr_1fr_0.8fr]"
              key={order.id}
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-600">
                  {order.trackingCode || `Pedido #${order.id}`}
                </p>
                <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">
                  Entrega #{order.id}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Finalizada el {dateTime.format(new Date(order.deliveredAt || order.updatedAt || order.fecha))}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Repartidor
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-950">
                  {order.repartidor?.nombre || 'Sin repartidor registrado'}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Tiempo de entrega
                </p>
                <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                  {formatDuration(order)}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="grid min-h-[320px] place-items-center rounded-[30px] border border-dashed border-slate-200 bg-white px-8 text-center shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
          <div>
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-slate-100 text-slate-400">
              <Truck className="h-7 w-7" />
            </span>
            <strong className="mt-4 block text-2xl text-slate-950">No hay entregas finalizadas</strong>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Cuando un repartidor complete pedidos, aparecerán aquí con su tiempo total de entrega.
            </p>
          </div>
        </section>
      )}

      {orders.length > PAGE_SIZE ? (
        <div className="flex flex-col items-center justify-between gap-3 rounded-[28px] border border-slate-200 bg-white px-4 py-4 shadow-[0_16px_34px_rgba(15,23,42,0.05)] sm:flex-row">
          <p className="text-sm font-medium text-slate-500">
            Mostrando{' '}
            <span className="font-semibold text-slate-900">
              {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, orders.length)}
            </span>{' '}
            de <span className="font-semibold text-slate-900">{orders.length}</span> entregas
          </p>

          <div className="flex items-center gap-2">
            <button
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              type="button"
            >
              Anterior
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                className={`inline-flex h-10 min-w-10 items-center justify-center rounded-2xl px-3 text-sm font-semibold transition ${
                  currentPage === page
                    ? 'bg-slate-950 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:text-slate-900'
                }`}
                key={page}
                onClick={() => setCurrentPage(page)}
                type="button"
              >
                {page}
              </button>
            ))}

            <button
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              type="button"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
