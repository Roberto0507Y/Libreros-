type SummaryItem = {
  id: number;
  name: string;
  quantity: number;
};

type PaymentSummaryProps = {
  customerLabel: string;
  deliveryLabel?: string;
  shippingLabel?: string;
  orderLabel: string;
  items: SummaryItem[];
  subtotalLabel: string;
};

function SummaryIcon({ type }: { type: 'product' | 'customer' | 'order' }) {
  if (type === 'product') {
    return (
      <svg aria-hidden="true" className="h-5 w-5 text-current" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="18.5" r="1.75" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17" cy="18.5" r="1.75" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M3 4.5h2.5l1.8 8.1a2 2 0 0 0 1.95 1.56h7.9a2 2 0 0 0 1.95-1.59L20.3 7H7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === 'customer') {
    return (
      <svg aria-hidden="true" className="h-5 w-5 text-current" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.01-8 4.5V20h16v-1.5c0-2.49-3.58-4.5-8-4.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-5 w-5 text-current" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3.75h7l4 4V20.25A1.75 1.75 0 0 1 16.25 22h-9.5A1.75 1.75 0 0 1 5 20.25V5.5A1.75 1.75 0 0 1 6.75 3.75H7Zm6 1.5v3h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function DeliveryIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 text-current" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 11.5V5.75A1.75 1.75 0 0 1 6.75 4h10.5A1.75 1.75 0 0 1 19 5.75v11.5A1.75 1.75 0 0 1 17.25 19H6.75A1.75 1.75 0 0 1 5 17.25V15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 8.5h8M8 12h8M8 15.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PaymentSummary({
  customerLabel,
  deliveryLabel,
  shippingLabel,
  orderLabel,
  items,
  subtotalLabel,
}: PaymentSummaryProps) {
  const primaryItem = items[0];

  return (
    <div className="grid gap-5">
      <div>
        <h3 className="text-[2rem] font-bold tracking-tight text-slate-950">Resumen de compra</h3>
        <p className="mt-2 text-base leading-7 text-slate-500">
          Revisa el pedido antes de confirmar.
        </p>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-slate-900 shadow-[0_22px_60px_rgba(15,23,42,0.08)] md:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-4 first:pt-0">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-blue-50 text-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <SummaryIcon type="product" />
            </span>
            <div>
              <strong className="block text-[1.15rem] font-semibold text-slate-950">Producto / Curso</strong>
              <small className="mt-1 block text-[0.98rem] leading-6 text-slate-500">
                {primaryItem ? primaryItem.name : 'Producto de prueba'}
              </small>
            </div>
          </div>
          <strong className="text-[1.85rem] font-bold tracking-tight text-slate-800">{subtotalLabel}</strong>
        </div>

        <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-4">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-blue-50 text-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <SummaryIcon type="customer" />
            </span>
            <div>
              <strong className="block text-[1.15rem] font-semibold text-slate-950">Cliente</strong>
              <small className="mt-1 block text-[0.98rem] leading-6 text-slate-500">{customerLabel}</small>
            </div>
          </div>
          <strong className="text-2xl font-bold text-slate-400">—</strong>
        </div>

        {deliveryLabel ? (
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-4">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-blue-50 text-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <DeliveryIcon />
              </span>
              <div>
                <strong className="block text-[1.15rem] font-semibold text-slate-950">Entrega</strong>
                <small className="mt-1 block text-[0.98rem] leading-6 text-slate-500">{deliveryLabel}</small>
              </div>
            </div>
            <strong className="text-[1.55rem] font-bold tracking-tight text-slate-700">
              {shippingLabel ?? '—'}
            </strong>
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-4 pt-4">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-blue-50 text-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <SummaryIcon type="order" />
            </span>
            <div>
              <strong className="block text-[1.15rem] font-semibold text-slate-950">Número de orden</strong>
            </div>
          </div>
          <strong className="text-[1.4rem] font-bold tracking-tight text-slate-700">{orderLabel}</strong>
        </div>
      </div>
    </div>
  );
}
