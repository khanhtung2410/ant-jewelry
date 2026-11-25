import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type LighthouseAssertionOptions = {
  minScore?: number;
  maxNumericValue?: number;
  aggregationMethod?: string;
};

type LighthouseConfig = {
  ci?: {
    collect?: {
      url?: string[];
      numberOfRuns?: number;
      settings?: { formFactor?: string; throttlingMethod?: string; chromeFlags?: string };
      startServerCommand?: string;
      startServerReadyPattern?: string;
    };
    assert?: {
      assertions?: Record<string, ['error' | 'warn' | 'off', LighthouseAssertionOptions]>;
    };
    upload?: { target?: string; outputDir?: string };
  };
};

const root = process.cwd();
const readConfig = (): LighthouseConfig =>
  JSON.parse(readFileSync(path.join(root, 'lighthouserc.json'), 'utf8')) as LighthouseConfig;

const collect = (config: LighthouseConfig) => config.ci?.collect ?? {};
const assertions = (config: LighthouseConfig) => config.ci?.assert?.assertions ?? {};

describe('Lighthouse CI configuration guard', () => {
  it('collects three mobile runs over the four storefront pages', () => {
    const settings = collect(readConfig());

    expect(settings.numberOfRuns).toBe(3);
    expect(settings.url).toEqual([
      'http://127.0.0.1:3200/',
      'http://127.0.0.1:3200/c/wedding-ring',
      'http://127.0.0.1:3200/p/aurora-band',
      'http://127.0.0.1:3200/blog/cach-chon-nhan-cuoi-phu-hop',
    ]);
    expect(settings.settings?.formFactor).toBe('mobile');
    expect(settings.settings?.throttlingMethod).toBe('simulate');
    expect(settings.startServerCommand).toContain('--port 3200');
    expect(settings.startServerReadyPattern).toBe('Local:\\s+http://127\\.0\\.0\\.1:3200');
  });

  it('launches Chromium without the sandbox so hosted runners can collect Lighthouse data', () => {
    const settings = collect(readConfig()).settings ?? {};

    expect(settings.chromeFlags ?? '').toContain('--no-sandbox');
  });

  it('enforces exactly the four median budget assertions at error level', () => {
    const config = readConfig();
    const entries = assertions(config);

    expect(Object.keys(entries)).toEqual([
      'categories:performance',
      'categories:accessibility',
      'categories:seo',
      'cumulative-layout-shift',
    ]);
    expect(entries['categories:performance']).toEqual([
      'error',
      { minScore: 0.85, aggregationMethod: 'median' },
    ]);
    expect(entries['categories:accessibility']).toEqual([
      'error',
      { minScore: 0.9, aggregationMethod: 'median' },
    ]);
    expect(entries['categories:seo']).toEqual([
      'error',
      { minScore: 0.95, aggregationMethod: 'median' },
    ]);
    expect(entries['cumulative-layout-shift']).toEqual([
      'error',
      { maxNumericValue: 0.1, aggregationMethod: 'median' },
    ]);
  });

  it('writes reports to the ignored artifact directory', () => {
    const config = readConfig();

    expect(config.ci?.upload?.target).toBe('filesystem');
    expect(config.ci?.upload?.outputDir).toBe('./lhci-report');
    expect(readFileSync(path.join(root, '.gitignore'), 'utf8')).toContain('/lhci-report/');
  });
});
