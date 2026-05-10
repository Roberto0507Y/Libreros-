import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';

import { EmptyState } from '../components/subcategories/EmptyState';
import { LoadingSkeleton } from '../components/subcategories/LoadingSkeleton';
import { SubcategoryCard } from '../components/subcategories/SubcategoryCard';
import { SubcategoryFilters } from '../components/subcategories/SubcategoryFilters';
import { SubcategoryForm } from '../components/subcategories/SubcategoryForm';
import { SubcategoryStats } from '../components/subcategories/SubcategoryStats';
import type { CatalogOption, SubcategoryOption } from '../domain/types';

type SubcategoriesPageProps = {
  categories: CatalogOption[];
  isLoading: boolean;
  isSaving: boolean;
  onCreate: (input: { name: string; categoryId: number }) => Promise<void>;
  subcategories: SubcategoryOption[];
};

export function SubcategoriesPage({
  categories,
  isLoading,
  isSaving,
  onCreate,
  subcategories,
}: SubcategoriesPageProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('activa');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilterId, setCategoryFilterId] = useState('');
  const [localMessage, setLocalMessage] = useState('');

  const categoriesUsedCount = useMemo(() => {
    return new Set(subcategories.map((subcategory) => subcategory.categoryId)).size;
  }, [subcategories]);

  const latestSubcategoryName = useMemo(() => {
    if (!subcategories.length) return '';
    return subcategories[subcategories.length - 1]?.nombre ?? '';
  }, [subcategories]);

  const visibleSubcategories = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return subcategories.filter((subcategory) => {
      const categoryName =
        categories.find((category) => category.id === subcategory.categoryId)?.nombre ?? '';
      const matchesQuery = !normalizedQuery
        ? true
        : [subcategory.nombre, categoryName].join(' ').toLowerCase().includes(normalizedQuery);
      const matchesCategory = !categoryFilterId
        ? true
        : subcategory.categoryId === Number(categoryFilterId);

      return matchesQuery && matchesCategory;
    });
  }, [categories, categoryFilterId, searchQuery, subcategories]);

  const resetForm = () => {
    setName('');
    setCategoryId('');
    setStatus('activa');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalMessage('');
    await onCreate({ name, categoryId: Number(categoryId) });
    resetForm();
    setActiveTab('list');
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleCategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setCategoryId(event.target.value);
  };

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setStatus(event.target.value);
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleCategoryFilterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilterId(event.target.value);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilterId('');
  };

  const handleUnavailableAction = (action: 'edit' | 'delete', subcategory: SubcategoryOption) => {
    if (action === 'delete') {
      const confirmed = window.confirm(
        `¿Deseas eliminar ${subcategory.nombre}? La accion no continuara porque todavia no hay endpoint conectado para subcategorias.`,
      );
      if (!confirmed) return;
    }

    setLocalMessage(
      action === 'edit'
        ? 'La interfaz de edicion queda preparada, pero la actualizacion de subcategorias aun no esta conectada en el backend.'
        : 'La confirmacion de eliminacion ya existe, pero la eliminacion aun no esta conectada en el backend.',
    );
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:px-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
          Catalogo de subcategorias
        </p>
        <h2 className="m-0 text-2xl font-bold text-slate-900">Administra tus subcategorias</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Organiza mejor tus productos con una vista mas clara de subcategorias, relaciones con categorias y acceso rapido a filtros.
        </p>

        <div className="mt-6">
          <SubcategoryStats
            categoryCount={categoriesUsedCount}
            latestName={latestSubcategoryName}
            total={subcategories.length}
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-[0_16px_28px_rgba(37,99,235,0.22)]'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => setActiveTab('list')}
            type="button"
          >
            Subcategorias creadas
          </button>
          <button
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white shadow-[0_16px_28px_rgba(37,99,235,0.22)]'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => {
              resetForm();
              setActiveTab('create');
            }}
            type="button"
          >
            Crear subcategoria
          </button>
        </div>
      </section>

      {localMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          {localMessage}
        </div>
      ) : null}

      {activeTab === 'create' ? (
        <section className="grid gap-6 xl:grid-cols-[460px_minmax(0,1fr)]">
          <SubcategoryForm
            categories={categories}
            categoryId={categoryId}
            isSaving={isSaving}
            name={name}
            onCategoryChange={handleCategoryChange}
            onNameChange={handleNameChange}
            onStatusChange={handleStatusChange}
            onSubmit={handleSubmit}
            status={status}
          />

          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
            <div className="grid h-full place-items-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <div className="max-w-lg">
                <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-[0_18px_30px_rgba(37,99,235,0.22)]">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M4 7.5 12 3l8 4.5m-16 0 8 4.5m-8-4.5V16.5L12 21m8-13.5V16.5L12 21m0-9V21"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </span>
                <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
                  Vista previa
                </p>
                <h3 className="mt-3 text-2xl font-bold text-slate-900">
                  Prepara una subcategoria clara y ordenada
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  Usa nombres especificos y asocialos a su categoria correcta para mantener un catalogo profesional y facil de explorar.
                </p>

                <div className="mt-8 rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200">
                    {categoryId
                      ? categories.find((category) => category.id === Number(categoryId))?.nombre ?? 'Categoria'
                      : 'Categoria padre'}
                  </span>
                  <h4 className="mt-4 text-lg font-bold text-slate-900">
                    {name.trim() || 'Nombre de la subcategoria'}
                  </h4>
                  <p className="mt-3 text-sm text-slate-500">
                    Estado visual: {status === 'activa' ? 'Activa' : 'Inactiva'}
                  </p>
                </div>
              </div>
            </div>
          </article>
        </section>
      ) : (
        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
                Subcategorias registradas
              </p>
              <h3 className="text-xl font-bold text-slate-900">Listado de subcategorias</h3>
              <p className="mt-2 text-sm text-slate-500">
                Explora rapidamente las subcategorias y filtralas por categoria padre.
              </p>
            </div>

            <div className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              {visibleSubcategories.length} {visibleSubcategories.length === 1 ? 'resultado' : 'resultados'}
            </div>
          </div>

          <SubcategoryFilters
            categories={categories}
            categoryFilterId={categoryFilterId}
            onCategoryFilterChange={handleCategoryFilterChange}
            onClear={handleClearFilters}
            onSearchChange={handleSearchChange}
            searchQuery={searchQuery}
          />

          <div className="mt-6">
            {isLoading ? <LoadingSkeleton /> : null}

            {!isLoading && visibleSubcategories.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleSubcategories.map((subcategory) => (
                  <SubcategoryCard
                    categoryName={
                      categories.find((category) => category.id === subcategory.categoryId)?.nombre ??
                      'Categoria'
                    }
                    key={subcategory.id}
                    onDelete={(item) => handleUnavailableAction('delete', item)}
                    onEdit={(item) => handleUnavailableAction('edit', item)}
                    subcategory={subcategory}
                  />
                ))}
              </div>
            ) : null}

            {!isLoading && !visibleSubcategories.length ? (
              <EmptyState
                description="Prueba con otra busqueda o registra una nueva subcategoria para comenzar."
                title="No hay subcategorias para este filtro."
              />
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
