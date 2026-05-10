import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CheckCircle,
  Clock3,
  ExternalLink,
  MapPin,
  Navigation,
  PackageCheck,
  Phone,
  Search,
  Truck,
  UserRound,
} from 'lucide-react';

import {
  assignDeliveryUser,
  fetchAdminDeliveryOrders,
  fetchCourierOrders,
  updateCourierOrderStatus,
} from '../api/delivery';
import { DeliveryStatusBadge } from '../components/delivery/DeliveryStatusBadge';
import { DELIVERY_STATUS_STEPS, getDeliveryStatusIndex } from '../components/delivery/delivery-status';
import type { DeliveryOrder, SessionData, UserManagementItem } from '../domain/types';
import { currency, dateTime } from '../lib/format';

type DeliveryManagementPageProps = {
  mode: 'all' | 'active' | 'completed';
  onActionComplete: (message: string) => Promise<void> | void;
  session: SessionData;
  users: UserManagementItem[];
};

type DeliveryFilter = 'all' | 'nuevo' | 'preparando' | 'despachado' | 'en_camino' | 'entregado' | 'retrasado';

const COMPANY_ZONE_1 = 'Zona 1, Ciudad de Guatemala';
const AUTO_REFRESH_MS = 30000;
const PAGE_SIZE = 10;

const filterLabels: Array<{ id: DeliveryFilter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'nuevo', label: 'Nuevo' },
  { id: 'preparando', label: 'Preparando' },
  { id: 'despachado', label: 'Despachado' },
  { id: 'en_camino', label: 'En camino' },
  { id: 'entregado', label: 'Entregado' },
  { id: 'retrasado', label: 'Retrasado' },
];

function isDelayedOrder(order: DeliveryOrder) {
  if (order.estadoPedido === 'entregado') {
    return false;
  }

  const minutesSinceCreated = (Date.now() - new Date(order.fecha).getTime()) / 60000;
  const expectedWindow = (order.tiempoEstimadoMinutos ?? 60) + 45;

  return minutesSinceCreated > expectedWindow;
}

function matchesFilter(order: DeliveryOrder, filter: DeliveryFilter) {
  if (filter === 'all') {
    return true;
  }

  if (filter === 'retrasado') {
    return isDelayedOrder(order);
  }

  if (filter === 'nuevo') {
    return order.estadoPedido === 'pedido_recibido' || order.estadoPedido === 'pago_confirmado';
  }

  if (filter === 'preparando') {
    return order.estadoPedido === 'preparando_pedido';
  }

  if (filter === 'despachado') {
    return order.estadoPedido === 'pedido_despachado';
  }

  if (filter === 'en_camino') {
    return (
      order.estadoPedido === 'repartidor_en_camino' || order.estadoPedido === 'repartidor_cerca'
    );
  }

  return order.estadoPedido === 'entregado';
}

function matchesQuery(order: DeliveryOrder, query: string) {
  if (!query.trim()) {
    return true;
  }

  const normalized = query.trim().toLowerCase();
  const haystack = [
    order.trackingCode,
    order.cliente.nombre,
    order.cliente.nit,
    order.cliente.telefono,
    order.telefonoEntrega,
    order.zonaEntrega,
    order.direccionEntrega,
    order.referenciaEntrega,
    ...order.productos.map((product) => product.nombre),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalized);
}

function formatStatusLabel(order: DeliveryOrder) {
  if (isDelayedOrder(order)) {
    return 'Retrasado';
  }

  switch (order.estadoPedido) {
    case 'pedido_recibido':
    case 'pago_confirmado':
      return 'Nuevo';
    case 'preparando_pedido':
      return 'Preparando';
    case 'pedido_despachado':
      return 'Despachado';
    case 'repartidor_en_camino':
      return 'En camino';
    case 'repartidor_cerca':
      return 'Cerca';
    case 'entregado':
      return 'Entregado';
    default:
      return order.estado.label;
  }
}

function buildMapsUrl(order: DeliveryOrder) {
  const destination = encodeURIComponent(
    [order.direccionEntrega, order.zonaEntrega, 'Guatemala'].filter(Boolean).join(', '),
  );
  const origin = encodeURIComponent(COMPANY_ZONE_1);
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
}

function normalizeDeliveryPhone(phone: string) {
  const rawPhone = phone.replace(/\D/g, '');

  if (!rawPhone) {
    return '';
  }

  if (rawPhone.startsWith('502') && rawPhone.length >= 11) {
    return rawPhone;
  }

  if (rawPhone.length === 8) {
    return `502${rawPhone}`;
  }

  return rawPhone;
}

function buildWhatsappUrl(order: DeliveryOrder, phone: string) {
  const message = encodeURIComponent(
    `Hola ${order.nombreRecibe || order.cliente.nombre}, tu pedido ${order.trackingCode || `#${order.id}`} de Librería Digital Nexus está en ruta.`,
  );
  return `https://wa.me/${phone}?text=${message}`;
}

function buildCallUrl(phone: string) {
  return `tel:+${phone}`;
}

function DeliverySummaryCard({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: typeof PackageCheck;
  label: string;
  tone: 'blue' | 'amber' | 'emerald' | 'cyan';
  value: string;
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
  } as const;

  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-2xl ring-1 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <strong className="mt-1 block text-2xl font-black tracking-[-0.04em] text-slate-950">
            {value}
          </strong>
        </div>
      </div>
    </div>
  );
}

function TimelinePill({
  active,
  complete,
  label,
}: {
  active: boolean;
  complete: boolean;
  label: string;
}) {
  return (
    <div className="flex min-w-[88px] flex-col items-center gap-2 text-center">
      <span
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold transition ${
          complete
            ? 'bg-blue-600 text-white shadow-[0_8px_18px_rgba(37,99,235,0.22)]'
            : active
              ? 'border border-blue-200 bg-blue-50 text-blue-700'
              : 'border border-slate-200 bg-white text-slate-400'
        }`}
      >
        {complete ? '✓' : '•'}
      </span>
      <span
        className={`text-[11px] font-semibold leading-4 ${
          complete || active ? 'text-slate-900' : 'text-slate-400'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function DeliveryRouteCard({ order }: { order: DeliveryOrder }) {
  const hasAddress = Boolean(order.direccionEntrega?.trim());
  const statusLabel = formatStatusLabel(order);

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Ruta de entrega</p>
          <p className="mt-1 text-xs text-slate-500">Resumen de origen, destino y estado actual.</p>
        </div>
        <DeliveryStatusBadge label={statusLabel} status={order.estadoPedido} />
      </div>

      {hasAddress ? (
        <div className="mt-4 grid gap-4">
          <div className="rounded-[20px] bg-slate-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <PackageCheck className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Origen</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{COMPANY_ZONE_1}</p>
                <p className="mt-1 text-xs text-slate-500">Librería Digital Nexus</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="h-12 w-px bg-slate-200" />
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
          </div>

          <div className="rounded-[20px] bg-slate-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <MapPin className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Destino</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{order.direccionEntrega}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Zona: {order.zonaEntrega || 'Sin zona'} · Tiempo estimado:{' '}
                  {order.tiempoEstimadoMinutos ? `${order.tiempoEstimadoMinutos} min` : 'Pendiente'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
          <p className="text-sm font-semibold text-slate-900">No hay dirección registrada</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Solicita al cliente actualizar sus datos de entrega.
          </p>
        </div>
      )}
    </div>
  );
}

export function DeliveryManagementPage({
  mode,
  onActionComplete,
  session,
  users,
}: DeliveryManagementPageProps) {
  const isAdminView = ['Administrador', 'Director'].includes(session.user.role.name);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [query, setQuery] = useState('');
  const [selectedRepartidores, setSelectedRepartidores] = useState<Record<number, string>>({});
  const [activeFilter, setActiveFilter] = useState<DeliveryFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const repartidores = useMemo(
    () => users.filter((user) => user.role.name === 'Repartidor'),
    [users],
  );
  const isCompletedMode = mode === 'completed';
  const isActiveMode = mode === 'active';

  const visibleFilters = useMemo(() => {
    if (isCompletedMode) {
      return filterLabels.filter((filter) => filter.id === 'all' || filter.id === 'entregado');
    }

    if (isActiveMode) {
      return filterLabels.filter((filter) => filter.id !== 'entregado');
    }

    return filterLabels;
  }, [isActiveMode, isCompletedMode]);

  const pageCopy = useMemo(() => {
    if (isCompletedMode) {
      return {
        title: 'Mis entregas',
        description:
          'Consulta tus entregas finalizadas, revisa el historial reciente y mantén ordenado tu cierre diario.',
        emptyTitle: 'Aún no tienes entregas completadas',
        emptyDescription:
          'Cuando cierres una ruta correctamente, el pedido aparecerá aquí automáticamente.',
      };
    }

    if (isActiveMode) {
      return {
        title: 'Entregas activas',
        description:
          'Gestiona tus rutas actuales, avanza estados y mueve a historial cada entrega completada.',
        emptyTitle: 'No tienes entregas activas',
        emptyDescription:
          'Tus pedidos asignados y pendientes de entrega aparecerán aquí en tiempo real.',
      };
    }

    return {
      title: 'Centro de entregas',
      description:
        'Despacha rutas, asigna repartidores y monitorea pedidos con una vista más operativa.',
      emptyTitle: 'No hay entregas para mostrar',
      emptyDescription: 'Todavía no existen pedidos de domicilio con los filtros actuales.',
    };
  }, [isActiveMode, isAdminView, isCompletedMode]);

  const loadOrders = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const payload = isAdminView
        ? await fetchAdminDeliveryOrders(session.token, { q: query })
        : await fetchCourierOrders(session.token);
      setOrders(payload.orders);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudieron cargar las entregas.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.token, isAdminView]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadOrders();
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.token, isAdminView, query]);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        if (isActiveMode && order.estadoPedido === 'entregado') {
          return false;
        }

        if (isCompletedMode && order.estadoPedido !== 'entregado') {
          return false;
        }

        return matchesFilter(order, activeFilter) && matchesQuery(order, query);
      }),
    [activeFilter, isActiveMode, isCompletedMode, orders, query],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, mode, query]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, filteredOrders.length]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredOrders]);

  const scopedOrders = useMemo(() => {
    if (isCompletedMode) {
      return orders.filter((order) => order.estadoPedido === 'entregado');
    }

    if (isActiveMode) {
      return orders.filter((order) => order.estadoPedido !== 'entregado');
    }

    return orders;
  }, [isActiveMode, isCompletedMode, orders]);

  const todayOrdersCount = scopedOrders.length;
  const pendingOrdersCount = scopedOrders.filter((order) => order.estadoPedido !== 'entregado').length;
  const deliveredOrdersCount = scopedOrders.filter((order) => order.estadoPedido === 'entregado').length;
  const onRouteOrdersCount = scopedOrders.filter(
    (order) =>
      order.estadoPedido === 'pedido_despachado' ||
      order.estadoPedido === 'repartidor_en_camino' ||
      order.estadoPedido === 'repartidor_cerca',
  ).length;

  const handleAssign = async (orderId: number) => {
    const repartidorId = Number(selectedRepartidores[orderId] ?? 0);

    if (!repartidorId) {
      setErrorMessage('Selecciona un repartidor antes de asignar el pedido.');
      return;
    }

    try {
      const payload = await assignDeliveryUser(session.token, orderId, repartidorId);
      await onActionComplete(payload.message);
      await loadOrders();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo asignar el repartidor.');
    }
  };

  const handleAdvanceStatus = async (order: DeliveryOrder) => {
    const currentIndex = getDeliveryStatusIndex(order.estadoPedido);
    const nextStep = DELIVERY_STATUS_STEPS[currentIndex + 1];

    if (!nextStep) {
      return;
    }

    try {
      const payload = await updateCourierOrderStatus(session.token, order.id, nextStep.code);
      await onActionComplete(payload.message);
      await loadOrders();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo actualizar el estado del pedido.',
      );
    }
  };

  const handleOpenWhatsapp = (order: DeliveryOrder) => {
    const phone = normalizeDeliveryPhone(order.telefonoEntrega || '');

    if (!phone || phone.length < 11) {
      setErrorMessage('El pedido no tiene un número de entrega válido para abrir WhatsApp.');
      return;
    }

    window.open(buildWhatsappUrl(order, phone), '_blank', 'noopener,noreferrer');
  };

  const handleCallClient = (order: DeliveryOrder) => {
    const phone = normalizeDeliveryPhone(order.telefonoEntrega || '');

    if (!phone || phone.length < 11) {
      setErrorMessage('El pedido no tiene un número de entrega válido para realizar la llamada.');
      return;
    }

    window.location.href = buildCallUrl(phone);
  };

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff,#f4f8ff)] px-5 py-5 shadow-[0_18px_44px_rgba(15,23,42,0.06)] md:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
              Delivery app
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              {pageCopy.title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 md:text-base">
              {pageCopy.description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DeliverySummaryCard
              icon={PackageCheck}
              label="Pedidos hoy"
              tone="blue"
              value={String(todayOrdersCount)}
            />
            <DeliverySummaryCard
              icon={Clock3}
              label="Pendientes"
              tone="amber"
              value={String(pendingOrdersCount)}
            />
            <DeliverySummaryCard
              icon={BadgeCheck}
              label="Entregados"
              tone="emerald"
              value={String(deliveredOrdersCount)}
            />
            <DeliverySummaryCard
              icon={Truck}
              label="En camino"
              tone="cyan"
              value={String(onRouteOrdersCount)}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
            <input
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                isAdminView
                  ? 'Buscar por cliente, tracking, zona o producto...'
                  : 'Buscar por cliente, zona, tracking o producto...'
              }
              type="search"
              value={query}
            />
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.14)]" />
            Actualización automática
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {visibleFilters.map((filter) => {
            const isActive = activeFilter === filter.id;

            return (
              <button
                key={filter.id}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-slate-900'
                }`}
                onClick={() => setActiveFilter(filter.id)}
                type="button"
              >
                {filter.label}
              </button>
            );
          })}
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
              className="h-[420px] animate-pulse rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
              key={index}
            />
          ))}
        </div>
      ) : filteredOrders.length ? (
        <div className="grid gap-4">
          {paginatedOrders.map((order) => {
            const currentIndex = getDeliveryStatusIndex(order.estadoPedido);
            const nextStep = DELIVERY_STATUS_STEPS[currentIndex + 1];
            const displayLabel = formatStatusLabel(order);
            const phoneValue = normalizeDeliveryPhone(order.telefonoEntrega || '');

            return (
              <article
                className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
                key={order.id}
              >
                <div className="border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-5 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600">
                        {order.trackingCode || `Pedido #${order.id}`}
                      </p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                        {order.cliente.nombre}
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        {dateTime.format(new Date(order.fecha))}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <div className="flex flex-wrap items-center gap-2">
                        <DeliveryStatusBadge label={displayLabel} status={order.estadoPedido} />
                        {isDelayedOrder(order) ? (
                          <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                            Retrasado
                          </span>
                        ) : null}
                      </div>
                      <strong className="text-2xl font-black tracking-tight text-slate-950">
                        {currency.format(order.total)}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        <UserRound className="h-4 w-4" />
                        Cliente / NIT
                      </div>
                      <p className="mt-3 font-semibold text-slate-900">
                        {order.cliente.nombre} · {order.cliente.nit}
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        <Truck className="h-4 w-4" />
                        Zona / Tiempo
                      </div>
                      <p className="mt-3 font-semibold text-slate-900">
                        {order.zonaEntrega || 'Sin zona'} ·{' '}
                        {order.tiempoEstimadoMinutos ? `${order.tiempoEstimadoMinutos} min` : 'Pendiente'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 px-5 py-5">
                  <DeliveryRouteCard order={order} />

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">Timeline de entrega</p>
                      <span className="text-xs font-medium text-slate-500">Tiempo real</span>
                    </div>
                    <div className="mt-4 overflow-x-auto pb-1">
                      <div className="flex min-w-max items-start gap-3">
                      {DELIVERY_STATUS_STEPS.map((step, index) => (
                        <div key={step.code} className="flex items-center gap-3">
                          <TimelinePill
                            active={currentIndex === index}
                            complete={currentIndex >= index}
                            label={step.label}
                          />
                          {index < DELIVERY_STATUS_STEPS.length - 1 ? (
                            <span
                              className={`mt-3 block h-px w-10 shrink-0 ${
                                currentIndex > index ? 'bg-blue-500' : 'bg-slate-200'
                              }`}
                            />
                          ) : null}
                        </div>
                      ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                    <p className="text-sm font-semibold text-slate-900">Detalle del pedido</p>
                    <div className="mt-3 grid gap-2">
                      {order.productos.map((product) => (
                        <div
                          className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3 text-sm"
                          key={`${order.id}-${product.productoId}`}
                        >
                          <div>
                            <strong className="block text-slate-800">{product.nombre}</strong>
                            <span className="text-slate-500">Cantidad: {product.cantidad}</span>
                          </div>
                          <strong className="text-slate-800">{currency.format(product.subtotal)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-slate-50"
                      onClick={() => window.open(buildMapsUrl(order), '_blank')}
                      type="button"
                    >
                      <Navigation className="h-4 w-4" />
                      Abrir Maps
                    </button>
                    <button
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-slate-50"
                      disabled={!phoneValue || phoneValue.length < 11}
                      onClick={() => handleOpenWhatsapp(order)}
                      type="button"
                    >
                      <ExternalLink className="h-4 w-4" />
                      WhatsApp cliente
                    </button>
                    <button
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-slate-50"
                      disabled={!phoneValue || phoneValue.length < 11}
                      onClick={() => handleCallClient(order)}
                      type="button"
                    >
                      <Phone className="h-4 w-4" />
                      Llamar
                    </button>

                    {isAdminView ? (
                      <select
                        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          setSelectedRepartidores((current) => ({
                            ...current,
                            [order.id]: event.target.value,
                          }))
                        }
                        value={selectedRepartidores[order.id] ?? String(order.repartidor?.id ?? '')}
                      >
                        <option value="">Selecciona un repartidor</option>
                        {repartidores.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.profileName || user.username}
                          </option>
                        ))}
                      </select>
                    ) : !isCompletedMode && nextStep ? (
                      <button
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2563eb,#155dfc)] px-4 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(37,99,235,0.28)]"
                        onClick={() => void handleAdvanceStatus(order)}
                        type="button"
                      >
                        {order.estadoPedido === 'pedido_despachado' ? (
                          <>
                            <Navigation className="h-4 w-4" />
                            Iniciar ruta
                          </>
                        ) : nextStep.code === 'entregado' ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Marcar entregado
                          </>
                        ) : (
                          <>
                            <Truck className="h-4 w-4" />
                            Marcar como {nextStep.label}
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-50 px-4 text-sm font-semibold text-emerald-700">
                        Entrega completada
                      </span>
                    )}
                  </div>

                  {isAdminView ? (
                    <button
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f172a,#1e293b)] px-4 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:brightness-[1.05]"
                      onClick={() => void handleAssign(order.id)}
                      type="button"
                    >
                      <Truck className="h-4 w-4" />
                      Asignar repartidor
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="grid min-h-[360px] place-items-center rounded-[30px] border border-dashed border-slate-200 bg-white px-8 text-center shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
          <div>
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-slate-100 text-slate-400">
              <Truck className="h-7 w-7" />
            </span>
            <strong className="mt-4 block text-2xl text-slate-950">{pageCopy.emptyTitle}</strong>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">{pageCopy.emptyDescription}</p>
          </div>
        </section>
      )}

      {filteredOrders.length > PAGE_SIZE ? (
        <div className="flex flex-col items-center justify-between gap-3 rounded-[28px] border border-slate-200 bg-white px-4 py-4 shadow-[0_16px_34px_rgba(15,23,42,0.05)] sm:flex-row">
          <p className="text-sm font-medium text-slate-500">
            Mostrando{' '}
            <span className="font-semibold text-slate-900">
              {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredOrders.length)}
            </span>{' '}
            de <span className="font-semibold text-slate-900">{filteredOrders.length}</span> entregas
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
