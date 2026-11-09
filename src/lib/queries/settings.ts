import type { Settings } from '@/types/domain';
import { settings } from '@/lib/mock/settings';

/**
 * Returns storefront contact settings (phone, Facebook, Instagram, address).
 * A clone is returned so callers cannot mutate the mock source.
 */
export function getSettings(): Settings {
  return structuredClone(settings);
}
