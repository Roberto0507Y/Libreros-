type BrandStatsProps = {
  withImageCount: number;
  total: number;
  withoutImageCount: number;
};

const stats = (total: number, withImageCount: number, withoutImageCount: number) => [
  {
    label: 'Total de marcas',
    value: total,
    description: 'Marcas disponibles para el catalogo y productos.',
    tone: 'from-slate-950 via-slate-900 to-slate-800 text-white',
  },
  {
    label: 'Marcas con imagen',
    value: withImageCount,
    description: 'Logos ya listos para mostrarse de forma visual.',
    tone: 'from-blue-600 via-indigo-600 to-blue-700 text-white',
  },
  {
    label: 'Marcas sin imagen',
    value: withoutImageCount,
    description: 'Registros pendientes de completar con su logo.',
    tone: 'from-amber-400 via-orange-400 to-amber-500 text-slate-950',
  },
];

export function BrandStats({ withImageCount, total, withoutImageCount }: BrandStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats(total, withImageCount, withoutImageCount).map((item) => (
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
