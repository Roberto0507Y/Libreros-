import type { InputHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  wrapperClassName?: string;
};

export function Input({ className, hint, label, wrapperClassName, ...props }: InputProps) {
  return (
    <label className={cn('grid gap-2', wrapperClassName)}>
      {label ? <span className="text-sm font-semibold text-slate-700">{label}</span> : null}
      <input
        className={cn(
          'h-12 rounded-2xl border border-slate-200 bg-white/90 px-4 text-sm text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.03)] outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100',
          className,
        )}
        {...props}
      />
      {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}
