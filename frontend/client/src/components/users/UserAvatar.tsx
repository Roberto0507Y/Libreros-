import { UserRound } from 'lucide-react';

type UserAvatarProps = {
  name: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'h-9 w-9 rounded-2xl',
  md: 'h-10 w-10 rounded-2xl',
  lg: 'h-11 w-11 rounded-2xl',
};

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-4.5 w-4.5',
  lg: 'h-5 w-5',
};

export function UserAvatar({ name: _name, size = 'md' }: UserAvatarProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-sky-100 bg-[linear-gradient(180deg,#f8fbff_0%,#eef8ff_100%)] text-sky-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition duration-200 group-hover:scale-[1.02] ${sizeClasses[size]}`}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.55),transparent_48%)]" />
      <span className="relative flex h-full w-full items-center justify-center">
        <UserRound className={`block ${iconSizes[size]}`} />
      </span>
    </span>
  );
}
