import type { ChangeEvent } from 'react';

import { currency } from '../../lib/format';
import type { ProductItem } from '../../domain/types';

type ProductSearchProps = {
  onAddProduct: () => void;
  onProductQueryChange: (value: string) => void;
  onProductSelect: (productId: string) => void;
  onQuantityChange: (value: string) => void;
  productQuery: string;
  products: ProductItem[];
  quantity: string;
  searchResults: ProductItem[];
  selectedProduct: ProductItem | null;
  stockRemaining: number;
};

export function ProductSearch({
  onAddProduct,
  onProductQueryChange,
  onProductSelect,
  onQuantityChange,
  productQuery,
  products,
  quantity,
  searchResults,
  selectedProduct,
  stockRemaining,
}: ProductSearchProps) {
  const handleSearchSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    onProductSelect(event.target.value);
  };

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
          Producto
        </p>
        <h3 className="mt-2 text-xl font-bold text-slate-900">Busca y agrega productos</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Localiza por nombre o por codigo interno y agrega la cantidad al carrito.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-1.5">
          <label
            className="flex items-center gap-3 rounded-[18px] bg-white px-4 py-3 shadow-sm"
            htmlFor="sale-product-search"
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
              id="sale-product-search"
              onChange={(event) => onProductQueryChange(event.target.value)}
              placeholder="Buscar producto por nombre, codigo o SKU..."
              type="search"
              value={productQuery}
            />
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_140px]">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600" htmlFor="sale-product-select">
              Resultado
            </label>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              id="sale-product-select"
              onChange={handleSearchSelect}
              value={selectedProduct ? String(selectedProduct.id) : ''}
            >
              <option value="">
                {products.length ? 'Selecciona un producto' : 'No hay productos disponibles'}
              </option>
              {searchResults.map((product) => (
                <option key={product.id} value={product.id}>
                  #{product.id} - {product.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600" htmlFor="sale-quantity">
              Cantidad
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              id="sale-quantity"
              min="1"
              onChange={(event) => onQuantityChange(event.target.value)}
              step="1"
              type="number"
              value={quantity}
            />
          </div>
        </div>

        {selectedProduct ? (
          <div className="grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
            <article className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Producto</p>
              <strong className="mt-2 block text-sm text-slate-900">{selectedProduct.nombre}</strong>
              <span className="mt-2 block text-sm text-slate-500">
                #{selectedProduct.id} • {selectedProduct.brandName || 'Sin marca'}
              </span>
            </article>

            <article className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Precio de venta</p>
              <strong className="mt-2 block text-xl text-slate-900">
                {currency.format(selectedProduct.salePrice)}
              </strong>
              <span className="mt-2 block text-sm text-slate-500">{selectedProduct.categoryName}</span>
            </article>

            <article className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Stock disponible</p>
              <strong className="mt-2 block text-xl text-slate-900">{stockRemaining}</strong>
              <span className="mt-2 block text-sm text-slate-500">
                {stockRemaining > 0 ? 'Listo para agregar al carrito' : 'Sin existencia disponible'}
              </span>
            </article>
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!selectedProduct || stockRemaining <= 0}
            onClick={onAddProduct}
            type="button"
          >
            Agregar producto
          </button>
        </div>
      </div>
    </section>
  );
}
