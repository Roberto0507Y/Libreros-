import { BanknoteArrowDown, CreditCard, PackageCheck, Wallet } from 'lucide-react';

import type { SalesHistorySummary } from '../../domain/types';
import { currency } from '../../lib/format';

type SalesSummaryCardsProps = {
  summary: SalesHistorySummary;
};

const cards = [
  {
    key: 'totalVendido',
    label: 'Total vendido',
    icon: Wallet,
    tone:
      'border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,246,255,0.95))] text-slate-950',
    iconTone: 'bg-[linear-gradient(135deg,#1e3a8a,#2563eb)] text-white shadow-[0_14px_28px_rgba(37,99,235,0.24)]',
    labelTone: 'text-blue-700/80',
    value: (summary: SalesHistorySummary) => currency.format(summary.totalVendido),
  },
  {
    key: 'cantidadVentas',
    label: 'Cantidad de ventas',
    icon: BanknoteArrowDown,
    tone:
      'border-emerald-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(236,253,245,0.95))] text-slate-950',
    iconTone: 'bg-[linear-gradient(135deg,#059669,#10b981)] text-white shadow-[0_14px_28px_rgba(16,185,129,0.22)]',
    labelTone: 'text-emerald-700/80',
    value: (summary: SalesHistorySummary) => String(summary.cantidadVentas),
  },
  {
    key: 'productosVendidos',
    label: 'Productos vendidos',
    icon: PackageCheck,
    tone:
      'border-amber-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,251,235,0.95))] text-slate-950',
    iconTone: 'bg-[linear-gradient(135deg,#f59e0b,#f97316)] text-white shadow-[0_14px_28px_rgba(249,115,22,0.2)]',
    labelTone: 'text-amber-700/80',
    value: (summary: SalesHistorySummary) => String(summary.productosVendidos),
  },
  {
    key: 'ventasEfectivo',
    label: 'Ventas en efectivo',
    icon: BanknoteArrowDown,
    tone:
      'border-teal-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,253,250,0.95))] text-slate-950',
    iconTone: 'bg-[linear-gradient(135deg,#0f766e,#14b8a6)] text-white shadow-[0_14px_28px_rgba(20,184,166,0.18)]',
    labelTone: 'text-teal-700/80',
    value: (summary: SalesHistorySummary) => String(summary.ventasEfectivo),
  },
  {
    key: 'ventasTarjeta',
    label: 'Ventas con tarjeta',
    icon: CreditCard,
    tone:
      'border-indigo-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(238,242,255,0.95))] text-slate-950',
    iconTone: 'bg-[linear-gradient(135deg,#4f46e5,#2563eb)] text-white shadow-[0_14px_28px_rgba(79,70,229,0.18)]',
    labelTone: 'text-indigo-700/80',
    value: (summary: SalesHistorySummary) => String(summary.ventasTarjeta),
  },
] as const;

export function SalesSummaryCards({ summary }: SalesSummaryCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            className={`rounded-[28px] border px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-[0_24px_42px_rgba(15,23,42,0.08)] ${card.tone}`}
            key={card.key}
          >
            <div className="flex items-center justify-between gap-3">
              <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${card.labelTone}`}>{card.label}</span>
              <span className={`grid h-11 w-11 place-items-center rounded-2xl ${card.iconTone}`}>
                <Icon className="h-5 w-5" />
              </span>
            </div>
            <strong className="mt-4 block text-[1.85rem] font-black tracking-tight">
              {card.value(summary)}
            </strong>
          </article>
        );
      })}
    </section>
  );
}
