import { useMemo, useState, type ChangeEvent } from 'react';

import { EmptyState } from '../components/inventory/EmptyState';
import { InventoryCard } from '../components/inventory/InventoryCard';
import { InventoryFilters } from '../components/inventory/InventoryFilters';
import { InventoryStats } from '../components/inventory/InventoryStats';
import { InventoryTable } from '../components/inventory/InventoryTable';
import { LoadingSkeleton } from '../components/inventory/LoadingSkeleton';
import type { StockStatus } from '../components/inventory/StockBadge';
import type { CatalogOption, ProductItem } from '../domain/types';
import { currency } from '../lib/format';

type InventoryPageProps = {
  isLoading: boolean;
  onCreateProduct: () => void;
  onEditProduct: (productId?: number) => void;
  products: ProductItem[];
};

const getProductStatus = (product: ProductItem): StockStatus => {
  if (product.stock <= 0) return 'out';
  if (product.stock <= 5) return 'low';
  return 'in-stock';
};

export function InventoryPage({
  isLoading,
  onCreateProduct,
  onEditProduct,
  products,
}: InventoryPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [activeImage, setActiveImage] = useState<'primary' | 'secondary'>('primary');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | StockStatus>('');
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [localMessage, setLocalMessage] = useState('');

  const categories = useMemo<CatalogOption[]>(() => {
    const map = new Map<number, CatalogOption>();
    products.forEach((product) => {
      if (!map.has(product.categoryId)) {
        map.set(product.categoryId, { id: product.categoryId, nombre: product.categoryName });
      }
    });
    return Array.from(map.values()).sort((left, right) => left.nombre.localeCompare(right.nombre));
  }, [products]);

  const brands = useMemo<CatalogOption[]>(() => {
    const map = new Map<number, CatalogOption>();
    products.forEach((product) => {
      if (product.brandId && !map.has(product.brandId)) {
        map.set(product.brandId, { id: product.brandId, nombre: product.brandName });
      }
    });
    return Array.from(map.values()).sort((left, right) => left.nombre.localeCompare(right.nombre));
  }, [products]);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const status = getProductStatus(product);
      const matchesQuery = !normalizedQuery
        ? true
        : [product.nombre, product.categoryName, product.subcategoryName, product.brandName]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery);
      const matchesCategory = !categoryFilter ? true : product.categoryId === Number(categoryFilter);
      const matchesBrand = !brandFilter ? true : product.brandId === Number(brandFilter);
      const matchesStatus = !statusFilter ? true : status === statusFilter;
      const matchesAlerts = showOnlyAlerts ? status !== 'in-stock' : true;

      return matchesQuery && matchesCategory && matchesBrand && matchesStatus && matchesAlerts;
    });
  }, [brandFilter, categoryFilter, products, searchQuery, showOnlyAlerts, statusFilter]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleCategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilter(event.target.value);
  };

  const handleBrandChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setBrandFilter(event.target.value);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setBrandFilter('');
    setStatusFilter('');
    setShowOnlyAlerts(false);
  };

  const openProductDetail = (product: ProductItem) => {
    setSelectedProduct(product);
    setActiveImage('primary');
  };

  const closeProductDetail = () => {
    setSelectedProduct(null);
    setActiveImage('primary');
  };

  const lowStockProducts = visibleProducts.filter((product) => getProductStatus(product) === 'low');
  const outOfStockProducts = visibleProducts.filter((product) => getProductStatus(product) === 'out');
  const totalUnits = visibleProducts.reduce((sum, product) => sum + product.stock, 0);

  const detailImages = selectedProduct
    ? [
        { id: 'primary' as const, label: 'Foto 1', src: selectedProduct.primaryImage },
        { id: 'secondary' as const, label: 'Foto 2', src: selectedProduct.secondaryImage },
      ]
    : [];
  const currentDetailImage =
    detailImages.find((image) => image.id === activeImage)?.src ??
    selectedProduct?.primaryImage ??
    selectedProduct?.secondaryImage ??
    null;
  const descriptionLines = (selectedProduct?.descripcion ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const handleQuickAction = (mode: 'edit' | 'stock', productId?: number) => {
    onEditProduct(productId);
    setLocalMessage(
      mode === 'edit'
        ? 'Te llevamos al modulo de productos para editar la ficha completa.'
        : 'Te llevamos al modulo de productos para ajustar el stock desde la ficha existente.',
    );
  };

  return (
    <>
      <div className="grid gap-6">
        <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:px-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
                Inventario
              </p>
              <h2 className="m-0 text-2xl font-bold text-slate-900">Controla tu stock en tiempo real</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Supervisa existencias, detecta alertas rapido y entra al editor de productos cuando necesites ajustar informacion o stock.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => {
                  onEditProduct();
                  setLocalMessage('Abriendo el modulo de productos para ajustar inventario.');
                }}
                type="button"
              >
                Ajustar inventario
              </button>
              <button
                className="rounded-2xl border border-emerald-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(236,253,245,0.95))] px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-50"
                onClick={() => {
                  onEditProduct();
                  setLocalMessage('Abriendo productos para registrar una entrada de stock.');
                }}
                type="button"
              >
                Entrada de stock
              </button>
              <button
                className="rounded-2xl border border-amber-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,251,235,0.95))] px-4 py-3 text-sm font-semibold text-amber-700 transition hover:border-amber-200 hover:bg-amber-50"
                onClick={() => {
                  onEditProduct();
                  setLocalMessage('Abriendo productos para registrar una salida o ajuste de stock.');
                }}
                type="button"
              >
                Salida de stock
              </button>
            </div>
          </div>

          <div className="mt-6">
            <InventoryStats
              lowStockCount={lowStockProducts.length}
              outOfStockCount={outOfStockProducts.length}
              totalUnits={totalUnits}
              visibleProducts={visibleProducts.length}
            />
          </div>
        </section>

        {localMessage ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            {localMessage}
          </div>
        ) : null}

        {(lowStockProducts.length || outOfStockProducts.length) && !isLoading ? (
          <section className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-[28px] border border-amber-200 bg-amber-50/70 p-5 shadow-[0_14px_28px_rgba(245,158,11,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700">
                    Alerta
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">Productos con stock bajo</h3>
                </div>
                <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-amber-700 shadow-sm">
                  {lowStockProducts.length}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {lowStockProducts.slice(0, 6).map((product) => (
                  <button
                    className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-amber-100"
                    key={product.id}
                    onClick={() => openProductDetail(product)}
                    type="button"
                  >
                    {product.nombre} · {product.stock}
                  </button>
                ))}
              </div>
            </article>

            <article className="rounded-[28px] border border-rose-200 bg-rose-50/70 p-5 shadow-[0_14px_28px_rgba(244,63,94,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-700">
                    Critico
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">Productos agotados</h3>
                </div>
                <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm">
                  {outOfStockProducts.length}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {outOfStockProducts.slice(0, 6).map((product) => (
                  <button
                    className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-rose-100"
                    key={product.id}
                    onClick={() => openProductDetail(product)}
                    type="button"
                  >
                    {product.nombre}
                  </button>
                ))}
              </div>
            </article>
          </section>
        ) : null}

        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
                Inventario
              </p>
              <h3 className="text-xl font-bold text-slate-900">Panel de stock</h3>
              <p className="mt-2 text-sm text-slate-500">
                Cambia entre tabla o cards y enfoca el panel solo en productos con alerta cuando lo necesites.
              </p>
            </div>

            {isLoading ? <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">Actualizando...</span> : null}
          </div>

          <InventoryFilters
            brandFilter={brandFilter}
            brands={brands}
            categoryFilter={categoryFilter}
            categories={categories}
            onBrandChange={handleBrandChange}
            onCategoryChange={handleCategoryChange}
            onClear={handleClearFilters}
            onSearchChange={handleSearchChange}
            onStatusChange={setStatusFilter}
            onToggleAlerts={() => setShowOnlyAlerts((current) => !current)}
            searchQuery={searchQuery}
            showOnlyAlerts={showOnlyAlerts}
            statusFilter={statusFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          <div className="mt-6">
            {isLoading ? <LoadingSkeleton /> : null}

            {!isLoading && visibleProducts.length ? (
              viewMode === 'table' ? (
                <div className="hidden xl:block">
                  <InventoryTable
                    getStatus={getProductStatus}
                    onAdjustStock={(productId) => handleQuickAction('stock', productId)}
                    onEdit={(productId) => handleQuickAction('edit', productId)}
                    onViewDetail={openProductDetail}
                    products={visibleProducts}
                  />
                </div>
              ) : null
            ) : null}

            {!isLoading && visibleProducts.length ? (
              <div
                className={`grid gap-4 ${viewMode === 'table' ? 'xl:hidden' : 'md:grid-cols-2 xl:grid-cols-3'}`}
              >
                {visibleProducts.map((product) => (
                  <InventoryCard
                    getStatus={getProductStatus}
                    key={product.id}
                    onAdjustStock={(productId) => handleQuickAction('stock', productId)}
                    onEdit={(productId) => handleQuickAction('edit', productId)}
                    onViewDetail={openProductDetail}
                    product={product}
                  />
                ))}
              </div>
            ) : null}

            {!isLoading && !visibleProducts.length ? <EmptyState onCreateProduct={onCreateProduct} /> : null}
          </div>
        </section>
      </div>

      {selectedProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-auto rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.24)] md:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="text-xs text-slate-500">
                Inicio <span className="mx-1">→</span> {selectedProduct.brandName}{' '}
                <span className="mx-1">→</span> {selectedProduct.subcategoryName}
              </div>
              <button
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                onClick={closeProductDetail}
                type="button"
              >
                Cerrar
              </button>
            </div>

            <h3 className="border-b border-slate-200 pb-4 text-[1.8rem] font-bold uppercase leading-tight text-blue-900">
              {selectedProduct.nombre}
            </h3>

            <div className="mt-5 grid gap-5 xl:grid-cols-[72px_minmax(0,1fr)]">
              <div className="grid gap-3">
                {detailImages.map((image) => (
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

              <div className="grid gap-5 xl:grid-cols-[minmax(280px,1fr)_minmax(270px,0.92fr)]">
                <div className="grid min-h-[470px] place-items-center rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  {currentDetailImage ? (
                    <img
                      alt={selectedProduct.nombre}
                      className="max-h-[430px] w-full object-contain"
                      src={currentDetailImage}
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center text-sm font-medium text-slate-400">
                      Este producto no tiene imagen disponible
                    </div>
                  )}
                </div>

                <div className="grid content-start gap-4">
                  <div className="border-b border-slate-200 pb-3">
                    <div className="flex gap-5 text-xs font-semibold uppercase tracking-wide text-slate-700">
                      <span className="border-b-2 border-amber-400 pb-2 text-slate-900">Descripcion</span>
                      <span className="pb-2 text-slate-400">Ficha</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm leading-7 text-slate-700">
                    {descriptionLines.length ? (
                      <ul className="list-disc space-y-1 pl-5">
                        {descriptionLines.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>
                        Este producto aun no tiene una descripcion detallada registrada en el
                        sistema.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 border-t border-blue-200 pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[2rem] font-bold text-slate-900">
                          {currency.format(selectedProduct.salePrice)}
                        </div>
                        <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                          {selectedProduct.stock > 0 ? 'En existencia' : 'Sin existencias'}
                        </div>
                        <div className="mt-2 text-sm text-slate-500">
                          Compra: {currency.format(selectedProduct.purchasePrice)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 px-4 py-3 text-center text-xs text-slate-500">
                        <div className="font-semibold text-slate-700">{selectedProduct.brandName}</div>
                        <div className="mt-1">SKU: {selectedProduct.id}</div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                        Stock disponible: {selectedProduct.stock}
                      </div>
                      <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                        Categoria: {selectedProduct.categoryName}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        onClick={() => {
                          closeProductDetail();
                          handleQuickAction('edit', selectedProduct.id);
                        }}
                        type="button"
                      >
                        Editar producto
                      </button>
                      <button
                        className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                        onClick={() => {
                          closeProductDetail();
                          handleQuickAction('stock', selectedProduct.id);
                        }}
                        type="button"
                      >
                        Ajustar stock
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
