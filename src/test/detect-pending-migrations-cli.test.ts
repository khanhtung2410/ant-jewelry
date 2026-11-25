import { describe, expect, it } from 'vitest';
import {
  classifyStatusCommand,
  runStatusCommand,
} from '../../scripts/detect-pending-migrations.mjs';

describe('pending migration CLI wrapper', () => {
  it('returns true for a pending banner even when the status command exits non-zero', () => {
    const result = classifyStatusCommand({
      stdout:
        'Following migration have not yet been applied:\n20261118100000_add_product_image_blobs',
      stderr: '',
      status: 1,
    });
    expect(result).toEqual({ exitCode: 0, stdout: 'true\n', stderr: '' });
  });

  it('returns false only for an explicit up-to-date marker', () => {
    const result = classifyStatusCommand({
      stdout: 'Database schema is up to date',
      stderr: '',
      status: 0,
    });
    expect(result).toEqual({ exitCode: 0, stdout: 'false\n', stderr: '' });
  });

  it('returns true for empty or unknown output', () => {
    expect(classifyStatusCommand({ stdout: '', stderr: '', status: 0 }).stdout).toBe('true\n');
    expect(classifyStatusCommand({ stdout: 'unknown wording', stderr: '', status: 0 }).stdout).toBe(
      'true\n',
    );
  });

  it('fails the command when status fails and no pending banner is present', () => {
    const result = classifyStatusCommand({ stdout: '', stderr: 'P1001', status: 1 });
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('refusing to continue');
  });

  it('fails the command on a spawn error', () => {
    const result = classifyStatusCommand({
      stdout: '',
      stderr: '',
      status: null,
      error: new Error('spawn failed'),
    });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('refusing to continue');
  });

  it('runs the production status script with the injected environment', () => {
    const calls: Array<{ command: string; args: string[]; env: NodeJS.ProcessEnv }> = [];
    const result = runStatusCommand({
      npm: 'fake-npm',
      env: { TEST_MARKER: '1' },
      spawn: ((command: string, args: string[], options: { env: NodeJS.ProcessEnv }) => {
        calls.push({ command, args, env: options.env });
        return { stdout: 'Database schema is up to date', stderr: '', status: 0 };
      }) as never,
    });

    expect(result).toEqual({ exitCode: 0, stdout: 'false\n', stderr: '' });
    expect(calls).toEqual([
      {
        command: 'fake-npm',
        args: ['run', 'db:migrate:status:production'],
        env: { TEST_MARKER: '1' },
      },
    ]);
  });
});
