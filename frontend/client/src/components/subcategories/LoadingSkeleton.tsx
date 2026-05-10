export function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          className="animate-pulse rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]"
          key={index}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-200" />
            <div className="h-7 w-24 rounded-full bg-slate-200" />
          </div>
          <div className="mt-5 h-6 w-40 rounded bg-slate-200" />
          <div className="mt-3 h-5 w-28 rounded-full bg-slate-200" />
          <div className="mt-5 h-24 rounded-[22px] bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
