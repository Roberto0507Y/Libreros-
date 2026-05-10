export function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          className="animate-pulse rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]"
          key={index}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="h-7 w-24 rounded-full bg-slate-200" />
            <div className="h-4 w-12 rounded bg-slate-200" />
          </div>
          <div className="mt-5 h-36 rounded-[24px] bg-slate-100" />
          <div className="mt-5 h-6 w-32 rounded bg-slate-200" />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="h-11 rounded-2xl bg-slate-100" />
            <div className="h-11 rounded-2xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
