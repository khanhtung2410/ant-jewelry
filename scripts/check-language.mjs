import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ASCII = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const VIETNAMESE_LOWER = 'àáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩị' + 'òóỏõọồốổỗộờởớỡợùúủũụừứửữựỳýỷỹỵăâđêôơư';
const VIETNAMESE_UPPER = VIETNAMESE_LOWER.toUpperCase().replaceAll('Đ', 'Đ');

export const ALLOWED_LETTERS = new Set((ASCII + VIETNAMESE_LOWER + VIETNAMESE_UPPER).split(''));

/** Returns each letter outside the Vietnamese/English alphabet, in first-seen order. */
export function findDisallowedLetters(text) {
  const found = new Set();
  for (const match of text.matchAll(/\p{L}/gu)) {
    const letter = match[0];
    if (!ALLOWED_LETTERS.has(letter)) found.add(letter);
  }
  return [...found];
}

const SKIP_DIRS = new Set([
  '.git',
  '.next',
  'node_modules',
  'playwright-report',
  'test-results',
  '.superpowers',
]);
const SCAN_EXTENSIONS = /\.(md|ts|tsx|mjs|js|json|css|html|yml|yaml)$/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (SKIP_DIRS.has(entry)) continue;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SCAN_EXTENSIONS.test(entry)) out.push(full);
  }
  return out;
}

const invokedDirectly =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (invokedDirectly) {
  const root = process.cwd();
  const failures = [];
  for (const file of walk(root)) {
    const disallowed = findDisallowedLetters(readFileSync(file, 'utf8'));
    if (disallowed.length > 0) {
      failures.push(`${path.relative(root, file)}: ${disallowed.join(' ')}`);
    }
  }
  if (failures.length > 0) {
    console.error('Disallowed letters found (Vietnamese and English only):');
    for (const line of failures) console.error(line);
    process.exitCode = 1;
  } else {
    console.log('All tracked text files use Vietnamese and English letters only.');
  }
}
