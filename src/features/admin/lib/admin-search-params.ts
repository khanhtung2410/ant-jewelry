export type SearchParam = string | string[] | undefined;

export function firstSearchParam(value: SearchParam): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}
