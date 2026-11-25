import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALLOWED_ADVISORIES } from '../../scripts/audit-dependencies.mjs';

const root = process.cwd();

const readRequired = (relativePath: string): string => {
  const fullPath = path.join(root, relativePath);
  expect(existsSync(fullPath), `${relativePath} must exist`).toBe(true);
  return readFileSync(fullPath, 'utf8').replace(/\r\n/g, '\n');
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Returns the indented lines below a `key:` mapping line, so assertions read a
 * real YAML block instead of matching text from an unrelated part of the file.
 */
const section = (content: string, key: string): string => {
  const lines = content.split('\n');
  const start = lines.findIndex((line) => {
    const match = line.match(/^( *)([A-Za-z0-9_.-]+):\s*$/);
    return match !== null && match[2] === key;
  });
  if (start === -1) return '';

  const baseIndent = (lines[start].match(/^ */) ?? [''])[0].length;
  const collected: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '') {
      collected.push(line);
      continue;
    }
    const lineIndent = (line.match(/^ */) ?? [''])[0].length;
    if (lineIndent <= baseIndent) break;
    collected.push(line);
  }
  return collected.join('\n');
};

/** Reads a scalar value such as `interval: weekly` from a block. */
const scalar = (content: string, key: string): string | undefined => {
  const match = content.match(
    new RegExp(`^\\s*(?:-\\s+)?${escapeRegExp(key)}:\\s*(.+?)\\s*$`, 'm'),
  );
  if (!match) return undefined;
  return match[1].replace(/^["']|["']$/g, '');
};

/** Reads a YAML sequence such as `- minor` / `- patch` from a block. */
const sequence = (content: string): string[] =>
  content
    .split('\n')
    .map((line) => line.match(/^\s*-\s+(.+?)\s*$/)?.[1])
    .filter((value): value is string => value !== undefined)
    .map((value) => value.replace(/^["']|["']$/g, ''));

/** Splits a block whose entries start with `- ` into individual entries. */
const listEntries = (content: string, marker: string): string[] => {
  const lines = content.split('\n');
  const starts: number[] = [];
  lines.forEach((line, index) => {
    if (new RegExp(`^\\s*-\\s+${escapeRegExp(marker)}:`).test(line)) starts.push(index);
  });
  return starts.map((start, index) =>
    lines.slice(start, starts[index + 1] ?? lines.length).join('\n'),
  );
};

/** Splits a job or step block into its `- ` list items. */
const steps = (job: string): string[] => {
  const lines = job.split('\n');
  const starts: number[] = [];
  lines.forEach((line, index) => {
    if (/^\s*-\s+/.test(line)) starts.push(index);
  });
  return starts.map((start, index) =>
    lines.slice(start, starts[index + 1] ?? lines.length).join('\n'),
  );
};

describe('Dependabot configuration', () => {
  it('is version 2 and configures exactly npm and github-actions', () => {
    const content = readRequired('.github/dependabot.yml');
    const entries = listEntries(content, 'package-ecosystem');

    expect(scalar(content, 'version')).toBe('2');
    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => scalar(entry, 'package-ecosystem'))).toEqual(
      expect.arrayContaining(['npm', 'github-actions']),
    );
  });

  for (const ecosystem of ['npm', 'github-actions']) {
    it(`updates ${ecosystem} weekly with one minor and patch group`, () => {
      const content = readRequired('.github/dependabot.yml');
      const entries = listEntries(content, 'package-ecosystem');
      const entry = entries.find(
        (candidate) => scalar(candidate, 'package-ecosystem') === ecosystem,
      );

      expect(entry, `dependabot must configure ${ecosystem}`).toBeDefined();
      expect(scalar(entry as string, 'directory')).toBe('/');
      expect(scalar(section(entry as string, 'schedule'), 'interval')).toBe('weekly');

      const groups = section(entry as string, 'groups');
      const group = section(groups, 'weekly-minor-patch');
      expect(group, 'the weekly-minor-patch group must exist').not.toBe('');
      expect(sequence(section(group, 'patterns'))).toEqual(['*']);
      expect(sequence(section(group, 'update-types'))).toEqual(['minor', 'patch']);
    });
  }
});

describe('CodeQL workflow', () => {
  it('scans main pushes, main pull requests and a weekly schedule', () => {
    const triggers = section(readRequired('.github/workflows/codeql.yml'), 'on');

    expect(section(triggers, 'push'), 'push must target main').toContain('branches: [main]');
    expect(section(triggers, 'pull_request'), 'pull requests must target main').toContain(
      'branches: [main]',
    );

    const cron = scalar(section(triggers, 'schedule'), 'cron');
    expect(cron, 'the schedule must define a cron expression').toBeDefined();
    const fields = (cron as string).split(/\s+/);
    expect(fields).toHaveLength(5);
    expect(fields[2]).toBe('*');
    expect(fields[3]).toBe('*');
    expect(fields[4], 'the cron must run once a week').toMatch(/^[0-6]$/);
  });

  it('grants read access to the repository and write access to security events', () => {
    const permissions = section(readRequired('.github/workflows/codeql.yml'), 'permissions');

    expect(permissions).toMatch(/^\s+contents: read$/m);
    expect(permissions).toMatch(/^\s+actions: read$/m);
    expect(permissions).toMatch(/^\s+security-events: write$/m);
  });

  it('runs one analyze job for javascript-typescript with the v3 actions', () => {
    const jobs = section(readRequired('.github/workflows/codeql.yml'), 'jobs');
    const jobNames = jobs
      .split('\n')
      .map((line) => line.match(/^ {2}([A-Za-z0-9_-]+):\s*$/)?.[1])
      .filter((name): name is string => name !== undefined);

    expect(jobNames).toEqual(['analyze']);

    const job = section(jobs, 'analyze');
    expect(job).toContain('javascript-typescript');
    expect(job).toContain('github/codeql-action/init@v3');
    expect(job).toContain('github/codeql-action/autobuild@v3');
    expect(job).toContain('github/codeql-action/analyze@v3');
  });

  it('cancels superseded runs of the same ref', () => {
    const concurrency = section(readRequired('.github/workflows/codeql.yml'), 'concurrency');

    expect(scalar(concurrency, 'cancel-in-progress')).toBe('true');
    expect(scalar(concurrency, 'group')).toContain('github.ref');
  });
});

describe('CI static job audit gate', () => {
  const staticJob = (): string => {
    const content = readRequired('.github/workflows/ci.yml');
    return section(section(content, 'jobs'), 'static');
  };

  it('runs the documented production audit in the static job', () => {
    expect(staticJob()).toContain('run: npm run audit:production');
  });

  it('never suppresses audit failures in the static job', () => {
    const job = staticJob();
    expect(job).not.toContain('continue-on-error');
    expect(job).not.toContain('|| true');
  });

  it('gives the audit step a name and keeps its command unsuppressed', () => {
    const auditStep = steps(staticJob()).find((step) =>
      step.includes('run: npm run audit:production'),
    );

    expect(auditStep, 'the static job must contain an audit step').toBeDefined();
    expect(auditStep as string).toMatch(/^\s*-\s+name:\s+\S/m);
    expect(auditStep as string).not.toContain('continue-on-error');
    expect(auditStep as string).not.toContain('|| true');
  });
});

describe('Security exception record', () => {
  const securityDoc = (): string => readRequired('docs/SECURITY.md');

  it('documents the advisory, the package chain and the pinned versions', () => {
    const doc = securityDoc();

    expect(doc).toContain('GHSA-7589-6fvf-x4pw');
    expect(doc).toContain('prisma -> @prisma/config -> effect');
    expect(doc).toContain('Prisma 7.10.1');
    expect(doc).toContain('3.20.0');
    expect(doc).toContain('6.12.0');
    expect(doc).toMatch(/breaking/i);
  });

  it('names the owner, the review date and the removal condition', () => {
    const doc = securityDoc();

    expect(doc).toContain('khanhtung2410');
    expect(doc).toContain('2026-12-25');
    expect(doc).toMatch(/remove this exception/i);
    expect(doc).toMatch(/patched/i);
  });

  it('links the exception to the CI step that enforces it', () => {
    const doc = securityDoc();

    expect(doc).toContain('.github/workflows/ci.yml');
    expect(doc).toContain('audit:production');
  });

  it('keeps the wrapper allowlist identical to the documented advisory', () => {
    const doc = securityDoc();

    expect(ALLOWED_ADVISORIES).toEqual(['GHSA-7589-6fvf-x4pw']);
    for (const advisory of ALLOWED_ADVISORIES) {
      expect(doc).toContain(advisory);
    }
  });
});
