import type { PropsWithChildren, ReactNode } from 'react';

type ModalProps = PropsWithChildren<{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  size?: 'md' | 'lg' | 'xl';
}>;

const sizeClasses = {
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

export function Modal({
  children,
  headerAction,
  isOpen,
  onClose,
  size = 'lg',
  subtitle,
  title,
}: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[95] overflow-y-auto bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className={`mx-auto overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] ${sizeClasses[size]}`}>
        {(title || subtitle || headerAction) ? (
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <div>
              {title ? <h3 className="text-2xl font-bold text-slate-950">{title}</h3> : null}
              {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
            </div>
            <div className="flex items-center gap-3">
              {headerAction}
              <button
                className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 text-slate-500"
                onClick={onClose}
                type="button"
              >
                ×
              </button>
            </div>
          </div>
        ) : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
