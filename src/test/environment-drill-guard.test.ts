import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const workflowPath = '.github/workflows/deploy.yml';

const read = (relativePath: string): string => readFileSync(path.join(root, relativePath), 'utf8');

// Return the indented body of one YAML mapping key so a drill job cannot be
// confused with a sibling job that declares the same environment key.
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

const jobs = (): string => block(read(workflowPath), 'jobs');
const job = (name: string): string => block(jobs(), name, 2);

// Run the same parser that the workflow uses for the GET alias response after
// the rollback POST. The payload crosses from the Vercel REST body into the
// comparison against the requested deployment id, so a mismatch must be red.
const runAliasParser = (payload: unknown, target: string) => {
  const script = job('rollback').match(
    /\n          TARGET_ID="\$PREVIOUS_ID" node -e '([\s\S]*?)' "\$body"/,
  )?.[1];
  if (!script) throw new Error('The rollback job no longer embeds the alias parser.');
  return spawnSync(process.execPath, ['-e', script, JSON.stringify(payload)], {
    encoding: 'utf8',
    env: { ...process.env, TARGET_ID: target },
  });
};

// The POST body crosses from the Vercel REST response into the evidence line
// that the drill records, so a response without the old id must fail the step.
const runPostParser = (payload: unknown) => {
  const script = job('rollback').match(
    /\n          node -e '([\s\S]*?)' "\$\(cat rollback-response\.json\)"/,
  )?.[1];
  if (!script) throw new Error('The rollback job no longer embeds the POST parser.');
  return spawnSync(process.execPath, ['-e', script, JSON.stringify(payload)], {
    encoding: 'utf8',
  });
};

describe('production drill environment guard', () => {
  it('gates dispatch drills behind a separate reviewer environment', () => {
    const drill = block(jobs(), 'drill-approval', 2);

    expect(drill, 'the drill gate must be its own job').not.toBe('');
    expect(drill).toContain('environment: production-drill');
    expect(drill, 'normal deploys must not wait for a reviewer').toContain(
      "if: github.event_name == 'workflow_dispatch'",
    );
  });

  it('keeps the normal deploy chain off the drill gate', () => {
    for (const name of ['check-migrations', 'approval', 'migrate', 'deploy']) {
      expect(job(name), `${name} must not depend on a drill`).not.toContain('drill-approval');
    }
  });

  it('requires the drill gate before the dispatch smoke can run', () => {
    const smoke = job('smoke');

    expect(smoke).toContain('needs: [deploy, drill-approval]');
    expect(smoke, 'a dispatch with no approval must not smoke').toContain(
      "needs.drill-approval.result == 'success'",
    );
    expect(smoke, 'an ordinary deploy must still smoke after a green deploy').toContain(
      "github.event_name != 'workflow_dispatch' && needs.deploy.result == 'success'",
    );
  });

  it('records the alias before and after a rollback POST', () => {
    const rollback = job('rollback');

    expect(rollback, 'the before GET belongs to the rollback job').toContain(
      'Record the alias before rollback',
    );
    expect(rollback, 'the after GET must prove the alias moved').toContain(
      'Record the alias after rollback',
    );
    const before = rollback.indexOf('Record the alias before rollback');
    const post = rollback.indexOf('- name: Roll back to the previous production deployment');
    const after = rollback.indexOf('Record the alias after rollback');
    expect(before).toBeLessThan(post);
    expect(post).toBeLessThan(after);
  });

  it('verifies the deployment id that crosses from the alias REST response', () => {
    const matching = runAliasParser(
      {
        alias: 'ant-jewelry.vercel.app',
        deploymentId: 'dpl_current123',
        deployment: { url: 'ant-jewelry-current.vercel.app', state: 'READY' },
      },
      'dpl_current123',
    );
    expect(matching.status, matching.stderr).toBe(0);
    expect(matching.stdout).toContain('Confirmed alias deploymentId dpl_current123');

    const mismatched = runAliasParser(
      {
        alias: 'ant-jewelry.vercel.app',
        deploymentId: 'dpl_old456',
        deployment: { url: 'ant-jewelry-old.vercel.app', state: 'READY' },
      },
      'dpl_current123',
    );
    expect(mismatched.status).toBe(1);
    expect(mismatched.stderr).toContain('is not the target dpl_current123');
  });

  it('requires oldDeploymentId in the rollback POST response', () => {
    const matching = runPostParser({
      alias: 'ant-jewelry.vercel.app',
      oldDeploymentId: 'dpl_current123',
      uid: 'dpl_old456',
    });
    expect(matching.status, matching.stderr).toBe(0);
    expect(matching.stdout).toContain('oldDeploymentId dpl_current123');

    const missing = runPostParser({ alias: 'ant-jewelry.vercel.app', uid: 'dpl_old456' });
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain('missing oldDeploymentId');
  });

  it('fails a dispatch drill whose approval gate never succeeded', () => {
    const finalize = job('finalize');

    expect(finalize, 'finalize must see the drill gate result').toContain(
      'needs: [smoke, rollback, drill-approval]',
    );
    expect(finalize, 'a rejected drill must not finish green').toContain(
      "if: github.event_name == 'workflow_dispatch' && needs.drill-approval.result != 'success'",
    );
  });

  it('captures the current alias during a dispatch smoke', () => {
    const smoke = job('smoke');
    const start = smoke.indexOf('- name: Record the current production alias');
    const nextStep = smoke.indexOf('- name:', start + 1);
    const capture = smoke.slice(start, nextStep === -1 ? undefined : nextStep);

    expect(smoke, 'the alias capture is drill evidence').toContain(
      '- name: Record the current production alias',
    );
    expect(capture).toContain("if: github.event_name == 'workflow_dispatch'");
    expect(capture).toContain(
      'https://api.vercel.com/v1/aliases/$alias_host?teamId=$VERCEL_ORG_ID',
    );
    expect(capture).toContain('Authorization: Bearer $VERCEL_TOKEN');
  });

  it('documents the live environment rules and the API check', () => {
    const content = read(workflowPath);
    const drillDoc = section(read('docs/DEPLOY.md'), '### Drill: smoke fail co y');
    const checklist = section(
      read('docs/DEPLOY.md'),
      '## Production readiness checklist (kèm bằng chứng)',
    );

    expect(content, 'the stale drill comment must be gone').not.toContain(
      'both the smoke and rollback jobs use the production environment',
    );
    expect(content).toContain('production-drill');
    expect(drillDoc).toContain('production-drill');
    expect(drillDoc, 'the drill doc must not claim a production reviewer').not.toContain(
      'phải qua required reviewer của Environment này',
    );
    expect(checklist, 'the environment rules must be checked live').toContain('kiểm bằng API');
    expect(drillDoc, 'the API output must name the branch rule').toContain(
      '"name":"main","type":"branch"',
    );
    expect(drillDoc, 'the API output must name the drill reviewer').toContain(
      '"reviewers":["khanhtung2410"]',
    );
  });
});
