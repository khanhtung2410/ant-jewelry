# Admin Permission Matrix

This document defines the current admin roles and permissions for Ant Jewelry (G3.1).

## Roles

| Role | Description |
|---|---|
| `ADMIN` | Full access to all admin features. |
| `EDITOR` | Can view products and their prices read-only, and manage blog posts. Cannot create, update, publish, or hide products, and cannot access Categories, Hero Slides, Settings, or Users. |

## Permission Matrix

| Permission | `ADMIN` | `EDITOR` | Notes |
|---|---:|---:|---|
| Access admin area (`/admin/*`) | Yes | Yes | Unauthenticated requests are redirected to `/admin/login`. |
| View products | Yes | Yes | Product listing/detail screens; EDITOR is read-only. |
| Create products | Yes | No | Enforced in the server action. |
| Update products | Yes | No | Enforced via `products:update`. |
| Delete/hide products | Yes | No | Visibility is toggled by an ADMIN-only action. |
| Edit product price | Yes | No | `products:edit_price` is ADMIN-only. |
| Manage categories | Yes | No | Create/update/delete/reorder as implemented. |
| Manage blog posts | Yes | Yes | The only write permission granted to EDITOR. |
| Manage hero slides | Yes | No | Create/update/delete/reorder/visibility as implemented. |
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