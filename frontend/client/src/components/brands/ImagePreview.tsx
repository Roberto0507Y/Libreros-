type ImagePreviewProps = {
  image?: string;
  label: string;
  name: string;
};

export function ImagePreview({ image, label, name }: ImagePreviewProps) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        {label}
      </div>
      <div className="grid min-h-[180px] place-items-center overflow-hidden rounded-[22px] border border-slate-200 bg-white p-6">
        {image ? (
          <img alt={name || 'Marca'} className="h-24 w-full object-contain" src={image} />
        ) : (
          <div className="text-center">
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path
                  d="M4 16.5V6.75A1.75 1.75 0 0 1 5.75 5h12.5A1.75 1.75 0 0 1 20 6.75v10.5A1.75 1.75 0 0 1 18.25 19H5.75A1.75 1.75 0 0 1 4 17.25Zm0 0 4.7-4.7a1 1 0 0 1 1.4 0l1.9 1.9 3.9-3.9a1 1 0 0 1 1.4 0L20 12.5M9 9.5h.01"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </span>
            <span className="mt-3 block text-sm text-slate-400">Aun no hay imagen para esta marca</span>
          </div>
        )}
      </div>
    </div>
  );
}
