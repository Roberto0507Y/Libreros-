import type { SubcategoryOption } from '../../domain/types';
import { dateOnly } from '../../lib/format';

type SubcategoryCardProps = {
  categoryName: string;
  onDelete?: (subcategory: SubcategoryOption) => void;
  onEdit?: (subcategory: SubcategoryOption) => void;
  subcategory: SubcategoryOption;
};

const formatCreatedAt = (value?: string | null) => {
  if (!value) return 'Sin fecha disponible';
  return dateOnly.format(new Date(value));
};

export function SubcategoryCard({
  categoryName,
  onDelete,
  onEdit,
  subcategory,
}: SubcategoryCardProps) {
  const status = subcategory.active === false ? 'Inactiva' : 'Activa';
  const statusClass =
    subcategory.active === false
      ? 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200'
      : 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200';

  return (
    <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_20px_36px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path
              d="M4 7.5 12 3l8 4.5m-16 0 8 4.5m-8-4.5V16.5L12 21m8-13.5V16.5L12 21m0-9V21"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </span>

        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusClass}`}>
          {status}
        </span>
      </div>

      <div className="mt-5">
        <h3 className="text-lg font-bold text-slate-900">{subcategory.nombre}</h3>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200">
            {categoryName}
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            #{subcategory.id}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Categoria padre</p>
          <p className="mt-2 text-sm font-medium text-slate-700">{categoryName}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Fecha</p>
          <p className="mt-2 text-sm font-medium text-slate-700">
            {formatCreatedAt(subcategory.createdAt)}
          </p>
        </div>
      </div>

      {(onEdit || onDelete) ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={() => onEdit?.(subcategory)}
            type="button"
          >
            Editar
          </button>
          <button
            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
            onClick={() => onDelete?.(subcategory)}
            type="button"
          >
            Eliminar
          </button>
        </div>
      ) : null}
    </article>
  );
}
