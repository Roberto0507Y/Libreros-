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
    tone: 'from-slate-950 via-slate-900 to-slate-800 text-white',
  },
  {
    label: 'Unidades en stock',
    value: totalUnits,
    description: 'Existencias disponibles sumadas de los productos visibles.',
    tone: 'from-blue-600 via-indigo-600 to-blue-700 text-white',
  },
  {
    label: 'Stock bajo',
    value: lowStockCount,
    description: 'Productos que requieren reposicion pronta.',
    tone: 'from-amber-400 via-orange-400 to-amber-500 text-slate-950',
  },
  {
    label: 'Agotados',
    value: outOfStockCount,
    description: 'Productos sin unidades disponibles en inventario.',
    tone: 'from-rose-500 via-red-500 to-rose-600 text-white',
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
          className={`rounded-[24px] bg-gradient-to-br ${item.tone} p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]`}
          key={item.label}
        >
          <p className="text-sm font-semibold text-inherit/80">{item.label}</p>
          <strong className="mt-3 block text-3xl font-bold">{item.value}</strong>
          <p className="mt-3 text-sm leading-6 text-inherit/75">{item.description}</p>
        </article>
      ))}
    </div>
  );
}
