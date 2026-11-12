export type MoveDirection = 'up' | 'down';

/**
 * Returns a new ordered id list with `id` moved one position up or down.
 * Unknown ids and moves outside the list are returned unchanged.
 */
export function moveIdInOrder(ids: string[], id: string, direction: MoveDirection): string[] {
  const index = ids.indexOf(id);
  if (index === -1) return ids;

  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= ids.length) return ids;

  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
