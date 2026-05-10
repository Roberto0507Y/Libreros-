import { useEffect, useRef, useState, type ReactNode } from 'react';

import type { AppSection, SessionData } from '../../domain/types';
import { initialsFrom } from '../../lib/initials';
import {
  BellIcon,
  BrandIcon,
  CategoryIcon,
  ChevronDownIcon,
  DashboardIcon,
  DeliveryIcon,
  HistoryIcon,
  InventoryIcon,
  LogoutIcon,
  MenuIcon,
  ProductIcon,
  SaleIcon,
  SubcategoryIcon,
  SunIcon,
  UsersIcon,
} from '../icons';

const navItems: Array<{
  id: AppSection;
  label: string;
  description: string;
  roles?: string[];
}> = [
  { id: 'dashboard', label: 'Dashboard', description: 'Ingresos y resumen', roles: ['Administrador', 'Director', 'Vendedor'] },
  { id: 'inventory', label: 'Inventario', description: 'Stock y alertas', roles: ['Administrador', 'Director', 'Vendedor'] },
  { id: 'products', label: 'Productos', description: 'Listado y registro', roles: ['Administrador', 'Director', 'Vendedor'] },
  { id: 'categories', label: 'Categorías', description: 'Catálogo visual', roles: ['Administrador', 'Director'] },
  { id: 'brands', label: 'Marcas', description: 'Catálogo de marcas', roles: ['Administrador', 'Director'] },
  { id: 'subcategories', label: 'Subcategorías', description: 'Organiza por categoría', roles: ['Administrador', 'Director'] },
  { id: 'users', label: 'Usuarios', description: 'Roles y accesos', roles: ['Administrador', 'Director'] },
  { id: 'sales', label: 'Registrar venta', description: 'Salida de inventario', roles: ['Administrador', 'Director', 'Vendedor'] },
  { id: 'sales-history', label: 'Historial ventas', description: 'Cuadre diario y detalle', roles: ['Administrador', 'Director', 'Vendedor'] },
  { id: 'deliveries', label: 'Entregas', description: 'Rutas activas y seguimiento', roles: ['Administrador', 'Director', 'Repartidor'] },
  { id: 'my-deliveries', label: 'Mis entregas', description: 'Entregas completadas', roles: ['Repartidor'] },
  { id: 'deliveries-history', label: 'Historial entregas', description: 'Cierre y tiempos', roles: ['Administrador', 'Director'] },
];

type AppShellProps = {
  activeSection: AppSection;
  children: ReactNode;
  notificationsCount: number;
  onLogout: () => void;
  onNavigate: (section: AppSection) => void;
  session: SessionData;
};

const baseNavItemClass =
  'group grid min-h-[60px] grid-cols-[42px_minmax(0,1fr)] items-center gap-3 rounded-2xl border px-3 py-3 text-left transition duration-200';

const inactiveNavItemClass =
  'border-white/8 bg-white/[0.035] text-white/88 hover:-translate-y-0.5 hover:border-sky-300/25 hover:bg-white/[0.055]';

const activeNavItemClass =
  'border-sky-400/45 bg-gradient-to-r from-sky-500/28 to-sky-400/16 text-white shadow-[0_12px_24px_rgba(14,41,94,0.18)]';

export function AppShell({
  activeSection,
  children,
  notificationsCount,
  onLogout,
  onNavigate,
  session,
}: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const visibleNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(session.user.role.name),
  );

  const title = visibleNavItems.find((item) => item.id === activeSection)?.label ?? 'Dashboard';
  const subtitle =
    visibleNavItems.find((item) => item.id === activeSection)?.description ?? 'Mi cuenta';
  const avatarText = initialsFrom(session.user.username);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!userMenuRef.current) {
        return;
      }

      if (!userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className="grid h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_22%),linear-gradient(180deg,#f6f9fe_0%,#edf3fb_100%)] lg:grid-cols-[276px_minmax(0,1fr)]">
      {isSidebarOpen ? (
        <button
          aria-label="Cerrar menu"
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[276px] flex-col border-r border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_36%),linear-gradient(180deg,#0b1730_0%,#09152c_56%,#081225_100%)] px-4 py-4 shadow-[inset_-1px_0_0_rgba(255,255,255,0.04),0_24px_60px_rgba(6,18,37,0.30)] transition-transform duration-200 lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-[110%]'
        }`}
      >
        <div className="shrink-0">
          <div className="rounded-[26px] border border-sky-200/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_34%),linear-gradient(145deg,rgba(12,25,49,0.98),rgba(10,19,41,0.95))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="grid place-items-center">
              <img
                alt="Logo Libreria Nexus"
                className="block max-h-[54px] w-[min(110px,72%)] object-contain object-center drop-shadow-[0_8px_18px_rgba(37,99,235,0.10)]"
                src="/libreria.png"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-hidden">
          <nav aria-label="Menu" className="grid max-h-full gap-2 overflow-y-auto pr-1">
            {visibleNavItems.map((item) => (
              <button
                className={`${baseNavItemClass} ${
                  activeSection === item.id ? activeNavItemClass : inactiveNavItemClass
                }`}
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsSidebarOpen(false);
                }}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className={`grid h-[42px] w-[42px] place-items-center rounded-2xl border transition ${
                    activeSection === item.id
                      ? 'border-white/15 bg-white/12'
                      : 'border-white/7 bg-white/6 group-hover:bg-white/9'
                  } [&_.ui-icon]:h-5 [&_.ui-icon]:w-5 [&_.ui-icon]:stroke-[1.8] [&_.ui-icon]:text-white/90`}
                >
                  {item.id === 'dashboard' ? <DashboardIcon /> : null}
                  {item.id === 'inventory' ? <InventoryIcon /> : null}
                  {item.id === 'products' ? <ProductIcon /> : null}
                  {item.id === 'categories' ? <CategoryIcon /> : null}
                  {item.id === 'brands' ? <BrandIcon /> : null}
                  {item.id === 'subcategories' ? <SubcategoryIcon /> : null}
                  {item.id === 'users' ? <UsersIcon /> : null}
                  {item.id === 'sales' ? <SaleIcon /> : null}
                  {item.id === 'sales-history' ? <HistoryIcon /> : null}
                  {item.id === 'deliveries' || item.id === 'my-deliveries' || item.id === 'deliveries-history' ? <DeliveryIcon /> : null}
                </span>
                <span className="flex min-w-0 flex-col justify-center">
                  <strong className="block text-[15px] font-semibold leading-[1.15] tracking-[0.01em] text-inherit">
                    {item.label}
                  </strong>
                  <span className="mt-0.5 block text-[12.5px] font-medium leading-[1.2] text-slate-200/75">
                    {item.description}
                  </span>
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto shrink-0 border-t border-white/8 pt-4" />
      </aside>

      <div className="flex min-w-0 min-h-0 flex-col overflow-hidden">
        <header className="shrink-0 flex items-center justify-between gap-4 border-b border-white/60 bg-white/76 px-4 py-[1.05rem] shadow-[0_18px_40px_rgba(16,32,58,0.05)] backdrop-blur-2xl md:px-8">
          <div className="flex min-w-0 items-center gap-3.5">
            <button
              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-900/10 bg-white/90 lg:hidden"
              onClick={() => setIsSidebarOpen((current) => !current)}
              type="button"
            >
              <MenuIcon />
            </button>

            <div>
              <h1 className="m-0 text-[1.35rem] font-bold text-slate-950">{title}</h1>
              <p className="mt-1 text-[0.9rem] font-medium text-slate-700/70">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              aria-label="Notificaciones"
              className="relative grid h-11 w-11 place-items-center rounded-2xl border border-slate-900/10 bg-white/90 transition duration-200 hover:-translate-y-0.5"
              type="button"
            >
              <BellIcon />
              {notificationsCount > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute right-1.5 top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-blue-600 px-1 text-[11px] font-bold text-white shadow-[0_10px_18px_rgba(37,99,235,0.22)]"
                >
                  {notificationsCount > 99 ? '99+' : notificationsCount}
                </span>
              ) : null}
            </button>
            <button
              aria-label="Tema"
              className="hidden h-11 w-11 place-items-center rounded-2xl border border-slate-900/10 bg-white/90 transition duration-200 hover:-translate-y-0.5 sm:grid"
              type="button"
            >
              <SunIcon />
            </button>

            <div className="relative" ref={userMenuRef}>
              <button
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                className={`flex items-center gap-3 rounded-[22px] border border-slate-900/10 bg-white/90 px-3 py-2 shadow-[0_10px_24px_rgba(16,32,58,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(16,32,58,0.08)] ${
                  isUserMenuOpen ? 'border-sky-300/70 shadow-[0_14px_32px_rgba(37,99,235,0.10)]' : ''
                }`}
                onClick={() => setIsUserMenuOpen((current) => !current)}
                type="button"
              >
                <div className="grid h-[42px] w-[42px] place-items-center rounded-2xl bg-slate-950 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                  {avatarText}
                </div>
                <div className="hidden min-w-0 gap-0.5 text-left sm:grid">
                  <strong className="block truncate text-[14px] font-semibold leading-[1.15] text-slate-950">
                    {session.user.username}
                  </strong>
                  <span className="block truncate text-[12px] text-slate-600">{session.user.email}</span>
                </div>
                <span
                  aria-hidden="true"
                  className={`grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-600 transition duration-200 [&_.ui-icon]:h-4 [&_.ui-icon]:w-4 [&_.ui-icon]:fill-slate-500 ${
                    isUserMenuOpen ? 'rotate-180 bg-sky-50 text-sky-600' : ''
                  }`}
                >
                  <ChevronDownIcon />
                </span>
              </button>

              <div
                className={`absolute right-0 top-[calc(100%+0.7rem)] z-20 w-[280px] origin-top-right rounded-[24px] border border-slate-900/10 bg-white/96 p-3 shadow-[0_24px_50px_rgba(15,23,42,0.16)] backdrop-blur-xl transition duration-200 ${
                  isUserMenuOpen
                    ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                    : 'pointer-events-none -translate-y-2 scale-95 opacity-0'
                }`}
                role="menu"
              >
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                      {avatarText}
                    </div>
                    <div className="grid min-w-0 gap-0.5">
                      <strong className="block truncate text-sm font-semibold text-slate-950">
                        {session.user.username}
                      </strong>
                      <span className="block truncate text-xs text-slate-600">{session.user.email}</span>
                      <span className="mt-1 inline-flex items-center gap-2 text-xs font-medium text-slate-600">
                        <span
                          aria-hidden="true"
                          className="h-[7px] w-[7px] rounded-full bg-emerald-400 shadow-[0_0_0_2px_rgba(34,197,94,0.14)]"
                        />
                        En linea
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 border-t border-slate-200/80 pt-3">
                  <button
                    className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-left text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-slate-900"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 [&_.ui-icon]:h-4 [&_.ui-icon]:w-4 [&_.ui-icon]:stroke-[1.8] [&_.ui-icon]:text-white"
                    >
                      <LogoutIcon />
                    </span>
                    Cerrar sesion
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="content-area">{children}</main>
      </div>
    </div>
  );
}
