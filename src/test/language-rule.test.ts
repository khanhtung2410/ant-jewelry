import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { findDisallowedLetters } from '../../scripts/check-language.mjs';

const han = String.fromCodePoint(0x4e2d);
const hangul = String.fromCodePoint(0xd55c);
const cyrillic = String.fromCodePoint(0x042f);
const nonVietnameseLatinA = String.fromCodePoint(0x00c6);
const nonVietnameseLatinB = String.fromCodePoint(0x00ef);

const root = process.cwd();
const keyFiles = [
  'AGENTS.md',
  'README.md',
  'AI_LOG.md',
  'docs/CONTRIBUTING.md',
  'docs/ARCHITECTURE.md',
  'docs/DEPLOY.md',
  'docs/PERFORMANCE.md',
  'docs/REQUIREMENTS.md',
];

describe('Vietnamese and English only language rule', () => {
  it('allows English and Vietnamese letters', () => {
    expect(findDisallowedLetters('Ant Jewelry - san pham sản phẩm')).toEqual([]);
  });

  it('rejects Han, Hangul, Cyrillic and mojibake letters', () => {
    expect(findDisallowedLetters(han)).toEqual([han]);
    expect(findDisallowedLetters(hangul)).toEqual([hangul]);
    expect(findDisallowedLetters(cyrillic)).toEqual([cyrillic]);
    expect(findDisallowedLetters(nonVietnameseLatinA)).toEqual([nonVietnameseLatinA]);
    expect(findDisallowedLetters(nonVietnameseLatinB)).toEqual([nonVietnameseLatinB]);
  });

  it('finds no disallowed letters in current project documents', () => {
    for (const file of keyFiles) {
      const content = readFileSync(path.join(root, file), 'utf8');
      expect(
        findDisallowedLetters(content),
        `${file} uses only Vietnamese/English letters`,
      ).toEqual([]);
    }
  });
});
