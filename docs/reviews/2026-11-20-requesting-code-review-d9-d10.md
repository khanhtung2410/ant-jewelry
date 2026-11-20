# Codebase hygiene review - D9, D10 (2026-11-20)

- **Skill:** requesting-code-review + verification-before-completion + test-driven-development
- **Head reviewed:** `f4b7a10` (main after PR #122)
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-20 ... - D9/D10: Lighthouse evidence và script boundary`.
- **Reviewer:** owner; findings supplied directly, then re-read against real source before deciding.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| D9 | Important · `docs/lighthouse-reports/` (45 files, 22.499.810 bytes, ~360k lines) | `Get-ChildItem` + line count: reports from superseded rounds (v1, v2, v3, warm-up) stay in git forever; PRs #113, #114, #121 carried 95k–132k lines of JSON and became unreviewable. | **Accepted (fixed).** Kept only the current baseline (v4 + ivy, 12 files), gzipped to `.json.gz` (1.808.506 bytes total, down from 22.499.810). Deleted the 33 superseded files. Added `src/test/lighthouse-reports.test.ts` pinning the exact 12-file list. Documented the policy in `docs/PERFORMANCE.md` and `docs/CONTRIBUTING.md`: no report files in code PRs; new reports go to a GitHub Release/artifact or an evidence-only PR. Historical commits still contain the old JSON, but no new report files are added. |
| D10 | Important · `src/features/products/server/product-image-storage.ts:6`, `scripts/product-image-processing.mjs`, `scripts/reencode-legacy-uploads.mjs:8` | App code on Vercel imports across the repo boundary into `scripts/`; the CLI owns the resize helper that production depends on. | **Accepted (fixed).** Added typed `src/features/products/server/product-image-processing.ts` (`MAX_STORED_IMAGE_DIMENSION`, `STORED_IMAGE_BUDGET_BYTES`, `resizeToStoredWebp(image: Uint8Array<ArrayBufferLike>): Promise<Uint8Array<ArrayBuffer>>`). App imports it locally; CLI converted to `scripts/reencode-legacy-uploads.ts`, run with `npx tsx`, and now imports the helper from `src/`. Deleted both old `.mjs` files. Added `src/test/no-scripts-import.test.ts` as a boundary guard. TDD: the new module test failed with "Cannot find module" before the module existed; the guard tests failed on the old import path before the move. |
| Mojibake | Minor · `AI_LOG.md` (73 lines) | Historical entries contained UTF-8 bytes decoded as cp1252 (`â€”`, `Ã¡`, `á»`, `Ä‘`), including verbatim prompt blocks. | **Accepted (fixed).** Decoded cp1252-back-to-UTF-8 with a one-off script held outside the repo, mapped the undefined cp1252 bytes (0x81/0x8D/0x8F/0x90/0x9D) so tone marks restored correctly, and applied up to three passes. 73 lines changed; `rg 'Ã|â€|Ä‘|á»|Æ°|Â§|ï¿½' AI_LOG.md` now returns no matches; CJK/Hangul/Cyrillic scan returns 0. Two meta-sentences that became self-referential after decoding were rephrased. |

## Verification

Complete stdout/stderr for the full check set is attached to the PR body. Targeted evidence:

- RED: `product-image-processing.test.ts` -> `Cannot find module './product-image-processing'`; guard tests -> old `scripts/` import and missing CLI `.ts`.
- GREEN: 13 tests across the resize module, boundary guards, legacy migration and storage tests; `npm run typecheck` exit 0 after fixing the Prisma `Uint8Array<ArrayBuffer>` types and the CLI top-level await.
- `npx tsx` import probe: `exports=migrateLegacyBlobs,reencodeLegacyBlob,withVersionQuery`.
- Lighthouse guard: 12 baseline `.json.gz` files only, 1.808.506 bytes.

## Limitations

- Git history still contains the deleted reports; rewriting history would require a force push and was not done.
- The mojibake decoder restored the original text of historical prompts; it changed their byte representation but not their meaning. Previous rounds had deliberately left them untouched.
- No production check was needed: this is a build/evidence/structure change with no UI behaviour change.
