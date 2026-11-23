import { describe, expect, it } from 'vitest';

describe('C1 merge lock drill', () => {
  it('fails on purpose so branch protection blocks the merge', () => {
    expect(true).toBe(false);
  });
});
