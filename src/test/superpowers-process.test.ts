import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string): string => readFileSync(path.join(root, relativePath), 'utf8');

const requiredRuleTokens = [
  'docs/reviews/TEMPLATE.md',
  'grep',
  'flow test',
  'mentor checklist',
  'owner feedback',
  'historical',
  '##',
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

  it('keeps an AI_LOG header above every verbatim-prompt heading', () => {
    const lines = read('AI_LOG.md').split('\n');
    let sawHeader = false;
    for (const line of lines) {
      if (line.startsWith('## ')) sawHeader = true;
      if (line === '### Prompt nguyên văn đã dùng') {
        expect(sawHeader, 'every verbatim prompt must have an earlier ## header').toBe(true);
      }
    }
  });
});
