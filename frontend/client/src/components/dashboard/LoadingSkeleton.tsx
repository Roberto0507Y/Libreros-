export function LoadingSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="animate-pulse rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]"
            key={index}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="h-14 w-14 rounded-2xl bg-slate-100" />
              <div className="h-7 w-24 rounded-full bg-slate-100" />
            </div>
            <div className="mt-5 h-4 w-32 rounded bg-slate-200" />
            <div className="mt-3 h-8 w-40 rounded bg-slate-200" />
            <div className="mt-4 h-4 w-full rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="animate-pulse rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
        <div className="h-5 w-48 rounded bg-slate-200" />
        <div className="mt-6 h-72 rounded-[24px] bg-slate-100" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            className="animate-pulse rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]"
            key={index}
          >
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="mt-5 h-48 rounded-[24px] bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
