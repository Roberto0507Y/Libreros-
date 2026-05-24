import type { ChangeEvent, FormEvent } from 'react';

import type { CatalogOption } from '../../domain/types';

type SubcategoryFormProps = {
  categories: CatalogOption[];
  categoryId: string;
  formId?: string;
  isSaving: boolean;
  name: string;
  onCategoryChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  status: string;
  onStatusChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  showSubmit?: boolean;
};

export function SubcategoryForm({
  categories,
  categoryId,
  formId,
  isSaving,
  name,
  onCategoryChange,
  onNameChange,
  onStatusChange,
  onSubmit,
  status,
  showSubmit = true,
}: SubcategoryFormProps) {
  const hasNameError = !name.trim();
  const hasCategoryError = !categoryId;

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
      <div className="mb-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
          Nueva subcategoria
        </p>
        <h3 className="text-xl font-bold text-slate-900">Crear subcategoria</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Define el nombre, relaciona la categoria padre y deja lista la subcategoria para usarla en productos.
        </p>
      </div>

      <form className="grid gap-5" id={formId} onSubmit={onSubmit}>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Nombre de la subcategoria
          <input
            className={`rounded-2xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-4 ${
              hasNameError
                ? 'border-rose-200 focus:border-rose-300 focus:ring-rose-100'
                : 'border-slate-200 focus:border-blue-400 focus:ring-blue-100'
            }`}
            onChange={onNameChange}
            placeholder="Ej. Calculadoras cientificas"
            required
            type="text"
            value={name}
          />
          {hasNameError ? (
            <span className="text-xs font-medium text-rose-600">El nombre es obligatorio.</span>
          ) : null}
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Categoria padre
          <select
            className={`rounded-2xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-4 ${
              hasCategoryError
                ? 'border-rose-200 focus:border-rose-300 focus:ring-rose-100'
                : 'border-slate-200 focus:border-blue-400 focus:ring-blue-100'
            }`}
            onChange={onCategoryChange}
            required
            value={categoryId}
          >
            <option value="">Selecciona una categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nombre}
              </option>
            ))}
          </select>
          {hasCategoryError ? (
            <span className="text-xs font-medium text-rose-600">La categoria es obligatoria.</span>
          ) : null}
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Estado
          <select
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            onChange={onStatusChange}
            value={status}
          >
            <option value="activa">Activa</option>
            <option value="inactiva">Inactiva</option>
          </select>
        </label>

        {showSubmit ? (
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSaving || hasNameError || hasCategoryError}
            type="submit"
          >
            {isSaving ? 'GUARDANDO SUBCATEGORIA...' : 'GUARDAR SUBCATEGORIA'}
          </button>
        ) : null}
      </form>
    </section>
  );
}
