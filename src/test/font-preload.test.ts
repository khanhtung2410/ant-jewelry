import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const layoutSource = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');

describe('root layout fonts', () => {
  it('preloads the intended subsets and avoids late font swaps', () => {
    const configs =
      layoutSource.match(
        /const (?:montserrat|robotoMono) = (?:Montserrat|Roboto_Mono)\(\{[\s\S]*?\n\}\);/g,
      ) ?? [];

    expect(configs).toHaveLength(2);

    for (const config of configs) {
      expect(config).toContain("subsets: ['latin', 'vietnamese']");
      expect(config).not.toContain("'latin-ext'");
      expect(config).toContain("display: 'optional'");
    }
  });
});
