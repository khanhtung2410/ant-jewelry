# Test-coverage audit (2026-11-21)

- **Skill:** `requesting-code-review` (exact id; read-only, no subagents dispatched by the reviewer)
- **HEAD:** `cffd7b0` (main after PR #132)
- **Owner prompt:** "use skill to scan through code and check if any test missing / unit test, integration test, workflow / both e2e and vimtest"
- **Method:** enumerated 51 `*.test.ts`, 19 `*.test.tsx`, 5 `e2e/*.spec.ts`; read risky source and full tests before judging. Strict labels: unit = pure/mocked/static markup; integration = real Prisma/route/action; workflow = multi-step UI->API->DB->storefront. A unit test never proves a workflow.

## Gaps found

| # | Behaviour | Layer | Existing evidence | Gap | Severity | Proposed test |
|---|---|---|---|---|---|---|
| G1 | Email normalized before login lookup/rate-limit key | integration | `auth/actions.test.ts:29-38,89-171` uses lowercase; `user-form-schema.test.ts:5-15` unit only | No action-level test with mixed-case/padded email | Important | Create `Editor@Example.com`, login with `"  EDITOR@example.com "`, assert cookie and normalized `loginAttempt.email` after a failure |
| G2 | `next` target wired to `redirect` | integration | `next-path.test.ts:4-24` unit; `actions.test.ts:136` only `/admin` | Safe/unsafe `next` not asserted through `loginAction` | Minor | Set `next=/admin/products?search=ring` -> redirect there; `https://evil.example` -> `/admin` |
| G3 | Session cookie security options | unit | `proxy.test.ts` uses name only | `httpOnly`, `sameSite`, `secure`, `path`, `maxAge` unasserted | Minor | New `cookie.test.ts` for test/production `NODE_ENV`, including `secure: true` and revoke `maxAge: 0` |
| G4 | Duplicate email in `createUser` | integration | no test of P2002 branch `users/actions.ts:112-126` | Raw Prisma error could leak | Important | Real DB: create once, recreate with padded uppercase email, assert friendly field error and one row |
| G5 | Stale row in `saveUserAccess` | integration | `users/actions.test.ts:79-152` existing row only | `UserNotFoundError` branch untested | Important | Delete user after load, call action, assert friendly form error, no throw |
| G6 | Serializable retry loop | unit | `actions.test.ts:141-152` checks isolation level only | `isRetryableTransactionError` + 3 attempts unproven | Minor | Mock `$transaction` to throw P2034 twice then succeed; assert 3 calls; non-retryable -> 1 call |
| G7 | Admin-driven session revocation | workflow | `session.test.ts:58-62` unit; E2E only explicit logout | Changing role/lock/password invalidating an issued cookie not proven | Important | Sign in EDITOR, capture cookie; ADMIN locks/demotes; reuse cookie -> login redirect |
| G8 | `saveProduct` error branches | integration | price/deletion tests only | Slug conflict, foreign color, missing product, `published -> status` unasserted | Important | Real DB tests for each branch |
| G9 | Hiding product removes it from storefront | workflow | E2E covers confirm/cancel and row flip only | No assertion that hidden product disappears from `/p/<slug>` and category | Important | Extend hide E2E: after confirm request page and category, assert absent; restore, assert returns |
| G10 | Product image management actions | integration | component test mocks all five actions | front/hover/color/sort/assign actions untested at action level | Important | Real DB tests for each invariant and no-op boundary move |
| G11 | Category CRUD, delete guard, reorder | integration + workflow | schema unit only | `save/delete/moveCategory` untested | Important | Duplicate slug/type, non-empty delete guard, swap order; workflow for hidden category |
| G12 | Blog CRUD and image sync | workflow | schema/image unit only | `save/deleteBlogPost` + `syncBlogPostImages` untested | Important | Integration create/duplicate/delete; workflow create -> `/blog/<slug>` -> delete -> 404 |
| G13 | Hero slide CRUD and ordering | workflow | schema/static markup only | `save/delete/moveHeroSlide` untested | Important | Integration sortOrder/max, swap, delete; workflow home carousel after revalidation |
| G14 | Settings save updates public contact data | workflow | schema unit and EDITOR denial only | ADMIN happy path and layout revalidation unasserted | Minor | Change phone/social, reload `/` and product, assert contact/footer updated |
| G15 | Zero-byte upload rejection | unit | oversized and bad magic covered | `file.size === 0` branch untested | Minor | Route test with empty File -> 413, no upload call |
| G16 | Missing/invalid stored image 404 | unit | 200/304/Etag covered | Catch branch for not-found/invalid key unasserted | Minor | Mock helpers to reject each error class -> 404 not 500 |
| G17 | `SEE MORE` load-more | workflow | markup + query unit only | No browser click/sort-preservation/disable/end-state test | Important | E2E on `/c/other-jewelry?sort=price_asc`: append new sorted IDs, disabled during load, button hidden at end |
| G18 | Carousel arrow interaction | workflow | pure paging/static markup only | Click/wrap/boundary unasserted | Minor | E2E home carousel next/prev and disabled state |
| G19 | Responsive checks beyond home | workflow | width loop only `/` | Category/product/blog pages untested at mobile widths | Minor | Extend loop to four more pages |
| G20 | Admin dialog accessibility | workflow | public a11y + component confirm popover | Admin dialogs not axe-scanned in browser | Important | E2E ADMIN: axe each admin dialog, assert no serious/critical |
| G21 | Pending-state disabled buttons | unit + workflow | static markup only | Double-submit guards unasserted | Minor | Interaction test with delayed action; one E2E login double-click |

## Prior rounds — no new gaps

- F3 optimizer URL assertion, F5 real-DB rollback proof, S3 skill-id guard, E2E cleanup revalidation, upload route, ETag/304 serving — reviewer explicitly reported no new gaps.

## Decisions

All 21 findings are **Accepted** as real evidence gaps with the severities above. No finding is Rejected: each was verified by reading the named source and existing test.

The owner chose **All 21 gaps**. Implementation was split across three parallel test-only workstreams with non-overlapping file ownership:
- G1-G7 in `src/features/auth/actions.test.ts`, new `src/features/auth/cookie.test.ts`, `src/features/users/actions.test.ts`, new `src/features/auth/session-revocation-flow.test.ts` — 29 focused tests passed.
- G8, G10-G14 in six new integration test files under `src/features/products/actions/`, `src/features/blog/actions/`, `src/features/layout/actions/`, `src/features/settings/actions/` — 30 focused tests passed.
- G9, G15-G21 in `e2e/storefront-admin.spec.ts`, new `e2e/admin-a11y.spec.ts`, two route test files and a new `form-controls.test.tsx` — 19 focused Vitest tests passed; E2E green after the defect below was fixed.

**Real defect found by the new G20 a11y test:** `src/features/blog/components/blog-post-form-dialog.tsx:262-270` rendered `<textarea name="body">` without a label, producing an Axe serious violation `label: Form elements must have labels`. Fixed by adding `aria-label="Body"`, which is the RED→GREEN evidence for that finding. The E2E agent left the test red deliberately; controller fixed and re-ran it (6 admin axe tests passed).

No production defect was found elsewhere. Full combined gate: 79 Vitest files / 371 tests, 43 E2E tests, lint/typecheck/format/build all exit 0.

## Assessment

Ready to merge? **With fixes** — no Critical production defect, but Important workflow/integration gaps remain open.
