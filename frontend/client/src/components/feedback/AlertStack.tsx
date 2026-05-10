type AlertSeverity = 'success' | 'info' | 'warning' | 'error';

type AlertItem = {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
};

type AlertStackProps = {
  alerts: AlertItem[];
  onClose: (id: string) => void;
};

const toneClasses: Record<AlertSeverity, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
};

const iconClasses: Record<AlertSeverity, string> = {
  success: 'bg-emerald-100 text-emerald-700',
  info: 'bg-sky-100 text-sky-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-rose-100 text-rose-700',
};

function AlertIcon({ severity }: { severity: AlertSeverity }) {
  if (severity === 'success') {
    return (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <path d="m7 12.5 3.2 3.2L17.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (severity === 'warning') {
    return (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <path d="M12 8.25v4.5M12 16.25h.01M10.34 4.94 3.7 16.44A1.5 1.5 0 0 0 5 18.69h14a1.5 1.5 0 0 0 1.3-2.25L13.66 4.94a1.5 1.5 0 0 0-2.6 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (severity === 'info') {
    return (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <path d="M12 16v-4M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path d="M15 9 9 15M9 9l6 6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AlertStack({ alerts, onClose }: AlertStackProps) {
  if (!alerts.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`pointer-events-auto rounded-2xl border px-4 py-4 shadow-[0_18px_48px_rgba(15,23,42,0.14)] backdrop-blur-sm transition duration-300 animate-[fade-in_.24s_ease-out] ${toneClasses[alert.severity]}`}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${iconClasses[alert.severity]}`}>
              <AlertIcon severity={alert.severity} />
            </span>

            <div className="min-w-0 flex-1">
              <strong className="block text-sm font-bold">{alert.title}</strong>
              <p className="mt-1 text-sm leading-6 opacity-90">{alert.message}</p>
            </div>

            <button
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black/5 bg-white/60 text-lg leading-none text-current transition hover:bg-white/90"
              onClick={() => onClose(alert.id)}
              type="button"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
