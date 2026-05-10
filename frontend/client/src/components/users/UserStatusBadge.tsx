import { statusBadgeClass } from './userStyles';

type UserStatusBadgeProps = {
  active: boolean;
  status?: 'activo' | 'suspendido' | 'pendiente';
};

export function UserStatusBadge({ active, status }: UserStatusBadgeProps) {
  const resolvedStatus = status ?? (active ? 'activo' : 'suspendido');

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold tracking-[0.12em] uppercase ${statusBadgeClass(
        resolvedStatus,
      )}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {resolvedStatus}
    </span>
  );
}
