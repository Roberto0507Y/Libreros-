export function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          className="animate-pulse rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]"
          key={index}
        >
          <div className="h-44 rounded-[22px] bg-slate-100" />
          <div className="mt-5 h-5 w-32 rounded bg-slate-200" />
          <div className="mt-3 h-6 w-48 rounded bg-slate-200" />
          <div className="mt-5 h-20 rounded-[20px] bg-slate-100" />
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="h-10 rounded-xl bg-slate-100" />
            <div className="h-10 rounded-xl bg-slate-100" />
            <div className="h-10 rounded-xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
