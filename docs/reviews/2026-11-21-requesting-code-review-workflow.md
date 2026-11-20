# Whole-workflow review (2026-11-21)

- **Skill:** `requesting-code-review` (exact id; read-only, no subagents dispatched by the reviewer)
- **Base:** `3249432` · **Head:** `224a67c`
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-21 00:04:30 +07:00 - Review lại code theo đúng quy trình Superpowers`.
- **Review package:** commit list + stat + full diff in `C:/Users/Hello/AppData/Local/Temp/opencode/review-workflow-package.txt` (outside repo).

## Method

The reviewer received the mentor's corrected protocol explicitly: name the exact skill id, verify claims against real source and grep consumers, include a mentor-checklist-versus-evidence table, state "no new findings" honestly if nothing beyond the checklist appears, and check whole-workflow coverage rather than unit tests alone.

## Reviewer report

### Strengths (evidence-backed)

- F1 is a genuine cross-module flow test: `src/features/auth/password-flow.test.ts:74,81,102,109,122` drives `createUser → loginAction` and `saveUserAccess → loginAction` against real Prisma and bcrypt; RED 3/5 → GREEN 5/5 recorded in AI_LOG `20:49:51`.
- `shouldSkipImageOptimizer` removal is complete: `src/features/shared/lib/image-url.ts:16-18` skips only external URLs; all five consumers use the same helper; card/detail tests pin `data-unoptimized="false"`.
- Migration change is coherent: `scripts/reencode-legacy-uploads.ts:36,55-62,85-96` batches by `storageKey` cursor at 50 and groups blob plus URL writes in one `$transaction`.
- T2 closes the largest prior gap: `e2e/product-upload.spec.ts:77-165` covers ADMIN login, three files, progress toasts, 3×201, storefront HTML, raw WebP/ETag/304, cleanup; oversized case at `:167`.
- Process rules are pinned by `src/test/superpowers-process.test.ts`.

### Issues

1. **Important — F3 "optimizer → served image" had no automated workflow assertion.** `e2e/product-upload.spec.ts:65,152,160` checked only the raw `/uploads/...webp` URL and that the URL string appeared in HTML; the optimizer behaviour existed only as a manual probe in `DEPLOY.md:172`. The browser actually loads `/_next/image?url=…`.
2. **Important — F5 crash atomicity proven only with a fake `$transaction`.** `src/test/legacy-image-migration.test.ts:104-134` asserted grouping, not rollback of the blob write when a URL update fails.
3. **Minor — guard forbids the bad skill id but does not require a valid one in every review file.** `src/test/superpowers-process.test.ts` had only a negative regex; two historical review files lacked a `- **Skill:**` line.

### No new findings

The reviewer explicitly reported no findings beyond the mentor checklist and the workflow cross-check it required.

## Decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| 1 | Important · `e2e/product-upload.spec.ts:64,159` | A regression in `localPatterns` or the skip decision would not fail any automated test; the E2E title claimed "storefront serves small cached WebP copies" while checking the raw route. | **Accepted (fixed).** `assertStoredImage` now returns the raw byte count; added `assertOptimizedImage` which finds the rendered `/_next/image?...` src for an uploaded URL, asserts 200, `image/jpeg|webp`, fewer bytes than raw and under 400 KB. E2E rerun: 2 passed. |
| 2 | Important · `src/test/legacy-image-migration.test.ts:104` | Unit grouping test cannot prove rollback. | **Accepted (fixed).** Added a real-DB integration test: delete the ProductImage row after `findMany` so the in-transaction update fails with Prisma P2025, then assert the blob's contentType, etag and bytes are unchanged. RED proof: temporarily reverting the script to sequential writes produced `expected 'image/webp' to be 'image/png'`; restored atomic code → 8/8 pass. Kept the grouping test as the fast guard. |
| 3 | Minor · `src/test/superpowers-process.test.ts:47`, `docs/reviews/2026-11-19-*.md` | A future review file could omit the skill id and still pass CI. | **Accepted (fixed).** Added a guard requiring every review file except `TEMPLATE.md` to have `- **Skill:** <non-superpowers id>`; added the missing line to `2026-11-19-requesting-code-review.md` (`requesting-code-review`) and `2026-11-19-superpowers.md` (`receiving-code-review`). Guard 6/6 pass. |

## Set-aside behaviours

- Original unexplained Vercel 400 on non-query URLs — unknown; F2 only separates it.
- Blobs already inconsistent from the pre-F5 script — F5 prevents recurrence, does not repair old rows.
- Page-level bytes after deploying the no-skip code — requires a real deploy.
- ADMIN delete flow in the upload E2E — cleanup uses Prisma directly, documented limitation.
- Production dashboard/DB checks — no access; `[ ]` cells in `DEPLOY.md` remain.
- Reviewer did not re-run the check gate (read-only); full output was run by the controller and is in the PR body.

## Assessment

Ready to merge? **With fixes** was the reviewer verdict; all three findings are fixed and verified. No production defect was found.
