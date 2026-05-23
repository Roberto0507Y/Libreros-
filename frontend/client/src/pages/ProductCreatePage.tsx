import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';

import { EditSheetModal } from '../components/ui/EditSheetModal';
import type { CatalogOption, ProductItem, SubcategoryOption } from '../domain/types';
import { currency } from '../lib/format';

type ProductCreatePageProps = {
  brands: CatalogOption[];
  categories: CatalogOption[];
  initialProductId?: number | null;
  onConsumeInitialProductId?: () => void;
  isDeleting: boolean;
  isSaving: boolean;
  onCreate: (input: {
    name: string;
    description: string;
    brandId: number | null;
    subcategoryId: number;
    purchasePrice: number;
    salePrice: number;
    initialStock: number;
    primaryImage: string;
    secondaryImage: string;
  }) => Promise<void>;
  onDelete: (productId: number) => Promise<void>;
  onUpdate: (
    productId: number,
    input: {
      name: string;
      description: string;
      brandId: number | null;
      subcategoryId: number;
      purchasePrice: number;
      salePrice: number;
      initialStock: number;
      primaryImage: string;
      secondaryImage: string;
    },
  ) => Promise<void>;
  products: ProductItem[];
  subcategories: SubcategoryOption[];
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });

export function ProductCreatePage({
  brands,
  categories,
  initialProductId,
  onConsumeInitialProductId,
  isDeleting,
  isSaving,
  onCreate,
  onDelete,
  onUpdate,
  products,
  subcategories,
}: ProductCreatePageProps) {
  const PRODUCTS_PER_PAGE = 12;
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    brandId: '',
    categoryId: '',
    subcategoryId: '',
    purchasePrice: '',
    salePrice: '',
    initialStock: '',
    primaryImage: '',
    secondaryImage: '',
  });
  const [activeImage, setActiveImage] = useState<'primaryImage' | 'secondaryImage'>('primaryImage');
  const [imageNames, setImageNames] = useState({
    primaryImage: '',
    secondaryImage: '',
  });

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'categoryId' ? { subcategoryId: '' } : {}),
    }));
  };

  const handleImageChange = async (
    event: ChangeEvent<HTMLInputElement>,
    field: 'primaryImage' | 'secondaryImage',
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      setForm((current) => ({ ...current, [field]: '' }));
      setImageNames((current) => ({ ...current, [field]: '' }));
      return;
    }

    const imageData = await readFileAsDataUrl(file);
    setForm((current) => ({ ...current, [field]: imageData }));
    setImageNames((current) => ({ ...current, [field]: file.name }));
    setActiveImage(field);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      name: form.name,
      description: form.description,
      brandId: form.brandId ? Number(form.brandId) : null,
      subcategoryId: Number(form.subcategoryId),
      purchasePrice: Number(form.purchasePrice),
      salePrice: Number(form.salePrice),
      initialStock: Number(form.initialStock || 0),
      primaryImage: form.primaryImage,
      secondaryImage: form.secondaryImage,
    };

    await onCreate(payload);

    setForm({
      name: '',
      description: '',
      brandId: '',
      categoryId: '',
      subcategoryId: '',
      purchasePrice: '',
      salePrice: '',
      initialStock: '',
      primaryImage: '',
      secondaryImage: '',
    });
    setEditingProductId(null);
    setActiveImage('primaryImage');
    setImageNames({
      primaryImage: '',
      secondaryImage: '',
    });
    setActiveTab('list');
  };

  const closeEditModal = () => {
    setEditingProductId(null);
    setForm({
      name: '',
      description: '',
      brandId: '',
      categoryId: '',
      subcategoryId: '',
      purchasePrice: '',
      salePrice: '',
      initialStock: '',
      primaryImage: '',
      secondaryImage: '',
    });
    setActiveImage('primaryImage');
    setImageNames({
      primaryImage: '',
      secondaryImage: '',
    });
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProductId) return;

    await onUpdate(editingProductId, {
      name: form.name,
      description: form.description,
      brandId: form.brandId ? Number(form.brandId) : null,
      subcategoryId: Number(form.subcategoryId),
      purchasePrice: Number(form.purchasePrice),
      salePrice: Number(form.salePrice),
      initialStock: Number(form.initialStock || 0),
      primaryImage: form.primaryImage,
      secondaryImage: form.secondaryImage,
    });
    closeEditModal();
  };

  const handleEditProduct = (product: ProductItem) => {
    setEditingProductId(product.id);
    setForm({
      name: product.nombre,
      description: product.descripcion ?? '',
      brandId: product.brandId ? String(product.brandId) : '',
      categoryId: String(product.categoryId),
      subcategoryId: String(product.subcategoryId),
      purchasePrice: String(product.purchasePrice),
      salePrice: String(product.salePrice),
      initialStock: String(product.stock),
      primaryImage: product.primaryImage ?? '',
      secondaryImage: product.secondaryImage ?? '',
    });
    setActiveImage('primaryImage');
    setImageNames({
      primaryImage: product.primaryImage ? 'Imagen principal actual' : '',
      secondaryImage: product.secondaryImage ? 'Imagen secundaria actual' : '',
    });
  };

  const handleDeleteProduct = async (productId: number) => {
    await onDelete(productId);
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      brandId: '',
      categoryId: '',
      subcategoryId: '',
      purchasePrice: '',
      salePrice: '',
      initialStock: '',
      primaryImage: '',
      secondaryImage: '',
    });
    setActiveImage('primaryImage');
    setImageNames({
      primaryImage: '',
      secondaryImage: '',
    });
  };

  const visibleProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return products;

    return products.filter((product) =>
      [product.nombre, product.brandName, product.categoryName, product.subcategoryName]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [products, searchQuery]);
  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = visibleProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE,
  );

  const selectedBrand = brands.find((brand) => String(brand.id) === form.brandId)?.nombre ?? 'Marca';
  const selectedCategory =
    categories.find((category) => String(category.id) === form.categoryId)?.nombre ?? 'Categoria';
  const filteredSubcategories = form.categoryId
    ? subcategories.filter((subcategory) => String(subcategory.categoryId) === form.categoryId)
    : subcategories;
  const selectedSubcategory =
    subcategories.find((subcategory) => String(subcategory.id) === form.subcategoryId)?.nombre ??
    'Subcategoria';
  const gallery = [
    { id: 'primaryImage' as const, label: 'Foto 1', src: form.primaryImage },
    { id: 'secondaryImage' as const, label: 'Foto 2', src: form.secondaryImage },
  ];
  const currentImage =
    gallery.find((image) => image.id === activeImage)?.src || form.primaryImage || form.secondaryImage;
  const detailLines = form.description
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  useEffect(() => {
    if (!initialProductId) return;
    const product = products.find((item) => item.id === initialProductId);
    if (!product) return;
    if (editingProductId === product.id) return;
    handleEditProduct(product);
    onConsumeInitialProductId?.();
  }, [editingProductId, initialProductId, onConsumeInitialProductId, products]);

  return (
    <div className="grid gap-6">
      <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:px-6">
        <div className="mb-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
            Productos
          </p>
          <h2 className="m-0 text-2xl font-bold text-slate-900">Administra tus productos</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Consulta los productos creados y usa el boton Crear producto para abrir la pestaña del formulario.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-[0_16px_28px_rgba(37,99,235,0.22)]'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => {
              setActiveTab('list');
              setCurrentPage(1);
            }}
            type="button"
          >
            Productos creados
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
            Crear producto
          </button>
        </div>
      </section>

      {activeTab === 'list' ? (
        <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:px-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
                Productos registrados
              </p>
              <h3 className="text-xl font-bold text-slate-900">Listado de productos</h3>
            </div>

            <div className="w-full md:max-w-sm">
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar producto, marca o categoria..."
                type="search"
                value={searchQuery}
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {paginatedProducts.map((product) => (
              <article
                className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
                key={product.id}
              >
                <div className="grid h-56 place-items-center border-b border-slate-100 bg-slate-50 p-5">
                  {product.primaryImage ? (
                    <img
                      alt={product.nombre}
                      className="max-h-full w-full object-contain"
                      src={product.primaryImage}
                    />
                  ) : (
                    <span className="text-sm font-medium text-slate-400">Sin imagen</span>
                  )}
                </div>

                <div className="grid gap-3 px-5 py-5">
                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <span>{product.brandName}</span>
                    <span>•</span>
                    <span>{product.categoryName}</span>
                  </div>

                  <strong className="min-h-[84px] text-[1.05rem] font-bold leading-7 text-slate-900">
                    {product.nombre}
                  </strong>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-lg font-bold text-blue-900">
                      {currency.format(product.salePrice)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        product.stock > 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      Stock: {product.stock}
                    </span>
                  </div>

                  <div className="text-sm text-slate-500">{product.subcategoryName}</div>

                  <div className="mt-2 flex gap-2">
                    <button
                      className="flex-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                      onClick={() => handleEditProduct(product)}
                      type="button"
                    >
                      Editar
                    </button>
                    <button
                      className="flex-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isDeleting}
                      onClick={() => void handleDeleteProduct(product.id)}
                      type="button"
                    >
                      {isDeleting ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {visibleProducts.length > PRODUCTS_PER_PAGE ? (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                type="button"
              >
                Anterior
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  className={`h-10 min-w-10 rounded-2xl px-3 text-sm font-semibold transition ${
                    currentPage === page
                      ? 'bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)]'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => setCurrentPage(page)}
                  type="button"
                >
                  {page}
                </button>
              ))}

              <button
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                type="button"
              >
                Siguiente
              </button>
            </div>
          ) : null}

          {!visibleProducts.length ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
              <strong className="block text-slate-900">No hay productos para este filtro.</strong>
              <span className="mt-2 block text-sm text-slate-500">
                Usa la pestaña Crear producto para registrar uno nuevo.
              </span>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:px-8 md:py-8">
          <div className="mb-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
              {editingProductId ? 'Editar producto' : 'Nuevo producto'}
            </p>
            <h2 className="m-0 text-2xl font-bold text-slate-900">
              Crea una ficha completa del producto
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Sube dos fotos, agrega una descripcion detallada y define el precio para que el
              inventario quede presentado como una ficha real de catalogo.
            </p>
          </div>

          <form className="grid gap-8 2xl:grid-cols-[minmax(0,0.95fr)_minmax(520px,1fr)]" onSubmit={handleSubmit}>
            <div className="grid gap-6 rounded-[26px] border border-slate-200 bg-slate-50/80 p-5 md:p-6">
              <div className="grid gap-5 rounded-[22px] border border-slate-200 bg-white p-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600">
                    Imagenes
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">Fotos del producto</h3>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Foto principal
                    <span className="relative flex min-h-[92px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-blue-300 hover:bg-blue-50/40">
                      <input
                        accept="image/png,image/jpeg,image/webp"
                        className="absolute inset-0 cursor-pointer opacity-0"
                        onChange={(event) => void handleImageChange(event, 'primaryImage')}
                        required
                        type="file"
                      />
                      <span className="inline-flex shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)]">
                        Elegir archivo
                      </span>
                      <span className="min-w-0 truncate text-sm font-medium text-slate-500">
                        {imageNames.primaryImage || 'Selecciona una imagen PNG, JPG o WEBP'}
                      </span>
                    </span>
                  </label>

                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Foto secundaria
                    <span className="relative flex min-h-[92px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-blue-300 hover:bg-blue-50/40">
                      <input
                        accept="image/png,image/jpeg,image/webp"
                        className="absolute inset-0 cursor-pointer opacity-0"
                        onChange={(event) => void handleImageChange(event, 'secondaryImage')}
                        required
                        type="file"
                      />
                      <span className="inline-flex shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)]">
                        Elegir archivo
                      </span>
                      <span className="min-w-0 truncate text-sm font-medium text-slate-500">
                        {imageNames.secondaryImage || 'Selecciona una imagen PNG, JPG o WEBP'}
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid gap-5 rounded-[22px] border border-slate-200 bg-white p-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600">
                    Informacion general
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">Datos principales</h3>
                </div>

                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Nombre del producto
                  <input
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    name="name"
                    onChange={handleChange}
                    placeholder="Ej. Calculadora cientifica Casio FX-570LA Plus"
                    required
                    type="text"
                    value={form.name}
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Detalles del producto
                  <textarea
                    className="min-h-32 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 md:min-h-40"
                    name="description"
                    onChange={handleChange}
                    placeholder={'Escribe una linea por detalle.\nEj. 417 funciones\nBateria AAA\nIdeal para estudiantes'}
                    rows={7}
                    value={form.description}
                  />
                </label>
              </div>

              <div className="grid gap-5 rounded-[22px] border border-slate-200 bg-white p-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600">
                    Clasificacion
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">Marca y categoria</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Marca
                    <select
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      name="brandId"
                      onChange={handleChange}
                      value={form.brandId}
                    >
                      <option value="">Sin marca</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.nombre}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Categoria
                    <select
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      name="categoryId"
                      onChange={handleChange}
                      required
                      value={form.categoryId}
                    >
                      <option value="">Selecciona una categoria</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Subcategoria
                  <select
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    name="subcategoryId"
                    onChange={handleChange}
                    required
                    value={form.subcategoryId}
                  >
                    <option value="">
                      {form.categoryId ? 'Selecciona una subcategoria' : 'Primero selecciona una categoria'}
                    </option>
                    {filteredSubcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.nombre}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-5 rounded-[22px] border border-slate-200 bg-white p-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600">
                    Valores
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">Precios y stock</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Precio compra
                    <input
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      min="0"
                      name="purchasePrice"
                      onChange={handleChange}
                      required
                      step="0.01"
                      type="number"
                      value={form.purchasePrice}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Precio venta
                    <input
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      min="0"
                      name="salePrice"
                      onChange={handleChange}
                      required
                      step="0.01"
                      type="number"
                      value={form.salePrice}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Stock inicial
                    <input
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      min="0"
                      name="initialStock"
                      onChange={handleChange}
                      step="1"
                      type="number"
                      value={form.initialStock}
                    />
                  </label>
                </div>
              </div>

              <button
                className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? 'GUARDANDO PRODUCTO...' : 'CREAR PRODUCTO'}
              </button>
            </div>

            <aside className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-7">
              <div className="mb-4 text-xs text-slate-500">
                Inicio <span className="mx-1">→</span> {selectedBrand} <span className="mx-1">→</span>{' '}
                {selectedCategory} <span className="mx-1">→</span> {selectedSubcategory}
              </div>

              <h3 className="border-b border-slate-200 pb-4 text-[1.7rem] font-bold uppercase leading-tight text-blue-900">
                {form.name || 'NOMBRE DEL PRODUCTO'}
              </h3>

              <div className="mt-7 grid gap-7 xl:grid-cols-[72px_minmax(0,1fr)]">
                <div className="grid gap-3">
                  {gallery.map((image) => (
                    <button
                      className={`grid h-[72px] w-[56px] place-items-center overflow-hidden rounded-xl border bg-white transition ${
                        activeImage === image.id
                          ? 'border-blue-500 ring-2 ring-blue-100'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      key={image.id}
                      onClick={() => setActiveImage(image.id)}
                      type="button"
                    >
                      {image.src ? (
                        <img alt={image.label} className="h-full w-full object-cover" src={image.src} />
                      ) : (
                        <span className="px-2 text-center text-[11px] font-semibold text-slate-400">
                          {image.label}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="grid gap-6">
                  <div className="grid min-h-[420px] place-items-center rounded-[24px] border border-slate-200 bg-slate-50 p-8 lg:min-h-[520px]">
                    {currentImage ? (
                      <img
                        alt={form.name || 'Vista previa del producto'}
                        className="max-h-[430px] w-full object-contain"
                        src={currentImage}
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center text-sm font-medium text-slate-400">
                        Sube las dos fotos para ver la ficha del producto
                      </div>
                    )}
                  </div>

                  <div className="grid gap-6 rounded-[24px] border border-slate-200 bg-slate-50/70 p-6">
                    <div className="border-b border-slate-200 pb-3">
                      <div className="flex flex-wrap gap-5 text-xs font-semibold uppercase tracking-wide text-slate-700">
                        <span className="border-b-2 border-amber-400 pb-2 text-slate-900">Descripcion</span>
                        <span className="pb-2 text-slate-400">Detalles</span>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm leading-7 text-slate-700">
                      {detailLines.length ? (
                        <ul className="list-disc space-y-1 pl-5">
                          {detailLines.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>
                          Aqui se mostrara la descripcion detallada del producto, ideal para presentar
                          medidas, funciones, material o beneficios.
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 border-t border-blue-200 pt-5 md:grid-cols-[minmax(0,1fr)_170px]">
                      <div className="grid gap-3">
                        <div className="text-[2rem] font-bold text-slate-900">Q{form.salePrice || '0.00'}</div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                          En existencia
                        </div>
                        <div className="text-sm text-slate-500">Compra: Q{form.purchasePrice || '0.00'}</div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                        <div className="font-semibold text-slate-700">{selectedBrand}</div>
                        <div className="mt-2">Stock: {form.initialStock || '0'}</div>
                        <div className="mt-2">{selectedCategory}</div>
                        <div className="mt-2">{selectedSubcategory}</div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <button
                        className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white"
                        type="button"
                      >
                        Guardar en inventario
                      </button>
                      <button
                        className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
                        type="button"
                      >
                        Vista de ficha
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </form>
        </section>
      )}

      <EditSheetModal
        isOpen={editingProductId !== null}
        onClose={closeEditModal}
        subtitle="Actualiza la ficha del producto sin salir del listado principal."
        title="Editar producto"
        widthClassName="max-w-[1400px]"
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
              disabled={isSaving || !form.name.trim() || !form.categoryId || !form.subcategoryId}
              form="edit-product-form"
              type="submit"
            >
              {isSaving ? 'GUARDANDO CAMBIOS...' : 'GUARDAR CAMBIOS'}
            </button>
          </div>
        }
      >
        <form className="grid gap-8 2xl:grid-cols-[minmax(0,0.95fr)_minmax(520px,1fr)]" id="edit-product-form" onSubmit={handleEditSubmit}>
          <div className="grid gap-6 rounded-[26px] border border-slate-200 bg-slate-50/80 p-5 md:p-6">
            <div className="grid gap-5 rounded-[22px] border border-slate-200 bg-white p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600">
                  Imagenes
                </p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">Fotos del producto</h3>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Foto principal
                  <span className="relative flex min-h-[92px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-blue-300 hover:bg-blue-50/40">
                    <input
                      accept="image/png,image/jpeg,image/webp"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={(event) => void handleImageChange(event, 'primaryImage')}
                      type="file"
                    />
                    <span className="inline-flex shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)]">
                      Elegir archivo
                    </span>
                    <span className="min-w-0 truncate text-sm font-medium text-slate-500">
                      {imageNames.primaryImage || 'Selecciona una imagen PNG, JPG o WEBP'}
                    </span>
                  </span>
                </label>

                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Foto secundaria
                  <span className="relative flex min-h-[92px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-blue-300 hover:bg-blue-50/40">
                    <input
                      accept="image/png,image/jpeg,image/webp"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={(event) => void handleImageChange(event, 'secondaryImage')}
                      type="file"
                    />
                    <span className="inline-flex shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)]">
                      Elegir archivo
                    </span>
                    <span className="min-w-0 truncate text-sm font-medium text-slate-500">
                      {imageNames.secondaryImage || 'Selecciona una imagen PNG, JPG o WEBP'}
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="grid gap-5 rounded-[22px] border border-slate-200 bg-white p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600">
                  Informacion general
                </p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">Datos principales</h3>
              </div>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Nombre del producto
                <input
                  autoFocus
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  name="name"
                  onChange={handleChange}
                  placeholder="Ej. Calculadora cientifica Casio FX-570LA Plus"
                  required
                  type="text"
                  value={form.name}
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Detalles del producto
                <textarea
                  className="min-h-32 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 md:min-h-40"
                  name="description"
                  onChange={handleChange}
                  placeholder={'Escribe una linea por detalle.\nEj. 417 funciones\nBateria AAA\nIdeal para estudiantes'}
                  rows={7}
                  value={form.description}
                />
              </label>
            </div>

            <div className="grid gap-5 rounded-[22px] border border-slate-200 bg-white p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600">
                  Clasificacion
                </p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">Marca y categoria</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Marca
                  <select
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    name="brandId"
                    onChange={handleChange}
                    value={form.brandId}
                  >
                    <option value="">Sin marca</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Categoria
                  <select
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    name="categoryId"
                    onChange={handleChange}
                    required
                    value={form.categoryId}
                  >
                    <option value="">Selecciona una categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nombre}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Subcategoria
                <select
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  name="subcategoryId"
                  onChange={handleChange}
                  required
                  value={form.subcategoryId}
                >
                  <option value="">
                    {form.categoryId ? 'Selecciona una subcategoria' : 'Primero selecciona una categoria'}
                  </option>
                  {filteredSubcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-5 rounded-[22px] border border-slate-200 bg-white p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600">
                  Valores
                </p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">Precios y stock</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Precio compra
                  <input
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    min="0"
                    name="purchasePrice"
                    onChange={handleChange}
                    required
                    step="0.01"
                    type="number"
                    value={form.purchasePrice}
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Precio venta
                  <input
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    min="0"
                    name="salePrice"
                    onChange={handleChange}
                    required
                    step="0.01"
                    type="number"
                    value={form.salePrice}
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Stock inicial
                  <input
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    min="0"
                    name="initialStock"
                    onChange={handleChange}
                    step="1"
                    type="number"
                    value={form.initialStock}
                  />
                </label>
              </div>
            </div>
          </div>

          <aside className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-7">
            <div className="mb-4 text-xs text-slate-500">
              Inicio <span className="mx-1">→</span> {selectedBrand} <span className="mx-1">→</span>{' '}
              {selectedCategory} <span className="mx-1">→</span> {selectedSubcategory}
            </div>

            <h3 className="border-b border-slate-200 pb-4 text-[1.7rem] font-bold uppercase leading-tight text-blue-900">
              {form.name || 'NOMBRE DEL PRODUCTO'}
            </h3>

            <div className="mt-7 grid gap-7 xl:grid-cols-[72px_minmax(0,1fr)]">
              <div className="grid gap-3">
                {gallery.map((image) => (
                  <button
                    className={`grid h-[72px] w-[56px] place-items-center overflow-hidden rounded-xl border bg-white transition ${
                      activeImage === image.id
                        ? 'border-blue-500 ring-2 ring-blue-100'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    key={image.id}
                    onClick={() => setActiveImage(image.id)}
                    type="button"
                  >
                    {image.src ? (
                      <img alt={image.label} className="h-full w-full object-cover" src={image.src} />
                    ) : (
                      <span className="px-2 text-center text-[11px] font-semibold text-slate-400">
                        {image.label}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="grid gap-6">
                <div className="grid min-h-[420px] place-items-center rounded-[24px] border border-slate-200 bg-slate-50 p-8 lg:min-h-[520px]">
                  {currentImage ? (
                    <img
                      alt={form.name || 'Vista previa del producto'}
                      className="max-h-[430px] w-full object-contain"
                      src={currentImage}
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center text-sm font-medium text-slate-400">
                      Sube las dos fotos para ver la ficha del producto
                    </div>
                  )}
                </div>

                <div className="grid gap-6 rounded-[24px] border border-slate-200 bg-slate-50/70 p-6">
                  <div className="border-b border-slate-200 pb-3">
                    <div className="flex flex-wrap gap-5 text-xs font-semibold uppercase tracking-wide text-slate-700">
                      <span className="border-b-2 border-amber-400 pb-2 text-slate-900">Descripcion</span>
                      <span className="pb-2 text-slate-400">Detalles</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm leading-7 text-slate-700">
                    {detailLines.length ? (
                      <ul className="list-disc space-y-1 pl-5">
                        {detailLines.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>
                        Aqui se mostrara la descripcion detallada del producto, ideal para presentar
                        medidas, funciones, material o beneficios.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 border-t border-blue-200 pt-5 md:grid-cols-[minmax(0,1fr)_170px]">
                    <div className="grid gap-3">
                      <div className="text-[2rem] font-bold text-slate-900">Q{form.salePrice || '0.00'}</div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                        En existencia
                      </div>
                      <div className="text-sm text-slate-500">Compra: Q{form.purchasePrice || '0.00'}</div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                      <div className="font-semibold text-slate-700">{selectedBrand}</div>
                      <div className="mt-2">Stock: {form.initialStock || '0'}</div>
                      <div className="mt-2">{selectedCategory}</div>
                      <div className="mt-2">{selectedSubcategory}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </EditSheetModal>
    </div>
  );
}
