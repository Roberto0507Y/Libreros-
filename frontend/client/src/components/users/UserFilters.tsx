import type { ChangeEvent } from 'react';
import { Filter, RotateCcw } from 'lucide-react';

import type { RoleOption } from '../../domain/types';
import { UserSearchBar } from './UserSearchBar';

type UserFiltersProps = {
  filterRoleId: string;
  onClear?: () => void;
  onFilterRoleChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  roles: RoleOption[];
  searchQuery: string;
};

export function UserFilters({
  filterRoleId,
  onClear,
  onFilterRoleChange,
  onSearchChange,
  roles,
  searchQuery,
}: UserFiltersProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px_auto]">
      <UserSearchBar onSearchChange={onSearchChange} searchQuery={searchQuery} />

      <div className="rounded-[24px] border border-slate-200/90 bg-white/85 p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] backdrop-blur-sm">
        <label
          className="flex items-center gap-3 rounded-[18px] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-4 py-3"
          htmlFor="users-role-filter"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <Filter className="h-4 w-4" />
          </span>
          <select
            className="w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-800 outline-none focus:ring-0"
            id="users-role-filter"
            onChange={onFilterRoleChange}
            value={filterRoleId}
          >
            <option value="">Todos los roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        className="inline-flex h-[58px] items-center justify-center gap-2 rounded-[20px] border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:bg-slate-50"
        onClick={onClear}
        type="button"
      >
        <RotateCcw className="h-4 w-4" />
        Limpiar
      </button>
    </div>
  );
}
