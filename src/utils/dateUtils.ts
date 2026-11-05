/** OrangeHRM 5.x default date format is yyyy-dd-mm (Admin > Localization can change it). */
export function formatDate(date: Date, format = 'yyyy-dd-mm'): string {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return format.replace('yyyy', yyyy).replace('mm', mm).replace('dd', dd);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export const today = () => formatDate(new Date());
