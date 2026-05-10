import { Search } from 'lucide-react';
import type { ChangeEvent } from 'react';

type UserSearchBarProps = {
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  searchQuery: string;
};

export function UserSearchBar({ onSearchChange, searchQuery }: UserSearchBarProps) {
  return (
    <div className="rounded-[24px] border border-slate-200/90 bg-white/85 p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] backdrop-blur-sm">
      <label className="flex items-center gap-3 rounded-[18px] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-4 py-3" htmlFor="users-search">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <Search className="h-4 w-4" />
        </span>
        <input
          className="w-full border-0 bg-transparent p-0 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0"
          id="users-search"
          onChange={onSearchChange}
          placeholder="Buscar por nombre, usuario, correo o rol..."
          type="search"
          value={searchQuery}
        />
      </label>
    </div>
  );
}
