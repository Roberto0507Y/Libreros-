import { roleBadgeClass } from './userStyles';

type UserRoleBadgeProps = {
  roleName: string;
};

export function UserRoleBadge({ roleName }: UserRoleBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold tracking-[0.04em] ${roleBadgeClass(
        roleName,
      )}`}
    >
      {roleName}
    </span>
  );
}
