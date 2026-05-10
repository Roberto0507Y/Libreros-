import { forwardRef, type HTMLAttributes, type PropsWithChildren } from 'react';

import { cn } from '../../lib/cn';

type CardProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    tone?: 'default' | 'glass' | 'dark';
  }
>;

const toneClasses = {
  default:
    'border border-white/70 bg-white/88 shadow-[0_24px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl',
  glass:
    'border border-white/60 bg-white/72 shadow-[0_28px_72px_rgba(15,23,42,0.08)] backdrop-blur-2xl',
  dark:
    'border border-white/10 bg-[linear-gradient(180deg,#112347,#0b1730)] text-white shadow-[0_28px_80px_rgba(6,18,37,0.35)]',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, className, tone = 'default', ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn('rounded-[32px]', toneClasses[tone], className)} {...props}>
      {children}
    </div>
  );
});
