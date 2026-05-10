import Cards from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';

import type { PaymentCardFocus, PaymentFormValues } from './types';

type DemoCardPreviewProps = {
  values: PaymentFormValues;
  focus?: PaymentCardFocus;
};

export function DemoCardPreview({ focus, values }: DemoCardPreviewProps) {
  const expiry = values.expiry.replace(/\D/g, '').slice(0, 4);

  return (
    <div className="group relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(145deg,rgba(9,24,58,0.96),rgba(14,33,78,0.98))] px-5 py-6 shadow-[0_30px_90px_rgba(2,8,23,0.42)] ring-1 ring-white/8 transition duration-500 hover:-translate-y-1 hover:shadow-[0_36px_110px_rgba(30,64,175,0.28)]">
      <div className="pointer-events-none absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-cyan-300/14 blur-3xl" />
      <div className="pointer-events-none absolute right-[-70px] top-[-30px] h-40 w-40 rounded-full border border-white/8" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.12),transparent_28%,transparent_60%,rgba(255,255,255,0.06)_100%)]" />

      <div className="relative z-10 mb-4 flex items-center justify-between">
        <span className="inline-flex rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur">
          Tarjeta
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/42">
          Referencia visual
        </span>
      </div>

      <div className="relative z-10 flex justify-center">
        <div className="w-full max-w-[420px] rounded-[28px] border border-white/8 bg-white/[0.03] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm">
          <div className="[&_.rccs]:!mx-auto [&_.rccs]:!w-full [&_.rccs]:!max-w-[396px] [&_.rccs__card]:!rounded-[22px] [&_.rccs__card]:!shadow-[0_24px_64px_rgba(2,8,23,0.34)] [&_.rccs__card--front]:!bg-[linear-gradient(135deg,#0d1f4d_0%,#153a83_38%,#102f6c_62%,#081730_100%)] [&_.rccs__card--back]:!bg-[linear-gradient(135deg,#0d1f4d_0%,#153a83_38%,#102f6c_62%,#081730_100%)] [&_.rccs__name]:!font-semibold [&_.rccs__name]:!tracking-[0.08em] [&_.rccs__expiry]:!font-semibold [&_.rccs__number]:!font-semibold [&_.rccs__number]:!tracking-[0.28em]">
            <Cards
              cvc={values.cvv}
              expiry={expiry}
              focused={focus}
              name={values.cardholder}
              number={values.cardNumber}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
