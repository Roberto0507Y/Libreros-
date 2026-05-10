type EmptyStateProps = {
  onCreateProduct: () => void;
};

export function EmptyState({ onCreateProduct }: EmptyStateProps) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
      <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-[22px] bg-white text-slate-400 shadow-sm">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24">
          <path
            d="M11.25 3.5a3.75 3.75 0 0 0-3.72 3.25H6.75A2.75 2.75 0 0 0 4 9.5v9.75A2.75 2.75 0 0 0 6.75 22h10.5A2.75 2.75 0 0 0 20 19.25V9.5a2.75 2.75 0 0 0-2.75-2.75h-.78A3.75 3.75 0 0 0 12.75 3.5h-1.5Zm1.5 1.5a2.25 2.25 0 0 1 2.22 1.75H9.53A2.25 2.25 0 0 1 11.75 5h1Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <path d="M12 11v6m-3-3h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      </span>
      <strong className="mt-4 block text-lg text-slate-900">No hay productos para este filtro.</strong>
      <span className="mt-2 block text-sm text-slate-500">
        Prueba con otra busqueda o registra un nuevo producto para empezar a controlar stock.
      </span>
      <button
        className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(37,99,235,0.22)] transition hover:bg-blue-700"
        onClick={onCreateProduct}
        type="button"
      >
        Crear producto
      </button>
    </div>
  );
}
