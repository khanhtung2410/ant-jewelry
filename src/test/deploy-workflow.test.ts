import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const workflowPath = '.github/workflows/deploy.yml';
const VERCEL = 'npx --yes vercel@66.6.0';

const read = (relativePath: string): string => readFileSync(path.join(root, relativePath), 'utf8');

const readWorkflow = (): string => read(workflowPath);

// The same block reader as the CI guard: it returns the indented body of one
// YAML mapping key so an assertion cannot accidentally match a sibling block.
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

describe('production deploy guard', () => {
  it('disables Vercel Git deployments and keeps the production build command', () => {
    const config = JSON.parse(read('vercel.json')) as {
      buildCommand?: string;
      git?: { deploymentEnabled?: unknown };
    };

    expect(config.buildCommand, 'Vercel must keep using the production build').toBe(
      'npm run build:production',
    );
    expect(
      config.git?.deploymentEnabled,
      'every branch must stop deploying through the Vercel Git integration',
    ).toBe(false);
  });

  it('deploys only for a completed CI run on main', () => {
    expect(existsSync(path.join(root, workflowPath)), `${workflowPath} must exist`).toBe(true);

    const content = readWorkflow();
    expect(content).toMatch(/^on:$/m);

    const trigger = block(content, 'workflow_run', 2);
    expect(trigger, 'deploy.yml must use the workflow_run event').not.toBe('');
    expect(trigger).toContain('workflows: [ci]');
    expect(trigger).toContain('types: [completed]');
    expect(trigger).toContain('branches: [main]');

    // `needs` only links jobs inside one workflow, so a cross-workflow gate
    // must live in `workflow_run` plus a guard job instead.
    expect(trigger, 'workflow_run must not declare needs').not.toContain('needs:');

    expect(block(content, 'push', 2), 'a push trigger would deploy before CI finishes').toBe('');
    expect(block(content, 'pull_request', 2), 'pull requests must never deploy').toBe('');
  });

  it('verifies the run succeeded and that its commit is still the tip of main', () => {
    const verify = block(block(readWorkflow(), 'jobs'), 'verify-ci', 2);

    expect(verify, 'the verify-ci job must exist').not.toBe('');
    expect(verify).toContain("github.event.workflow_run.conclusion == 'success'");
    expect(verify).toContain('github.event.workflow_run.head_sha');
    expect(verify, 'the guard must compare against the current main commit').toContain(
      'commits/main',
    );
  });

  it('deploys the verified commit inside the production environment', () => {
    const deploy = block(block(readWorkflow(), 'jobs'), 'deploy', 2);

    expect(deploy, 'the deploy job must exist').not.toBe('');
    expect(deploy).toContain('needs: verify-ci');
    expect(deploy).toContain('environment: production');
    expect(deploy).toContain('deployment_url');
    expect(deploy, 'the deploy job must check out the verified SHA').toContain(
      'ref: ${{ github.event.workflow_run.head_sha }}',
    );
  });

  it('builds from the lockfile with the npm cache', () => {
    const deploy = block(block(readWorkflow(), 'jobs'), 'deploy', 2);

    expect(deploy).toContain('actions/checkout@v7');
    expect(deploy).toContain('actions/setup-node@v7');
    expect(deploy).toContain('node-version: 22');
    expect(deploy).toContain('cache: npm');
    expect(deploy).toContain('run: npm ci');
  });

  it('serialises deploys in the production group without cancelling the running one', () => {
    const concurrency = block(readWorkflow(), 'concurrency');

    expect(concurrency, 'a top-level concurrency block must exist').not.toBe('');
    expect(concurrency).toContain('group: production');
    expect(concurrency).toContain('cancel-in-progress: false');
  });

  it('runs the three pinned Vercel commands with the environment token secrets', () => {
    const content = readWorkflow();

    for (const command of [
      `${VERCEL} pull --environment=production`,
      `${VERCEL} build --prod`,
      `${VERCEL} deploy --prebuilt --prod`,
    ]) {
      expect(content, `deploy.yml must run: ${command}`).toContain(command);
    }

    for (const secret of [
      '${{ secrets.VERCEL_TOKEN }}',
      '${{ secrets.VERCEL_ORG_ID }}',
      '${{ secrets.VERCEL_PROJECT_ID }}',
    ]) {
      expect(content, `deploy.yml must read ${secret}`).toContain(secret);
    }
  });

  it('keeps the application secrets in Vercel instead of GitHub', () => {
    const content = readWorkflow();

    for (const name of ['DATABASE_URL', 'AUTH_SECRET', 'SITE_URL', 'DIRECT_URL']) {
      expect(content, `${name} belongs to the Vercel project, not to this workflow`).not.toContain(
        name,
      );
    }
  });
});
