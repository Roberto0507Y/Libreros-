import { useMemo, useState, type ChangeEvent } from 'react';
import { SearchX } from 'lucide-react';

import { UserCard } from '../components/users/UserCard';
import { UserFilters } from '../components/users/UserFilters';
import { UserSkeleton } from '../components/users/UserSkeleton';
import { UserTable } from '../components/users/UserTable';
import type { RoleOption, UserManagementItem } from '../domain/types';

type UsersPageProps = {
  isLoading: boolean;
  isSaving: boolean;
  onRoleChange: (input: { roleId: number; userId: number }) => Promise<void>;
  roles: RoleOption[];
  users: UserManagementItem[];
};

export function UsersPage({ isLoading, isSaving, onRoleChange, roles, users }: UsersPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoleId, setFilterRoleId] = useState('');

  const visibleUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery = !normalizedQuery
        ? true
        : [user.profileName, user.username, user.email, user.role.name]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery);
      const matchesRole = !filterRoleId ? true : user.role.id === Number(filterRoleId);

      return matchesQuery && matchesRole;
    });
  }, [filterRoleId, searchQuery, users]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleFilterRoleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFilterRoleId(event.target.value);
  };

  const handleRoleChange = async (input: { roleId: number; userId: number }) => {
    await onRoleChange(input);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterRoleId('');
  };

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white px-5 py-6 shadow-[0_20px_48px_rgba(15,23,42,0.06)] md:px-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
          Gestion de usuarios
        </p>
        <h2 className="m-0 text-2xl font-bold text-slate-900">Administra cuentas y roles</h2>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-6">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">
              Usuarios registrados
            </p>
            <h3 className="text-xl font-bold text-slate-900">Listado de usuarios</h3>
            <p className="mt-2 text-sm text-slate-500">
              Filtra por rol, busca cuentas especificas y actualiza permisos sin salir del modulo.
            </p>
          </div>

          <div className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            {visibleUsers.length} {visibleUsers.length === 1 ? 'resultado' : 'resultados'}
          </div>
        </div>

        <UserFilters
          filterRoleId={filterRoleId}
          onClear={handleClearFilters}
          onFilterRoleChange={handleFilterRoleChange}
          onSearchChange={handleSearchChange}
          roles={roles}
          searchQuery={searchQuery}
        />

        <div className="mt-6">
          {isLoading ? <UserSkeleton /> : null}

          {!isLoading && visibleUsers.length ? (
            <>
              <div className="hidden lg:block">
                <UserTable
                  isSaving={isSaving}
                  onRoleChange={handleRoleChange}
                  roles={roles}
                  users={visibleUsers}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:hidden">
                {visibleUsers.map((user) => (
                  <UserCard
                    isSaving={isSaving}
                    key={user.id}
                    onRoleChange={handleRoleChange}
                    roles={roles}
                    user={user}
                  />
                ))}
              </div>
            </>
          ) : null}

          {!isLoading && !visibleUsers.length ? (
            <div className="mt-5 rounded-[30px] border border-dashed border-slate-200 bg-[linear-gradient(180deg,#fafcff_0%,#f6f9ff_100%)] px-5 py-12 text-center">
              <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-[24px] bg-white text-slate-400 shadow-[0_14px_28px_rgba(15,23,42,0.06)]">
                <SearchX className="h-7 w-7" />
              </span>
              <strong className="mt-5 block text-lg text-slate-900">
                No hay usuarios para este filtro.
              </strong>
              <span className="mt-2 block text-sm text-slate-500">
                Prueba con otra busqueda o selecciona otro rol para seguir explorando.
              </span>
              <button
                className="mt-5 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={handleClearFilters}
                type="button"
              >
                Limpiar filtros
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
