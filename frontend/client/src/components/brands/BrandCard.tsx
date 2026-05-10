import type { CatalogOption } from '../../domain/types';

type BrandCardProps = {
  imageSrc: string;
  isDeleting: boolean;
  onDelete: (brand: CatalogOption) => void;
  onEdit: (brand: CatalogOption) => void;
  brand: CatalogOption;
};

export function BrandCard({ brand, imageSrc, isDeleting, onDelete, onEdit }: BrandCardProps) {
  const hasImage = Boolean(brand.imagen);

  return (
    <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_20px_36px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            hasImage
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
              : 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200'
          }`}
        >
          {hasImage ? 'Con imagen' : 'Sin imagen'}
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">#{brand.id}</span>
      </div>

      <div className="mt-5 grid h-36 place-items-center overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 p-5">
        {imageSrc ? (
          <img alt={brand.nombre} className="h-20 w-full object-contain" src={imageSrc} />
        ) : (
          <div className="text-center">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                <path
                  d="M4 16.5V6.75A1.75 1.75 0 0 1 5.75 5h12.5A1.75 1.75 0 0 1 20 6.75v10.5A1.75 1.75 0 0 1 18.25 19H5.75A1.75 1.75 0 0 1 4 17.25Zm0 0 4.7-4.7a1 1 0 0 1 1.4 0l1.9 1.9 3.9-3.9a1 1 0 0 1 1.4 0L20 12.5M9 9.5h.01"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </span>
            <span className="mt-3 block text-sm text-slate-400">Sin imagen disponible</span>
          </div>
        )}
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Marca</p>
        <h3 className="mt-2 text-lg font-bold text-slate-900">{brand.nombre}</h3>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          onClick={() => onEdit(brand)}
          type="button"
        >
          Editar
        </button>
        <button
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isDeleting}
          onClick={() => onDelete(brand)}
          type="button"
        >
          Eliminar
        </button>
      </div>
    </article>
  );
}
