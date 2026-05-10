import { Save } from 'lucide-react';
import { useState } from 'react';

import type { RoleOption, UserManagementItem } from '../../domain/types';
import { formatUserDate } from './userStyles';
import { UserAvatar } from './UserAvatar';
import { UserRoleBadge } from './UserRoleBadge';
import { UserStatusBadge } from './UserStatusBadge';

type UserCardProps = {
  isSaving: boolean;
  onRoleChange: (input: { roleId: number; userId: number }) => Promise<void>;
  roles: RoleOption[];
  user: UserManagementItem;
};

export function UserCard({ isSaving, onRoleChange, roles, user }: UserCardProps) {
  const [selectedRoleId, setSelectedRoleId] = useState(String(user.role.id));

  const hasChanges = Number(selectedRoleId) !== user.role.id;

  return (
    <article className="group rounded-[28px] border border-slate-200 bg-white/96 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_22px_40px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <UserAvatar name={user.profileName} size="md" />

          <div className="min-w-0">
            <h4 className="truncate text-base font-bold text-slate-950">{user.profileName}</h4>
            <p className="mt-1 truncate text-sm text-slate-500">{user.email}</p>
            <p className="mt-1 text-sm text-slate-400">@{user.username}</p>
          </div>
        </div>

        <UserStatusBadge active={user.active} />
      </div>

      <div className="mt-5 grid gap-4">
        <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Rol actual</span>
            <UserRoleBadge roleName={user.role.name} />
          </div>

          <div className="grid gap-3">
            <label className="text-xs font-medium text-slate-500" htmlFor={`mobile-role-${user.id}`}>
              Cambiar rol
            </label>
            <select
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              disabled={isSaving}
              id={`mobile-role-${user.id}`}
              onChange={(event) => setSelectedRoleId(event.target.value)}
              value={selectedRoleId}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-[24px] border border-slate-200 bg-slate-50/60 p-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Usuario</p>
            <p className="mt-2 font-medium text-slate-700">@{user.username}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Fecha</p>
            <p className="mt-2 font-medium text-slate-700">{formatUserDate(user.createdAt)}</p>
          </div>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!hasChanges || isSaving}
          onClick={() => void onRoleChange({ userId: user.id, roleId: Number(selectedRoleId) })}
          type="button"
        >
          {isSaving ? (
            'Actualizando...'
          ) : (
            <>
              <Save className="h-4 w-4" />
              Actualizar rol
            </>
          )}
        </button>
      </div>
    </article>
  );
}
