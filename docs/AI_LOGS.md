# AI Change Log

## 2026-11-08 09:22:23 +07:00 — Fix docs/README.md for GitHub

### User prompt

> fix README.md at docs/
> - Nội dung: mô tả dự án, prerequisites, npm install / npm run dev / npm run build, link tới docs/*.
> - AC: README hiển thị trên trang repo GitHub.
>
> if change, add promt and output summarize to ai_logs.md with time stamp, put in beginning of file so user can review

### Changes made

- Updated `docs/README.md` work-tree status to reflect the actual `src/app/` App Router structure and the `src/types/domain.ts` contracts.
- Corrected the project tree in `docs/README.md` from `app/` at the repository root to `src/app/` and `src/types/`.
- Corrected the `@/*` TypeScript alias description to point at `src/*` (matching `tsconfig.json`).
- Changed the related-document list to relative Markdown links (`./REQUIREMENTS.md`, `./ARCHITECTURE.md`, `./CONTRIBUTING.md`, `./AI_LOGS.md`) so they resolve from `docs/` when GitHub renders the README.
- Kept the existing project description, prerequisites (Node.js >= 20.9.0, npm, Git) and the `npm install`, `npm run dev`, `npm run build` instructions.

### Output summary

`docs/README.md` now describes the actual repository, lists prerequisites and the required setup/build commands, and links to every document in `docs/` using GitHub-safe relative paths. Because the repository has no root README, GitHub renders `docs/README.md` on the repository landing page; the corrected links resolve to the sibling `docs/*` files.

---

## 2026-11-07 13:26:18 +07:00 — Verify domain entities and align docs

### User prompt

> Định nghĩa Product, Category, BlogPost.
> - Không any, không @ts-ignore.
> - price: integer, đơn vị VND.
> - slug: string cho cả 3 entity.
> - Status dùng union literal ("DRAFT" | "PUBLISHED", "VISIBLE" | "HIDDEN"…), không dùng string.
> - AC: npx tsc --noEmit pass.
>
> if change, add promt and output summarize to ai_logs.md with time stamp, put in beginning of file so user can review

### Changes made

- Verified `src/types/domain.ts`: `Product`, `Category`, `BlogPost` already satisfy the requested contracts (string `slug` on all three; literal-union statuses `VISIBLE | HIDDEN` for Product/Category and `DRAFT | PUBLISHED` for BlogPost; `price` uses the branded integer `VndPrice` in VND with a `createVndPrice` integer guard). No `any` or `@ts-ignore` is present.
- Fixed `docs/ARCHITECTURE.md` references from the non-existent `src/types/catalog.ts` to the actual `src/types/domain.ts` (work-tree status line and logical data architecture note).
- No changes to `src/types/domain.ts` were needed.

### Output summary

Domain contracts are in place and consistent with the requirements. `npx tsc --noEmit` exits with code 0. The architecture document now points to the real domain type file, and this entry records the verification at the top of the log.

---

## 2026-11-07 11:43:38 +07:00 — Define domain domain types

### User prompt

> Định nghĩa Product, Category, BlogPost.
> - Không any, không @ts-ignore.
> - price: integer, đơn vị VND.
> - slug: string cho cả 3 entity.
> - Status dùng union literal ("DRAFT" | "PUBLISHED", "VISIBLE" | "HIDDEN"…), không dùng string.
> - AC: npx tsc --noEmit pass.
> if change, add promt and output summarize to ai_logs.md with time stamp, put in beginning of file so user can review

### Changes made

- Added `src/types/domain.ts` with `Product`, `Category`, and `BlogPost` interfaces; each has a string slug and a literal-union status.
- Added a branded VND integer price type and `createVndPrice` guard to reject non-integer amounts.
- Updated `docs/ARCHITECTURE.md` to record the domain type contracts without implying a database or workflow exists.

### Output summary

Domain entities now have strict TypeScript contracts, product prices are represented as integer VND, and content/visibility statuses are constrained to literal unions. No `any` or `@ts-ignore` was added. Validation requested: `npx tsc --noEmit`.

---

## 2026-11-07 10:00:00 +07:00 — Remove reporting workflow from docs

### User instruction

> remove all of reporting workflow in docs/ folder
> if change, add promt and output summarize to ai_logs.md with time stamp, put in beginning of file so user can review

### Changes made

- `docs/REQUIREMENTS.md`: removed MOD-09, FR-037/FR-038, UC-21, AC-037, API-A29/A30, BR-016, BC-05, OI-007 and all reporting permission/UI/data/traceability references. Updated totals: 28 FR, 6 modules, 15 BR, 16 UC, 48 AC, 25 OI, 31 APIs.
- `docs/ARCHITECTURE.md`: removed the Reporting module, actor permissions, layer-diagram node, Admin API group, permission-matrix row, repository folder, OI-007, implementation phase and ADR-009. Preserved the remaining IDs and renumbered only the sequential implementation phase.
- `docs/AI_LOGS.md`: removed a historical word-level reporting reference and added this entry at the top.
- No source code changes.

### Output summary

The reporting workflow is gone from the active requirements and architecture documents. Remaining requirements, use cases, APIs, acceptance criteria, traceability rows and totals are internally consistent; no reporting feature, module, permission or endpoint remains documented in `docs/`.

---

## 2026-11-06 11:41:47 +07:00 — Align ARCHITECTURE.md with current work tree

### User instruction

> clean architecture.md work tree file to match current work tree
> if change, add promt and output summarize to ai_logs.md with time stamp, put in beginning of file so user can review

### Changes made

- Updated `docs/ARCHITECTURE.md` status header and document limits: the repository now has a root-level Next.js 16.4.5 App Router skeleton (React 19.3.0, Tailwind CSS v4, TypeScript strict, ESLint 9). Backend, database, auth, image storage, business APIs and domain features are still not implemented.
- Added a "Hiện trạng work tree" section with the real folder tree and clarified that `app/page.tsx` is still the `create-next-app` starter page and no `test` script exists.
- Updated the technology stack table with installed versions/statuses while keeping Backend, Database, ORM, Authentication and Cloudinary as proposals.
- Reworked the repository structure section: actual root-level app first; the separate `frontend/` and `backend/` trees are now explicitly labeled as a future proposal only.
- Marked completed items in the implementation sequence (Next.js, Tailwind, TypeScript, ESLint, Git workflow, docs) and left NestJS, PostgreSQL, Prisma and environment variables unchecked.
- Updated guardrails and the ADR log (ADR-001, ADR-008, added ADR-011/ADR-012), and added "not implemented" notes to the proposed request-flow, data, API, auth and image-storage sections.
- No source code changes.

### Output summary

`ARCHITECTURE.md` now separates the actual work tree from the proposed architecture instead of claiming the project has no codebase. Installed pieces match `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs` and the folder tree; all unbuilt backend/database/auth/image/API items remain clearly marked as proposed or unconfirmed.

---

## 2026-11-06 11:26:32 +07:00 — Clean contributing guide and align README with work tree

### User instruction

> clean contributing.md, modify readme.md to match current work tree
> if change, add prompt and output summarize to ai_logs.md with time stamp, put in beginning of file so user can review

### Changes made

- Updated `docs/CONTRIBUTING.md` to remove stale task/user examples, MSSQL references, and the unavailable `npm run test:run` check. Replaced them with AN JEWELRY domains, the actual Next.js App Router structure, and the current lint/type-check workflow.
- Updated `docs/README.md` to describe the actual work tree: a root-level Next.js 16.4.5 App Router skeleton with React 19.3.0, Tailwind CSS v4, TypeScript strict, and ESLint. Backend, database, authentication, image storage, tests, and domain features are marked as proposed or not implemented.
- No source code changes.

### Output summary

The contributing guide and README now match the current repository instead of the earlier unbuilt frontend/backend proposal. `CONTRIBUTING.md` no longer references task-management or user-submission examples, MSSQL, or a non-existent test script. `README.md` documents the real setup commands, configuration files, folder tree, current starter-page state, and remaining TBD items (official repository URL, license, backend/database choices, and test framework).

---

## Previous entry — Remove contact form

### User instruction

> Remove the contact form and all contact-submission requirements and architecture. Customers should contact the store directly using only the phone number and social links already in scope. Do not add anything new to customer contact.

## Changes made

- Updated `REQUIREMENTS.md` to remove contact-submission requirements, use cases, validation/data rules, APIs, and related acceptance criteria. Preserved surviving identifiers rather than renumbering them.
- Updated `REQUIREMENTS.md` to remove contact-submission requirements, use cases, validation/data rules, APIs, and related acceptance criteria. Preserved surviving identifiers rather than renumbering them.
- Restricted the customer-facing contact requirement to the phone number and Facebook/Instagram links already present in the source materials. The official phone number and social URLs remain `[CONFIRMATION REQUIRED]`; no values or additional contact channels were invented.
- Updated `ARCHITECTURE.md` to remove the contact-submission module, request flow, data entity, endpoints, administration workflow, security/privacy design, repository folders, and implementation phase.
- Updated `README.md` to describe direct contact through the existing phone and social-link channels, with no contact form or submission flow.
