# Code review - fix capture round 1 (2026-11-24)

- **Skill:** `receiving-code-review`
- **Scope:** `docs/DEPLOY.md`, `docs/ARCHITECTURE.md`, `.github/workflows/deploy.yml` rollback selection, two guard test files, plus the AI_LOG and report updates for this round.
- **Base:** `d58149a` | **Head:** working tree truoc commit local.
- **Prompt nguyên văn:** xem `AI_LOG.md` mục `2026-11-24 18:40:38 +07:00 - Fix round 1: cap nhat docs va guard rollback`.

## Method

Self-review cua feedback tu task reviewer, khong dung subagent. Da load skill theo dung id: `receiving-code-review` va `test-driven-development`. Doc lai toan bo "Deploy & rollback" cua `docs/DEPLOY.md` (dong 156-210), muc 14.2 cua `docs/ARCHITECTURE.md` (dong 975-999), step capture va step rollback cua `.github/workflows/deploy.yml`. `grep` moi lan nhac `uid`, `vercel ls`, `!= 'success'` trong `docs/`: chi co ba dong duoc bao cao la con sai; cac file plan/review lich su giu nguyen. Viet hai test RED truoc khi doi code; ca hai fail dung ly do thieu hanh vi, khong phai syntax.

## Findings and decisions

| # | Severity · file:line | Reproduction / effect | Decision |
|---|---|---|---|
| 1 | Important · `docs/DEPLOY.md:190,198`, `docs/ARCHITECTURE.md:994` (before) | Doc van huong dan lay `uid` tu `vercel ls --prod --json` (field khong ton tai) va noi finalize do khi smoke khong `success` (sai voi smoke `skipped`). | **Accepted (fixed in `ci/fix-capture-alias-api`)**: manual rollback lay `deploymentId` tu `GET /v1/aliases/{alias}`, giu dashboard promotion lam fallback; ca hai doc mo ta finalize chi fail tren `failure`/`cancelled`, ghi nhan rieng `skipped`. |
| 2 | Minor · `.github/workflows/deploy.yml:315-318` (before) | Khi capture fail truoc promotion, step select in `::error::No previous production deployment id...` roi step rollback van goi API voi id rong, tao loi thu hai. | **Accepted (fixed in `ci/fix-capture-alias-api`)**: step select co `id: select`, nhanh khong co target in thong bao trung tinh, ghi `has_target=false` va `exit 0`; step rollback co `if: steps.select.outputs.has_target == 'true'`. Drill thieu id van `::error::` va `exit 1`. Run van do vi deploy fail. |
| 3 | Minor · `.github/workflows/deploy.yml:183-184` (before) | Alias host chi bo `https://`; neu `SITE_URL` co `http://` thi alias sai. Duong dan `/` cuoi da duoc bo boi `${alias_host%%/*}`. | **Accepted as documented (fixed in `ci/fix-capture-alias-api`)**: chon phuong an nho hon la ghi ro rang trong `DEPLOY.md` rang chi ho tro HTTPS origin, khong chuyen `http://`, va lookup se doi HTTP ngoai 2xx neu SITE_URL sai. Khong doi workflow. |
| 4 | Important · live GitHub/Vercel | Push, mo PR, chay drill hoac doi setting de lay bang chung. | **Rejected**: task cam; tai san cua dieu phoi vien. |

## Declined to judge

- Live run cua `deploy.yml` sau fix: khong co credential va khong duoc phep chay.
- Cac file `docs/superpowers/plans/` va review cu van nhac `uid`/CLI rollback; la ho so lich su, khong nam trong pham vi ba dong duoc bao cao.

## Checklist versus evidence

| Claim | Test or output | Result |
|---|---|---|
| Doc manual rollback lay id tu alias API va khong con `uid` | `deploy-workflow.test.ts > documents the alias capture, the alias fallback and the exact finalize cases` | pass |
| ARCH mo ta `deploymentId` va finalize `failure`/`cancelled` | cung test tren, doc tim dong chua chuoi finalize | pass |
| Constraint HTTPS cua SITE_URL duoc ghi ro | cung test tren, assertion `không chuyển \`http://\`` | pass |
| Khong co loi thu hai khi thieu target | `smoke-rollback.test.ts > skips the alias call cleanly when capture produced no target` | pass |
| Guard cu van walk duoc | `smoke-rollback.test.ts > rolls back through the project-scoped alias API when the chain fails` va `> does not roll back when an upstream job fails before promotion` | pass |
| Focused test RED -> GREEN | RED `2 failed | 27 passed (29)`, EXIT=1; GREEN `29 passed (29)`, EXIT=0 | pass |
| Full check set xanh | Output day du o phan Verification output, tat ca `EXIT=0` | pass |

## Verification output

Xem phan "Fix round 1" trong `C:\Users\Hello\AppData\Local\Temp\opencode\sdd-ci-deploy-gating\fix-capture-report.md` de co output day du cua focused test va full check set (Node `spawnSync`, UTF-8, `NO_COLOR=1`, `DATABASE_URL=file:./prisma/dev.db`). Ky tu U+0192 cua legend Next.js da duoc thay bang `F`.

## Limitations

- Khong co live run hay drill that; payload alias chi do dieu phoi vien xac nhan.
- Full check set chay tren Windows voi SQLite, khong phai `ubuntu-latest`.
- Khong push, khong mo PR, khong doi setting GitHub.

Link AI_LOG entry: `AI_LOG.md` mục `2026-11-24 18:40:38 +07:00 - Fix round 1: cap nhat docs va guard rollback`.
