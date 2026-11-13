# Admin Permission Matrix

This document defines the current admin roles and permissions for Ant Jewelry (G3.1).

## Roles

| Role | Description |
|---|---|
| `ADMIN` | Full access to all admin features. |
| `EDITOR` | Can manage products (update, hide) except product prices, and manage categories, blog posts, and hero slides. Cannot create products, or access Settings or Users. |

## Permission Matrix

| Permission | `ADMIN` | `EDITOR` | Notes |
|---|---:|---:|---|
| Access admin area (`/admin/*`) | Yes | Yes | Unauthenticated requests are redirected to `/admin/login`. |
| View products | Yes | Yes | Product listing/detail screens; EDITOR can manage products but not prices. |
| Create products | Yes | No | EDITOR cannot create products; only ADMIN can set an initial price. |
| Update products | Yes | Yes | EDITOR can update products via `products:update`; hiding is allowed through the same permission. |
| Delete/hide products | Yes | Yes | Delete is ADMIN-only via `products:delete`; hiding is allowed via `products:update`. |
| Edit product price | Yes | No | `products:edit_price` is ADMIN-only; EDITOR saves keep the stored price. |
| Manage categories | Yes | Yes | EDITOR can create/update/delete/reorder as implemented. |
| Manage blog posts | Yes | Yes | Write permission granted to EDITOR. |
| Manage hero slides | Yes | Yes | EDITOR can create/update/delete/reorder/visibility as implemented. |
| Manage settings | Yes | No | Storefront site name, phone, email, address, Facebook, and Instagram values used by the header, footer, and contact popover. |
| Manage users and permissions | Yes | No | Create accounts, assign roles, and lock accounts. ADMIN-only. |

## Account safety

- Locked accounts cannot sign in, and an existing session becomes invalid on its next request because the session check re-reads the account record.
- A role change also takes effect on the next request.
- The last active (unlocked) `ADMIN` cannot be demoted or locked; at least one active ADMIN must always remain.
- Settings and Users mutations are enforced in their server actions, so calling them directly as an `EDITOR` is rejected even when the UI is bypassed.

## Implementation

- Pure permission helpers live in `src/features/shared/lib/permissions.ts`.
- Unit tests live in `src/features/shared/lib/permissions.test.ts`.
- Server-side checks must use these helpers (or equivalent permission checks) before performing protected admin mutations or rendering restricted admin sections.
- UI hiding is not sufficient for authorization; protected actions must be enforced on the server.