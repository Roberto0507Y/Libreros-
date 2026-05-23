type InventoryStatsProps = {
  lowStockCount: number;
  outOfStockCount: number;
  totalUnits: number;
  visibleProducts: number;
};

const stats = (
  visibleProducts: number,
  totalUnits: number,
  lowStockCount: number,
  outOfStockCount: number,
) => [
  {
    label: 'Productos visibles',
    value: visibleProducts,
    description: 'Items filtrados y listos para revisar en el panel.',
    tone:
      'border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,246,255,0.95))] text-slate-950',
    accent: 'bg-[linear-gradient(135deg,#1e3a8a,#2563eb)] text-white shadow-[0_14px_28px_rgba(37,99,235,0.24)]',
    labelTone: 'text-blue-700/80',
    valueTone: 'text-slate-950',
    descriptionTone: 'text-slate-500',
  },
  {
    label: 'Unidades en stock',
    value: totalUnits,
    description: 'Existencias disponibles sumadas de los productos visibles.',
    tone:
      'border-indigo-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(238,242,255,0.95))] text-slate-950',
    accent: 'bg-[linear-gradient(135deg,#4f46e5,#2563eb)] text-white shadow-[0_14px_28px_rgba(79,70,229,0.18)]',
    labelTone: 'text-indigo-700/80',
    valueTone: 'text-slate-950',
    descriptionTone: 'text-slate-500',
  },
  {
    label: 'Stock bajo',
    value: lowStockCount,
    description: 'Productos que requieren reposicion pronta.',
    tone:
      'border-amber-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,251,235,0.95))] text-slate-950',
    accent: 'bg-[linear-gradient(135deg,#f59e0b,#f97316)] text-white shadow-[0_14px_28px_rgba(249,115,22,0.2)]',
    labelTone: 'text-amber-700/80',
    valueTone: 'text-slate-950',
    descriptionTone: 'text-slate-500',
  },
  {
    label: 'Agotados',
    value: outOfStockCount,
    description: 'Productos sin unidades disponibles en inventario.',
    tone:
      'border-rose-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,241,242,0.95))] text-slate-950',
    accent: 'bg-[linear-gradient(135deg,#e11d48,#f43f5e)] text-white shadow-[0_14px_28px_rgba(244,63,94,0.18)]',
    labelTone: 'text-rose-700/80',
    valueTone: 'text-slate-950',
    descriptionTone: 'text-slate-500',
  },
];

export function InventoryStats({
  lowStockCount,
  outOfStockCount,
  totalUnits,
  visibleProducts,
}: InventoryStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {stats(visibleProducts, totalUnits, lowStockCount, outOfStockCount).map((item) => (
        <article
          className={`rounded-[24px] border p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-[0_24px_42px_rgba(15,23,42,0.08)] ${item.tone}`}
          key={item.label}
        >
          <div className="flex items-start justify-between gap-4">
            <p className={`text-sm font-semibold ${item.labelTone}`}>{item.label}</p>
            <span className={`grid h-11 w-11 place-items-center rounded-2xl ${item.accent}`} />
          </div>
          <strong className={`mt-3 block text-3xl font-bold ${item.valueTone}`}>{item.value}</strong>
          <p className={`mt-3 text-sm leading-6 ${item.descriptionTone}`}>{item.description}</p>
        </article>
      ))}
    </div>
  );
}
