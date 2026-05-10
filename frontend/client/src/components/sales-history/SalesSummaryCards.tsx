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
    tone: 'from-slate-950 to-blue-700 text-white',
    value: (summary: SalesHistorySummary) => currency.format(summary.totalVendido),
  },
  {
    key: 'cantidadVentas',
    label: 'Cantidad de ventas',
    icon: BanknoteArrowDown,
    tone: 'from-emerald-500 to-teal-500 text-white',
    value: (summary: SalesHistorySummary) => String(summary.cantidadVentas),
  },
  {
    key: 'productosVendidos',
    label: 'Productos vendidos',
    icon: PackageCheck,
    tone: 'from-amber-400 to-orange-500 text-white',
    value: (summary: SalesHistorySummary) => String(summary.productosVendidos),
  },
  {
    key: 'ventasEfectivo',
    label: 'Ventas en efectivo',
    icon: BanknoteArrowDown,
    tone: 'from-emerald-50 to-emerald-100 text-emerald-800',
    value: (summary: SalesHistorySummary) => String(summary.ventasEfectivo),
  },
  {
    key: 'ventasTarjeta',
    label: 'Ventas con tarjeta',
    icon: CreditCard,
    tone: 'from-blue-50 to-blue-100 text-blue-800',
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
            className={`rounded-[28px] bg-gradient-to-br px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ${card.tone}`}
            key={card.key}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{card.label}</span>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15">
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
