import { DELIVERY_STATUS_STEPS, getDeliveryStatusIndex } from './delivery-status';
import type { DeliveryOrderStatus } from '../../domain/types';

type DeliveryTimelineProps = {
  currentStatus: DeliveryOrderStatus;
};

export function DeliveryTimeline({ currentStatus }: DeliveryTimelineProps) {
  const currentIndex = getDeliveryStatusIndex(currentStatus);

  return (
    <div className="grid gap-4">
      {DELIVERY_STATUS_STEPS.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-3" key={step.code}>
            <div className="flex flex-col items-center">
              <span
                className={`grid h-10 w-10 place-items-center rounded-2xl ring-1 transition ${
                  isCompleted
                    ? 'bg-blue-600 text-white ring-blue-500/30'
                    : 'bg-slate-50 text-slate-400 ring-slate-200'
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              {index < DELIVERY_STATUS_STEPS.length - 1 ? (
                <span className={`mt-2 h-10 w-px ${index < currentIndex ? 'bg-blue-500' : 'bg-slate-200'}`} />
              ) : null}
            </div>
            <div className="pt-1">
              <strong className={`block text-sm ${isCurrent ? 'text-slate-950' : 'text-slate-700'}`}>
                {step.label}
              </strong>
              <span className="mt-1 block text-xs text-slate-500">
                {isCompleted
                  ? isCurrent
                    ? 'Estado actual del pedido'
                    : 'Completado'
                  : 'Pendiente'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
