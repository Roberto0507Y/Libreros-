export const currency = new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  minimumFractionDigits: 2,
});

export const GUATEMALA_TIME_ZONE = 'America/Guatemala';

export const dateTime = new Intl.DateTimeFormat('es-GT', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: GUATEMALA_TIME_ZONE,
});

export const dateOnly = new Intl.DateTimeFormat('es-GT', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: GUATEMALA_TIME_ZONE,
});

export const timeOnly = new Intl.DateTimeFormat('es-GT', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: GUATEMALA_TIME_ZONE,
});

export const monthDay = new Intl.DateTimeFormat('es-GT', {
  day: '2-digit',
  month: 'short',
  timeZone: GUATEMALA_TIME_ZONE,
});

export const getGuatemalaDateInputValue = (value = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: GUATEMALA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);

  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';

  return `${year}-${month}-${day}`;
};
