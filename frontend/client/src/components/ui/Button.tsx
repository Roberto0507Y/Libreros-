import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

import { cn } from '../../lib/cn';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'cta'
  | 'dark'
  | 'success'
  | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
  }
>;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[linear-gradient(135deg,var(--brand-primary),var(--brand-secondary))] text-white shadow-[0_18px_36px_rgba(37,99,235,0.22)] hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(37,99,235,0.28)]',
  secondary:
    'border border-slate-200 bg-white text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 hover:border-sky-200 hover:bg-slate-50',
  ghost:
    'border border-transparent bg-white/10 text-white hover:-translate-y-0.5 hover:bg-white/16',
  cta:
    'bg-[linear-gradient(135deg,var(--brand-cta),#f59e0b)] text-white shadow-[0_18px_36px_rgba(249,115,22,0.24)] hover:-translate-y-0.5 hover:brightness-[1.04]',
  dark:
    'bg-[linear-gradient(135deg,#0f172a,#1e293b)] text-white shadow-[0_18px_36px_rgba(15,23,42,0.22)] hover:-translate-y-0.5 hover:brightness-[1.06]',
  success:
    'bg-[linear-gradient(135deg,#22c55e,#16a34a)] text-white shadow-[0_18px_36px_rgba(34,197,94,0.24)] hover:-translate-y-0.5 hover:brightness-[1.04]',
  danger:
    'bg-[linear-gradient(135deg,#ef4444,#dc2626)] text-white shadow-[0_18px_36px_rgba(239,68,68,0.22)] hover:-translate-y-0.5 hover:brightness-[1.04]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-10 rounded-xl px-4 text-sm',
  md: 'h-11 rounded-2xl px-5 text-sm',
  lg: 'h-12 rounded-2xl px-6 text-[15px]',
};

export function Button({
  children,
  className,
  fullWidth = false,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'w-full',
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
