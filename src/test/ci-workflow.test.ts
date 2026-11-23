import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const workflowPath = '.github/workflows/ci.yml';
const legacyWorkflowPath = '.github/workflows/npm-ci.yml';

const readWorkflow = (): string => readFileSync(path.join(root, workflowPath), 'utf8');

// GitHub Actions turns the workflow `name:` and the top-level job keys into the
// status check contexts that branch protection requires, so the guard reads the
// mapping blocks instead of searching the whole file.
const block = (content: string, key: string, indent = 0): string => {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((line) => new RegExp(`^ {${indent}}${key}:\\s*$`).test(line));
  if (start === -1) return '';

  const collected: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '') {
      collected.push(line);
      continue;
    }
    const lineIndent = line.match(/^ */)?.[0].length ?? 0;
    if (lineIndent <= indent) break;
    collected.push(line);
  }
  return collected.join('\n');
};

describe('CI workflow guard', () => {
  it('publishes exactly one workflow file named ci.yml', () => {
    expect(existsSync(path.join(root, workflowPath)), `${workflowPath} must exist`).toBe(true);
    expect(
      existsSync(path.join(root, legacyWorkflowPath)),
      `${legacyWorkflowPath} must be renamed`,
    ).toBe(false);
  });

  it('names the workflow ci and runs on main pushes and every pull request', () => {
    const content = readWorkflow();
    expect(content).toMatch(/^name: ci$/m);
    expect(content).toMatch(/^on:$/m);
    expect(block(content, 'push', 2)).toContain('branches: [main]');
    expect(content).toMatch(/^ {2}pull_request:/m);
    expect(block(content, 'pull_request', 2), 'pull_request must cover every branch').not.toContain(
      'branches:',
    );
  });

  it('installs dependencies the same way in every job', () => {
    const jobs = block(readWorkflow(), 'jobs');
    for (const job of ['static', 'test', 'build', 'e2e']) {
      const steps = block(jobs, job, 2);
      expect(steps, `${job} must check out the repository`).toContain('actions/checkout@v7');
      expect(steps, `${job} must use the npm cache`).toContain('cache: npm');
      expect(steps, `${job} must clean install`).toContain('run: npm ci');
      expect(steps, `${job} must generate the Prisma Client`).toContain('run: npm run db:generate');
      expect(steps, `${job} must generate the Next.js types`).toContain(
        'npx --no-install next typegen',
      );
    }
  });

  it('defines the four required status check jobs', () => {
    const jobs = block(readWorkflow(), 'jobs');
    expect(jobs, 'jobs: must be a top-level mapping').not.toBe('');

    for (const job of ['static', 'test', 'build', 'e2e']) {
      expect(block(jobs, job, 2), `${job} job must exist`).not.toBe('');
    }
  });

  it('runs the complete check set in the matching job', () => {
    const jobs = block(readWorkflow(), 'jobs');
    const staticJob = block(jobs, 'static', 2);
    const testJob = block(jobs, 'test', 2);
    const buildJob = block(jobs, 'build', 2);
    const e2eJob = block(jobs, 'e2e', 2);

    for (const command of [
      'npm run lint',
      'npm run typecheck',
      'npm run format:check',
      'npm run check:language',
    ]) {
      expect(staticJob, `static job must run ${command}`).toContain(`run: ${command}`);
    }
    expect(testJob).toContain('run: npm test');
    expect(buildJob).toContain('run: npm run db:push');
    expect(buildJob).toContain('run: npm run build');
    expect(e2eJob).toContain('run: npm run test:e2e');
  });

  it('caches the Playwright browsers in the e2e job', () => {
    const e2eJob = block(block(readWorkflow(), 'jobs'), 'e2e', 2);
    expect(e2eJob).toContain('actions/cache@v4');
    expect(e2eJob).toContain('ms-playwright');
    expect(e2eJob).toContain("hashFiles('package-lock.json')");
    expect(e2eJob).toContain('run: npx playwright install --with-deps chromium');
    expect(e2eJob, 'the Playwright report must upload only after a failure').toContain(
      'if: failure()',
    );
    expect(e2eJob).toContain('actions/upload-artifact@v4');
    expect(e2eJob).toContain('playwright-report/');
    expect(e2eJob).toContain('test-results/');
  });

  it('never runs the production build command that applies migrations', () => {
    expect(readWorkflow()).not.toContain('npm run build:production');
  });
});
