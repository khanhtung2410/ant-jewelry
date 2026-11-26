import { describe, expect, it } from 'vitest';
import {
  classifyAuditCommands,
  evaluateAuditReport,
  runAudit,
} from '../../scripts/audit-dependencies.mjs';

const allowed = ['GHSA-7589-6fvf-x4pw'];

const allowedReport = {
  vulnerabilities: {
    effect: {
      via: [
        {
          title: 'Effect ReDoS',
          url: 'https://github.com/advisories/GHSA-7589-6fvf-x4pw',
          severity: 'high',
          range: '<=3.22.0',
        },
      ],
    },
    prisma: {
      via: [
        {
          title: 'Effect ReDoS',
          url: 'https://github.com/advisories/GHSA-7589-6fvf-x4pw',
          severity: 'high',
          range: '>=6.13.0-dev.1',
        },
      ],
    },
  },
};

const liveFailure = { status: 1, stdout: 'npm audit high advisory output', stderr: '' };

function jsonResult(report: unknown) {
  return { status: 1, stdout: JSON.stringify(report), stderr: '' };
}

describe('evaluateAuditReport', () => {
  it('accepts a report that only contains the documented advisory', () => {
    expect(evaluateAuditReport(allowedReport, allowed)).toEqual([]);
  });

  it('returns a new advisory id that is not in the allowlist', () => {
    const report = {
      vulnerabilities: {
        effect: allowedReport.vulnerabilities.effect,
        unknown: {
          via: [
            {
              title: 'Unknown advisory',
              url: 'https://github.com/advisories/GHSA-NEW-0000-0000',
              severity: 'high',
            },
          ],
        },
      },
    };

    expect(evaluateAuditReport(report, allowed)).toEqual(['GHSA-NEW-0000-0000']);
  });

  it('follows string via entries to the advisory they name', () => {
    const report = {
      vulnerabilities: {
        '@prisma/config': {
          via: ['effect'],
        },
        prisma: {
          via: ['@prisma/config'],
        },
        effect: allowedReport.vulnerabilities.effect,
      },
    };

    expect(evaluateAuditReport(report, allowed)).toEqual([]);
  });

  it('fails closed when a vulnerability has no advisory object', () => {
    const report = {
      vulnerabilities: {
        'left-pad': {
          via: [],
        },
      },
    };

    const disallowed = evaluateAuditReport(report, allowed);
    expect(disallowed).toHaveLength(1);
    expect(disallowed[0]).toContain('left-pad');
  });

  it('fails closed when a string via entry names no reported vulnerability', () => {
    const report = {
      vulnerabilities: {
        ghost: {
          via: ['missing-package'],
        },
      },
    };

    const disallowed = evaluateAuditReport(report, allowed);
    expect(disallowed).toHaveLength(1);
    expect(disallowed[0]).toContain('ghost');
  });
});

describe('classifyAuditCommands', () => {
  it('passes a successful live command through', () => {
    const result = classifyAuditCommands(
      { status: 0, stdout: 'no high advisories', stderr: '' },
      undefined,
      allowed,
    );

    expect(result).toEqual({ exitCode: 0, stdout: 'no high advisories', stderr: '' });
  });

  it('accepts a failed live command explained only by the documented advisory', () => {
    const result = classifyAuditCommands(liveFailure, jsonResult(allowedReport), allowed);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('npm audit high advisory output');
    expect(result.stdout).toContain('GHSA-7589-6fvf-x4pw');
    expect(result.stdout).toMatch(/documented exception/i);
  });

  it('fails on an unknown advisory and prints no pass message', () => {
    const report = {
      vulnerabilities: {
        effect: allowedReport.vulnerabilities.effect,
        unknown: {
          via: [
            {
              title: 'Unknown advisory',
              url: 'https://github.com/advisories/GHSA-NEW-0000-0000',
              severity: 'high',
            },
          ],
        },
      },
    };

    const result = classifyAuditCommands(liveFailure, jsonResult(report), allowed);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).not.toMatch(/documented exception/i);
    expect(result.stderr).toContain('GHSA-NEW-0000-0000');
  });

  it('fails closed on malformed JSON after a live failure', () => {
    const result = classifyAuditCommands(
      liveFailure,
      { status: 1, stdout: 'not json', stderr: '' },
      allowed,
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).not.toMatch(/documented exception/i);
    expect(result.stderr).toContain('refusing to pass');
  });

  it('fails closed on a live spawn error', () => {
    const result = classifyAuditCommands(
      { status: null, stdout: '', stderr: '', error: new Error('spawn failed') },
      undefined,
      allowed,
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('refusing to pass');
  });

  it('fails closed when the live command has no exit status', () => {
    const result = classifyAuditCommands(
      { status: null, stdout: '', stderr: '' },
      undefined,
      allowed,
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).not.toMatch(/documented exception/i);
    expect(result.stderr).toContain('refusing to pass');
  });

  it('fails closed on a JSON spawn error', () => {
    const result = classifyAuditCommands(
      liveFailure,
      { status: null, stdout: '', stderr: '', error: new Error('spawn failed') },
      allowed,
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('refusing to pass');
  });

  it('fails closed when the failed command reports no vulnerability', () => {
    const result = classifyAuditCommands(liveFailure, jsonResult({ vulnerabilities: {} }), allowed);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).not.toMatch(/documented exception/i);
  });
});

describe('runAudit', () => {
  it('runs the literal high-severity audit and passes a successful result through', () => {
    const calls: Array<{
      command: string;
      args: string[];
      options: { encoding: string; env: NodeJS.ProcessEnv };
    }> = [];

    const result = runAudit({
      spawn: ((
        command: string,
        args: string[],
        options: { encoding: string; env: NodeJS.ProcessEnv },
      ) => {
        calls.push({ command, args, options });
        return { status: 0, stdout: 'clean audit', stderr: '' };
      }) as never,
    });

    expect(result).toEqual({ exitCode: 0, stdout: 'clean audit', stderr: '' });
    expect(calls).toHaveLength(1);
    expect(calls[0].args).toEqual(['audit', '--omit=dev', '--audit-level=high']);
    expect(calls[0].options.encoding).toBe('utf8');
    expect(calls[0].options.env.NO_COLOR).toBe('1');
  });

  it('runs the JSON command after a failure and accepts the documented advisory', () => {
    const calls: string[][] = [];
    let call = 0;

    const result = runAudit({
      spawn: ((_command: string, args: string[]) => {
        calls.push(args);
        call += 1;
        return call === 1 ? liveFailure : jsonResult(allowedReport);
      }) as never,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('GHSA-7589-6fvf-x4pw');
    expect(calls).toEqual([
      ['audit', '--omit=dev', '--audit-level=high'],
      ['audit', '--omit=dev', '--audit-level=high', '--json'],
    ]);
  });
});
