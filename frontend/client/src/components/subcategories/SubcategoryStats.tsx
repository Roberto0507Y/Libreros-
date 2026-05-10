type SubcategoryStatsProps = {
  categoryCount: number;
  latestName: string;
  total: number;
};

const stats = (total: number, categoryCount: number, latestName: string) => [
  {
    label: 'Total de subcategorias',
    value: String(total),
    description: 'Secciones activas para organizar mejor el catalogo.',
    tone: 'from-slate-950 via-slate-900 to-slate-800 text-white',
  },
  {
    label: 'Categorias relacionadas',
    value: String(categoryCount),
    description: 'Categorias padre conectadas con subcategorias visibles.',
    tone: 'from-blue-600 via-indigo-600 to-blue-700 text-white',
  },
  {
    label: 'Ultima subcategoria creada',
    value: latestName || 'Sin registros',
    description: 'Ultimo nombre disponible segun la informacion cargada.',
    tone: 'from-emerald-500 via-green-500 to-emerald-600 text-white',
  },
];

export function SubcategoryStats({ categoryCount, latestName, total }: SubcategoryStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats(total, categoryCount, latestName).map((item) => (
        <article
          className={`rounded-[24px] bg-gradient-to-br ${item.tone} p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]`}
          key={item.label}
        >
          <p className="text-sm font-semibold text-inherit/80">{item.label}</p>
          <strong className="mt-3 block text-2xl font-bold leading-tight">{item.value}</strong>
          <p className="mt-3 text-sm leading-6 text-inherit/75">{item.description}</p>
        </article>
      ))}
    </div>
  );
}
