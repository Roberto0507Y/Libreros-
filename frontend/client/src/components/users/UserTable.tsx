import { Save, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { RoleOption, UserManagementItem } from '../../domain/types';
import { formatUserDate } from './userStyles';
import { UserAvatar } from './UserAvatar';
import { UserStatusBadge } from './UserStatusBadge';

type UserTableProps = {
  isSaving: boolean;
  onRoleChange: (input: { roleId: number; userId: number }) => Promise<void>;
  roles: RoleOption[];
  users: UserManagementItem[];
};

export function UserTable({ isSaving, onRoleChange, roles, users }: UserTableProps) {
  const [draftRoles, setDraftRoles] = useState<Record<number, string>>({});

  const roleValueByUser = useMemo(() => {
    return users.reduce<Record<number, string>>((accumulator, user) => {
      accumulator[user.id] = draftRoles[user.id] ?? String(user.role.id);
      return accumulator;
    }, {});
  }, [draftRoles, users]);

  return (
    <div className="overflow-hidden rounded-[30px] border border-slate-200/90 bg-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm">
      <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#f6f9ff_100%)] px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Vista de escritorio
            </p>
            <h4 className="mt-2 text-lg font-bold text-slate-950">Cuentas del sistema</h4>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            Roles administrables
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3 px-3">
          <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl">
            <tr>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Nombre
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Usuario
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Correo
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Rol
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Fecha
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Accion
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const selectedRoleId = roleValueByUser[user.id];
              const hasChanges = Number(selectedRoleId) !== user.role.id;

              return (
                <tr
                  className="group transition duration-200 hover:-translate-y-0.5"
                  key={user.id}
                >
                  <td className="rounded-l-[26px] border-y border-l border-slate-200 bg-white px-6 py-5 align-top shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition group-hover:border-slate-300 group-hover:bg-slate-50/60">
                    <div className="flex items-center gap-4">
                      <UserAvatar name={user.profileName} size="md" />
                      <div className="min-w-0">
                        <strong className="block truncate text-sm font-bold text-slate-950">
                          {user.profileName}
                        </strong>
                        <p className="mt-1 truncate text-sm text-slate-500">{user.email}</p>
                        <p className="mt-1 text-sm text-slate-400">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="border-y border-slate-200 bg-white px-6 py-5 align-middle shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition group-hover:border-slate-300 group-hover:bg-slate-50/60">
                    <UserStatusBadge active={user.active} />
                  </td>
                  <td className="border-y border-slate-200 bg-white px-6 py-5 align-middle text-sm text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition group-hover:border-slate-300 group-hover:bg-slate-50/60">
                    {user.email}
                  </td>
                  <td className="border-y border-slate-200 bg-white px-6 py-5 align-middle shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition group-hover:border-slate-300 group-hover:bg-slate-50/60">
                    <select
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      disabled={isSaving}
                      onChange={(event) =>
                        setDraftRoles((current) => ({
                          ...current,
                          [user.id]: event.target.value,
                        }))
                      }
                      value={selectedRoleId}
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border-y border-slate-200 bg-white px-6 py-5 align-middle text-sm text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition group-hover:border-slate-300 group-hover:bg-slate-50/60">
                    {formatUserDate(user.createdAt)}
                  </td>
                  <td className="rounded-r-[26px] border-y border-r border-slate-200 bg-white px-6 py-5 align-middle shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition group-hover:border-slate-300 group-hover:bg-slate-50/60">
                    <button
                      className="inline-flex min-w-[128px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!hasChanges || isSaving}
                      onClick={() => void onRoleChange({ userId: user.id, roleId: Number(selectedRoleId) })}
                      type="button"
                    >
                      {isSaving ? (
                        'Actualizando...'
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Guardar
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
