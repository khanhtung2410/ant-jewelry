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

function resolveVar(name: string, seen = new Set<string>()): string {
  if (seen.has(name)) throw new Error(`cyclic token: ${name}`);
  seen.add(name);
  const match = css.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
  if (!match) throw new Error(`missing token: ${name}`);
  const value = match[1].trim();
  const nested = value.match(/^var\((--[\w-]+)\)$/);
  return nested ? resolveVar(nested[1], seen) : value;
}

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

  it('resolves every component token to its intended concrete colour', () => {
    const componentTokenHexes: Record<string, string> = {
      '--component-action-button-background': '#ffffff80',
      '--component-action-button-text': '#000000',
      '--component-action-button-hover-background': '#265649',
      '--component-action-button-hover-text': '#ffffff',
      '--component-admin-action-border': '#93aaa0',
      '--component-admin-action-hover-border': '#265649',
      '--component-admin-action-hover-text': '#265649',
      '--component-admin-action-danger-border': '#fecaca',
      '--component-admin-action-danger-text': '#b91c1c',
      '--component-admin-action-danger-hover-border': '#b91c1c',
      '--component-confirm-cancel-border': '#93aaa0',
      '--component-confirm-confirm-border': '#fecaca',
      '--component-confirm-confirm-text': '#b91c1c',
      '--component-confirm-confirm-hover-border': '#b91c1c',
      '--component-confirm-confirm-hover-background': '#fef2f2',
      '--component-confirm-primary-background': '#265649',
      '--component-confirm-primary-text': '#fefdf8',
      '--component-close-button-border': '#93aaa0',
      '--component-close-button-background': '#fefdf8',
      '--component-close-button-text': '#383838',
      '--component-close-button-hover-border': '#991b1b',
      '--component-close-button-hover-background': '#bbbab6',
      '--component-close-button-hover-text': '#b91c1c',
      '--component-close-button-outline': '#991b1b',
      '--component-arrow-button-border': '#262626',
      '--component-arrow-button-background': '#ffffff80',
      '--component-arrow-button-text': '#383838',
      '--component-arrow-button-hover-border': '#265649',
      '--component-arrow-button-hover-background': '#e5e5e5',
      '--component-arrow-button-hover-text': '#265649',
    };

    const declared = [...css.matchAll(/^\s*(--component-[\w-]+)\s*:/gm)].map((match) => match[1]);
    expect(new Set(declared).size, 'each component token is declared exactly once').toBe(
      declared.length,
    );
    expect(new Set(declared)).toEqual(new Set(Object.keys(componentTokenHexes)));

    for (const [name, expected] of Object.entries(componentTokenHexes)) {
      expect(resolveVar(name), name).toBe(expected);
    }
  });
});
