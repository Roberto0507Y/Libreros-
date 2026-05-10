import { useMemo, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';

import { API_URL } from '../api/client';
import { BrandCard } from '../components/brands/BrandCard';
import { BrandFilters } from '../components/brands/BrandFilters';
import { BrandForm } from '../components/brands/BrandForm';
import { BrandStats } from '../components/brands/BrandStats';
import { EmptyState } from '../components/brands/EmptyState';
import { ImagePreview } from '../components/brands/ImagePreview';
import { LoadingSkeleton } from '../components/brands/LoadingSkeleton';
import type { CatalogOption } from '../domain/types';

type BrandsPageProps = {
  brands: CatalogOption[];
  isDeleting: boolean;
  isLoading: boolean;
  isSaving: boolean;
  onCreate: (input: { name: string; image: string }) => Promise<void>;
  onDelete: (brandId: number) => Promise<void>;
  onUpdate: (input: { brandId: number; name: string; image?: string }) => Promise<void>;
};

type ImageFilter = 'all' | 'with-image' | 'without-image';

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });

const isAllowedImage = (file: File) =>
  ['image/png', 'image/jpeg', 'image/webp'].includes(file.type);

export function BrandsPage({
  brands,
  isDeleting,
  isLoading,
  isSaving,
  onCreate,
  onDelete,
  onUpdate,
}: BrandsPageProps) {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [imageFilter, setImageFilter] = useState<ImageFilter>('all');
  const [isDragActive, setIsDragActive] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editDragActive, setEditDragActive] = useState(false);
  const [localMessage, setLocalMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(
    null,
  );

  const withImageCount = brands.filter((brand) => Boolean(brand.imagen)).length;
  const withoutImageCount = brands.length - withImageCount;

  const visibleBrands = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return brands.filter((brand) => {
      const matchesQuery = !normalizedQuery
        ? true
        : brand.nombre.toLowerCase().includes(normalizedQuery);

      const matchesFilter =
        imageFilter === 'all'
          ? true
          : imageFilter === 'with-image'
            ? Boolean(brand.imagen)
            : !brand.imagen;

      return matchesQuery && matchesFilter;
    });
  }, [brands, imageFilter, searchQuery]);

  const resolveImageSrc = (value?: string | null) => {
    if (!value) return '';
    if (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    return `${API_URL}${value}`;
  };

  const consumeFile = async (file: File | null, target: 'create' | 'edit') => {
    if (!file) {
      if (target === 'create') {
        setImage('');
      } else {
        setEditImage('');
      }
      return;
    }

    if (!isAllowedImage(file)) {
      setLocalMessage({
        tone: 'error',
        text: 'Solo se permiten imagenes JPG, PNG o WEBP.',
      });
      return;
    }

    const nextImage = await readFileAsDataUrl(file);
    setLocalMessage(null);

    if (target === 'create') {
      setImage(nextImage);
    } else {
      setEditImage(nextImage);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onCreate({ name, image });
    setName('');
    setImage('');
    setLocalMessage({
      tone: 'success',
      text: 'Marca creada correctamente.',
    });
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await consumeFile(event.target.files?.[0] ?? null, 'create');
  };

  const handleEditImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await consumeFile(event.target.files?.[0] ?? null, 'edit');
  };

  const startEditing = (brand: CatalogOption) => {
    setEditingBrandId(brand.id);
    setEditName(brand.nombre);
    setEditImage('');
    setLocalMessage(null);
  };

  const cancelEditing = () => {
    setEditingBrandId(null);
    setEditName('');
    setEditImage('');
    setEditDragActive(false);
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingBrandId) return;

    await onUpdate({
      brandId: editingBrandId,
      name: editName,
      image: editImage || undefined,
    });

    setLocalMessage({
      tone: 'success',
      text: 'Marca actualizada correctamente.',
    });
    cancelEditing();
  };

  const handleDelete = async (brand: CatalogOption) => {
    const confirmed = window.confirm(`¿Deseas eliminar la marca ${brand.nombre}?`);
    if (!confirmed) return;

    await onDelete(brand.id);
    setLocalMessage({
      tone: 'success',
      text: 'Marca eliminada correctamente.',
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setImageFilter('all');
  };

  const handleCreateDrop = async (file: File | null) => {
    setIsDragActive(false);
    await consumeFile(file, 'create');
  };

  const handleEditDropFile = async (file: File | null) => {
    setEditDragActive(false);
    await consumeFile(file, 'edit');
  };

  const handleEditDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handleEditDropEvent = async (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    await handleEditDropFile(event.dataTransfer.files?.[0] ?? null);
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:px-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
          Catalogo de marcas
        </p>
        <h2 className="m-0 text-2xl font-bold text-slate-900">Crea y administra tus marcas</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Gestiona tus marcas con una ficha visual mas ordenada, logos consistentes y filtros rapidos para mantener el catalogo profesional.
        </p>

        <div className="mt-6">
          <BrandStats
            total={brands.length}
            withImageCount={withImageCount}
            withoutImageCount={withoutImageCount}
          />
        </div>
      </section>

      {localMessage ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-medium ${
            localMessage.tone === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {localMessage.text}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        <BrandForm
          image={image}
          isDragActive={isDragActive}
          isSaving={isSaving}
          name={name}
          onDropFile={(file) => void handleCreateDrop(file)}
          onDragStateChange={setIsDragActive}
          onImageChange={(event) => void handleImageChange(event)}
          onNameChange={handleNameChange}
          onSubmit={handleSubmit}
        />

        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
                Marcas registradas
              </p>
              <h3 className="text-xl font-bold text-slate-900">Listado de marcas</h3>
              <p className="mt-2 text-sm text-slate-500">
                Filtra por nombre o por disponibilidad de imagen para encontrar cada marca mas rapido.
              </p>
            </div>

            <div className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              {visibleBrands.length} {visibleBrands.length === 1 ? 'resultado' : 'resultados'}
            </div>
          </div>

          <BrandFilters
            imageFilter={imageFilter}
            onClear={handleClearFilters}
            onFilterChange={setImageFilter}
            onSearchChange={handleSearchChange}
            searchQuery={searchQuery}
          />

          <div className="mt-6">
            {isLoading ? <LoadingSkeleton /> : null}

            {!isLoading && visibleBrands.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleBrands.map((brand) => (
                  <BrandCard
                    brand={brand}
                    imageSrc={resolveImageSrc(brand.imagen)}
                    isDeleting={isDeleting}
                    key={brand.id}
                    onDelete={(item) => void handleDelete(item)}
                    onEdit={startEditing}
                  />
                ))}
              </div>
            ) : null}

            {!isLoading && !visibleBrands.length ? (
              <EmptyState
                description={
                  brands.length
                    ? 'Prueba con otra busqueda o limpia los filtros para ver mas resultados.'
                    : 'Aun no has registrado marcas. Crea la primera desde el formulario.'
                }
                title={
                  brands.length ? 'No hay marcas para este filtro.' : 'Todavia no existen marcas registradas.'
                }
              />
            ) : null}
          </div>
        </article>
      </section>

      {editingBrandId ? (
        <div aria-modal="true" className="auth-modal" role="dialog">
          <div className="auth-modal-card">
            <div className="auth-modal-head">
              <div>
                <strong>Editar marca</strong>
                <span>Actualiza nombre y logo de la marca</span>
              </div>
              <button className="auth-close" onClick={cancelEditing} type="button">
                Cerrar
              </button>
            </div>

            <form className="grid gap-5" onSubmit={handleEditSubmit}>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Nombre de la marca
                <input
                  className={`rounded-2xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-4 ${
                    !editName.trim()
                      ? 'border-rose-200 focus:border-rose-300 focus:ring-rose-100'
                      : 'border-slate-200 focus:border-blue-400 focus:ring-blue-100'
                  }`}
                  onChange={(event) => setEditName(event.target.value)}
                  required
                  type="text"
                  value={editName}
                />
              </label>

              <div className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Nueva imagen (opcional)</span>
                <label
                  className={`grid cursor-pointer gap-3 rounded-[24px] border-2 border-dashed px-5 py-6 text-center transition ${
                    editDragActive
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40'
                  }`}
                  onDragEnter={() => setEditDragActive(true)}
                  onDragLeave={() => setEditDragActive(false)}
                  onDragOver={handleEditDragOver}
                  onDrop={(event) => void handleEditDropEvent(event)}
                >
                  <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M12 16V4m0 0-4 4m4-4 4 4M4 16.5v.75A1.75 1.75 0 0 0 5.75 19h12.5A1.75 1.75 0 0 0 20 17.25v-.75"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </span>
                  <div>
                    <strong className="block text-sm text-slate-800">Arrastra aqui el logo o haz clic para reemplazarlo</strong>
                    <span className="mt-2 block text-xs leading-5 text-slate-500">
                      Formatos permitidos: JPG, PNG, WEBP.
                    </span>
                  </div>
                  <input
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(event) => void handleEditImageChange(event)}
                    type="file"
                  />
                </label>
              </div>

              <ImagePreview image={editImage} label="Vista previa nueva" name={editName} />

              <button
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSaving || !editName.trim()}
                type="submit"
              >
                {isSaving ? 'GUARDANDO CAMBIOS...' : 'ACTUALIZAR MARCA'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
