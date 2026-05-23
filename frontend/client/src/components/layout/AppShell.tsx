import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Boxes,
  ChevronDown,
  FolderKanban,
  History,
  LayoutGrid,
  LogOut,
  Menu,
  PackageCheck,
  PackagePlus,
  Shapes,
  ShoppingCart,
  Tag,
  Truck,
  Users2,
} from 'lucide-react';

import { NexusLogo } from '../branding/NexusLogo';
import type { AppSection, SessionData } from '../../domain/types';
import { initialsFrom } from '../../lib/initials';

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
  onLogout: () => void;
  onNavigate: (section: AppSection) => void;
  session: SessionData;
};

const baseNavItemClass =
  'group relative flex min-h-[52px] items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all duration-300';

const inactiveNavItemClass =
  'border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950';

const activeNavItemClass =
  'border-rose-200 bg-[linear-gradient(135deg,#e11d48,#ef4444)] text-white shadow-[0_14px_28px_rgba(239,68,68,0.24)]';

const navIconMap: Record<AppSection, ReactNode> = {
  dashboard: <LayoutGrid className="ui-icon" />,
  inventory: <Boxes className="ui-icon" />,
  products: <PackagePlus className="ui-icon" />,
  categories: <FolderKanban className="ui-icon" />,
  brands: <Tag className="ui-icon" />,
  subcategories: <Shapes className="ui-icon" />,
  users: <Users2 className="ui-icon" />,
  sales: <ShoppingCart className="ui-icon" />,
  'sales-history': <History className="ui-icon" />,
  deliveries: <Truck className="ui-icon" />,
  'my-deliveries': <PackageCheck className="ui-icon" />,
  'deliveries-history': <Truck className="ui-icon" />,
};

function NavItemIcon({ id }: { id: AppSection }) {
  return navIconMap[id] ?? null;
}

export function AppShell({
  activeSection,
  children,
  onLogout,
  onNavigate,
  session,
}: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const visibleNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(session.user.role.name),
  );

  const title = visibleNavItems.find((item) => item.id === activeSection)?.label ?? 'Dashboard';
  const subtitle =
    visibleNavItems.find((item) => item.id === activeSection)?.description ?? 'Mi cuenta';
  const avatarText = initialsFrom(session.user.username);
  const desktopSidebarWidth = isSidebarCollapsed ? 104 : 280;
  const mobileQuickNavItems = visibleNavItems.slice(0, 4);

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
    <div className="flex h-screen overflow-hidden bg-[linear-gradient(180deg,#f5f7fb_0%,#eef2f8_100%)]">
      <AnimatePresence>
        {isSidebarOpen ? (
          <motion.button
            animate={{ opacity: 1 }}
            aria-label="Cerrar menu"
            className="fixed inset-0 z-30 bg-slate-950/32 backdrop-blur-sm lg:hidden"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            type="button"
          />
        ) : null}
      </AnimatePresence>

      <motion.aside
        animate={{ width: desktopSidebarWidth }}
        className={`fixed inset-y-0 left-0 z-40 flex h-screen shrink-0 flex-col overflow-x-hidden border-r border-slate-200/80 bg-white/96 px-3 py-3 shadow-[0_18px_44px_rgba(15,23,42,0.08)] transition-transform duration-300 lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-[110%]'
        }`}
        initial={false}
      >
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-200 pb-3 lg:hidden">
          <div className="flex items-center gap-3">
            <NexusLogo mode="navbar" />
            <span className="block truncate text-xs font-medium text-slate-500">{session.user.role.name}</span>
          </div>

          <motion.button
            whileHover={{ y: -1, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Cerrar sidebar"
            className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            onClick={() => setIsSidebarOpen(false)}
            type="button"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.button>
        </div>

        <div className="shrink-0">
          <div
            className={`transition-all duration-300 ${
              isSidebarCollapsed
                ? 'px-1 py-1'
                : 'px-1 py-1'
            }`}
          >
            <div className="grid place-items-center">
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <NexusLogo collapsed={isSidebarCollapsed} mode="sidebar" />
              </motion.div>
            </div>
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-hidden">
          <nav aria-label="Menu" className="grid max-h-full gap-1.5 overflow-x-hidden overflow-y-auto pr-1">
            {visibleNavItems.map((item) => (
              <motion.button
                whileHover={{ x: isSidebarCollapsed ? 0 : 2, y: -1 }}
                whileTap={{ scale: 0.985 }}
                className={`${baseNavItemClass} ${
                  activeSection === item.id ? activeNavItemClass : inactiveNavItemClass
                } ${isSidebarCollapsed ? 'min-h-[52px] justify-center rounded-[20px] px-0 py-2.5' : ''}`}
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsSidebarOpen(false);
                }}
                type="button"
              >
                {activeSection === item.id ? (
                  <motion.span
                    layoutId="admin-nav-active-glow"
                    className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_42%)]"
                  />
                ) : null}
                <span
                  aria-hidden="true"
                  className={`relative z-[1] grid h-[42px] w-[42px] shrink-0 place-items-center rounded-2xl border transition ${
                    activeSection === item.id
                      ? 'border-white/20 bg-white/15'
                      : 'border-slate-200 bg-slate-50 group-hover:bg-white'
                  } [&_.ui-icon]:h-5 [&_.ui-icon]:w-5 [&_.ui-icon]:stroke-[1.8] ${
                    activeSection === item.id
                      ? '[&_.ui-icon]:text-white'
                      : '[&_.ui-icon]:text-slate-500 group-hover:[&_.ui-icon]:text-slate-900'
                  }`}
                >
                  <NavItemIcon id={item.id} />
                </span>
                <AnimatePresence initial={false}>
                  {!isSidebarCollapsed ? (
                    <motion.span
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative z-[1] flex min-w-0 flex-1 flex-col justify-center"
                      exit={{ opacity: 0, x: -8 }}
                      initial={{ opacity: 0, x: -8 }}
                    >
                      <strong className="block text-[15px] font-semibold leading-[1.15] tracking-[0.01em] text-inherit">
                        {item.label}
                      </strong>
                      <span className={`mt-0.5 block text-[12.5px] font-medium leading-[1.2] ${
                        activeSection === item.id ? 'text-white/78' : 'text-slate-400'
                      }`}>
                        {item.description}
                      </span>
                    </motion.span>
                  ) : null}
                </AnimatePresence>

                {isSidebarCollapsed ? (
                  <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 hidden -translate-y-1/2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-medium text-slate-900 opacity-0 shadow-[0_16px_24px_rgba(15,23,42,0.12)] transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100 lg:block">
                    {item.label}
                  </span>
                ) : null}
              </motion.button>
            ))}
          </nav>
        </div>

        <div className="mt-auto shrink-0 border-t border-slate-200 pt-3">
          <div className={`rounded-[22px] border border-slate-200 bg-slate-50/90 transition-all duration-300 ${
            isSidebarCollapsed ? 'px-2 py-2' : 'px-3 py-3'
          }`}>
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-900">
                {avatarText}
              </div>
              {!isSidebarCollapsed ? (
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm font-semibold text-slate-950">{session.user.username}</strong>
                  <span className="block truncate text-xs text-slate-500">{session.user.role.name}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </motion.aside>

      <div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden">
        <div className="h-[5px] bg-[linear-gradient(90deg,#e11d48,#ef4444,#f97316)]" />
        <header className="shrink-0 flex items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(16,32,58,0.04)] md:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              aria-label={isSidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
              className="hidden h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white transition duration-200 hover:bg-slate-50 lg:grid"
              onClick={() => setIsSidebarCollapsed((current) => !current)}
              type="button"
            >
              <Menu className="h-4 w-4 text-slate-700" />
            </motion.button>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white transition duration-200 hover:bg-slate-50 lg:hidden"
              onClick={() => setIsSidebarOpen((current) => !current)}
              type="button"
            >
              <Menu className="h-4 w-4 text-slate-700" />
            </motion.button>

            <div className="min-w-0">
              <h1 className="m-0 truncate text-[1.02rem] font-bold uppercase tracking-[0.02em] text-slate-950 sm:text-[1.1rem] lg:text-[1.22rem]">{title}</h1>
              <p className="mt-1 hidden truncate text-[0.78rem] font-medium uppercase tracking-[0.14em] text-slate-400 sm:block">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative" ref={userMenuRef}>
              <button
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                className={`flex items-center gap-2 rounded-[22px] border border-slate-200 bg-white px-2.5 py-2 shadow-[0_10px_24px_rgba(16,32,58,0.04)] transition duration-200 hover:shadow-[0_14px_32px_rgba(16,32,58,0.08)] sm:gap-3 sm:px-3 ${
                  isUserMenuOpen ? 'border-rose-200 shadow-[0_14px_32px_rgba(244,63,94,0.10)]' : ''
                }`}
                onClick={() => setIsUserMenuOpen((current) => !current)}
                type="button"
              >
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,#111827,#334155)] text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] sm:h-[42px] sm:w-[42px]">
                  {avatarText}
                </div>
                <div className="hidden min-w-0 gap-0.5 text-left md:grid">
                  <strong className="block truncate text-[14px] font-semibold leading-[1.15] text-slate-950">
                    {session.user.username}
                  </strong>
                  <span className="block truncate text-[12px] text-slate-600">{session.user.email}</span>
                </div>
                <span
                  aria-hidden="true"
                  className={`grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-600 transition duration-200 [&_.ui-icon]:h-4 [&_.ui-icon]:w-4 [&_.ui-icon]:fill-slate-500 ${
                    isUserMenuOpen ? 'rotate-180 bg-rose-50 text-rose-600' : ''
                  }`}
                >
                  <ChevronDown className="h-4 w-4" />
                </span>
              </button>

              <div
                className={`absolute right-0 top-[calc(100%+0.7rem)] z-20 w-[280px] origin-top-right rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_24px_50px_rgba(15,23,42,0.12)] transition duration-200 ${
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
                      <LogOut className="ui-icon" />
                    </span>
                    Cerrar sesion
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="content-area min-w-0 w-full bg-[linear-gradient(180deg,#f7f8fc_0%,#eef2f8_100%)] px-3 py-3 pb-24 lg:px-4 lg:py-4 lg:pb-6">
          {children}
        </main>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-3 pt-2 lg:hidden">
        <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-between gap-2 rounded-[28px] border border-slate-200 bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
          {mobileQuickNavItems.map((item) => {
            const isActive = activeSection === item.id;

            return (
              <button
                className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-center transition-all duration-200 ${
                  isActive
                    ? 'bg-sky-50 text-sky-600 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.14)]'
                    : 'text-slate-500 hover:bg-slate-100/80'
                }`}
                key={item.id}
                onClick={() => onNavigate(item.id)}
                type="button"
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-2xl ${
                    isActive ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'
                  } [&_.ui-icon]:h-4.5 [&_.ui-icon]:w-4.5 [&_.ui-icon]:stroke-[1.9]`}
                >
                  <NavItemIcon id={item.id} />
                </span>
                <span className="truncate text-[11px] font-semibold">{item.label}</span>
              </button>
            );
          })}

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            aria-label="Abrir menu"
            className="flex w-[58px] shrink-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-slate-500 transition-all duration-200 hover:bg-slate-100/80"
            onClick={() => setIsSidebarOpen(true)}
            type="button"
          >
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-950 text-white">
              <Menu className="h-4 w-4" />
            </span>
            <span className="text-[11px] font-semibold">Menu</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
