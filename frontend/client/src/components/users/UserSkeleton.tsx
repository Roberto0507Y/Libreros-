export function UserSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="hidden overflow-hidden rounded-[30px] border border-slate-200 bg-white p-4 shadow-[0_18px_42px_rgba(15,23,42,0.05)] lg:block">
        <div className="animate-pulse space-y-3">
          <div className="grid grid-cols-[2fr_1.2fr_1.6fr_1.7fr_1fr_0.9fr] gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="h-4 rounded-full bg-slate-200" key={index} />
            ))}
          </div>

          {Array.from({ length: 4 }).map((_, rowIndex) => (
            <div className="grid grid-cols-[2fr_1.2fr_1.6fr_1.7fr_1fr_0.9fr] gap-3 rounded-[24px] border border-slate-100 bg-slate-50/70 p-4" key={rowIndex}>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-[20px] bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 rounded-full bg-slate-200" />
                  <div className="h-3 w-20 rounded-full bg-slate-200" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 rounded-full bg-slate-200" />
                <div className="h-7 w-24 rounded-full bg-slate-200" />
              </div>
              <div className="h-4 rounded-full bg-slate-200" />
              <div className="space-y-2">
                <div className="h-6 w-24 rounded-full bg-slate-200" />
                <div className="h-11 rounded-2xl bg-slate-200" />
              </div>
              <div className="h-4 rounded-full bg-slate-200" />
              <div className="h-11 rounded-2xl bg-slate-200" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 lg:hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            className="animate-pulse rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]"
            key={index}
          >
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-[20px] bg-slate-200" />
              <div className="min-w-0 flex-1">
                <div className="h-5 w-40 rounded bg-slate-200" />
                <div className="mt-3 h-4 w-28 rounded bg-slate-200" />
              </div>
            </div>
            <div className="mt-5 h-24 rounded-[24px] bg-slate-100" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="h-16 rounded-[20px] bg-slate-100" />
              <div className="h-16 rounded-[20px] bg-slate-100" />
            </div>
            <div className="mt-4 h-12 w-full rounded-[20px] bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
