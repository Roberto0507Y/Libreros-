import type { PropsWithChildren, ReactNode } from 'react';

import { cn } from '../../lib/cn';

type DrawerProps = PropsWithChildren<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  actions?: ReactNode;
  side?: 'left' | 'right';
}>;

export function Drawer({ actions, children, isOpen, onClose, side = 'right', title }: DrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] lg:hidden">
      <button
        aria-label="Cerrar panel"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <aside
        className={cn(
          'absolute inset-y-0 w-[min(92vw,360px)] overflow-y-auto bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]',
          side === 'right' ? 'right-0 rounded-l-[28px]' : 'left-0 rounded-r-[28px]',
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            <strong className="text-lg font-bold text-slate-950">{title}</strong>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <button
              className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 text-slate-600"
              onClick={onClose}
              type="button"
            >
              ×
            </button>
          </div>
        </div>
        <div className="px-5 py-5">{children}</div>
      </aside>
    </div>
  );
}
