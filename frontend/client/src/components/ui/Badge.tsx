import type { HTMLAttributes, PropsWithChildren } from 'react';

import { cn } from '../../lib/cn';

type BadgeProps = PropsWithChildren<
  HTMLAttributes<HTMLSpanElement> & {
    tone?: 'primary' | 'neutral' | 'success' | 'warning' | 'danger';
  }
>;

const toneClasses = {
  primary: 'border border-sky-200 bg-sky-50 text-sky-700',
  neutral: 'border border-slate-200 bg-white text-slate-600',
  success: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border border-rose-200 bg-rose-50 text-rose-700',
};

export function Badge({ children, className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]',
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
