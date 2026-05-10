import type { DeliveryOrderStatus } from '../../domain/types';

type DeliveryStatusBadgeProps = {
  status: DeliveryOrderStatus;
  label?: string;
};

const tones: Record<DeliveryOrderStatus, string> = {
  pedido_recibido: 'bg-slate-100 text-slate-700 ring-slate-200',
  pago_confirmado: 'bg-blue-50 text-blue-700 ring-blue-100',
  preparando_pedido: 'bg-amber-50 text-amber-700 ring-amber-100',
  pedido_despachado: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  repartidor_en_camino: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
  repartidor_cerca: 'bg-violet-50 text-violet-700 ring-violet-100',
  entregado: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
};

export function DeliveryStatusBadge({ status, label }: DeliveryStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${tones[status]}`}
    >
      {label}
    </span>
  );
}
