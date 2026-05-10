export function SecurityNotice() {
  return (
    <div className="rounded-[22px] border border-sky-100 bg-[linear-gradient(180deg,#eff6ff,#e0f2fe)] px-5 py-5 text-sm text-sky-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/80 text-sky-600 shadow-sm">
          <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 8v.01M11 12h1v4h1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <strong className="block font-semibold text-sky-900">Información de pago</strong>
          <p className="mt-1 leading-6 text-sky-800/85">
            Verifica cuidadosamente el nombre del titular, el número de tarjeta, la fecha de expiración y el código de seguridad antes de confirmar tu compra.
          </p>
        </div>
      </div>
    </div>
  );
}

export function SecurityFeatures() {
  const items = [
    'Pago 100% seguro',
    'Tus datos están protegidos',
    'Modo prueba: sin cobros',
  ];

  return (
    <div className="grid gap-3 border-t border-slate-200 pt-6 text-sm text-slate-600 sm:grid-cols-3">
      {items.map((item) => (
        <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50/80 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]" key={item}>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path d="m7 12.5 3.2 3.2L17.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="font-medium">{item}</span>
        </div>
      ))}
    </div>
  );
}

export function SecurePaymentBox({
  shippingLabel,
  totalLabel,
}: {
  shippingLabel?: string;
  totalLabel: string;
}) {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-4 rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div>
          <strong className="block text-[2rem] font-bold tracking-tight text-slate-950">Total a pagar</strong>
          <p className="mt-2 text-base leading-7 text-slate-500">
            {shippingLabel ? `Incluye envío estimado de ${shippingLabel}` : 'Pedido seguro en modo prueba'}
          </p>
        </div>
        <div className="text-right text-[2.35rem] font-bold tracking-tight text-blue-600">
          {totalLabel}
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500">
          <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
            <path d="M17.25 9H16.5V7.5a4.5 4.5 0 0 0-9 0V9h-.75A2.25 2.25 0 0 0 4.5 11.25v8.25a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-8.25A2.25 2.25 0 0 0 17.25 9ZM9 7.5a3 3 0 0 1 6 0V9H9V7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span>Transacción protegida con encriptación SSL de 256 bits.</span>
      </div>
    </div>
  );
}
