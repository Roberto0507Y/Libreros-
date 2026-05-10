import type { ChangeEvent } from 'react';

import type { CatalogOption } from '../../domain/types';

type SubcategoryFiltersProps = {
  categories: CatalogOption[];
  categoryFilterId: string;
  onCategoryFilterChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onClear: () => void;
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  searchQuery: string;
};

export function SubcategoryFilters({
  categories,
  categoryFilterId,
  onCategoryFilterChange,
  onClear,
  onSearchChange,
  searchQuery,
}: SubcategoryFiltersProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px_auto]">
      <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-1.5">
        <label
          className="flex items-center gap-3 rounded-[18px] bg-white px-4 py-3 shadow-sm"
          htmlFor="subcategory-search"
        >
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
            id="subcategory-search"
            onChange={onSearchChange}
            placeholder="Buscar por subcategoria o categoria padre..."
            type="search"
            value={searchQuery}
          />
        </label>
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-1.5">
        <label
          className="flex items-center gap-3 rounded-[18px] bg-white px-4 py-3 shadow-sm"
          htmlFor="subcategory-category-filter"
        >
          <span className="text-slate-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path
                d="M4 6h16M7 12h10m-7 6h4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </span>
          <select
            className="w-full border-0 bg-transparent p-0 text-sm text-slate-800 outline-none focus:ring-0"
            id="subcategory-category-filter"
            onChange={onCategoryFilterChange}
            value={categoryFilterId}
          >
            <option value="">Todas las categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        onClick={onClear}
        type="button"
      >
        Limpiar filtros
      </button>
    </div>
  );
}
