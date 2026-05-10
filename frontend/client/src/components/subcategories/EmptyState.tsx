type EmptyStateProps = {
  description: string;
  title: string;
};

export function EmptyState({ description, title }: EmptyStateProps) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
      <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path
            d="M4 7.5 12 3l8 4.5m-16 0 8 4.5m-8-4.5V16.5L12 21m8-13.5V16.5L12 21m0-9V21"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      </span>
      <strong className="mt-4 block text-lg text-slate-900">{title}</strong>
      <span className="mt-2 block text-sm text-slate-500">{description}</span>
    </div>
  );
}
