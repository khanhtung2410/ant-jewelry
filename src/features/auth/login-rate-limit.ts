import { prisma } from '@/features/shared/db/prisma';

export const LOGIN_MAX_FAILED_ATTEMPTS = 5;
export const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;

function getWindowStart(now: Date): Date {
  return new Date(now.getTime() - LOGIN_FAILURE_WINDOW_MS);
}

/**
 * Blocks a combination of email and client IP after too many failures inside
 * the rolling window. A blocked attempt returns TOO_MANY_ATTEMPTS while a
 * normal failure returns INVALID_CREDENTIALS; both are generic and neither
 * names the email, so the response does not reveal whether the account exists.
 *
 * Residual risk (deferred to security/auth-hardening): this check and
 * recordFailedLogin are not atomic, so a tightly synchronised burst can pass
 * the check before any failure is recorded. The probability is low and the
 * response stays generic; no behaviour change is made here.
 */
export async function isLoginRateLimited(
  email: string,
  ip: string,
  now = new Date(),
): Promise<boolean> {
  const failures = await prisma.loginAttempt.count({
    where: {
      email,
      ip,
      createdAt: { gte: getWindowStart(now) },
    },
  });

  return failures >= LOGIN_MAX_FAILED_ATTEMPTS;
}

export async function recordFailedLogin(
  email: string,
  ip: string,
  now = new Date(),
): Promise<void> {
  await prisma.$transaction([
    prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: getWindowStart(now) } } }),
    prisma.loginAttempt.create({ data: { email, ip, createdAt: now } }),
  ]);
}

export async function clearFailedLogins(email: string, ip: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { email, ip } });
}
