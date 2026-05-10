type ActivityItem = {
  description: string;
  id: string;
  sortValue: number;
  time: string;
  title: string;
  tone: 'blue' | 'emerald';
};

type ActivityFeedProps = {
  items: ActivityItem[];
};

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
          Actividad reciente
        </p>
        <h3 className="mt-2 text-xl font-bold text-slate-900">Ultimas acciones del sistema</h3>
      </div>

      {items.length ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <div className="flex gap-4 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3.5" key={item.id}>
              <span
                className={`mt-1 inline-flex h-3 w-3 rounded-full ${
                  item.tone === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'
                }`}
              />
              <div className="min-w-0">
                <strong className="block text-sm text-slate-900">{item.title}</strong>
                <span className="mt-1 block text-sm text-slate-500">{item.description}</span>
                <span className="mt-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                  {item.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
          <strong className="block text-lg text-slate-900">Aun no hay actividad reciente.</strong>
          <span className="mt-2 block text-sm text-slate-500">
            Las ventas y productos nuevos apareceran aqui automaticamente.
          </span>
        </div>
      )}
    </article>
  );
}

export type { ActivityItem };
