import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, MapPin, PackageCheck, ShieldCheck, Truck } from 'lucide-react';

import { fetchTracking } from '../api/delivery';
import { DeliveryStatusBadge } from '../components/delivery/DeliveryStatusBadge';
import { DeliveryTimeline } from '../components/delivery/DeliveryTimeline';
import type { DeliveryTrackingResponse } from '../domain/types';
import { currency, dateTime } from '../lib/format';

type TrackingPageProps = {
  trackingCode: string;
};

export function TrackingPage({ trackingCode }: TrackingPageProps) {
  const [payload, setPayload] = useState<DeliveryTrackingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const nextPayload = await fetchTracking(trackingCode);

        if (!ignore) {
          setPayload(nextPayload);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error ? error.message : 'No se pudo cargar el seguimiento.',
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      ignore = true;
    };
  }, [trackingCode]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dfeefe_0%,#eff5fd_32%,#f6f9fe_100%)] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <button
          className="mb-5 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          onClick={() => {
            window.location.href = '/';
          }}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la tienda
        </button>

        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="h-[520px] animate-pulse rounded-[34px] border border-slate-200 bg-white" />
            <div className="h-[520px] animate-pulse rounded-[34px] border border-slate-200 bg-white" />
          </div>
        ) : errorMessage ? (
          <div className="rounded-[30px] border border-rose-200 bg-white px-6 py-12 text-center shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
            <strong className="text-2xl text-slate-950">{errorMessage}</strong>
          </div>
        ) : payload ? (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-[34px] border border-slate-200 bg-white p-7 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
                Seguimiento de pedido
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-950">
                  {payload.order.trackingCode || trackingCode}
                </h1>
                <DeliveryStatusBadge
                  label={payload.order.estado.label}
                  status={payload.order.estado.code}
                />
              </div>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
                {payload.order.estado.message}
              </p>

              <div className="mt-8 rounded-[28px] bg-[linear-gradient(180deg,#f8fbff_0%,#f2f7ff_100%)] p-5">
                <DeliveryTimeline currentStatus={payload.order.estado.code} />
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <SummaryCard
                  icon={<PackageCheck className="h-5 w-5" />}
                  label="Pedido"
                  value={`#${payload.order.id}`}
                  helper={dateTime.format(new Date(payload.order.fecha))}
                />
                <SummaryCard
                  icon={<Truck className="h-5 w-5" />}
                  label="Tiempo estimado"
                  value={
                    payload.order.tiempoEstimadoMinutos
                      ? `${payload.order.tiempoEstimadoMinutos} a ${payload.order.tiempoEstimadoMinutos + 15} min`
                      : 'Pendiente'
                  }
                  helper={payload.order.zonaEntrega || 'Entrega a domicilio'}
                />
                <SummaryCard
                  icon={<MapPin className="h-5 w-5" />}
                  label="Dirección"
                  value={payload.order.direccionEntrega || 'Sin dirección registrada'}
                  helper={payload.order.referenciaEntrega || 'Sin referencia adicional'}
                />
                <SummaryCard
                  icon={<ShieldCheck className="h-5 w-5" />}
                  label="Total pagado"
                  value={currency.format(payload.order.total)}
                  helper="Pago confirmado"
                />
              </div>
            </section>

            <aside className="rounded-[34px] border border-slate-200 bg-white p-7 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
              <h2 className="text-2xl font-bold text-slate-950">Detalle del pedido</h2>
              <div className="mt-5 grid gap-3">
                {payload.order.productos.map((product) => (
                  <div
                    className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4"
                    key={`${payload.order.id}-${product.productoId}`}
                  >
                    <strong className="block text-sm text-slate-900">{product.nombre}</strong>
                    <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
                      <span>Cantidad: {product.cantidad}</span>
                      <span>{currency.format(product.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[28px] bg-slate-950 px-5 py-5 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Costo de envío</span>
                  <strong>{currency.format(payload.order.costoEnvio)}</strong>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-base font-semibold">Total</span>
                  <strong className="text-3xl font-black">{currency.format(payload.order.total)}</strong>
                </div>
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SummaryCard({
  helper,
  icon,
  label,
  value,
}: {
  helper: string;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-100 bg-white px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
        {icon}
        {label}
      </span>
      <strong className="mt-3 block text-sm leading-6 text-slate-900">{value}</strong>
      <span className="mt-2 block text-xs leading-5 text-slate-500">{helper}</span>
    </div>
  );
}
