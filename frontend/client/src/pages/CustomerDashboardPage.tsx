import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Box,
  CheckCircle,
  ChevronRight,
  CreditCard,
  FileText,
  LoaderCircle,
  MapPin,
  MapPinned,
  Package2,
  PackageCheck,
  ShoppingBag,
  Truck,
  UserRound,
} from 'lucide-react';

import { API_URL } from '../api/client';
import { fetchCustomerDashboard, updateCustomerProfile } from '../api/customer-account';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import type {
  CustomerAccountDashboard,
  CustomerAccountOrder,
  CustomerAccountSection,
  SessionData,
} from '../domain/types';
import { currency, dateOnly, dateTime } from '../lib/format';
import { generateInvoicePdf, type InvoicePdfData } from '../lib/invoice-pdf';

type CustomerDashboardPageProps = {
  session: SessionData;
  onSessionRefresh: (session: SessionData) => void;
  onBackToStore: () => void;
};

type OrderFilter = 'all' | 'pago_confirmado' | 'preparando' | 'en_camino' | 'entregado';

const sections: Array<{
  id: CustomerAccountSection;
  label: string;
  description: string;
  icon: typeof ShoppingBag;
}> = [
  {
    id: 'orders',
    label: 'Mis pedidos',
    description: 'Seguimiento de compras',
    icon: ShoppingBag,
  },
  {
    id: 'addresses',
    label: 'Direcciones',
    description: 'Entrega y cobertura',
    icon: MapPinned,
  },
  {
    id: 'invoices',
    label: 'Facturas',
    description: 'Descargas y respaldo',
    icon: FileText,
  },
  {
    id: 'history',
    label: 'Historial',
    description: 'Compras completadas',
    icon: Package2,
  },
  {
    id: 'profile',
    label: 'Mis datos',
    description: 'Cuenta personal',
    icon: UserRound,
  },
];

const statusToneMap: Record<string, string> = {
  pedido_recibido: 'border border-slate-200 bg-slate-100 text-slate-700',
  pago_confirmado: 'border border-blue-100 bg-blue-50 text-blue-700',
  preparando_pedido: 'border border-amber-100 bg-amber-50 text-amber-700',
  pedido_despachado: 'border border-indigo-100 bg-indigo-50 text-indigo-700',
  repartidor_en_camino: 'border border-cyan-100 bg-cyan-50 text-cyan-700',
  repartidor_cerca: 'border border-violet-100 bg-violet-50 text-violet-700',
  entregado: 'border border-emerald-100 bg-emerald-50 text-emerald-700',
};

const orderFilterOptions: Array<{ id: OrderFilter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'pago_confirmado', label: 'Pago confirmado' },
  { id: 'preparando', label: 'Preparando' },
  { id: 'en_camino', label: 'En camino' },
  { id: 'entregado', label: 'Entregado' },
];

const timelineSteps = [
  { status: 'pedido_recibido', label: 'Pedido recibido', icon: PackageCheck },
  { status: 'pago_confirmado', label: 'Pago confirmado', icon: CreditCard },
  { status: 'preparando_pedido', label: 'Preparando pedido', icon: Box },
  { status: 'pedido_despachado', label: 'Despachado', icon: Package2 },
  { status: 'repartidor_en_camino', label: 'En camino', icon: Truck },
  { status: 'repartidor_cerca', label: 'Repartidor cerca', icon: MapPin },
  { status: 'entregado', label: 'Entregado', icon: CheckCircle },
] as const;

function CustomerStatusBadge({ label, status }: { label: string; status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        statusToneMap[status] ?? 'border border-slate-200 bg-slate-100 text-slate-700'
      }`}
    >
      {label}
    </span>
  );
}

function resolveImageSrc(value?: string | null) {
  if (!value) {
    return '';
  }

  if (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  return `${API_URL}${value}`;
}

function matchesOrderFilter(order: CustomerAccountOrder, filter: OrderFilter) {
  if (filter === 'all') {
    return true;
  }

  if (filter === 'pago_confirmado') {
    return order.deliveryStatus === 'pago_confirmado';
  }

  if (filter === 'preparando') {
    return (
      order.deliveryStatus === 'pedido_recibido' ||
      order.deliveryStatus === 'preparando_pedido'
    );
  }

  if (filter === 'en_camino') {
    return (
      order.deliveryStatus === 'pedido_despachado' ||
      order.deliveryStatus === 'repartidor_en_camino' ||
      order.deliveryStatus === 'repartidor_cerca'
    );
  }

  return order.deliveryStatus === 'entregado';
}

function buildInvoicePayload(
  order: CustomerAccountOrder,
  customerName: string,
): InvoicePdfData {
  const subtotal = order.items.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryEta =
    order.zone && order.estimatedMinutes
      ? `${order.zone} · ${order.estimatedMinutes} a ${order.estimatedMinutes + 15} min`
      : order.zone || 'Entrega programada';

  return {
    customerName,
    deliveryAddress: order.address || 'Dirección pendiente',
    deliveryEta,
    items: order.items.map((item) => ({
      id: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    })),
    orderDate: order.createdAt,
    orderId: order.id,
    orderTotal: order.total,
    phone: order.phone || '',
    reference: order.reference || '',
    shippingCost: order.shippingCost,
    subtotal,
  };
}

function TimelineStep({
  isActive,
  isCompleted,
  isLast,
  label,
  Icon,
}: {
  isActive: boolean;
  isCompleted: boolean;
  isLast: boolean;
  label: string;
  Icon: (typeof timelineSteps)[number]['icon'];
}) {
  return (
    <div className="relative flex items-start gap-3 md:flex-1 md:flex-col md:items-center md:text-center">
      {!isLast ? (
        <>
          <span
            className={`absolute left-[15px] top-9 h-[calc(100%-1.25rem)] w-px md:left-[calc(50%+1.5rem)] md:top-[15px] md:h-px md:w-[calc(100%-3rem)] ${
              isCompleted ? 'bg-blue-500' : 'bg-slate-200'
            }`}
          />
        </>
      ) : null}
      <span
        className={`relative z-[1] grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[11px] shadow-sm transition ${
          isCompleted || isActive
            ? 'border-blue-500 bg-blue-600 text-white'
            : 'border-slate-200 bg-white text-slate-400'
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="pb-3 md:px-2 md:pb-0">
        <p
          className={`text-xs font-semibold leading-5 ${
            isCompleted || isActive ? 'text-slate-900' : 'text-slate-400'
          }`}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

function OrderTimeline({ status }: { status: string }) {
  const activeIndex = timelineSteps.findIndex((step) => step.status === status);

  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4">
      <div className="flex flex-col gap-1 md:flex-row md:gap-0">
        {timelineSteps.map((step, index) => (
          <TimelineStep
            key={step.status}
            Icon={step.icon}
            isActive={index === activeIndex}
            isCompleted={activeIndex >= index}
            isLast={index === timelineSteps.length - 1}
            label={step.label}
          />
        ))}
      </div>
    </div>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof ShoppingBag;
  label: string;
  value: string;
  tone: 'blue' | 'amber' | 'emerald' | 'slate';
}) {
  const toneClasses = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  } as const;

  return (
    <Card className="rounded-[24px] border border-slate-200/80 bg-white/95 px-4 py-4 shadow-[0_16px_34px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3">
        <span
          className={`grid h-11 w-11 place-items-center rounded-2xl ring-1 ${toneClasses[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>
          <strong className="mt-1 block text-2xl font-black tracking-[-0.04em] text-slate-950">
            {value}
          </strong>
        </div>
      </div>
    </Card>
  );
}

export function CustomerDashboardPage({
  onBackToStore,
  onSessionRefresh,
  session,
}: CustomerDashboardPageProps) {
  const [activeSection, setActiveSection] = useState<CustomerAccountSection>('orders');
  const [dashboard, setDashboard] = useState<CustomerAccountDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    nit: '',
  });

  useEffect(() => {
    let ignore = false;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError('');

      try {
        const payload = await fetchCustomerDashboard(session.token);

        if (ignore) {
          return;
        }

        setDashboard(payload);
        setProfileForm({
          fullName: payload.profile.fullName,
          email: payload.profile.email,
          phone: payload.profile.phone ?? '',
          nit: payload.profile.nit ?? '',
        });
      } catch (loadError) {
        if (!ignore) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No fue posible cargar tu panel de cliente.',
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      ignore = true;
    };
  }, [session.token]);

  const deliveredOrders = useMemo(
    () => dashboard?.orders.filter((order) => order.deliveryStatus === 'entregado') ?? [],
    [dashboard],
  );

  const filteredOrders = useMemo(
    () => dashboard?.orders.filter((order) => matchesOrderFilter(order, orderFilter)) ?? [],
    [dashboard, orderFilter],
  );

  const ordersInProcess = useMemo(
    () => dashboard?.orders.filter((order) => order.deliveryStatus !== 'entregado').length ?? 0,
    [dashboard],
  );

  const handleProfileSave = async () => {
    setMessage('');
    setError('');
    setIsSaving(true);

    try {
      const payload = await updateCustomerProfile(session.token, profileForm);

      setDashboard((current) =>
        current
          ? {
              ...current,
              profile: payload.profile,
            }
          : current,
      );
      setMessage(payload.message);
      onSessionRefresh({
        ...session,
        user: {
          ...session.user,
          email: payload.profile.email,
        },
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'No fue posible actualizar tus datos.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadInvoice = async (order: CustomerAccountOrder) => {
    if (!dashboard) {
      return;
    }

    try {
      await generateInvoicePdf(buildInvoicePayload(order, dashboard.profile.fullName));
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : 'No fue posible generar la factura en PDF.',
      );
    }
  };

  const renderOrdersSection = () => {
    if (!dashboard?.orders.length) {
      return (
        <EmptyState
          action={
            <Button onClick={onBackToStore} size="sm" variant="primary">
              Explorar productos
            </Button>
          }
          description="Cuando completes una compra, verás aquí el detalle y seguimiento de tus pedidos."
          title="Aún no tienes pedidos"
        />
      );
    }

    return (
      <div className="grid gap-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryMetric
            icon={ShoppingBag}
            label="Pedidos totales"
            tone="slate"
            value={String(dashboard.summary.totalOrders)}
          />
          <SummaryMetric
            icon={Package2}
            label="En proceso"
            tone="amber"
            value={String(ordersInProcess)}
          />
          <SummaryMetric
            icon={CheckCircle}
            label="Entregados"
            tone="emerald"
            value={String(dashboard.summary.deliveredOrders)}
          />
          <SummaryMetric
            icon={CreditCard}
            label="Total comprado"
            tone="blue"
            value={currency.format(dashboard.summary.totalSpent)}
          />
        </div>

        <Card className="rounded-[24px] border border-slate-200/80 bg-white/95 px-4 py-4 shadow-[0_16px_34px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Filtrar pedidos</p>
              <p className="mt-1 text-sm text-slate-500">
                Cambia la vista para enfocarte en el estado actual de tus compras.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {orderFilterOptions.map((option) => {
                const isActive = orderFilter === option.id;

                return (
                  <button
                    key={option.id}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.2)]'
                        : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-sky-200 hover:bg-white hover:text-slate-900'
                    }`}
                    onClick={() => setOrderFilter(option.id)}
                    type="button"
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {filteredOrders.length ? (
          filteredOrders.map((order) => {
            const mainProduct = order.items[0];
            const deliveryLabel = order.address || 'Pendiente de dirección';

            return (
              <Card
                key={order.id}
                className="rounded-[28px] border border-slate-200/80 bg-white/95 px-5 py-5 shadow-[0_18px_42px_rgba(15,23,42,0.05)]"
              >
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50">
                        {mainProduct?.image ? (
                          <img
                            alt={mainProduct.name}
                            className="h-full w-full object-cover"
                            src={resolveImageSrc(mainProduct.image)}
                          />
                        ) : (
                          <Package2 className="h-7 w-7 text-slate-300" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-lg font-bold tracking-[-0.03em] text-slate-950">
                            {order.orderCode}
                          </span>
                          <CustomerStatusBadge
                            label={order.deliveryStatusLabel}
                            status={order.deliveryStatus}
                          />
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {dateTime.format(new Date(order.createdAt))}
                        </p>
                        {mainProduct ? (
                          <div className="mt-3">
                            <p className="font-semibold text-slate-900">{mainProduct.name}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {mainProduct.brandName} · {mainProduct.quantity} unidad(es)
                              {order.items.length > 1 ? ` · +${order.items.length - 1} producto(s)` : ''}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:w-[320px]">
                      <div className="rounded-[20px] bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Total
                        </p>
                        <strong className="mt-1 block text-2xl font-black tracking-[-0.04em] text-slate-950">
                          {currency.format(order.total)}
                        </strong>
                      </div>
                      <div className="rounded-[20px] bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Método de entrega
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {order.address ? 'Entrega a domicilio' : 'Pendiente'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#fbfdff,#f8fbff)] p-4">
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <MapPin className="mt-0.5 h-4.5 w-4.5 text-blue-500" />
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Entrega
                              </p>
                              <p className="mt-1 font-semibold text-slate-900">
                                {order.zone || 'Cobertura local'}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-slate-500">{deliveryLabel}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Truck className="mt-0.5 h-4.5 w-4.5 text-emerald-500" />
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Tiempo estimado
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {order.estimatedMinutes
                                  ? `${order.estimatedMinutes} a ${order.estimatedMinutes + 15} min`
                                  : 'Tiempo en actualización'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                          {order.trackingCode ? (
                            <Button
                              fullWidth
                              onClick={() => window.open(`/tracking/${order.trackingCode}`, '_blank')}
                              size="sm"
                              variant="secondary"
                            >
                              Ver seguimiento
                            </Button>
                          ) : null}
                          <Button
                            fullWidth
                            onClick={() => void handleDownloadInvoice(order)}
                            size="sm"
                            variant="primary"
                          >
                            Descargar factura
                          </Button>
                        </div>
                      </div>
                    </div>

                    <OrderTimeline status={order.deliveryStatus} />
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <EmptyState
            action={
              <Button onClick={() => setOrderFilter('all')} size="sm" variant="secondary">
                Ver todos los pedidos
              </Button>
            }
            description="No encontramos pedidos con ese estado. Prueba con otro filtro para ver más resultados."
            title="No hay pedidos en esta vista"
          />
        )}
      </div>
    );
  };

  const renderAddressesSection = () => {
    if (!dashboard?.addresses.length) {
      return (
        <EmptyState
          description="Tus direcciones de entrega aparecerán aquí automáticamente cuando completes pedidos a domicilio."
          title="Aún no tienes direcciones registradas"
        />
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {dashboard.addresses.map((address) => (
          <Card
            key={address.id}
            className="rounded-[28px] border border-slate-200/80 bg-white/90 px-5 py-5 shadow-[0_20px_46px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {address.label}
                </p>
                <h3 className="mt-2 text-lg font-bold text-slate-950">
                  {address.recipientName || 'Entrega principal'}
                </h3>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {address.ordersCount} pedido(s)
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">{address.address}</p>
            {address.reference ? (
              <p className="mt-2 text-sm text-slate-500">Referencia: {address.reference}</p>
            ) : null}
            <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
              <span>{address.phone || 'Sin teléfono'}</span>
              <span>Último uso: {dateOnly.format(new Date(address.lastUsedAt))}</span>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderInvoicesSection = () => {
    if (!dashboard?.orders.length) {
      return (
        <EmptyState
          description="Las facturas se generarán conforme completes compras en línea."
          title="No hay facturas disponibles"
        />
      );
    }

    return (
      <div className="grid gap-4">
        {dashboard.orders.map((order) => (
          <div
            key={`invoice-${order.id}`}
            className="flex flex-col gap-4 rounded-[26px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_42px_rgba(15,23,42,0.04)] md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Factura
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-950">{order.orderCode}</h3>
              <p className="mt-1 text-sm text-slate-500">
                Emitida el {dateOnly.format(new Date(order.createdAt))}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <CustomerStatusBadge
                label={order.deliveryStatusLabel}
                status={order.deliveryStatus}
              />
              <Button onClick={() => void handleDownloadInvoice(order)} size="sm" variant="primary">
                Descargar PDF
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderHistorySection = () => {
    if (!deliveredOrders.length) {
      return (
        <EmptyState
          description="Cuando tus pedidos se entreguen, verás un historial claro de tus compras finalizadas."
          title="Tu historial se irá formando aquí"
        />
      );
    }

    return (
      <div className="space-y-5">
        {deliveredOrders.map((order) => (
          <div
            key={`history-${order.id}`}
            className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_42px_rgba(15,23,42,0.04)]"
          >
            <div className="absolute bottom-6 left-6 top-6 w-px bg-slate-200" />
            <div className="relative pl-8">
              <div className="absolute left-0 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.14)]">
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">{order.orderCode}</h3>
                  <p className="text-sm text-slate-500">{dateTime.format(new Date(order.createdAt))}</p>
                </div>
                <strong className="text-xl font-black tracking-[-0.04em] text-slate-950">
                  {currency.format(order.total)}
                </strong>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {order.items.map((item) => (
                  <div
                    key={`history-item-${order.id}-${item.productId}`}
                    className="rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.quantity} unidad(es) · {currency.format(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderProfileSection = () => (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <Card className="rounded-[30px] border border-slate-200/80 bg-white/92 px-6 py-6 shadow-[0_22px_50px_rgba(15,23,42,0.06)]">
        <div className="mb-6">
          <h3 className="text-2xl font-bold tracking-[-0.03em] text-slate-950">Mis datos</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Mantén tu información actualizada para agilizar futuras compras y entregas.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label="Nombre completo"
            onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))}
            value={profileForm.fullName}
          />
          <Input
            label="Correo electrónico"
            onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
            value={profileForm.email}
          />
          <Input
            label="Teléfono"
            onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
            value={profileForm.phone}
          />
          <Input
            label="NIT"
            onChange={(event) => setProfileForm((current) => ({ ...current, nit: event.target.value }))}
            value={profileForm.nit}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={() => void handleProfileSave()} variant="primary">
            {isSaving ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </Button>
          {message ? <span className="text-sm font-medium text-emerald-600">{message}</span> : null}
        </div>
      </Card>

      <Card className="rounded-[30px] border border-blue-100 bg-white/70 px-6 py-6 shadow-[0_24px_56px_rgba(37,99,235,0.08)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,#eff6ff,#dbeafe)] text-blue-700 ring-1 ring-blue-100">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Cuenta</p>
            <h3 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-slate-950">
              {session.user.username}
            </h3>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-[22px] border border-blue-100/80 bg-[linear-gradient(180deg,rgba(239,246,255,0.8),rgba(255,255,255,0.92))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-500">
              Usuario
            </p>
            <p className="mt-2 font-semibold text-slate-900">@{session.user.username}</p>
          </div>

          <div className="rounded-[22px] border border-blue-100/80 bg-[linear-gradient(180deg,rgba(239,246,255,0.72),rgba(255,255,255,0.92))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-500">
              Correo
            </p>
            <p className="mt-2 font-medium text-slate-800">{profileForm.email || 'Sin correo'}</p>
          </div>

          <div className="rounded-[22px] border border-blue-100/80 bg-[linear-gradient(180deg,rgba(239,246,255,0.68),rgba(255,255,255,0.92))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-500">
              Miembro desde
            </p>
            <p className="mt-2 font-medium text-slate-800">
              {dashboard?.profile.createdAt
                ? dateOnly.format(new Date(dashboard.profile.createdAt))
                : 'Sin registro'}
            </p>
          </div>

          <div className="rounded-[22px] border border-blue-100/80 bg-[linear-gradient(180deg,rgba(239,246,255,0.64),rgba(255,255,255,0.94))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-500">
              Estado de cuenta
            </p>
            <div className="mt-2">
              <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Cuenta activa
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const sectionContent = {
    orders: renderOrdersSection(),
    addresses: renderAddressesSection(),
    invoices: renderInvoicesSection(),
    history: renderHistorySection(),
    profile: renderProfileSection(),
  }[activeSection];

  return (
    <div className="min-h-0 overflow-x-hidden xl:h-[calc(100vh-7rem)] xl:overflow-hidden">
      <div className="grid gap-6 px-4 py-4 md:px-6 md:py-6 xl:h-full xl:grid-cols-[320px_minmax(0,1fr)] xl:gap-0 xl:px-0 xl:py-0">
        <aside className="space-y-4 xl:flex xl:h-full xl:flex-col xl:overflow-hidden xl:border-r xl:border-white/60 xl:bg-white/28 xl:px-6 xl:py-6 xl:backdrop-blur-sm">
          <button
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-sky-200"
            onClick={onBackToStore}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a la tienda
          </button>

          <Card className="rounded-[28px] border border-white/70 bg-white/92 p-3 shadow-[0_20px_44px_rgba(15,23,42,0.05)] xl:flex-1 xl:overflow-hidden">
            <div className="rounded-[24px] bg-[linear-gradient(135deg,#0f172a,#2563eb)] px-4 py-4 text-white shadow-[0_18px_40px_rgba(37,99,235,0.18)]">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold tracking-[-0.03em] text-white">
                    {dashboard?.profile.fullName || session.user.username}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-white/70">@{session.user.username}</p>
                </div>
              </div>
            </div>

            <nav className="mt-3 hidden gap-2 xl:grid xl:flex-1 xl:overflow-y-auto xl:pr-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    className={`flex items-center justify-between rounded-[20px] px-3.5 py-3 text-left transition ${
                      isActive
                        ? 'bg-[linear-gradient(135deg,#eff6ff,#e0ecff)] shadow-[0_10px_20px_rgba(37,99,235,0.1)]'
                        : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setActiveSection(section.id)}
                    type="button"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid h-10 w-10 place-items-center rounded-2xl ${
                          isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{section.label}</p>
                        <p className="text-[11px] text-slate-500">{section.description}</p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
                    />
                  </button>
                );
              })}
            </nav>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 xl:hidden">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={`mobile-${section.id}`}
                    className={`flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.18)]'
                        : 'border border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                    onClick={() => setActiveSection(section.id)}
                    type="button"
                  >
                    <Icon className="h-4 w-4" />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </Card>
        </aside>

        <section className="min-w-0 space-y-5 pb-6 xl:h-full xl:overflow-y-auto xl:px-6 xl:py-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
              {sections.find((section) => section.id === activeSection)?.label}
            </p>
            <h1 className="text-3xl font-black tracking-[-0.05em] text-slate-950">
              {sections.find((section) => section.id === activeSection)?.label}
            </h1>
            <p className="text-sm text-slate-500">
              {sections.find((section) => section.id === activeSection)?.description}
            </p>
          </div>

          {error ? (
            <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-600">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <Card className="rounded-[32px] border border-white/70 bg-white/90 px-8 py-14 text-center shadow-[0_24px_56px_rgba(15,23,42,0.06)]">
              <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-4 text-sm font-medium text-slate-500">Cargando tu panel...</p>
            </Card>
          ) : (
            sectionContent
          )}
        </section>
      </div>
    </div>
  );
}
