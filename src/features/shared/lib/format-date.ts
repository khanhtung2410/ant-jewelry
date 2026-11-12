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

/**
 * Returns yyyy-mm-dd for an ISO timestamp in Vietnam time, suitable for
 * a date input value.
 */
export function toDateInputValue(isoDate: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(isoDate));

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function todayDateInputValue(): string {
  return toDateInputValue(new Date().toISOString());
}
