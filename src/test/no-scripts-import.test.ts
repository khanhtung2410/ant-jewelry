import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => readFileSync(path.join(root, relativePath), 'utf8');

describe('server code does not depend on scripts/', () => {
  it('product-image-storage uses the in-app resize helper', () => {
    const source = read('src/features/products/server/product-image-storage.ts');

    expect(source).toContain("from './product-image-processing'");
    expect(source).not.toMatch(/from\s+['"][^'"]*scripts\//);
  });

  it('the legacy migration CLI imports the helper from the server layer', () => {
    const source = read('scripts/reencode-legacy-uploads.ts');

    expect(source).toContain('src/features/products/server/product-image-processing');
  });
});
