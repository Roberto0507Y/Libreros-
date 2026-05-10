import { dateOnly } from '../../lib/format';

export const roleBadgeClass = (roleName: string) => {
  const normalized = roleName.toLowerCase();

  if (normalized.includes('super')) {
    return 'border border-violet-200 bg-violet-50 text-violet-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]';
  }

  if (normalized.includes('administrador')) {
    return 'border border-blue-200 bg-blue-50 text-blue-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]';
  }

  if (normalized.includes('vendedor') || normalized.includes('empleado')) {
    return 'border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]';
  }

  if (normalized.includes('cliente')) {
    return 'border border-amber-200 bg-amber-50 text-amber-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]';
  }

  return 'border border-slate-200 bg-slate-100 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]';
};

export const userTypeBadgeClass = (profileType: string) => {
  const normalized = profileType.toLowerCase();

  if (normalized.includes('empleado')) {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200';
  }

  if (normalized.includes('cliente')) {
    return 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200';
  }

  return 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200';
};

export const statusBadgeClass = (status: boolean | 'activo' | 'suspendido' | 'pendiente') => {
  if (status === true || status === 'activo') {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]';
  }

  if (status === 'pendiente') {
    return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]';
  }

  return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]';
};

export const getAvatarTone = (value: string) => {
  const tones = [
    'bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100',
    'bg-gradient-to-br from-slate-100 via-cyan-50 to-sky-100',
    'bg-gradient-to-br from-slate-100 via-emerald-50 to-teal-100',
    'bg-gradient-to-br from-slate-100 via-violet-50 to-fuchsia-100',
  ];

  const seed = value
    .split('')
    .reduce((accumulator, char) => accumulator + char.charCodeAt(0), 0);

  return tones[seed % tones.length];
};

export const getInitials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('');

export const formatUserDate = (value: string) =>
  dateOnly.format(new Date(value));
