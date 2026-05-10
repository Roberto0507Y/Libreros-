import type { ChangeEvent } from 'react';

import type { CatalogOption } from '../../domain/types';
import type { StockStatus } from './StockBadge';

type InventoryFiltersProps = {
  brandFilter: string;
  brands: CatalogOption[];
  categoryFilter: string;
  categories: CatalogOption[];
  onBrandChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onCategoryChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onClear: () => void;
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onStatusChange: (value: '' | StockStatus) => void;
  onToggleAlerts: () => void;
  searchQuery: string;
  showOnlyAlerts: boolean;
  statusFilter: '' | StockStatus;
  viewMode: 'cards' | 'table';
  onViewModeChange: (mode: 'cards' | 'table') => void;
};

export function InventoryFilters({
  brandFilter,
  brands,
  categoryFilter,
  categories,
  onBrandChange,
  onCategoryChange,
  onClear,
  onSearchChange,
  onStatusChange,
  onToggleAlerts,
  searchQuery,
  showOnlyAlerts,
  statusFilter,
  viewMode,
  onViewModeChange,
}: InventoryFiltersProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_220px_220px]">
        <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-1.5">
          <label className="flex items-center gap-3 rounded-[18px] bg-white px-4 py-3 shadow-sm" htmlFor="inventory-search">
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
              id="inventory-search"
              onChange={onSearchChange}
              placeholder="Buscar por nombre, categoria o marca..."
              type="search"
              value={searchQuery}
            />
          </label>
        </div>

        <select
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          onChange={onCategoryChange}
          value={categoryFilter}
        >
          <option value="">Todas las categorias</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nombre}
            </option>
          ))}
        </select>

        <select
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          onChange={onBrandChange}
          value={brandFilter}
        >
          <option value="">Todas las marcas</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.nombre}
            </option>
          ))}
        </select>

        <select
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          onChange={(event) => onStatusChange(event.target.value as '' | StockStatus)}
          value={statusFilter}
        >
          <option value="">Todos los estados</option>
          <option value="in-stock">En stock</option>
          <option value="low">Stock bajo</option>
          <option value="out">Agotado</option>
        </select>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              showOnlyAlerts
                ? 'bg-amber-500 text-slate-950 shadow-[0_16px_28px_rgba(245,158,11,0.22)]'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            onClick={onToggleAlerts}
            type="button"
          >
            Ver solo alertas
          </button>

          <button
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={onClear}
            type="button"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              viewMode === 'table'
                ? 'bg-blue-600 text-white shadow-[0_16px_28px_rgba(37,99,235,0.22)]'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => onViewModeChange('table')}
            type="button"
          >
            Vista tabla
          </button>
          <button
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              viewMode === 'cards'
                ? 'bg-blue-600 text-white shadow-[0_16px_28px_rgba(37,99,235,0.22)]'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => onViewModeChange('cards')}
            type="button"
          >
            Vista cards
          </button>
        </div>
      </div>
    </div>
  );
}
