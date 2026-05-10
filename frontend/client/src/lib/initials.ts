export const initialsFrom = (value: string) => {
  const cleaned = value.trim();
  if (!cleaned) return 'U';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? cleaned[0];
  const second = parts.length > 1 ? parts[1]?.[0] : cleaned[1];
  return `${String(first).toUpperCase()}${second ? String(second).toUpperCase() : ''}`;
};

