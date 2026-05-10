import type { ChangeEvent, ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  MapPin,
  Navigation,
  Phone,
  Route,
  ShoppingBag,
  ShieldCheck,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';

import type { DeliveryEstimate, DeliveryFormErrors, DeliveryFormValues } from './types';

type DeliveryZoneOption = {
  value: string;
  label: string;
  coverage: string;
  lat: number;
  lng: number;
  mapLabel?: string;
};

type DeliveryStepProps = {
  customerLabel: string;
  errors: DeliveryFormErrors;
  estimate: DeliveryEstimate | null;
  onBack: () => void;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onClose: () => void;
  onContinue: () => void;
  onSelectStep?: (step: 'delivery' | 'payment') => void;
  orderLabel: string;
  productLabel?: string;
  subtotalLabel: string;
  totalLabel: string;
  values: DeliveryFormValues;
  zoneOptions: DeliveryZoneOption[];
};

function fieldTone(hasError: boolean) {
  return hasError
    ? 'border-rose-200 bg-rose-50/80 focus:border-rose-400 focus:ring-4 focus:ring-rose-100'
    : 'border-slate-200 bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100';
}

function fieldIconTone(hasError: boolean) {
  return hasError ? 'text-rose-500' : 'text-slate-400';
}

const COMPANY_ORIGIN = {
  label: 'Zona 1, Ciudad de Guatemala',
  lat: 14.6349,
  lng: -90.5069,
};

const GUATEMALA_CITY_BOUNDS = {
  minLat: 14.47,
  maxLat: 14.73,
  minLng: -90.66,
  maxLng: -90.39,
};

function coordinateToPercent(lat: number, lng: number) {
  const x =
    ((lng - GUATEMALA_CITY_BOUNDS.minLng) /
      (GUATEMALA_CITY_BOUNDS.maxLng - GUATEMALA_CITY_BOUNDS.minLng)) *
    100;
  const y =
    ((GUATEMALA_CITY_BOUNDS.maxLat - lat) /
      (GUATEMALA_CITY_BOUNDS.maxLat - GUATEMALA_CITY_BOUNDS.minLat)) *
    100;

  return {
    x: Math.min(94, Math.max(6, x)),
    y: Math.min(88, Math.max(12, y)),
  };
}

export function DeliveryStep({
  customerLabel,
  errors,
  estimate,
  onBack,
  onChange,
  onClose,
  onContinue,
  onSelectStep,
  orderLabel,
  productLabel = 'Productos del pedido',
  subtotalLabel,
  totalLabel,
  values,
  zoneOptions,
}: DeliveryStepProps) {
  const deliveryBadge = estimate ? estimate.label : 'Cobertura pendiente';
  const deliveryDistance = estimate ? `${estimate.distanceKm.toFixed(1)} km` : 'Se calcula al confirmar la zona';
  const deliveryTime = estimate ? `${estimate.minutes} a ${estimate.minutes + 15} min` : 'Por calcular';
  const deliveryCost = estimate ? `Q ${estimate.shippingCost.toFixed(2)}` : 'Pendiente';
  const destinationLabel = estimate?.zone ?? 'Zona pendiente';
  const routeTarget = values.address.trim() || values.reference.trim() || 'Destino del pedido';
  const selectedZone = zoneOptions.find((option) => option.value === values.zone) ?? null;
  const originPoint = coordinateToPercent(COMPANY_ORIGIN.lat, COMPANY_ORIGIN.lng);
  const destinationPoint = selectedZone
    ? coordinateToPercent(selectedZone.lat, selectedZone.lng)
    : { x: 78, y: 30 };
  const routeMidX = (originPoint.x + destinationPoint.x) / 2;
  const routeMidY = Math.max(originPoint.y, destinationPoint.y) + 14;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${GUATEMALA_CITY_BOUNDS.minLng}%2C${GUATEMALA_CITY_BOUNDS.minLat}%2C${GUATEMALA_CITY_BOUNDS.maxLng}%2C${GUATEMALA_CITY_BOUNDS.maxLat}&layer=mapnik&marker=${COMPANY_ORIGIN.lat}%2C${COMPANY_ORIGIN.lng}`;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[68] overflow-y-auto bg-[radial-gradient(circle_at_top_left,#1f3c88_0%,#0d1f4d_28%,#081733_75%,#07112a_100%)] p-4 md:p-6"
      role="dialog"
    >
      <div className="mx-auto min-h-[calc(100vh-2rem)] max-w-[1500px] overflow-hidden rounded-[34px] bg-white shadow-[0_40px_120px_rgba(2,8,23,0.3)] ring-1 ring-white/10 md:min-h-[calc(100vh-3rem)]">
        <div className="grid min-h-full lg:grid-cols-[minmax(0,1fr)_560px]">
          <section className="order-2 overflow-y-auto bg-[linear-gradient(180deg,#ffffff_0%,#fcfdff_100%)] px-7 py-7 md:px-10 md:py-9 lg:order-1 lg:px-12 lg:py-10">
            <div className="mx-auto w-full max-w-[760px]">
              <div className="mb-8 flex items-center gap-4 text-slate-400">
                <CheckoutStep isActive label="Entrega" number="1" />
                <div className="h-px flex-1 bg-slate-200" />
                <CheckoutStep
                  isClickable
                  label="Pago"
                  number="2"
                  onClick={() => (onSelectStep ? onSelectStep('payment') : onContinue())}
                />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="grid h-[64px] w-[64px] shrink-0 place-items-center rounded-full bg-[linear-gradient(180deg,#eaf2ff,#dbeafe)] text-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                    <MapPin className="h-7 w-7" />
                  </div>

                  <div className="min-w-0">
                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">
                      Paso 1 de 2
                    </span>
                    <h3 className="mt-4 text-[32px] font-bold tracking-tight text-slate-950 md:text-[36px]">
                      Datos de entrega
                    </h3>
                    <p className="mt-2 max-w-xl text-base leading-7 text-slate-500">
                      Completa la dirección de destino y continúa al pago para confirmar tu pedido.
                    </p>
                  </div>
                </div>

                <button
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-700"
                  onClick={onClose}
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-10 grid gap-6">
                <label className="grid gap-2.5">
                  <span className="text-sm font-semibold text-slate-700">Nombre de quien recibe</span>
                  <div className="relative">
                    <span className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${fieldIconTone(Boolean(errors.recipientName))}`}>
                      <UserRound className="h-5 w-5" />
                    </span>
                    <input
                      className={`h-[58px] w-full rounded-2xl border pl-12 pr-4 text-[15px] text-slate-800 outline-none transition ${fieldTone(Boolean(errors.recipientName))}`}
                      name="recipientName"
                      onChange={onChange}
                      placeholder="Ej. María López"
                      type="text"
                      value={values.recipientName}
                    />
                  </div>
                  {errors.recipientName ? (
                    <span className="text-xs font-medium text-rose-600">{errors.recipientName}</span>
                  ) : null}
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2.5">
                    <span className="text-sm font-semibold text-slate-700">Teléfono</span>
                    <div className="relative">
                      <span className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${fieldIconTone(Boolean(errors.phone))}`}>
                        <Phone className="h-5 w-5" />
                      </span>
                      <input
                        className={`h-[58px] w-full rounded-2xl border pl-12 pr-4 text-[15px] text-slate-800 outline-none transition ${fieldTone(Boolean(errors.phone))}`}
                        name="phone"
                        onChange={onChange}
                        placeholder="502 5555 5555"
                        type="text"
                        value={values.phone}
                      />
                    </div>
                    {errors.phone ? <span className="text-xs font-medium text-rose-600">{errors.phone}</span> : null}
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-sm font-semibold text-slate-700">Zona de entrega</span>
                    <div className="relative">
                      <span className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${fieldIconTone(Boolean(errors.zone))}`}>
                        <Navigation className="h-5 w-5" />
                      </span>
                      <select
                        className={`h-[58px] w-full rounded-2xl border pl-12 pr-4 text-[15px] text-slate-800 outline-none transition ${fieldTone(Boolean(errors.zone))}`}
                        name="zone"
                        onChange={onChange}
                        value={values.zone}
                      >
                        <option value="">Selecciona una zona</option>
                        {zoneOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.zone ? <span className="text-xs font-medium text-rose-600">{errors.zone}</span> : null}
                  </label>
                </div>

                <label className="grid gap-2.5">
                  <span className="text-sm font-semibold text-slate-700">Dirección exacta</span>
                  <div className="relative">
                    <span className={`pointer-events-none absolute left-4 top-4 ${fieldIconTone(Boolean(errors.address))}`}>
                      <MapPin className="h-5 w-5" />
                    </span>
                    <textarea
                      className={`min-h-[92px] w-full rounded-2xl border pl-12 pr-4 py-4 text-[15px] text-slate-800 outline-none transition ${fieldTone(Boolean(errors.address))}`}
                      name="address"
                      onChange={onChange}
                      placeholder="Colonia, avenida, número de casa o apartamento"
                      value={values.address}
                    />
                  </div>
                  {errors.address ? <span className="text-xs font-medium text-rose-600">{errors.address}</span> : null}
                </label>

                <label className="grid gap-2.5">
                  <span className="text-sm font-semibold text-slate-700">Referencia para encontrar el domicilio</span>
                  <div className="relative">
                    <span className={`pointer-events-none absolute left-4 top-4 ${fieldIconTone(Boolean(errors.reference))}`}>
                      <Route className="h-5 w-5" />
                    </span>
                    <textarea
                      className={`min-h-[86px] w-full rounded-2xl border pl-12 pr-4 py-4 text-[15px] text-slate-800 outline-none transition ${fieldTone(Boolean(errors.reference))}`}
                      name="reference"
                      onChange={onChange}
                      placeholder="Portón, comercio cercano o punto de referencia"
                      value={values.reference}
                    />
                  </div>
                  {errors.reference ? <span className="text-xs font-medium text-rose-600">{errors.reference}</span> : null}
                </label>

                <div className="rounded-[24px] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff,#eef5ff)] px-4 py-4 text-sm text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm">
                      <Clock3 className="h-5 w-5" />
                    </div>
                    <div>
                      <strong className="block text-slate-900">Se calcula antes del pago</strong>
                      <p className="mt-1 leading-6">
                        Primero estimamos la entrega para mostrar el total final antes de confirmar la compra.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="hidden gap-4 pt-2 sm:grid sm:grid-cols-2">
                  <button
                    className="inline-flex h-[60px] items-center justify-center gap-2 rounded-[20px] border border-slate-200 bg-white px-5 text-[15px] font-semibold text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-slate-50"
                    onClick={onBack}
                    type="button"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al carrito
                  </button>
                  <button
                    className="inline-flex h-[60px] items-center justify-center gap-2 rounded-[20px] bg-[linear-gradient(135deg,#2563eb,#155dfc)] px-5 text-[15px] font-semibold text-white shadow-[0_18px_36px_rgba(37,99,235,0.26)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(37,99,235,0.34)]"
                    onClick={onContinue}
                    type="button"
                  >
                    Continuar al pago
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="pt-2 text-center text-sm text-slate-500">
                  Transacción protegida con encriptación SSL de 256 bits.
                </div>
              </div>
            </div>
          </section>

          <aside className="order-1 overflow-y-auto border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-7 py-8 md:px-10 md:py-10 lg:order-2 lg:border-b-0 lg:border-l">
            <div className="mx-auto grid max-w-[520px] gap-7">
              <div>
                <h3 className="text-[2.05rem] font-bold tracking-tight text-slate-950">Resumen de compra</h3>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Domicilio activo
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#f9fbff,#ffffff)] p-4 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(59,130,246,0.06),transparent_38%,rgba(59,130,246,0.04))]" />
                <div className="relative h-[208px] overflow-hidden rounded-[24px] border border-slate-100 bg-slate-100">
                  <iframe
                    aria-label="Mapa de entrega en Ciudad de Guatemala"
                    className="absolute inset-0 h-full w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={mapUrl}
                    title="Mapa de entrega"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.15),rgba(255,255,255,0.32))]" />

                  <div
                    className="absolute grid place-items-center rounded-full bg-blue-600 p-2 text-white shadow-[0_10px_20px_rgba(37,99,235,0.28)]"
                    style={{ left: `calc(${originPoint.x}% - 18px)`, top: `calc(${originPoint.y}% - 18px)` }}
                  >
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div
                    className="absolute grid place-items-center rounded-full bg-emerald-500 p-2 text-white shadow-[0_10px_20px_rgba(16,185,129,0.28)]"
                    style={{ left: `calc(${destinationPoint.x}% - 18px)`, top: `calc(${destinationPoint.y}% - 18px)` }}
                  >
                    <Navigation className="h-5 w-5" />
                  </div>

                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <path
                      d={`M ${originPoint.x} ${originPoint.y} Q ${routeMidX} ${routeMidY} ${destinationPoint.x} ${destinationPoint.y}`}
                      fill="none"
                      stroke="url(#deliveryRoute)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="deliveryRoute" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="100%" stopColor="#60a5fa" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur">
                    Origen: {COMPANY_ORIGIN.label}
                  </div>
                  <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur">
                    {selectedZone?.mapLabel ?? destinationLabel}
                  </div>
                  <div className="absolute bottom-4 left-4 max-w-[68%] rounded-2xl bg-white/88 px-3 py-2 text-xs font-medium leading-5 text-slate-600 shadow-sm backdrop-blur">
                    {routeTarget}
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
                <div className="grid gap-5">
                  <SummaryRow
                    icon={<ShoppingBag className="h-5 w-5" />}
                    label="Producto / Curso"
                    value={subtotalLabel}
                    description={productLabel}
                  />
                  <SummaryRow
                    icon={<UserRound className="h-5 w-5" />}
                    label="Cliente"
                    value="—"
                    description={customerLabel}
                  />
                  <SummaryRow
                    accent
                    icon={<Route className="h-5 w-5" />}
                    label="Entrega"
                    value={deliveryTime}
                    description={deliveryBadge}
                  />
                  <SummaryRow
                    icon={<Wallet className="h-5 w-5" />}
                    label="Costo de envío"
                    value={deliveryCost}
                    description={deliveryDistance}
                  />
                  <SummaryRow
                    icon={<Clock3 className="h-5 w-5" />}
                    label="Número de orden"
                    value={orderLabel}
                    description="Referencia generada para esta compra"
                  />
                </div>

                <div className="mt-6 border-t border-slate-100 pt-6">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <strong className="block text-[2rem] font-bold tracking-tight text-slate-950">Total a pagar</strong>
                      <p className="mt-2 text-base leading-7 text-slate-500">
                        Incluye productos y costo de entrega
                      </p>
                    </div>
                    <div className="text-right text-[2.4rem] font-bold tracking-tight text-blue-600">
                      {totalLabel}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-emerald-100 bg-[linear-gradient(180deg,#f4fff8,#ecfdf3)] px-5 py-4 text-sm text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <strong className="block text-slate-900">Pago 100% seguro</strong>
                    <p className="mt-1 leading-6">Tus datos están protegidos y no se almacenan.</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-[69] border-t border-white/60 bg-white/92 px-4 py-4 shadow-[0_-18px_40px_rgba(15,23,42,0.1)] backdrop-blur-xl sm:hidden">
          <div className="mx-auto grid max-w-[720px] gap-3">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span>Total estimado</span>
              <strong className="text-base text-slate-950">{totalLabel}</strong>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                onClick={onBack}
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </button>
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#2563eb,#155dfc)] px-4 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(37,99,235,0.26)] transition hover:shadow-[0_20px_32px_rgba(37,99,235,0.34)]"
                onClick={onContinue}
                type="button"
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutStep({
  isActive = false,
  isClickable = false,
  label,
  number,
  onClick,
}: {
  isActive?: boolean;
  isClickable?: boolean;
  label: string;
  number: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span
        className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold transition ${
          isActive ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white text-slate-500'
        }`}
      >
        {number}
      </span>
      <span className="font-medium">{label}</span>
    </>
  );

  if (isClickable && onClick) {
    return (
      <button
        className={`flex items-center gap-3 text-lg transition hover:text-slate-700 ${
          isActive ? 'text-slate-800' : 'text-slate-400'
        }`}
        onClick={onClick}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-3 text-lg ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
      {content}
    </div>
  );
}

function SummaryRow({
  accent = false,
  description,
  icon,
  label,
  value,
}: {
  accent?: boolean;
  description: string;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5 last:border-b-0 last:pb-0">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-blue-50 text-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          {icon}
        </span>
        <div>
          <strong className="block text-[1.15rem] font-semibold text-slate-950">{label}</strong>
          <small className="mt-1 block text-[0.98rem] leading-6 text-slate-500">{description}</small>
        </div>
      </div>
      <strong className={`text-[1.4rem] font-bold tracking-tight ${accent ? 'text-blue-600' : 'text-slate-700'}`}>
        {value}
      </strong>
    </div>
  );
}
