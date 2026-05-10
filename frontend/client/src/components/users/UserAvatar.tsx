import { getAvatarTone, getInitials } from './userStyles';

type UserAvatarProps = {
  name: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'h-9 w-9 rounded-2xl text-[12px]',
  md: 'h-10 w-10 rounded-2xl text-[12px]',
  lg: 'h-11 w-11 rounded-2xl text-[13px]',
};

export function UserAvatar({ name, size = 'md' }: UserAvatarProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-white/60 font-semibold leading-none tracking-[0.04em] text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition duration-200 group-hover:scale-[1.02] ${sizeClasses[size]} ${getAvatarTone(
        name,
      )}`}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.4),transparent_48%)]" />
      <span className="relative">{getInitials(name)}</span>
    </span>
  );
}
