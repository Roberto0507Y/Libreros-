import type { ChangeEvent } from 'react';

type BrandFiltersProps = {
  imageFilter: 'all' | 'with-image' | 'without-image';
  onClear: () => void;
  onFilterChange: (value: 'all' | 'with-image' | 'without-image') => void;
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  searchQuery: string;
};

const filterOptions = [
  { label: 'Todas', value: 'all' },
  { label: 'Con imagen', value: 'with-image' },
  { label: 'Sin imagen', value: 'without-image' },
] as const;

export function BrandFilters({
  imageFilter,
  onClear,
  onFilterChange,
  onSearchChange,
  searchQuery,
}: BrandFiltersProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
      <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-1.5">
        <label className="flex items-center gap-3 rounded-[18px] bg-white px-4 py-3 shadow-sm" htmlFor="brand-search">
          <span className="text-slate-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path
                d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </span>
          <input
            className="w-full border-0 bg-transparent p-0 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0"
            id="brand-search"
            onChange={onSearchChange}
            placeholder="Buscar por nombre de marca..."
            type="search"
            value={searchQuery}
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => {
            const active = option.value === imageFilter;

            return (
              <button
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? 'bg-blue-600 text-white shadow-[0_16px_28px_rgba(37,99,235,0.22)]'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
                key={option.value}
                onClick={() => onFilterChange(option.value)}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <button
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          onClick={onClear}
          type="button"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}
