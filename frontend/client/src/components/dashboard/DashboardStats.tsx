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
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {items.map((item) => {
        const positive = item.change >= 0;

        return (
          <article
            className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:rounded-[28px] sm:p-5"
            key={item.label}
          >
            <div className="flex items-start justify-between gap-4">
              <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl sm:h-14 sm:w-14 ${item.tone}`}>
                {item.icon}
              </span>
              <span
                className={`max-w-[150px] rounded-full px-2.5 py-1 text-right text-[11px] font-semibold leading-tight sm:max-w-none sm:px-3 sm:text-xs ${
                  positive
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
                    : 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200'
                }`}
              >
                {formatChange(item.change)}
              </span>
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-500 sm:mt-5">{item.label}</p>
            <strong className="mt-2 block text-[1.7rem] font-bold text-slate-900 sm:text-3xl">
              {item.isCurrency ? currency.format(item.value) : item.value}
            </strong>
            <p className="mt-2.5 text-sm leading-6 text-slate-500 sm:mt-3">{item.description}</p>
          </article>
        );
      })}
    </div>
  );
}
