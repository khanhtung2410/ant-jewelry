import type { Role } from '@/features/shared/domain/domain';
import { adminRole } from '@/constants/roles';

export type UserAccessSnapshot = {
  role: Role;
  locked: boolean;
};

/**
 * Returns true when applying the next access state would leave no unlocked ADMIN.
 * `otherActiveAdminCount` must exclude the user being changed and count unlocked ADMINs only.
 */
export function wouldRemoveLastActiveAdmin({
  current,
  next,
  otherActiveAdminCount,
}: {
  current: UserAccessSnapshot;
  next: UserAccessSnapshot;
  otherActiveAdminCount: number;
}): boolean {
  const isActiveAdmin = current.role === adminRole.ADMIN && !current.locked;
  const staysActiveAdmin = next.role === adminRole.ADMIN && !next.locked;

  return isActiveAdmin && !staysActiveAdmin && otherActiveAdminCount === 0;
}
