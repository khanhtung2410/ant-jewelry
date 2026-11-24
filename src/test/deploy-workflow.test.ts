import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { hasPendingMigrations } from '../../scripts/detect-pending-migrations.mjs';

const root = process.cwd();
const workflowPath = '.github/workflows/deploy.yml';
const VERCEL = 'npx --yes vercel@66.6.0';

const read = (relativePath: string): string => readFileSync(path.join(root, relativePath), 'utf8');

const readWorkflow = (): string => read(workflowPath);

// A markdown section is bounded by the next heading, so a doc assertion cannot
// accidentally match a different section with a similar phrase.
const section = (content: string, heading: string): string => {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) return '';
  const collected: string[] = [];
  let inFence = false;
  for (const line of lines.slice(start + 1)) {
    if (line.trimStart().startsWith('```')) {
      inFence = !inFence;
      collected.push(line);
      continue;
    }
    if (!inFence && /^#{1,3} /.test(line)) break;
    collected.push(line);
  }
  return collected.join('\n');
};

const job = (name: string): string => block(block(readWorkflow(), 'jobs'), name, 2);

// The capture step pipes the alias response into an embedded Node script. Run
// that exact script against a controller-verified payload so the test covers
// the value crossing from the REST body into the two GITHUB_OUTPUT lines.
const runCaptureParser = (payload: unknown) => {
  const script = job('deploy').match(/node -e '([\s\S]*?)'\)/)?.[1];
  if (!script) throw new Error('The capture step no longer embeds a Node parser.');
  return spawnSync(process.execPath, ['-e', script], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
  });
};

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
    expect(deploy).toContain('needs: [verify-ci, migrate]');
    expect(deploy).toContain('environment: production');
    expect(deploy).toContain('deployment_url');
    expect(deploy, 'the deploy job must check out the verified SHA').toContain(
      'ref: ${{ github.event.workflow_run.head_sha }}',
    );
  });

  it('deploys when approval was skipped and both real needs succeeded', () => {
    const deploy = block(block(readWorkflow(), 'jobs'), 'deploy', 2);

    expect(deploy, 'the deploy job must exist').not.toBe('');
    expect(deploy, 'a skipped approval must not propagate a skip to deploy').toContain(
      "if: always() && needs.verify-ci.result == 'success' && needs.migrate.result == 'success' && github.event_name != 'workflow_dispatch'",
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

  it('captures the previous deployment from the production alias endpoint', () => {
    const deploy = job('deploy');

    expect(deploy, 'the capture step must read the canonical alias from SITE_URL').toContain(
      'SITE_URL: ${{ vars.SITE_URL }}',
    );
    expect(deploy, 'the https prefix must be stripped from the alias host').toContain(
      '${SITE_URL#https://}',
    );
    expect(deploy, 'the alias endpoint returns the deployment the alias points at').toContain(
      'https://api.vercel.com/v1/aliases/$alias_host?teamId=$VERCEL_ORG_ID',
    );
    expect(deploy, 'the request must authenticate with the Vercel token').toContain(
      'Authorization: Bearer $VERCEL_TOKEN',
    );
    expect(deploy, 'a non-2xx response must fail before promotion').toContain('%{http_code}');
    expect(deploy, 'the deployment listing capture must be gone').not.toContain(
      'vercel@66.6.0 ls --prod --json',
    );
    expect(deploy, 'vercel ls has no uid field').not.toContain('current.uid');
  });

  it('parses the alias response into the deployment url and id', () => {
    const result = runCaptureParser({
      alias: 'ant-jewelry.vercel.app',
      deploymentId: 'dpl_previous123',
      deployment: { url: 'previous-deployment.vercel.app', state: 'READY' },
      target: 'production',
    });

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim().split('\n')).toEqual([
      'previous-deployment.vercel.app',
      'dpl_previous123',
    ]);
  });

  it('rejects an alias response missing the deployment url or id', () => {
    const missingId = runCaptureParser({
      deployment: { url: 'previous-deployment.vercel.app' },
    });
    const missingUrl = runCaptureParser({ deploymentId: 'dpl_previous123', deployment: {} });

    expect(missingId.status).not.toBe(0);
    expect(missingId.stderr).toContain('deployment.url or deploymentId');
    expect(missingUrl.status).not.toBe(0);
    expect(missingUrl.stderr).toContain('deployment.url or deploymentId');
  });

  it('documents the alias capture, the alias fallback and the exact finalize cases', () => {
    const deployDoc = read('docs/DEPLOY.md');
    const manual = section(deployDoc, '### Manual rollback');
    const architectureDeploy = read('docs/ARCHITECTURE.md')
      .split('\n')
      .filter((line) => line.includes('Job `finalize`'))
      .join('\n');

    expect(manual, 'manual rollback must take the id from the alias endpoint').toContain(
      'GET https://api.vercel.com/v1/aliases/',
    );
    expect(manual).toContain('deploymentId');
    expect(manual, 'uid is not a field of vercel ls').not.toContain('`uid`');
    expect(manual).not.toContain('ls --prod --json');
    expect(manual, 'dashboard promotion stays the fallback').toContain('Vercel dashboard');
    expect(architectureDeploy, 'architecture must describe the alias capture').toContain(
      '/v1/aliases/',
    );
    expect(architectureDeploy).toContain('deploymentId');
    expect(architectureDeploy, 'architecture must not claim uid').not.toContain('(`uid`)');
    expect(
      architectureDeploy,
      'finalize must not be red for every smoke that is not success',
    ).not.toContain('không `success`');
    expect(architectureDeploy).toContain('`cancelled`');
    expect(deployDoc, 'the https only alias input constraint must be explicit').toContain(
      'không chuyển `http://`',
    );
  });

  it('rolls back with the Vercel alias REST endpoint instead of the CLI', () => {
    const content = readWorkflow();
    const rollback = block(block(content, 'jobs'), 'rollback', 2);

    expect(rollback, 'the rollback job must exist').not.toBe('');
    expect(rollback, 'team-only tokens cannot resolve a CLI user for rollback').not.toContain(
      'rollback "$PREVIOUS_URL"',
    );
    expect(rollback, 'the alias API is scoped by the team id').toContain(
      'https://api.vercel.com/v2/deployments/$PREVIOUS_ID/aliases?teamId=$VERCEL_ORG_ID',
    );
    expect(rollback, 'the alias host must come from the canonical origin').toContain(
      'SITE_URL: ${{ vars.SITE_URL }}',
    );
    expect(rollback, 'the https prefix must be stripped before calling the API').toContain(
      '${SITE_URL#https://}',
    );
    expect(rollback).toContain('{\\"alias\\":\\"$alias_host\\"}');
    expect(content, 'SITE_URL stays an Environment variable, never a secret').not.toContain(
      'secrets.SITE_URL',
    );
  });

  it('checks pending migrations before the migration and deploy jobs', () => {
    const jobs = block(readWorkflow(), 'jobs');
    const check = block(jobs, 'check-migrations', 2);
    const approval = block(jobs, 'approval', 2);
    const migrate = block(jobs, 'migrate', 2);
    const deploy = block(jobs, 'deploy', 2);

    expect(check, 'the check-migrations job must exist').not.toBe('');
    expect(check).toContain('environment: production');
    expect(check).toContain('pending: ${{ steps.check.outputs.pending }}');
    expect(check, 'the workflow must name the status command it relies on').toContain(
      'db:migrate:status:production',
    );
    expect(check, 'status must be read through the detection wrapper').toContain(
      'node scripts/detect-pending-migrations.mjs',
    );

    expect(approval, 'the approval job must exist').not.toBe('');
    expect(approval).toContain('environment: migration-approval');
    expect(approval).toContain("needs.check-migrations.outputs.pending == 'true'");

    expect(migrate, 'the migrate job must exist').not.toBe('');
    expect(migrate).toContain('needs: [check-migrations, approval]');
    expect(migrate).toContain(
      "always() && (needs.approval.result == 'success' || needs.approval.result == 'skipped')",
    );
    expect(migrate).toContain('npm run db:migrate:production');
    expect(migrate, 'a failed status check must stop migration').toContain(
      'needs.check-migrations.result',
    );
    expect(migrate, 'the reviewer must see the commit and the snapshot reminder').toContain(
      'snapshot',
    );

    expect(deploy, 'deploy must wait for migrations').toContain('needs: [verify-ci, migrate]');
  });

  it('never applies migrations during the production build', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };

    expect(pkg.scripts['build:production']).toBe('npm run db:generate:production && next build');
    expect(pkg.scripts['build:production']).not.toContain('migrate');
    expect(existsSync(path.join(root, 'scripts/migrate-production.mjs'))).toBe(false);
  });

  it('links the workflow wrapper to the real status script across modules', () => {
    const wrapper = read('scripts/detect-pending-migrations.mjs');
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };

    expect(wrapper, 'the wrapper must run the status npm script').toContain(
      "['run', 'db:migrate:status:production']",
    );
    expect(wrapper, 'the wrapper must classify the captured output').toContain(
      'hasPendingMigrations(output)',
    );
    expect(pkg.scripts['db:migrate:status:production']).toContain('prisma migrate status');
  });

  it('feeds unknown status output through to the approval condition', () => {
    expect(hasPendingMigrations('A Prisma status line we do not recognise')).toBe(true);

    const jobs = block(readWorkflow(), 'jobs');
    const check = block(jobs, 'check-migrations', 2);
    const approval = block(jobs, 'approval', 2);

    expect(check, 'check-migrations must publish the pending output').toContain(
      'pending: ${{ steps.check.outputs.pending }}',
    );
    expect(approval, 'the pending output must drive the exact approval condition').toContain(
      "needs.check-migrations.outputs.pending == 'true'",
    );
  });

  it('keeps the Environment secret counts and direct URL rows consistent', () => {
    const deployDoc = read('docs/DEPLOY.md');
    const readme = read('README.md');
    const manual = section(deployDoc, '### Manual rollback');

    for (const phrase of [
      'chứa bốn secret',
      'đọc bốn secret của Environment',
      'bốn secret trong Environment',
      'đặt bốn secret Environment',
    ]) {
      expect(deployDoc, `DEPLOY.md must state four Environment secrets: ${phrase}`).toContain(
        phrase,
      );
    }
    expect(deployDoc, 'DEPLOY.md must not offer a DIRECT_URL row').not.toMatch(
      /^\|\s*`DIRECT_URL`/m,
    );
    expect(readme, 'README.md must not offer a DIRECT_URL row').not.toMatch(/^\|\s*`DIRECT_URL`/m);
    expect(manual, 'manual rollback must print the HTTP status').toContain('%{http_code}');
  });

  it('injects the direct database URL into every job that uses Prisma', () => {
    const jobs = block(readWorkflow(), 'jobs');

    for (const name of ['check-migrations', 'migrate', 'deploy']) {
      const job = block(jobs, name, 2);
      expect(job, `${name} must receive the direct database URL`).toContain(
        'DATABASE_URL: ${{ secrets.DATABASE_URL }}',
      );
    }
  });

  it('keeps the remaining application secrets in Vercel instead of GitHub', () => {
    const content = readWorkflow();

    for (const name of ['AUTH_SECRET', 'DIRECT_URL']) {
      expect(content, `${name} belongs to the Vercel project, not to this workflow`).not.toContain(
        name,
      );
    }
    expect(content, 'SITE_URL is an Environment variable, never a secret here').not.toContain(
      'secrets.SITE_URL',
    );
    expect(content, 'the smoke job must read the canonical origin from the Environment').toContain(
      'vars.SITE_URL',
    );
  });
});
