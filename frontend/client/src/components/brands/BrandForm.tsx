import type { ChangeEvent, DragEvent, FormEvent } from 'react';

import { ImagePreview } from './ImagePreview';

type BrandFormProps = {
  image: string;
  isDragActive: boolean;
  isSaving: boolean;
  name: string;
  onDropFile: (file: File | null) => void;
  onDragStateChange: (active: boolean) => void;
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function BrandForm({
  image,
  isDragActive,
  isSaving,
  name,
  onDropFile,
  onDragStateChange,
  onImageChange,
  onNameChange,
  onSubmit,
}: BrandFormProps) {
  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    onDragStateChange(true);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    onDragStateChange(false);
    onDropFile(event.dataTransfer.files?.[0] ?? null);
  };

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
      <div className="mb-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
          Nueva marca
        </p>
        <h3 className="text-xl font-bold text-slate-900">Agregar marca</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Crea una marca con una ficha visual clara y un logo listo para usarse en el catalogo.
        </p>
      </div>

      <form className="grid gap-5" onSubmit={onSubmit}>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Nombre de la marca
          <input
            className={`rounded-2xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-4 ${
              !name.trim()
                ? 'border-rose-200 focus:border-rose-300 focus:ring-rose-100'
                : 'border-slate-200 focus:border-blue-400 focus:ring-blue-100'
            }`}
            name="name"
            onChange={onNameChange}
            placeholder="Ej. Casio"
            required
            type="text"
            value={name}
          />
          {!name.trim() ? (
            <span className="text-xs font-medium text-rose-600">El nombre es obligatorio.</span>
          ) : null}
        </label>

        <div className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Imagen de la marca</span>
          <label
            className={`grid cursor-pointer gap-3 rounded-[24px] border-2 border-dashed px-5 py-6 text-center transition ${
              isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40'
            }`}
            onDragEnter={() => onDragStateChange(true)}
            onDragLeave={() => onDragStateChange(false)}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
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
              <strong className="block text-sm text-slate-800">Arrastra aqui el logo o haz clic para subirlo</strong>
              <span className="mt-2 block text-xs leading-5 text-slate-500">
                Formatos permitidos: JPG, PNG, WEBP. La imagen es opcional.
              </span>
            </div>
            <input
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={onImageChange}
              type="file"
            />
          </label>
        </div>

        <ImagePreview image={image} label="Vista previa" name={name} />

        <button
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSaving || !name.trim()}
          type="submit"
        >
          {isSaving ? 'GUARDANDO MARCA...' : 'CREAR MARCA'}
        </button>
      </form>
    </section>
  );
}
