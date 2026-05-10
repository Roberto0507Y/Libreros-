import type { ReactNode } from 'react';

import { cn } from '../../lib/cn';

type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  actions?: ReactNode;
  className?: string;
};

export function SectionTitle({
  actions,
  align = 'left',
  className,
  description,
  eyebrow,
  title,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between',
        align === 'center' && 'items-center text-center lg:flex-col lg:items-center',
        className,
      )}
    >
      <div className={cn(align === 'center' && 'mx-auto max-w-3xl')}>
        {eyebrow ? (
          <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.03em] text-slate-950 md:text-[2.2rem]">
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              'mt-3 max-w-2xl text-sm leading-7 text-slate-500',
              align === 'center' && 'mx-auto',
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
