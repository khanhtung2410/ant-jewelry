import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('public segment loading boundary', () => {
  it('has no broad loading fallback that lets streamed content move the footer', () => {
    const loadingFile = path.resolve(process.cwd(), 'src/app/(public)/loading.tsx');

    expect(existsSync(loadingFile)).toBe(false);
  });
});
