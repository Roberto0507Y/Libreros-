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
            d="M4 16.5V6.75A1.75 1.75 0 0 1 5.75 5h12.5A1.75 1.75 0 0 1 20 6.75v10.5A1.75 1.75 0 0 1 18.25 19H5.75A1.75 1.75 0 0 1 4 17.25Zm0 0 4.7-4.7a1 1 0 0 1 1.4 0l1.9 1.9 3.9-3.9a1 1 0 0 1 1.4 0L20 12.5M9 9.5h.01"
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
