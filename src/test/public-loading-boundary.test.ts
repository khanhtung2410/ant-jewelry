import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const publicSegmentDir = path.resolve(testDir, '../app/(public)');
const loadingExtensions = ['js', 'jsx', 'ts', 'tsx'];

describe('public segment loading boundary', () => {
  it('has no loading file that lets streamed content move the footer', () => {
    const loadingFiles = readdirSync(publicSegmentDir).filter((file) =>
      loadingExtensions.some((extension) => file === `loading.${extension}`),
    );

    expect(loadingFiles).toEqual([]);
  });
});
