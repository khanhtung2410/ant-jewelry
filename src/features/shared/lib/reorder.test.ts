import { describe, expect, it } from 'vitest';
import { moveIdInOrder } from './reorder';

describe('moveIdInOrder', () => {
  it('moves an id up or down one position', () => {
    expect(moveIdInOrder(['a', 'b', 'c'], 'b', 'up')).toEqual(['b', 'a', 'c']);
    expect(moveIdInOrder(['a', 'b', 'c'], 'b', 'down')).toEqual(['a', 'c', 'b']);
  });

  it('returns the original list at the edges or for unknown ids', () => {
    expect(moveIdInOrder(['a', 'b'], 'a', 'up')).toEqual(['a', 'b']);
    expect(moveIdInOrder(['a', 'b'], 'b', 'down')).toEqual(['a', 'b']);
    expect(moveIdInOrder(['a', 'b'], 'missing', 'up')).toEqual(['a', 'b']);
    expect(moveIdInOrder([], 'a', 'down')).toEqual([]);
  });
});
