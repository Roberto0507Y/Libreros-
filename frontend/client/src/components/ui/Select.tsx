import type { SelectHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  wrapperClassName?: string;
};

export function Select({ className, label, wrapperClassName, children, ...props }: SelectProps) {
  return (
    <label className={cn('grid gap-2', wrapperClassName)}>
      {label ? <span className="text-sm font-semibold text-slate-700">{label}</span> : null}
      <select
        className={cn(
          'h-12 rounded-2xl border border-slate-200 bg-white/90 px-4 text-sm text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.03)] outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
