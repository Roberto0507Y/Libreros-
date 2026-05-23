import { useId } from 'react';

type NexusLogoProps = {
  collapsed?: boolean;
  mode?: 'sidebar' | 'navbar';
};

function NexusMark({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  const gradientA = `nexus-mark-a-${id}`;
  const gradientB = `nexus-mark-b-${id}`;
  const shadow = `nexus-mark-shadow-${id}`;

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientA} x1="18" x2="101" y1="16" y2="97" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D8F3FF" />
          <stop offset="0.42" stopColor="#4CC9FF" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id={gradientB} x1="29" x2="91" y1="56" y2="101" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#93C5FD" />
        </linearGradient>
        <filter id={shadow} colorInterpolationFilters="sRGB" height="180%" width="180%" x="-40%" y="-40%">
          <feDropShadow dx="0" dy="12" floodColor="#020617" floodOpacity="0.22" stdDeviation="8" />
          <feDropShadow dx="0" dy="0" floodColor="#38BDF8" floodOpacity="0.18" stdDeviation="4" />
        </filter>
      </defs>

      <g filter={`url(#${shadow})`}>
        <path
          d="M27 77.5L52 83.5C56.2 84.5 59.8 86.8 62.5 90L68.5 97L74.5 90C77.2 86.8 80.8 84.5 85 83.5L110 77.5V55L86 59.5C79.3 60.7 73.3 64 68.5 68.8L68.2 69.1C67.2 70.1 65.6 70.1 64.6 69.1L64.3 68.8C59.5 64 53.5 60.7 46.8 59.5L27 55V77.5Z"
          opacity="0.92"
          stroke={`url(#${gradientA})`}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
        />
        <path
          d="M33.5 84L52.5 88.3C56.8 89.3 60.6 91.7 63.4 95L68.5 101L73.6 95C76.4 91.7 80.2 89.3 84.5 88.3L103.5 84"
          stroke={`url(#${gradientB})`}
          strokeLinecap="round"
          strokeWidth="4.5"
        />
        <path
          d="M52 21H69L86 40V82H72V49L52 67V21Z"
          fill={`url(#${gradientA})`}
        />
        <path
          d="M69 21V38.5C69 40.4 70.6 42 72.5 42H86"
          stroke="#F0F9FF"
          strokeLinecap="round"
          strokeOpacity="0.96"
          strokeWidth="3"
        />
        <path
          d="M52 21L86 82"
          stroke="#1E40AF"
          strokeLinecap="round"
          strokeOpacity="1"
          strokeWidth="4"
        />
        <g fill="#7DD3FC" opacity="1">
          <rect height="7" rx="1.5" width="7" x="24" y="36" />
          <rect height="10" rx="2" width="10" x="33" y="28" />
          <rect height="8" rx="2" width="8" x="32" y="45" />
          <rect height="6" rx="1.5" width="6" x="44" y="48" />
          <rect height="5" rx="1.5" width="5" x="25" y="57" />
          <rect height="5" rx="1.5" width="5" x="37" y="58" />
        </g>
        <g stroke="#7DD3FC" strokeLinecap="round" strokeWidth="3.3">
          <path d="M92 45.5L104 34" />
          <path d="M89 55L106.5 46.5" />
          <path d="M92 64L108 64" />
        </g>
        <g fill="#BAE6FD">
          <circle cx="108" cy="31.5" r="4.6" />
          <circle cx="111" cy="44.5" r="4.6" />
          <circle cx="112.5" cy="64" r="4.6" />
        </g>
      </g>
    </svg>
  );
}

export function NexusLogo({ collapsed = false, mode = 'sidebar' }: NexusLogoProps) {
  const isSidebar = mode === 'sidebar';

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#081028] to-[#132d6b] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-300/18 hover:shadow-[0_18px_40px_rgba(2,6,23,0.38)] ${
        collapsed ? 'px-3 py-3' : isSidebar ? 'px-4 py-3.5' : 'px-4 py-3'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_35%)] opacity-90" />
      <div
        className={`relative flex items-center ${
          collapsed ? 'justify-center' : 'gap-3'
        }`}
      >
        <span
          className={`grid shrink-0 place-items-center rounded-[22px] border border-white/12 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] ${
            collapsed ? 'h-12 w-12' : isSidebar ? 'h-14 w-14' : 'h-12 w-12'
          }`}
        >
          <NexusMark
            className={`object-contain drop-shadow-[0_12px_22px_rgba(56,189,248,0.26)] ${
              collapsed ? 'h-10 w-10' : isSidebar ? 'h-11 w-11' : 'h-10 w-10'
            }`}
          />
        </span>

        {!collapsed ? (
          <div className="min-w-0">
            <strong
              className={`block text-balance font-black uppercase leading-tight tracking-[0.08em] text-white ${
                isSidebar ? 'text-[0.9rem]' : 'text-[0.82rem]'
              }`}
            >
              Librería Digital Nexus
            </strong>
          </div>
        ) : null}
      </div>
    </div>
  );
}
