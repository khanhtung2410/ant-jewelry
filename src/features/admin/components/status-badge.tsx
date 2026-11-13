import type { StatusConfig } from '@/constants/statuses';

export function StatusBadge({
  config,
  className = '',
}: {
  config: StatusConfig;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-2 py-1 text-xs ${className}`}
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}
