// src/components/productCard.tsx
// Cung cấp khung bề mặt nội dung dạng div/article; không dùng thay cho component tương tác hoặc phần tử ngữ nghĩa chuyên biệt.
import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'article';
  rounded?: 'xl' | '2xl';
  shadow?: 'sm' | 'md';
}

const roundedClasses = {
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
} as const;

const shadowClasses = {
  sm: 'shadow-sm',
  md: 'shadow-md',
} as const;

export function Card({
  as: Component = 'div',
  className = '',
  children,
  rounded = 'xl',
  shadow = 'md',
  ...elementProps
}: CardProps) {
  return (
    <Component
      {...elementProps}
      className={`${roundedClasses[rounded]} bg-white ${shadowClasses[shadow]} ${className}`.trim()}
    >
      {children}
    </Component>
  );
}
