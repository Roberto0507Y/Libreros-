import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';

import { API_URL } from '../api/client';
import { EditSheetModal } from '../components/ui/EditSheetModal';
import type { CatalogOption } from '../domain/types';

type CategoriesPageProps = {
  categories: CatalogOption[];
  isDeleting: boolean;
  isSaving: boolean;
  onCreate: (input: { name: string; image: string }) => Promise<void>;
  onDelete: (categoryId: number) => Promise<void>;
  onUpdate: (input: { categoryId: number; name: string; image?: string }) => Promise<void>;
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });

export function CategoriesPage({
  categories,
  isDeleting,
  isSaving,
  onCreate,
  onDelete,
  onUpdate,
}: CategoriesPageProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState('');

  const visibleCategories = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return categories;

    return categories.filter((category) => category.nombre.toLowerCase().includes(normalizedQuery));
  }, [categories, searchQuery]);

  const resolveImageSrc = (value?: string | null) => {
    if (!value) return '';
    if (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    return `${API_URL}${value}`;
  };

  const resetForm = () => {
    setName('');
    setImage('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onCreate({ name, image });

    setActiveTab('list');
    resetForm();
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setImage('');
      return;
    }

    setImage(await readFileAsDataUrl(file));
  };

  const handleEditCategory = (category: CatalogOption) => {
    setEditingCategoryId(category.id);
    setEditName(category.nombre);
    setEditImage(category.imagen ?? '');
  };

  const closeEditModal = () => {
    setEditingCategoryId(null);
    setEditName('');
    setEditImage('');
  };

  const handleEditImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setEditImage('');
      return;
    }

    setEditImage(await readFileAsDataUrl(file));
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCategoryId) return;

    await onUpdate({ categoryId: editingCategoryId, name: editName, image: editImage || undefined });
    closeEditModal();
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:px-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
          Catalogo de categorias
        </p>
        <h2 className="m-0 text-2xl font-bold text-slate-900">Administra tus categorias</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Consulta las categorias creadas y usa el boton Crear categoria para abrir la pestaña del formulario.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-[0_16px_28px_rgba(37,99,235,0.22)]'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => setActiveTab('list')}
            type="button"
          >
            Categorias creadas
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
            Crear categoria
          </button>
        </div>
      </section>

      {activeTab === 'create' ? (
        <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
          <div className="mb-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
              Nueva categoria
            </p>
            <h3 className="text-xl font-bold text-slate-900">
              Agregar categoria
            </h3>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Nombre de la categoria
              <input
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Escolar"
                required
                type="text"
                value={name}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Imagen de la categoria
              <input
                accept="image/png,image/jpeg,image/webp"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                onChange={(event) => void handleImageChange(event)}
                required={!editingCategoryId && !image}
                type="file"
              />
            </label>

            {image ? (
              <div className="grid h-40 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <img
                  alt="Vista previa de categoria"
                  className="max-h-full w-full object-contain"
                  src={resolveImageSrc(image)}
                />
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? 'GUARDANDO CATEGORIA...' : 'CREAR CATEGORIA'}
              </button>
            </div>
          </form>
          </article>

          <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
            <div className="grid h-full place-items-center rounded-[22px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
                  Vista previa
                </p>
                <h3 className="mt-3 text-xl font-bold text-slate-900">
                  {editingCategoryId ? 'Actualiza tu categoria' : 'Crea una nueva categoria'}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                  Agrega una imagen representativa y un nombre claro para mejorar la organización visual del catálogo.
                </p>
                {image ? (
                  <div className="mx-auto mt-6 grid h-52 max-w-sm place-items-center overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5">
                    <img
                      alt="Vista previa de categoria"
                      className="max-h-full w-full object-contain"
                      src={resolveImageSrc(image)}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        </section>
      ) : (
        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
                Categorias registradas
              </p>
              <h3 className="text-xl font-bold text-slate-900">Listado de categorias</h3>
            </div>

            <div className="w-full lg:max-w-sm">
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar categoria..."
                type="search"
                value={searchQuery}
              />
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
            {visibleCategories.map((category) => (
              <div
                className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(15,23,42,0.06)]"
                key={category.id}
              >
                <div className="grid aspect-[16/8] place-items-center overflow-hidden rounded-[20px] bg-white p-3">
                  {category.imagen ? (
                    <img
                      alt={category.nombre}
                      className="h-full w-full object-cover"
                      src={resolveImageSrc(category.imagen)}
                    />
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Sin imagen
                    </span>
                  )}
                </div>
                <div className="mt-4 text-[1.1rem] font-semibold text-slate-900">{category.nombre}</div>
                <div className="mt-1 text-xs text-slate-500">ID: {category.id}</div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                    onClick={() => handleEditCategory(category)}
                    type="button"
                  >
                    Editar
                  </button>
                  <button
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isDeleting}
                    onClick={() => void onDelete(category.id)}
                    type="button"
                  >
                    {isDeleting ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {!visibleCategories.length ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
              <strong className="block text-slate-900">No hay categorias para este filtro.</strong>
              <span className="mt-2 block text-sm text-slate-500">
                Prueba con otro nombre o crea una nueva categoria.
              </span>
            </div>
          ) : null}
        </section>
      )}

      <EditSheetModal
        isOpen={editingCategoryId !== null}
        onClose={closeEditModal}
        subtitle="Actualiza el nombre y la imagen sin salir del listado de categorias."
        title="Editar categoria"
        widthClassName="max-w-3xl"
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={closeEditModal}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving || !editName.trim()}
              form="edit-category-form"
              type="submit"
            >
              {isSaving ? 'GUARDANDO CAMBIOS...' : 'GUARDAR CAMBIOS'}
            </button>
          </div>
        }
      >
        <form className="grid gap-5 md:grid-cols-[minmax(0,1fr)_320px]" id="edit-category-form" onSubmit={handleEditSubmit}>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Nombre de la categoria
              <input
                autoFocus
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                onChange={(event) => setEditName(event.target.value)}
                placeholder="Ej. Escolar"
                required
                type="text"
                value={editName}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Imagen de la categoria
              <input
                accept="image/png,image/jpeg,image/webp"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                onChange={(event) => void handleEditImageChange(event)}
                type="file"
              />
            </label>
          </div>

          <div className="grid place-items-center rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-5">
            {editImage ? (
              <img
                alt="Vista previa de categoria"
                className="max-h-56 w-full object-contain"
                src={resolveImageSrc(editImage)}
              />
            ) : (
              <span className="text-sm font-medium text-slate-400">Sin imagen seleccionada</span>
            )}
          </div>
        </form>
      </EditSheetModal>
    </div>
  );
}
