import { describe, it, expect } from 'vitest';
import pkg from '../package.json';

describe('project config', () => {
  it('name is lowercase', () => {
    expect(pkg.name).toBe(pkg.name?.toLowerCase());
  });

  it('has required scripts', () => {
    for (const script of ['dev', 'build', 'typecheck', 'test']) {
      expect(pkg.scripts).toHaveProperty(script);
    }
  });
});
