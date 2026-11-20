import { readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const baselineReports = [
  'prod-blog-v4-1.json.gz',
  'prod-blog-v4-2.json.gz',
  'prod-blog-v4-3.json.gz',
  'prod-home-v4-1.json.gz',
  'prod-home-v4-2.json.gz',
  'prod-home-v4-3.json.gz',
  'prod-ivy-1.json.gz',
  'prod-ivy-2.json.gz',
  'prod-ivy-3.json.gz',
  'prod-product-v4-1.json.gz',
  'prod-product-v4-2.json.gz',
  'prod-product-v4-3.json.gz',
];

describe('Lighthouse reports kept in git', () => {
  it('contains only the compressed v4 and ivy baseline, no raw or superseded rounds', () => {
    const files = readdirSync(path.join(process.cwd(), 'docs/lighthouse-reports')).sort();

    expect(files).toEqual(baselineReports);
  });
});
