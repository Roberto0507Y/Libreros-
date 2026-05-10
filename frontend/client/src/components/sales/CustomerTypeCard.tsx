import type { LucideIcon } from 'lucide-react';

type CustomerTypeCardProps = {
  active: boolean;
  description: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
};

export function CustomerTypeCard({
  active,
  description,
  icon: Icon,
  label,
  onClick,
}: CustomerTypeCardProps) {
  return (
    <button
      className={`rounded-[26px] border p-5 text-left transition ${
        active
          ? 'border-blue-300 bg-blue-50 shadow-[0_18px_34px_rgba(37,99,235,0.12)]'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
      onClick={onClick}
      type="button"
    >
      <span
        className={`grid h-12 w-12 place-items-center rounded-2xl ${
          active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <strong className="mt-4 block text-lg text-slate-950">{label}</strong>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </button>
  );
}
