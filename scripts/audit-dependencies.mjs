#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** The single advisory documented in docs/SECURITY.md and accepted until 2026-12-25. */
export const ALLOWED_ADVISORIES = ['GHSA-7589-6fvf-x4pw'];

const AUDIT_ARGS = ['audit', '--omit=dev', '--audit-level=high'];
const JSON_AUDIT_ARGS = [...AUDIT_ARGS, '--json'];

/** Returns the last URL segment, which npm uses for the advisory id. */
function advisoryIdFromUrl(url) {
  if (typeof url !== 'string') return null;
  const trimmed = url.replace(/[?#].*$/, '').replace(/\/+$/, '');
  const segment = trimmed.slice(trimmed.lastIndexOf('/') + 1);
  return segment.length > 0 ? segment : null;
}

/**
 * Resolves every advisory id behind a vulnerable package. A string `via` entry
 * names another vulnerable package in the same report, so its advisories are
 * inherited; skipping the string itself avoids inventing an id. The `seen` set
 * stops a report cycle from recursing forever.
 */
function advisoryIdsFor(name, vulnerabilities, seen) {
  if (seen.has(name)) return [];
  seen.add(name);

  const entry = vulnerabilities[name];
  const via = Array.isArray(entry?.via) ? entry.via : [];
  const ids = [];

  for (const item of via) {
    if (typeof item === 'string') {
      ids.push(...advisoryIdsFor(item, vulnerabilities, seen));
      continue;
    }
    if (!item || typeof item !== 'object') continue;
    const id = advisoryIdFromUrl(item.url);
    if (id) ids.push(id);
  }

  return ids;
}

/**
 * Returns the advisory ids that are not in the documented allowlist. A
 * vulnerability that resolves to no advisory object is reported by package
 * name, so an unexpected report shape fails closed instead of passing.
 */
export function evaluateAuditReport(report, allowedAdvisories = []) {
  const allowed = new Set(allowedAdvisories);
  const vulnerabilities = report?.vulnerabilities ?? {};
  const disallowed = new Set();

  for (const name of Object.keys(vulnerabilities)) {
    const ids = advisoryIdsFor(name, vulnerabilities, new Set());
    if (ids.length === 0) {
      disallowed.add(`${name} (no advisory id)`);
      continue;
    }
    for (const id of ids) {
      if (!allowed.has(id)) disallowed.add(id);
    }
  }

  return [...disallowed];
}

/** Every advisory id present in the report, after resolving string references. */
function collectAdvisoryIds(report) {
  const vulnerabilities = report?.vulnerabilities ?? {};
  const ids = new Set();

  for (const name of Object.keys(vulnerabilities)) {
    for (const id of advisoryIdsFor(name, vulnerabilities, new Set())) ids.add(id);
  }

  return [...ids];
}

function appendLine(output, line) {
  if (!output) return line;
  return output.endsWith('\n') ? `${output}${line}` : `${output}\n${line}`;
}

/**
 * Turns the live audit result and, after a failure, its JSON report into the
 * CLI output and exit code. The live output is replayed so the real advisory
 * list stays in the CI log. A live success passes through untouched; every
 * failure is explained only by the documented allowlist, otherwise the command
 * exits non-zero. Spawn errors, unreadable JSON and an empty report all fail
 * closed.
 */
export function classifyAuditCommands(liveResult, jsonResult, allowedAdvisories = []) {
  const liveStdout = liveResult?.stdout ?? '';
  const liveStderr = liveResult?.stderr ?? '';

  if (liveResult?.error || typeof liveResult?.status !== 'number') {
    return {
      exitCode: 1,
      stdout: liveStdout,
      stderr: appendLine(
        liveStderr,
        '[audit-dependencies] npm audit did not run or did not finish; refusing to pass.\n',
      ),
    };
  }

  if (liveResult?.status === 0) {
    return { exitCode: 0, stdout: liveStdout, stderr: liveStderr };
  }

  if (jsonResult?.error || typeof jsonResult?.status !== 'number') {
    return {
      exitCode: 1,
      stdout: liveStdout,
      stderr: appendLine(
        liveStderr,
        '[audit-dependencies] npm audit --json did not run or did not finish; refusing to pass.\n',
      ),
    };
  }

  let report;
  try {
    report = JSON.parse(jsonResult?.stdout ?? '');
  } catch {
    return {
      exitCode: 1,
      stdout: liveStdout,
      stderr: appendLine(
        liveStderr,
        '[audit-dependencies] Could not read the JSON audit report; refusing to pass.\n',
      ),
    };
  }

  const vulnerabilities = report?.vulnerabilities;
  if (
    !vulnerabilities ||
    typeof vulnerabilities !== 'object' ||
    Object.keys(vulnerabilities).length === 0
  ) {
    return {
      exitCode: 1,
      stdout: liveStdout,
      stderr: appendLine(
        liveStderr,
        '[audit-dependencies] npm audit failed without a vulnerability report; refusing to pass.\n',
      ),
    };
  }

  const disallowed = evaluateAuditReport(report, allowedAdvisories);
  if (disallowed.length > 0) {
    return {
      exitCode: 1,
      stdout: liveStdout,
      stderr: appendLine(
        liveStderr,
        `[audit-dependencies] Disallowed advisories: ${disallowed.join(', ')}. See docs/SECURITY.md.\n`,
      ),
    };
  }

  const allowed = new Set(allowedAdvisories);
  const matched = collectAdvisoryIds(report).filter((id) => allowed.has(id));
  return {
    exitCode: 0,
    stdout: appendLine(
      liveStdout,
      `[audit-dependencies] Documented exception accepted: ${matched.join(', ')}. See docs/SECURITY.md.\n`,
    ),
    stderr: liveStderr,
  };
}

/**
 * Runs the literal high-severity production audit, then the same command with
 * --json when it fails. Output is captured in UTF-8 and replayed by the caller
 * so the real audit text stays visible and the classification stays testable.
 */
export function runAudit(options = {}) {
  const spawn = options.spawn ?? spawnSync;
  const npm = options.npm ?? 'npm';
  const allowedAdvisories = options.allowedAdvisories ?? ALLOWED_ADVISORIES;
  const spawnOptions = {
    encoding: 'utf8',
    env: options.env ?? { ...process.env, NO_COLOR: '1' },
    shell: process.platform === 'win32',
  };

  const liveResult = spawn(npm, AUDIT_ARGS, spawnOptions);
  if (!liveResult?.error && liveResult?.status === 0) {
    return classifyAuditCommands(liveResult, undefined, allowedAdvisories);
  }

  const jsonResult = spawn(npm, JSON_AUDIT_ARGS, spawnOptions);
  return classifyAuditCommands(liveResult, jsonResult, allowedAdvisories);
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const { exitCode, stdout, stderr } = runAudit();
  process.stdout.write(stdout);
  process.stderr.write(stderr);
  process.exit(exitCode);
}
