import { ShieldCheck, Users, UserSquare2 } from 'lucide-react';

type UserStatsProps = {
  adminCount: number;
  employeeCount: number;
  totalUsers: number;
};

const stats = (totalUsers: number, adminCount: number, employeeCount: number) => [
  {
    label: 'Total de usuarios',
    value: totalUsers,
    description: 'Cuentas registradas en la plataforma',
    icon: Users,
    tone: 'from-slate-950 via-slate-900 to-blue-950 text-white',
    softTone: 'bg-white/12 text-slate-100 ring-1 ring-white/15',
  },
  {
    label: 'Administradores',
    value: adminCount,
    description: 'Usuarios con control total del panel',
    icon: ShieldCheck,
    tone: 'from-blue-600 via-indigo-600 to-violet-600 text-white',
    softTone: 'bg-white/12 text-blue-50 ring-1 ring-white/15',
  },
  {
    label: 'Empleados',
    value: employeeCount,
    description: 'Equipo operativo con acceso interno',
    icon: UserSquare2,
    tone: 'from-emerald-500 via-teal-500 to-cyan-600 text-white',
    softTone: 'bg-white/12 text-emerald-50 ring-1 ring-white/15',
  },
];

export function UserStats({ adminCount, employeeCount, totalUsers }: UserStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats(totalUsers, adminCount, employeeCount).map((item) => (
        <article
          key={item.label}
          className={`relative overflow-hidden rounded-[30px] bg-gradient-to-br ${item.tone} p-5 shadow-[0_26px_60px_rgba(15,23,42,0.14)]`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_34%)]" />
          <div className="absolute -right-10 top-10 h-36 w-36 rounded-full bg-white/10 blur-3xl" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-inherit/80">{item.label}</p>
              <strong className="mt-3 block text-3xl font-black tracking-tight">{item.value}</strong>
            </div>

            <span className={`relative inline-flex h-12 w-12 items-center justify-center rounded-2xl ${item.softTone}`}>
              <item.icon className="h-5 w-5" />
            </span>
          </div>

          <p className="relative mt-4 max-w-[18rem] text-sm leading-6 text-inherit/75">{item.description}</p>

          <div className="relative mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-inherit/65">
            <span className="h-2 w-2 rounded-full bg-current opacity-70" />
            Panel activo
          </div>
        </article>
      ))}
    </div>
  );
}
