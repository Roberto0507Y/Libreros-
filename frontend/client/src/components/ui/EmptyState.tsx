import type { ReactNode } from 'react';

import { Card } from './Card';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ action, description, title }: EmptyStateProps) {
  return (
    <Card className="grid justify-items-center gap-3 px-6 py-12 text-center" tone="glass">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[linear-gradient(135deg,#eff6ff,#dbeafe)] text-2xl">
        ◌
      </div>
      <strong className="text-lg font-bold text-slate-900">{title}</strong>
      {description ? <p className="max-w-xl text-sm leading-7 text-slate-500">{description}</p> : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </Card>
  );
}
