import type { LucideIcon } from 'lucide-react';

type PaymentMethodCardProps = {
  active: boolean;
  description: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
};

export function PaymentMethodCard({
  active,
  description,
  icon: Icon,
  label,
  onClick,
}: PaymentMethodCardProps) {
  return (
    <button
      className={`rounded-[24px] border p-5 text-left transition ${
        active
          ? 'border-emerald-300 bg-emerald-50 shadow-[0_18px_34px_rgba(16,185,129,0.12)]'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start gap-4">
        <span
          className={`grid h-12 w-12 place-items-center rounded-2xl ${
            active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>

        <div>
          <strong className="block text-base text-slate-950">{label}</strong>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
    </button>
  );
}
