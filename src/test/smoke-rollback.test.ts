import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const workflowPath = '.github/workflows/deploy.yml';
const configPath = 'playwright.production.config.ts';

const read = (relativePath: string): string => readFileSync(path.join(root, relativePath), 'utf8');

// Return the indented body of one YAML mapping key, so an assertion cannot
// accidentally match a sibling block with the same key elsewhere in the file.
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

const job = (name: string): string => block(block(read(workflowPath), 'jobs'), name, 2);

describe('production smoke and rollback guard', () => {
  it('generates a Playwright HTML report without opening a browser', () => {
    const config = read(configPath);

    expect(config).toContain("['list']");
    expect(config, 'an HTML report is needed for the uploaded smoke artifact').toContain(
      "['html', { open: 'never' }]",
    );
  });

  it('smokes the production origin after deploy and uploads reports always', () => {
    const smoke = job('smoke');

    expect(smoke, 'the smoke job must exist').not.toBe('');
    expect(smoke).toContain('needs: deploy');
    expect(smoke).toContain('environment: production');
    expect(smoke).toContain('npm run test:smoke:production');
    expect(
      smoke,
      'a deployment URL cannot satisfy canonical assertions based on SITE_URL',
    ).not.toContain('needs.deploy.outputs.deployment_url');
    expect(smoke).toMatch(/if: always\(\)\n\s+uses: actions\/upload-artifact@v4/);
    expect(smoke).toContain('playwright-report-smoke');
    expect(smoke).toContain('playwright-report/');
    expect(smoke).toContain('test-results/');
  });

  it('feeds SITE_URL through smoke into the canonical assertions', () => {
    const smoke = job('smoke');
    const config = read(configPath);
    const spec = read('e2e/production.smoke.spec.ts');

    expect(
      smoke,
      'smoke must run against the production origin, not a per-deployment URL',
    ).toContain('BASE_URL: ${{ vars.SITE_URL }}');
    expect(config, 'the config must consume the injected BASE_URL').toContain(
      'process.env.BASE_URL',
    );
    expect(spec, 'the canonical assertion must use that same base URL').toContain(
      'canonicalFor(baseURL',
    );
  });

  it('captures the previous production URL before promoting the new deployment', () => {
    const deploy = job('deploy');

    expect(deploy).toContain('previous_url: ${{ steps.previous.outputs.previous_url }}');
    expect(deploy, 'the previous URL must be read before the new deployment is promoted').toMatch(
      /vercel@66\.6\.0 ls --prod --json/,
    );
    expect(deploy.indexOf('id: previous')).toBeLessThan(deploy.indexOf('id: deploy'));
    expect(
      deploy,
      'the pinned CLI returns an object with a deployments array, not a bare array',
    ).toContain('data.deployments');
    expect(deploy).toContain('deployment_url: ${{ steps.deploy.outputs.deployment_url }}');
  });

  it('rolls back to the captured deployment when the chain fails', () => {
    const rollback = job('rollback');

    expect(rollback, 'the rollback job must exist').not.toBe('');
    expect(rollback).toContain('needs: [deploy, smoke]');
    expect(rollback).toContain('if: failure()');
    expect(rollback).toContain('environment: production');
    expect(rollback).toContain('${{ needs.deploy.outputs.previous_url }}');
    expect(rollback).toContain('vercel@66.6.0 rollback');
    expect(rollback).toContain('--yes');
    expect(rollback, 'an empty rollback target must stop before calling the CLI').toContain(
      '-z "$PREVIOUS_URL"',
    );
  });

  it('leaves the workflow red when smoke failed even after a rollback', () => {
    const finalize = job('finalize');

    expect(finalize, 'the finalize job must exist').not.toBe('');
    expect(finalize).toContain('needs: [smoke, rollback]');
    expect(finalize).toContain('if: always()');
    expect(finalize).toContain("needs.smoke.result != 'success'");
    expect(finalize).toContain('exit 1');
  });

  it('gates a dispatch drill behind the production environment', () => {
    const content = read(workflowPath);
    const trigger = block(content, 'workflow_dispatch', 2);
    const smoke = job('smoke');
    const rollback = job('rollback');
    const deploy = job('deploy');
    const migrate = job('migrate');

    expect(trigger, 'workflow_dispatch must exist').not.toBe('');
    expect(trigger).toContain('base_url:');
    expect(trigger).toContain('previous_deployment_url:');
    expect(trigger).toContain('simulate_failure:');
    expect(smoke, 'the drill must override BASE_URL with its input').toContain('inputs.base_url');
    expect(
      smoke,
      'the drill smoke step must set BASE_URL explicitly instead of relying on GITHUB_ENV precedence',
    ).toContain('BASE_URL: ${{ inputs.base_url }}');
    expect(smoke).toContain('inputs.simulate_failure');
    expect(rollback, 'the drill must never roll back a URL other than the given one').toContain(
      'inputs.previous_deployment_url',
    );
    expect(deploy, 'a drill must skip the real deploy').toContain(
      "github.event_name != 'workflow_dispatch'",
    );
    expect(migrate, 'a drill must skip migrations').toContain(
      "github.event_name != 'workflow_dispatch'",
    );
  });
});
