/**
 * Formats an ISO timestamp as dd/MM/yyyy in Vietnam time (Asia/Ho_Chi_Minh).
 */
export function formatPublishedDate(isoDate: string): string {
  const date = new Date(isoDate);

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
