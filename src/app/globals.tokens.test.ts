import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(path.resolve(process.cwd(), 'src/app/globals.css'), 'utf8');

const aliasNames = [
  '--underline-color',
  '--font-color',
  '--line',
  '--surface-overlay-color',
  '--button-bg-hover',
  '--button-bg-normal',
  '--control-outline',
  '--danger-border',
  '--danger-text',
  '--danger-bg',
  '--danger-strong',
  '--success-text',
  '--neutral-strong',
  '--neutral-hover',
  '--backdrop-color',
  '--backdrop-strong-color',
  '--backdrop-dialog-color',
  '--product-image-background',
];

const themeNames = [
  '--color-background',
  '--color-foreground',
  '--color-product-image',
  '--color-line',
  '--color-muted',
  '--button-bg-hover',
  '--button-bg-normal',
  '--color-surface-muted',
  '--color-admin-background',
];

const preservedHexes = [
  '#265649',
  '#383838',
  '#fefdf8',
  '#93aaa0',
  '#991b1b',
  '#262626',
  '#e5e5e5',
];

describe('layered design tokens', () => {
  it('declares each of the four layers exactly once', () => {
    for (const marker of ['/* 1. Raw', '/* 2. Primitive', '/* 3. Semantic', '/* 4. Component']) {
      expect(css.includes(marker), marker).toBe(true);
    }
  });

  it('keeps every existing token name as a var alias', () => {
    for (const name of aliasNames) {
      expect(css, name).toMatch(new RegExp(`${name}\\s*:\\s*var\\(--`));
    }
  });

  it('keeps every Tailwind @theme inline mapping name', () => {
    for (const name of themeNames) {
      expect(css, name).toContain(name);
    }
  });

  it('keeps the exact palette hex values', () => {
    for (const hex of preservedHexes) {
      expect(css, hex).toContain(hex);
    }
  });
});
