# Admin Permission Matrix

This document defines the current admin roles and permissions for Ant Jewelry (G3.1).

## Roles

| Role | Description |
|---|---|
| `ADMIN` | Full access to all admin features. |
| `EDITOR` | Content management role (maps to the SAD "Staff" actor). Can manage products, categories, blog posts, and hero slides, but cannot edit product prices and cannot access Settings or Users. |

## Permission Matrix

| Permission | `ADMIN` | `EDITOR` | Notes |
|---|---:|---:|---|
| Access admin area (`/admin/*`) | Yes | Yes | Unauthenticated requests are redirected to `/admin/login`. |
| View products | Yes | Yes | Admin listing/detail screens. |
| Create products | Yes | Yes | |
| Update products (non-price fields) | Yes | Yes | Enforced via `products:update`. |
| Delete/hide products | Yes | Yes | Enforced via `products:delete` (implementation-specific action). |
| Edit product price | Yes | No | `products:edit_price` is ADMIN-only. |
| Manage categories | Yes | Yes | Create/update/delete/reorder as implemented. |
| Manage blog posts | Yes | Yes | Create/update/delete/publish as implemented. |
| Manage hero slides | Yes | Yes | Create/update/delete/reorder/visibility as implemented. |
| Manage settings | Yes | No | Includes storefront/contact settings. |
| Manage users and permissions | Yes | No | User/role administration is ADMIN-only. |

## Implementation

- Pure permission helpers live in `src/features/shared/lib/permissions.ts`.
- Unit tests live in `src/features/shared/lib/permissions.test.ts`.
- Server-side checks must use these helpers (or equivalent permission checks) before performing protected admin mutations or rendering restricted admin sections.
- UI hiding is not sufficient for authorization; protected actions must be enforced on the server.