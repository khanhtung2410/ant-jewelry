import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => readFileSync(path.join(root, relativePath), 'utf8');

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

const jobNames = (content: string): string[] =>
  block(content, 'jobs')
    .split('\n')
    .map((line) => line.match(/^ {2}([A-Za-z0-9_-]+):\s*$/)?.[1])
    .filter((name): name is string => Boolean(name));

const needsOf = (content: string, job: string): string[] => {
  const needs = block(block(content, 'jobs'), job, 2).match(/^ {4}needs:\s*(.+)$/m)?.[1];
  if (!needs) return [];
  return needs
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((target) => target.trim())
    .filter(Boolean);
};

describe('deploy workflow graph', () => {
  it('resolves every needs target and has no cycle', () => {
    const content = read('.github/workflows/deploy.yml');
    const names = jobNames(content);
    expect(names.length).toBeGreaterThan(0);

    const graph = new Map(names.map((name) => [name, needsOf(content, name)]));
    for (const [job, targets] of graph) {
      for (const target of targets) {
        expect(names, `${job} needs unknown job ${target}`).toContain(target);
      }
    }

    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (job: string) => {
      expect(visiting.has(job), `cycle through ${job}`).toBe(false);
      if (visited.has(job)) return;
      visiting.add(job);
      for (const target of graph.get(job) ?? []) visit(target);
      visiting.delete(job);
      visited.add(job);
    };
    for (const job of names) visit(job);
  });

  it('keeps the production deploy chain in the real order', () => {
    const content = read('.github/workflows/deploy.yml');
    expect(needsOf(content, 'verify-ci')).toEqual([]);
    expect(needsOf(content, 'check-migrations')).toEqual(['verify-ci']);
    expect(needsOf(content, 'approval')).toEqual(['check-migrations']);
    expect(needsOf(content, 'migrate')).toEqual(['check-migrations', 'approval']);
    expect(needsOf(content, 'deploy')).toEqual(['verify-ci', 'migrate']);
    expect(needsOf(content, 'drill-approval')).toEqual([]);
    expect(needsOf(content, 'smoke')).toEqual(['deploy', 'drill-approval']);
    expect(needsOf(content, 'rollback')).toEqual(['deploy', 'smoke', 'drill-approval']);
    expect(needsOf(content, 'finalize')).toEqual(['smoke', 'rollback', 'drill-approval']);
  });

  it('names the CI workflow exactly and wires workflow_run to it', () => {
    const ci = read('.github/workflows/ci.yml');
    const deploy = read('.github/workflows/deploy.yml');
    expect(ci).toMatch(/^name: ci$/m);
    expect(block(deploy, 'workflow_run', 2)).toContain('workflows: [ci]');
  });

  it('has no unknown needs target in the CI workflow', () => {
    const content = read('.github/workflows/ci.yml');
    const names = jobNames(content);
    for (const job of names) {
      for (const target of needsOf(content, job)) {
        expect(names, `${job} needs unknown job ${target}`).toContain(target);
      }
    }
  });
});
