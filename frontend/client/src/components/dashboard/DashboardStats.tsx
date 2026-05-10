import type { ReactNode } from 'react';

import { currency } from '../../lib/format';

type StatItem = {
  change: number;
  description: string;
  icon: ReactNode;
  isCurrency?: boolean;
  label: string;
  tone: string;
  value: number;
};

type DashboardStatsProps = {
  items: StatItem[];
};

const formatChange = (value: number) => {
  const signal = value > 0 ? '+' : '';
  return `${signal}${value.toFixed(1)}% vs ayer`;
};

export function DashboardStats({ items }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {items.map((item) => {
        const positive = item.change >= 0;

        return (
          <article
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]"
            key={item.label}
          >
            <div className="flex items-start justify-between gap-4">
              <span className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${item.tone}`}>
                {item.icon}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  positive
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
                    : 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200'
                }`}
              >
                {formatChange(item.change)}
              </span>
            </div>

            <p className="mt-5 text-sm font-semibold text-slate-500">{item.label}</p>
            <strong className="mt-2 block text-3xl font-bold text-slate-900">
              {item.isCurrency ? currency.format(item.value) : item.value}
            </strong>
            <p className="mt-3 text-sm leading-6 text-slate-500">{item.description}</p>
          </article>
        );
      })}
    </div>
  );
}
