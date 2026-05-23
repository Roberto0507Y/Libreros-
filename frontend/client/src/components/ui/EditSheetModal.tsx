import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

type EditSheetModalProps = {
  children: ReactNode;
  footer?: ReactNode;
  isOpen: boolean;
  subtitle?: string;
  title: string;
  onClose: () => void;
  widthClassName?: string;
};

export function EditSheetModal({
  children,
  footer,
  isOpen,
  subtitle,
  title,
  onClose,
  widthClassName = 'max-w-6xl',
}: EditSheetModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/42 px-4 py-4 backdrop-blur-md md:px-6"
      role="dialog"
    >
      <button
        aria-label="Cerrar editor"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />

      <div
        className={`relative z-[1] flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] ${widthClassName}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 md:px-7 md:py-5">
          <div className="min-w-0">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
              Edicion
            </p>
            <h2 className="truncate text-xl font-bold text-slate-950 md:text-2xl">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>

          <button
            aria-label="Cerrar"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-7 md:py-6">{children}</div>

        {footer ? (
          <div className="border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur md:px-7">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
