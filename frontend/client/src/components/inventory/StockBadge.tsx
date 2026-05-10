type StockStatus = 'in-stock' | 'low' | 'out';

type StockBadgeProps = {
  status: StockStatus;
  stock: number;
};

const config: Record<StockStatus, { label: string; tone: string }> = {
  'in-stock': {
    label: 'En stock',
    tone: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  },
  low: {
    label: 'Stock bajo',
    tone: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  },
  out: {
    label: 'Agotado',
    tone: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
  },
};

export function StockBadge({ status, stock }: StockBadgeProps) {
  const current = config[status];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${current.tone}`}>
        {current.label}
      </span>
      <span className="text-xs font-medium text-slate-500">{stock} unidades</span>
    </div>
  );
}

export type { StockStatus };
