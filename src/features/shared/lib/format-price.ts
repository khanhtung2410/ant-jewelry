/**
 * Formats a VND amount with dot thousands separators, e.g. 10000000 -> "10.000.000".
 * The unit is added by the calling component so the value stays reusable.
 */
export function formatPrice(price: number): string {
  const rounded = Math.round(price);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded).toString();

  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}
