import { currency, dateTime } from '../../lib/format';

type InvoiceLine = {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type InvoicePreviewProps = {
  customerName: string;
  deliveryAddress: string;
  deliveryEta: string;
  logoSrc: string;
  onClose: () => void;
  onDownloadPdf: () => void;
  orderId: number;
  orderTotal: number;
  orderDate: string;
  phone: string;
  reference: string;
  shippingCost: number;
  subtotal: number;
  items: InvoiceLine[];
};

function formatOrderCode(orderId: number, orderDate: string) {
  const date = new Date(orderDate);
  const year = date.getFullYear();
  return `ORD-${year}-${String(orderId).padStart(4, '0')}`;
}

function buildTrackingCode(orderId: number, orderDate: string) {
  const date = new Date(orderDate);
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate(),
  ).padStart(2, '0')}`;
  return `TRK-${stamp}-${String(orderId).padStart(4, '0')}`;
}

function DataBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
        {title}
      </span>
      <div className="text-sm leading-6 text-slate-700">{children}</div>
    </div>
  );
}

export function InvoicePreview({
  customerName,
  deliveryAddress,
  deliveryEta,
  logoSrc,
  onClose,
  onDownloadPdf,
  orderId,
  orderTotal,
  orderDate,
  phone,
  reference,
  shippingCost,
  subtotal,
  items,
}: InvoicePreviewProps) {
  const orderCode = formatOrderCode(orderId, orderDate);
  const trackingCode = buildTrackingCode(orderId, orderDate);
  const formattedDate = dateTime.format(new Date(orderDate));

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[72] overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),rgba(15,23,42,0.88)_60%)] px-4 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <div className="mx-auto w-full max-w-[980px]">
        <div className="mb-4 flex justify-end gap-3">
          <button
            className="rounded-2xl border border-white/25 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
            onClick={onDownloadPdf}
            type="button"
          >
            Descargar PDF
          </button>
          <button
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-900"
            onClick={onClose}
            type="button"
          >
            Cerrar
          </button>
        </div>

        <div className="overflow-hidden rounded-[30px] border border-white/30 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.22)]">
          <div className="h-2 bg-[linear-gradient(90deg,#0f172a,#2563eb,#38bdf8)]" />

          <div className="px-7 py-8 md:px-10 md:py-10">
            <div className="flex flex-col gap-6 border-b border-slate-200 pb-7 md:flex-row md:items-start md:justify-between">
              <div className="space-y-4">
                <div className="h-2 w-16 rounded-full bg-[repeating-linear-gradient(90deg,#cbd5e1_0_6px,transparent_6px_10px)]" />
                <div className="flex items-start gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-full border border-slate-200 bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                    <img alt="Logo empresa" className="max-h-full w-full object-contain" src={logoSrc} />
                  </div>
                  <div>
                    <h3 className="text-[2rem] font-light tracking-[-0.05em] text-slate-950 md:text-[2.4rem]">
                      Factura
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
                      Documento generado por compra confirmada en línea.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50/70 px-5 py-4 md:min-w-[280px]">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold uppercase tracking-[0.18em] text-slate-400">No. de factura</span>
                  <strong className="text-slate-950">{orderCode}</strong>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold uppercase tracking-[0.18em] text-slate-400">Fecha</span>
                  <span className="text-right text-slate-700">{formattedDate}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold uppercase tracking-[0.18em] text-slate-400">Estado</span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Pagado
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold uppercase tracking-[0.18em] text-slate-400">Seguimiento</span>
                  <span className="text-right font-medium text-slate-700">{trackingCode}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-6 border-b border-slate-200 pb-8 md:grid-cols-2">
              <DataBlock title="De">
                <strong className="block text-slate-950">Librería Digital</strong>
                <span className="block">Zona 1, Ciudad de Guatemala</span>
                <span className="block">+502 2222 0000</span>
                <span className="block">soporte@libreriadigital.com</span>
              </DataBlock>

              <DataBlock title="Facturar a">
                <strong className="block text-slate-950">{customerName}</strong>
                <span className="block">{phone || 'Sin teléfono registrado'}</span>
                <span className="block">{deliveryAddress}</span>
              </DataBlock>

              <DataBlock title="Entrega">
                <strong className="block text-slate-950">{deliveryEta}</strong>
                <span className="block">{deliveryAddress}</span>
                <span className="block">{reference || 'Sin referencia adicional'}</span>
              </DataBlock>

              <DataBlock title="Pago y forma de entrega">
                <strong className="block text-slate-950">Tarjeta</strong>
                <span className="block">Pago aprobado</span>
                <span className="block">Entrega programada</span>
              </DataBlock>
            </div>

            <div className="mt-8 overflow-hidden rounded-[24px] border border-slate-200">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-slate-100 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    <th className="w-14 px-4 py-4">Cant.</th>
                    <th className="px-4 py-4">Descripción</th>
                    <th className="w-36 px-4 py-4 text-right">Precio unitario</th>
                    <th className="w-32 px-4 py-4 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="px-4 py-4 text-sm font-medium text-slate-700">{item.quantity}</td>
                      <td className="px-4 py-4 text-sm text-slate-950">{item.name}</td>
                      <td className="px-4 py-4 text-right text-sm text-slate-700">
                        {currency.format(item.unitPrice)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-slate-950">
                        {currency.format(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-md space-y-5">
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                    Condiciones y forma de pago
                  </span>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Pago procesado en línea con conexión SSL de 256 bits. Entrega sujeta a confirmación de ruta y horario.
                  </p>
                </div>
                <div className="grid gap-2 text-sm text-slate-500">
                  <span>✅ Pago aprobado</span>
                  <span>🚚 Entrega programada</span>
                  <span>🔒 Pago seguro SSL</span>
                </div>
              </div>

              <div className="w-full max-w-[320px] rounded-[24px] border border-slate-300 bg-slate-50">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 text-sm text-slate-600">
                  <span>Subtotal</span>
                  <strong className="text-slate-950">{currency.format(subtotal)}</strong>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 text-sm text-slate-600">
                  <span>Envío</span>
                  <strong className="text-slate-950">{currency.format(shippingCost)}</strong>
                </div>
                <div className="flex items-center justify-between px-5 py-4">
                  <span className="text-lg font-semibold uppercase tracking-[0.08em] text-slate-950">Total</span>
                  <strong className="text-3xl font-black tracking-[-0.04em] text-slate-950">
                    {currency.format(orderTotal)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500 md:flex-row md:items-end md:justify-between">
              <div>
                <strong className="block text-base text-slate-950">Gracias por tu compra</strong>
                <p className="mt-1">Conserva esta factura como respaldo de tu pedido.</p>
              </div>
              <div className="space-y-1 md:text-right">
                <span className="block">www.libreriadigital.com</span>
                <span className="block">soporte@libreriadigital.com</span>
                <span className="block">+502 2222 0000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
