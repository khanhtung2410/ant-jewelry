import type {
  BlogPostStatus,
  CategoryStatus,
  HeroSlideStatus,
  ProductStatus,
} from '@/features/shared/domain/domain';

export type StatusConfig = { label: string; bg: string; color: string };

export const visibilityStatus = {
  VISIBLE: 'VISIBLE',
  HIDDEN: 'HIDDEN',
} as const;

export type VisibilityStatusType = (typeof visibilityStatus)[keyof typeof visibilityStatus];

export const publishStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
} as const;

export type PublishStatusType = (typeof publishStatus)[keyof typeof publishStatus];

export const accountStatus = {
  ACTIVE: 'ACTIVE',
  LOCKED: 'LOCKED',
} as const;

export type AccountStatusType = (typeof accountStatus)[keyof typeof accountStatus];

export const UNKNOWN_STATUS_CONFIG: StatusConfig = {
  label: 'Không rõ',
  bg: '#E5E7EB',
  color: '#374151',
};

export const VISIBILITY_STATUS_CONFIG: Record<VisibilityStatusType, StatusConfig> = {
  [visibilityStatus.VISIBLE]: { label: 'Hiển thị', bg: '#DCFCE7', color: '#15803D' },
  [visibilityStatus.HIDDEN]: { label: 'Ẩn', bg: '#F1F5F9', color: '#334155' },
};

export const PRODUCT_STATUS_CONFIG = VISIBILITY_STATUS_CONFIG as Record<ProductStatus, StatusConfig>;
export const CATEGORY_STATUS_CONFIG = VISIBILITY_STATUS_CONFIG as Record<CategoryStatus, StatusConfig>;
export const HERO_SLIDE_STATUS_CONFIG = VISIBILITY_STATUS_CONFIG as Record<HeroSlideStatus, StatusConfig>;

export const BLOG_POST_STATUS_CONFIG: Record<BlogPostStatus, StatusConfig> = {
  [publishStatus.DRAFT]: { label: 'Bản nháp', bg: '#FEF3C7', color: '#92400E' },
  [publishStatus.PUBLISHED]: { label: 'Đã xuất bản', bg: '#DCFCE7', color: '#15803D' },
};

export const ACCOUNT_STATUS_CONFIG: Record<AccountStatusType, StatusConfig> = {
  [accountStatus.ACTIVE]: { label: 'Đang hoạt động', bg: '#DCFCE7', color: '#15803D' },
  [accountStatus.LOCKED]: { label: 'Đã khóa', bg: '#FEE2E2', color: '#B91C1C' },
};

export const VISIBILITY_STATUS_OPTIONS: ReadonlyArray<{ value: VisibilityStatusType; label: string }> = [
  { value: visibilityStatus.VISIBLE, label: VISIBILITY_STATUS_CONFIG[visibilityStatus.VISIBLE].label },
  { value: visibilityStatus.HIDDEN, label: VISIBILITY_STATUS_CONFIG[visibilityStatus.HIDDEN].label },
];

export const BLOG_POST_STATUS_OPTIONS: ReadonlyArray<{ value: PublishStatusType; label: string }> = [
  { value: publishStatus.DRAFT, label: BLOG_POST_STATUS_CONFIG[publishStatus.DRAFT].label },
  { value: publishStatus.PUBLISHED, label: BLOG_POST_STATUS_CONFIG[publishStatus.PUBLISHED].label },
];

function withFallback<K extends string>(
  config: Record<K, StatusConfig>,
): Record<K, StatusConfig> {
  return new Proxy(config, {
    get(target, prop, receiver) {
      if (typeof prop === 'symbol') return Reflect.get(target, prop, receiver);
      const value = (target as Record<string, StatusConfig>)[prop as string];
      if (value === undefined) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[statuses] Unknown status key: ${String(prop)}`);
        }
        return UNKNOWN_STATUS_CONFIG;
      }
      return value;
    },
  });
}

export const VISIBILITY_STATUS = withFallback(VISIBILITY_STATUS_CONFIG);
export const BLOG_POST_STATUS = withFallback(BLOG_POST_STATUS_CONFIG);
export const ACCOUNT_STATUS = withFallback(ACCOUNT_STATUS_CONFIG);

export function getVisibilityStatusConfig(status: string): StatusConfig {
  return VISIBILITY_STATUS[status as VisibilityStatusType] ?? UNKNOWN_STATUS_CONFIG;
}

export function getBlogPostStatusConfig(status: string): StatusConfig {
  return BLOG_POST_STATUS[status as PublishStatusType] ?? UNKNOWN_STATUS_CONFIG;
}

export function getAccountStatusConfig(locked: boolean): StatusConfig {
  return locked ? ACCOUNT_STATUS_CONFIG[accountStatus.LOCKED] : ACCOUNT_STATUS_CONFIG[accountStatus.ACTIVE];
}

export function isVisibilityStatus(value: unknown): value is VisibilityStatusType {
  return value === visibilityStatus.VISIBLE || value === visibilityStatus.HIDDEN;
}

export function isPublishStatus(value: unknown): value is PublishStatusType {
  return value === publishStatus.DRAFT || value === publishStatus.PUBLISHED;
}
