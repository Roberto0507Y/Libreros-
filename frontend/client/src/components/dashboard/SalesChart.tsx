import type { MetricPoint } from '../../domain/types';
import { currency } from '../../lib/format';

type SalesChartProps = {
  points: MetricPoint[];
};

export function SalesChart({ points }: SalesChartProps) {
  const max = Math.max(...points.map((point) => point.value), 1);
  const path = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 100 - (point.value / max) * 100;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
            Grafica
          </p>
          <h3 className="mt-2 text-xl font-bold text-slate-900">Ventas de los ultimos 7 dias</h3>
          <p className="mt-2 text-sm text-slate-500">
            Vista rapida del comportamiento diario de ventas registradas.
          </p>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Total periodo
          </span>
          <strong className="mt-2 block text-lg text-slate-900">
            {currency.format(points.reduce((sum, point) => sum + point.value, 0))}
          </strong>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
        <div className="h-56 md:h-60">
          <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            {Array.from({ length: 5 }).map((_, index) => {
              const y = 100 - index * 25;
              return (
                <line
                  key={y}
                  stroke="#dbeafe"
                  strokeDasharray="3 4"
                  strokeWidth="0.5"
                  x1="0"
                  x2="100"
                  y1={y}
                  y2={y}
                />
              );
            })}

            <path
              d={`${path} L 100 100 L 0 100 Z`}
              fill="url(#sales-gradient)"
              opacity="0.2"
              stroke="none"
            />
            <path
              d={path || 'M 0 100 L 100 100'}
              fill="none"
              stroke="#2563eb"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.4"
            />

            {points.map((point, index) => {
              const x = (index / Math.max(points.length - 1, 1)) * 100;
              const y = 100 - (point.value / max) * 100;

              return <circle cx={x} cy={y} fill="#2563eb" key={point.date} r="2.3" />;
            })}

            <defs>
              <linearGradient id="sales-gradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#93c5fd" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-2">
          {points.map((point) => (
            <div className="text-center" key={point.date}>
              <span className="block text-xs font-semibold text-slate-500">{point.label}</span>
              <span className="mt-1 block text-xs text-slate-400">{currency.format(point.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
