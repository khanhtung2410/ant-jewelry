import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { findDisallowedLetters } from '../../scripts/check-language.mjs';

const root = process.cwd();
const read = (relativePath: string): string => readFileSync(path.join(root, relativePath), 'utf8');

const requiredRuleTokens = [
  'docs/reviews/TEMPLATE.md',
  'grep',
  'flow test',
  'mentor checklist',
  'owner feedback',
  'historical',
  'immediately below the new `---`',
];

describe('Superpowers process guard', () => {
  it('pins the standing rule above the Next.js managed block', () => {
    const agents = read('AGENTS.md');
    expect(agents).toContain('### Standing working agreement');

    const managedStart = agents.indexOf('<!-- BEGIN:nextjs-agent-rules -->');
    expect(managedStart, 'AGENTS.md must keep the Next.js managed block marker').toBeGreaterThan(
      -1,
    );

    const standingText = agents.slice(0, managedStart);
    const rule10 = standingText.split('\n').find((line) => /^10\.\s/.test(line));
    expect(rule10, 'AGENTS.md must have item 10 in the standing list').toBeDefined();

    for (const token of requiredRuleTokens) {
      expect(rule10, `rule 10 must contain ${token}`).toContain(token);
    }
  });

  it('requires the full check output inside the pull request body', () => {
    const agents = read('AGENTS.md');
    const rule12 = agents.split('\n').find((line) => /^12\.\s/.test(line));
    expect(rule12, 'AGENTS.md must have item 12 in the standing list').toBeDefined();

    for (const token of ['PR body', 'full check output', 'EXIT=', 'spawnSync', 'NO_COLOR=1']) {
      expect(rule12, `rule 12 must contain ${token}`).toContain(token);
    }
  });

  it('requires the review template with its mandatory sections', () => {
    const template = read('docs/reviews/TEMPLATE.md');
    expect(template).toContain('- **Skill:** <exact skill id>');
    expect(template).toContain('## Checklist versus evidence');
  });

  it('points the contributing guide at the review template', () => {
    expect(read('docs/CONTRIBUTING.md')).toContain('docs/reviews/TEMPLATE.md');
  });

  it('forbids "superpowers" as a skill id in review records', () => {
    const files = readdirSync(path.join(root, 'docs/reviews')).filter((file) =>
      file.endsWith('.md'),
    );
    for (const file of files) {
      expect(
        read(path.join('docs/reviews', file)),
        `${file} must name an exact skill id`,
      ).not.toMatch(/^\s*-\s+\*\*Skill:\*\*\s+superpowers\s*$/m);
    }
  });

  it('keeps review records language-clean for the CI static check', () => {
    const files = readdirSync(path.join(root, 'docs/reviews')).filter((file) =>
      file.endsWith('.md'),
    );
    expect(files.length, 'review records must exist').toBeGreaterThan(0);
    for (const file of files) {
      expect(
        findDisallowedLetters(read(path.join('docs/reviews', file))),
        `${file} must use Vietnamese and English letters only`,
      ).toEqual([]);
    }
  });

  it('requires every review file to declare a concrete skill id', () => {
    const files = readdirSync(path.join(root, 'docs/reviews')).filter(
      (file) => file.endsWith('.md') && file !== 'TEMPLATE.md',
    );
    for (const file of files) {
      const content = read(path.join('docs/reviews', file));
      const match = content.match(/^\s*-\s+\*\*Skill:\*\*\s+(.+)$/m);
      expect(match, `${file} must have a - **Skill:** line`).toBeTruthy();
      expect(match?.[1].trim().toLowerCase(), `${file} skill id`).not.toBe('superpowers');
    }
  });

  it('keeps an AI_LOG header directly above every verbatim-prompt heading it owns', () => {
    // Normalize CRLF: an exact heading comparison silently skips every line on Windows otherwise.
    const content = read('AI_LOG.md').replace(/\r\n/g, '\n');
    const lines = content.split('\n');
    const separators = lines.reduce<number[]>((found, line, index) => {
      if (line.trim() === '---') found.push(index);
      return found;
    }, []);

    // The prepended entry and the entry it must preserve are the first three sections.
    // Older entries predate this rule and are outside the prepend regression this guard owns.
    const protectedEnd = separators[2] ?? lines.length;
    let sawHeader = false;
    let nearestNonBlank = '';

    for (let index = 0; index < protectedEnd; index += 1) {
      const line = lines[index];
      const trimmed = line.trim();
      if (trimmed === '') continue;

      if (trimmed === '---') {
        sawHeader = false;
        nearestNonBlank = '';
        continue;
      }

      if (line === '### Prompt nguyên văn đã dùng') {
        expect(sawHeader, 'every verbatim prompt must follow a header in its own entry').toBe(true);
        expect(
          nearestNonBlank.startsWith('## '),
          `orphaned prompt heading at line ${index + 1}; nearest non-blank line was "${nearestNonBlank}"`,
        ).toBe(true);
      }

      if (line.startsWith('## ')) sawHeader = true;
      nearestNonBlank = line;
    }

    expect(content, 'the preserved previous AI_LOG header must survive a prepend').toContain(
      '## 2026-11-20 15:37:07 +07:00 - D9/D10: Lighthouse evidence và script boundary',
    );
  });
});
