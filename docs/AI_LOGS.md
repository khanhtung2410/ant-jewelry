# AI Change Log

## 2026-11-10 11:06:47 +07:00 — Responsive header/footer toggles and dropdown underline

### User prompt

> item of dropdownmenu in header should have 2px #265649 border like other link,
> drop down menu should not overlap with header, make them have a little distance
> implement a toggle for main navigation, footer in ms and sm scr
>
> commit branch, commit strictly follow contributing rule and pull_request_template.md
> also give pr title
> if change, add prompt and output summarize to ai_logs.md with time stamp, put in beginning of file so user can review

### Changes made

- Branched `feature/responsive-nav-footer` from `main`.
- Restored the `--underline-color: #265649` token in `src/app/globals.css`; the tracked file was missing it, so the `var(--underline-color)` used by the header fell back to the current text color.
- `src/components/header.tsx`: active main links and PRODUCTS dropdown items now use a 2px `--underline-color` underline. Dropdown items show the same underline on hover/focus and keep the current category highlighted. The dropdown is offset from the header with `mt-14`, leaving a 15px gap at the verified 800px viewport so it no longer touches the header border.
- `src/components/header.tsx`: below the `md` breakpoint the desktop nav is replaced by a MENU/CLOSE toggle that expands an inline mobile navigation panel. PRODUCTS expands its four categories as a nested accordion; the panel closes on navigation, Escape returns focus to the toggle, and a pathname-based open state avoids a setState-in-effect.
- `src/components/footer.tsx`: below `md`, HOME, INFO, HELP and SOCIAL render as accordion toggles with `aria-expanded` / `aria-controls`; the contact block stays visible and the columns remain always open from `md` up.
- `src/components/icons.tsx`: added `MenuIcon` and `CloseIcon`, both using `currentColor`.
- Documented the responsive behaviour in `docs/README.md` and `docs/ARCHITECTURE.md`.

### Output summary

Header dropdown items and active links share the 2px `#265649` underline, the dropdown now sits below the header with a small gap, and the mobile/small-screen navigation and footer sections have accessible toggles. Verified at 800px (desktop nav, dropdown gap 15px, footer columns static) and in a 390px iframe (MENU/CLOSE panel with nested categories, footer accordions expanded/collapsed). `npm run format`, `npm run lint`, `npm run typecheck`, `npm test` (5 files, 39 tests), `npm run format:check` and `npm run build` pass; the six-digit hex grep still returns no matches in `src/components` and `src/app`.

---

## 2026-11-09 23:00:00 +07:00 — Add shared ProductCard, Carousel, BlogRow and formatPrice (G1.3)

### User prompt

> G1.3 — create Component dùng chung.
> ProductCard (ảnh vuông nền #EFEEEC, hover đổi ảnh thứ 2, tên, giá, color swatch),
> Carousel (5 card, nút ‹ › góc phải dưới, VIEW PRODUCTS góc phải trên),
> BlogRow, formatPrice.
> formatPrice(10000000) → "10.000.000" có unit test; card đúng khi sản phẩm chỉ có 1 ảnh hoặc không có màu; carousel đúng khi < 5 sản phẩm; swatch có aria-label tên màu.
>
> create new commit branch, commit strictly follow contributing rule and pull_request_template.md
> also give pr title
> if change, add prompt and output summarize to ai_logs.md with time stamp, put in beginning of file so user can review

### Changes made

- Branched `feature/g1-3-shared-components` from `feature/g1-2-tokens-layout` because the components build on the G1.2 tokens and layout.
- Added `src/lib/format-price.ts`: groups VND digits with dots (`10000000` → `10.000.000`) and leaves the currency unit to the caller. Added `src/lib/format-price.test.ts`.
- Added `src/components/product-card.tsx`: square `product-image-frame` (the `#EFEEEC` token), front image plus a second gallery image that fades in on hover, product name, formatted price and colour swatches. Single-image products render one image; products without colours render no swatch list; each swatch exposes the colour name through `aria-label`. Placeholder products that reuse the same image URL do not get a pointless hover layer.
- Added `src/components/carousel.tsx`: product carousel with five cards per page, `getCarouselPage()` windowing helper, VIEW PRODUCTS link at the top right and `‹` / `›` buttons at the bottom right. Fewer than five products render in full with both arrows disabled; the last page shows the remainder; an empty list shows a short empty state.
- Added `src/components/blog-row.tsx`: horizontal Blog row with cover image, `dd.mm.yyyy` publication date, title, summary and READ MORE link.
- Added `src/components/product-card.test.tsx` and `src/components/carousel.test.tsx`, rendering the components with `react-dom/server` and mocked `next/image` / `next/link` to cover the one-image, no-colour, swatch-label, fewer-than-five and pagination cases.
- Verified the components at runtime through a temporary `/preview` route: the first carousel rendered five cards with the next arrow enabled, the three-item carousel disabled both arrows, the Serenade card rendered two images and two labelled swatches, and paging to the second page showed the remaining product before returning. The temporary route was deleted afterwards.
- Documented the new components and helper in `docs/README.md` and `docs/ARCHITECTURE.md`, and committed the `next dev` agent-feedback block in `AGENTS.md`.

### Output summary

Shared product, carousel and Blog components plus `formatPrice` are ready for the G1.4 screens. `npm run format`, `npm run lint`, `npm run typecheck`, `npm test` (5 files, 39 tests), `npm run format:check` and `npm run build` pass, and the required six-digit hex grep still returns no matches.

---

## 2026-11-09 22:22:00 +07:00 — Add tokens-based header, footer and shell layout (G1.2)

### User prompt

> G1.2 — Tokens + Layout.  requirement
> Tokens trong Tailwind (@theme), font qua next/font.
> Header: logo, HOME, PRODUCTS (dropdown 4 danh mục, gạch chân mục active), BLOG, CONTACT.
> Footer: địa chỉ / điện thoại / email + icon, INFO, HELP, SOCIAL.
> grep -rnE "#[0-9A-Fa-f]{6}" src/components src/app --include=*.tsx không có kết quả; dropdown mở/đóng được bằng bàn phím (Enter, Esc, Tab).
>
> create new commit branch, commit strictly follow contributing rule and pull_request_template.md
> also give pr title
> if change, add prompt and output summarize to ai_logs.md with time stamp, put in beginning of file so user can review

### Changes made

- Branched `feature/g1-2-tokens-layout` from `feature/design-tokens-base-styles` because the layout consumes the Figma tokens added there.
- Added `src/components/header.tsx`: logo, HOME, PRODUCTS disclosure with the 4 seeded categories, BLOG and CONTACT; the active route gets an underline via `aria-current` styling. The disclosure opens with Enter/Space/ArrowDown, closes with Escape (focus returns to the toggle), closes on Tab out of the toggle, supports ArrowUp/ArrowDown inside the menu, and closes on outside pointer-down or focus loss.
- Added `src/components/footer.tsx`: responsive 12-column footer with the contact block (address, phone and email links plus icons) and HOME, INFO, HELP and SOCIAL columns; SOCIAL uses the Facebook and Instagram URLs from `getSettings()`; the footer carries `id="contact"` so the CONTACT link resolves to `/#contact`.
- Kept the live address update in `src/lib/mock/settings.ts` so the footer shows the real store address.
- Exposed the footer's secondary text colour as the `--color-muted` Tailwind token instead of the `text-[#383838]` arbitrary values, satisfying the no-hex rule in TSX.
- Added `src/components/icons.tsx`: inline chevron, map-pin, phone, mail, Facebook and Instagram SVGs using `currentColor` only, so no hex colours exist in TSX.
- Updated `src/app/layout.tsx`: keeps the Geist Sans/Mono `next/font` variables, reads categories and settings through query functions, renders `SiteHeader`/`SiteFooter` around the page, and sets the AN JEWELRY metadata plus `lang="vi"`.
- Added the provided `public/mock/products/antjewelry-logo.svg` asset used by the header and footer.
- Removed the two remaining six-digit hex utilities from the untracked WIP `src/app/home/page.tsx` so the required grep returns no results; that file and `src/components/productCard.ts` remain uncommitted.
- Updated `docs/README.md` and `docs/ARCHITECTURE.md` to describe the shared layout components and the root-layout wiring.
- Omitted the copyright year from the footer because Next.js 16 rejects `new Date()` during prerendering.

### Output summary

The storefront now has a global, token-based header and footer rendered by the root layout. Verified in the running production build: clicking PRODUCTS or pressing Enter opens the 4-category menu, Escape closes it and keeps focus on the toggle, and Tab from the toggle closes it before moving to BLOG. Lighthouse accessibility reports 100 with no failures. `npm run format`, `npm run lint`, `npm run typecheck`, `npm test` (24 tests), `npm run format:check` and `npm run build` pass, and the required hex grep returns no matches.

---

## 2026-11-09 15:46:00 +07:00 — Apply Figma design tokens to the root layout stylesheet

### User prompt

> Token	Giá trị	Dùng ở
> Nền trang	#FEFDF8	body, header, footer
> Nền ảnh sản phẩm	#EFEEEC	khung ảnh vuông của card và gallery
> Đường kẻ	#93AAA0	viền dưới header, viền trên footer, divider trang sản phẩm
> Chữ chính	#000000	tên sản phẩm, giá, đoạn văn
> Font heading / nav	Monospace, VIẾT HOA	tiêu đề section, menu, nút — đối chiếu tên font chính xác trong Figma
> Font nội dung	Sans-serif	mô tả, blog, footer
>
> use this to change layout.css at highest level
> create new commit branch, commit strictly follow contributing rule and pull_request_template.md
> also give pr title
> if change, add prompt and output summarize to ai_logs.md with time stamp, put in beginning of file so user can review

### Changes made

- Updated the highest-level stylesheet imported by `src/app/layout.tsx`, `src/app/globals.css`, with the Figma tokens as CSS custom properties: page background `#FEFDF8`, product-image background `#EFEEEC`, line colour `#93AAA0` and main text `#000000`.
- Exposed the tokens through Tailwind v4 `@theme inline` as `bg-background`, `bg-product-image`, `border-line`, `font-heading` and `font-body` utilities.
- Set the body background, text colour and sans-serif content font; applied the monospace heading font and uppercase transform to headings, nav and buttons.
- Added header/footer backgrounds, header bottom border, footer top border and product divider colour, plus a `.product-image-frame` helper for square card/gallery frames.
- Removed the default dark-mode overrides so the Figma colours stay consistent.
- Noted the stylesheet and its tokens in `docs/README.md`.
- Removed leftover merge-conflict markers from `docs/AI_LOGS.md`, `docs/README.md`, `docs/ARCHITECTURE.md`, `src/lib/mock/products.ts` and `src/lib/queries/queries.test.ts`, keeping the webp-photo side of each conflict.
- Left the existing uncommitted home-page move and empty `src/components/productCard.ts` untouched.

### Output summary

The root layout now defines and applies the Figma design tokens in one place. Verification passed: `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`, `npm run build`.

---

## 2026-11-09 15:35:00 +07:00 — Populate mock products with webp photos

### User prompt

> use the new webp images in products to populate mock, ex: ring-5-2 is second pic of ring-5
>
> use previous command brand, commit stricly follow contributing rule and pull_request_template.md
> merge 2 pull request body, previous one has not been merged yet, also give pr title
> if change, add promt and output summarize to ai_logs.md with time stamp, put in beginning of file so user can review

### Changes made

- Added a `productPhoto()` helper and an optional `images` list to `ProductSeed` in `src/lib/mock/products.ts`; the first URL becomes the front image and the rest are ordered gallery images.
- Wired the 10 new primary webp photos into the matching ring products: `ring-1` → Solitaire Grace, `ring-2` → Étoile Pavé, `ring-3` → Blossom Three Stone, `ring-4` → Eclipse Pavé Band, `ring-5` → Serenade Twisted Band, `ring-6` → Aurora Band, `ring-7` → Halo Eternity Band, `ring-8` → Petite Promise, `ring-9` → Lumiere Slim Band, `ring-10` → Regal Emerald Cut.
- Added the second angles as secondary gallery images: `ring-2-1` for Étoile Pavé and `ring-5-2` for Serenade Twisted Band, with `sortOrder` and `isFront` set by position.
- Products without a matching photo keep the existing SVG placeholder per `ProductType` (both a front and a detail entry), so all mock products still expose a gallery.
- Extended `src/lib/queries/queries.test.ts` with checks for 10 unique webp front images, webp front-image shape, ordered secondary angles for `ring-2`/`ring-5`, and SVG placeholders for products without a photo.
- Updated `docs/README.md` and `docs/ARCHITECTURE.md` to document the webp product photos, the `ring-N-M` secondary-image convention and SVG placeholders.

### Output summary

Mock products now display the new webp photos, and `ring-2-1` / `ring-5-2` are exposed as the second gallery image of their parent ring. Verification passed: `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`, `npm run build`.

---

## 2026-11-09 14:58:00 +07:00 — Unify ProductType with Category and fix mock data

### User prompt

> fix mock data with new ProductType, type and category are one, use category filter use ProductType,
>
> use previous command brand, commit stricly follow contributing rule and pull_request_template.md
> merge 2 pull request body, previous one has not been merged yet, also give pr title
> if change, add promt and output summarize to ai_logs.md with time stamp, put in beginning of file so user can review

### Changes made

- Kept the new `ProductType` union (`WEDDING RING`, `ENGAGEMENT RING`, `NECKLACE`, `OTHER JEWELRY`) from `src/types/domain.ts`.
- Unified type and category: removed `Product.categoryId`, made `Product.type` the category key, and added `Category.type: ProductType` so each category maps one-to-one to a ProductType.
- Rewrote `src/lib/mock/categories.ts` with 4 categories keyed by ProductType: Wedding Ring, Engagement Ring, Necklace, Other Jewelry, ordered by `sortOrder`.
- Rewrote `src/lib/mock/products.ts` around the unified type: 24 products (23 visible, 1 hidden) now carry `type` instead of `categoryId`; the former jewelry form is kept only as a local `form` used to build detail rows.
- Updated mock hero slides to link to the new category slugs (`/c/wedding-ring`, `/c/engagement-ring`, `/c/other-jewelry`).
- Updated queries: `getProducts` filters by `type` (which is the category filter), added `getCategoryByType` and `getProductsByCategorySlug`, and `getRelatedProducts` now matches on `ProductType`.
- Updated tests to 21 passing cases covering type filters, category-slug filtering through ProductType, one category per ProductType, related products and the existing blog/hero/settings/price checks.
- Updated `docs/README.md`, `docs/ARCHITECTURE.md` and `docs/REQUIREMENTS.md` to record that ProductType and Category are unified and that the category filter uses ProductType.
- Left the pre-existing uncommitted edit in `docs/CONTRIBUTING.md` untouched.

### Output summary

Mock data, queries and tests now use the new ProductType as the single product/category taxonomy. There is no `categoryId`; category filtering goes through `ProductType`, and `getProductsByCategorySlug` resolves a category slug to its ProductType before filtering. Verification passed: `npm run lint`, `npm run typecheck`, `npm test` (2 files, 21 tests), `npm run format:check`, `npm run build`.

---

## 2026-11-09 14:35:00 +07:00 — G1.1 domain types, mock data and query layer

### User prompt

> Dùng mock data đặt trong src/lib/mock/, gõ kiểu theo src/types/domain.ts. Truy cập dữ liệu qua hàm query
>
> G1.1 — Domain types + mock data + query layer. Bổ sung domain.ts: Product (categoryId, brand, type, description, details, colors), ProductColor, ProductImage, Category (sortOrder), BlogPost (coverImageUrl, publishedAt), HeroSlide, Settings, Role. Mock ≥ 20 sản phẩm / 4 danh mục, 6 bài blog.
> trang chỉ import hàm query, không import trực tiếp file mock.
>
> create new branch, commit stricly follow contributing rule and pull_request_template.md
> if change, add promt and output summarize to ai_logs.md with time stamp, put in beginning of file so user can review

### Changes made

- Extended `src/types/domain.ts` with `ProductColor`, `ProductImage`, `Product`, `HeroSlide`, `Settings`, `Role` and `ProductType`, and added the requested fields: product `categoryId`, `brand`, `type`, `description`, `details`, `colors`; category `sortOrder`; Blog `coverImageUrl`, `publishedAt`. `createVndPrice` now also rejects negative amounts.
- Added typed mock data in `src/lib/mock/`: 24 products (23 `VISIBLE`, 1 `HIDDEN`) across 4 categories, 6 Blog posts (5 `PUBLISHED`, 1 `DRAFT`), 3 hero slides (2 `VISIBLE`, 1 `HIDDEN`) and storefront `Settings` with clearly fake contact values.
- Added `src/lib/queries/` as the only data-access layer: `getProducts` (category/type/status filters plus `price_asc`, `price_desc`, `name_asc`, `name_desc` sorting), `getProductBySlug`, `getProductById`, `getRelatedProducts`, `getCategories`, `getCategoryBySlug`, `getBlogPosts`, `getBlogPostBySlug`, `getHeroSlides` and `getSettings`.
- Query functions exclude hidden/draft records from storefront results unless an admin option is passed, and return deep clones so callers cannot mutate mock sources.
- Added local SVG placeholders under `public/mock/` for 4 product images, 6 Blog covers and 3 hero slides.
- Added an ESLint `no-restricted-imports` rule that blocks `src/app/**` from importing `@/lib/mock` or `**/lib/mock/*`; verified the rule reports an error on a probe import.
- Configured the `@` alias in `vitest.config.mts` so tests resolve `@/lib/...`.
- Added `src/lib/queries/queries.test.ts` with 17 tests covering counts, hidden/draft exclusion, filters, sorting, slug lookups, related products, clone isolation, settings and the VND guard.
- Updated `docs/README.md` and `docs/ARCHITECTURE.md` work-tree status, repository trees and the mock/query data-access rule.
- Left the pre-existing uncommitted edit in `docs/CONTRIBUTING.md` untouched.

### Output summary

G1.1 is implemented on branch `feature/g1-1-domain-mock-query`: domain types, typed mock data and the query layer are in place, and pages can only reach data through `@/lib/queries` (enforced by ESLint). Mock coverage exceeds the requirement: 24 products ≥ 20, 4 categories, 6 Blog posts. Verification passed: `npm run lint`, `npm run typecheck`, `npm test` (2 files, 19 tests), `npm run format:check`, `npm run build`.

---

## 2026-11-09 14:02:00 +07:00 — Align docs and tooling with the repository

### User prompt

> review file, check for bug, mismatch between file and iron out
>
> Storefront + trang quản trị + database, trong repo Ant-jewelry hiện có. Làm theo 4 giai đoạn (G0 → G4), mỗi mục có dấu ☐ là một PR.
> Design: Figma Jewelry-website — 6 màn: Home, Category, Product, Product + Contact popover, Blog list, Blog detail. Đối chiếu thêm antjewelry.vn.
> Quyết định đã chốt: một Next.js App Router + TypeScript strict; read bằng Server Components, mutation bằng Server Actions, Route Handlers chỉ cho upload; không NestJS, không tầng REST riêng. Prisma, SQLite dev, PostgreSQL production, validate bằng Zod. ADMIN toàn quyền; EDITOR quản lý sản phẩm (trừ giá), danh mục, Blog, hero slide; không sửa giá, không vào Settings / Users. Không có Inquiry/form; ORDER NOW mở Contact popover lấy số điện thoại + Facebook + Instagram từ Settings. Giá là số nguyên VND, hiển thị 10.000.000, không ký hiệu tiền tệ. Responsive tự thiết kế cho mobile/tablet. Ngoài phạm vi: giỏ hàng, thanh toán, tài khoản khách hàng, wishlist, đa ngôn ngữ. Design tokens: #FEFDF8, #EFEEEC, #93AAA0, #000000; heading/nav monospace viết hoa; nội dung sans-serif. Figma ghi "Short by" ở Category — sửa thành "Sort by".
> dont code anything yet
> create new branch, commit stricly follow contributing rule and pull_request_template.md
> if change, add promt and output summarize to ai_logs.md with time stamp, put in beginning of file so user can review

### Changes made

- Reviewed the work tree against `CONTRIBUTING.md`, `pull_request_template.md` and the agreed decisions; found configuration, documentation and template mismatches rather than application-code defects.
- Fixed `.gitignore` so `.env.example` is committed while `.env*` remains ignored; added local SQLite database file patterns.
- Rewrote `.env.example` for Prisma with SQLite local development and PostgreSQL production placeholders.
- Renamed `vitest.config.ts` to `vitest.config.mts`; this removes the Vitest/Vite CommonJS config-loader warning.
- Ran Prettier across the configured code files (11 files) and fixed the missing newline in `package.json`; `npm run format:check` now passes.
- Repaired `.github/pull_request_template.md`: its first heading was indented four spaces and rendered as a code block. The template now matches the PR sections and verification commands in `CONTRIBUTING.md`.
- Updated `docs/README.md`: single Next.js architecture (removed NestJS), Prisma/SQLite/PostgreSQL/Zod decisions, Prettier/Vitest, `.env.example`, scripts, directory tree and verification commands.
- Updated `docs/CONTRIBUTING.md`: `src/` structure and `@/*` alias, no separate backend/REST layer, Prisma/Zod decisions, Vitest and Prettier commands, and PR checklist/description consistency.
- Updated `docs/ARCHITECTURE.md`: work-tree status, stack table, SQLite/PostgreSQL and Prisma decisions, repository trees, environment section, implementation checkboxes and ADR entries.
- Updated `docs/REQUIREMENTS.md`: added the agreed decisions and Figma design tokens, aligned role names (`ADMIN`/`EDITOR`, mapping `EDITOR` to SAD Staff), integer VND price, ORDER NOW → Contact popover, single Next.js/no-REST architecture, "Sort by" label, and fixed the truncated `NFR-008` reference in OI-021.
- No storefront, admin, database schema or Server Action code was added.

### Output summary

Documentation and repository tooling now match the work tree and the agreed technical decisions. Verification passed: `npm test` (2 tests), `npm run typecheck`, `npm run lint`, `npm run format:check`, and `npm run build`. The new branch is `fix/align-docs-and-tooling`; no application features were implemented.

---

## 2026-11-08 10:32:32 +07:00 — Convert architecture to a single Next.js app

### User prompt

> docs/ARCHITECTURE.md: single Next.js app
> - Bỏ NestJS và tầng REST API riêng.
> - Kiến trúc: Next.js App Router, Server Components cho read, Server Actions / Route Handlers cho mutation.
> - Cập nhật lại sơ đồ layer, request flow, cấu trúc repo cho khớp.
> - AC: grep -ci nestjs docs/ARCHITECTURE.md → 0.
>
> if change, add promt and output summarize to ai_logs.md with time stamp, put in beginning of file so user can review

### Changes made

- Removed the separate backend and REST API layer from `docs/ARCHITECTURE.md`; the document now describes one Next.js application.
- Updated the technology stack: Next.js App Router as the application, React Server Components for read, Server Actions / Route Handlers for mutation; removed the backend framework row.
- Rewrote the layer list and Mermaid architecture diagram into a single Next.js deployment with UI, read path, mutation path, domain modules, Prisma and PostgreSQL.
- Rewrote the request flows: read requests go through Server Components and query functions; admin mutations go through Server Actions (Route Handlers for upload/webhook), with server-side authorization and revalidation.
- Replaced the API Architecture section with "Server Data Access and Mutation Architecture", including read/mutation tables and a mapping from the SAD endpoint proposals to query functions / Server Actions.
- Updated image storage, non-functional concerns, repository structure, deployment, open issues, implementation phases, guardrails and ADR entries to remove the split frontend/backend design.
- Updated the actual work-tree tree to `src/app/` and `src/types/`, and the proposed structure to a single app with `src/features/`, `src/lib/`, `prisma/` and Route Handlers only for uploads/webhooks.
- Removed every `NestJS` reference from `docs/ARCHITECTURE.md`.

### Output summary

`docs/ARCHITECTURE.md` now documents a single Next.js App Router application: Server Components for reads, Server Actions / Route Handlers for mutations, Prisma/PostgreSQL for persistence, and no separate REST API layer. Verification: `git grep -ci nestjs -- docs/ARCHITECTURE.md` returns no matches (`Select-String` count = 0), satisfying the AC.

---

## 2026-11-08 10:16:25 +07:00 — Update sitemap in docs/REQUIREMENTS.md

### User prompt

> Sitemap in docs/REQUIREMENTS.md need modification
> - Bảng: Route | Màn Figma | Các khối chính | Quyền truy cập
> - Storefront: /, /c/[slug], /p/[slug], /blog, /blog/[slug], 4 trang footer (Terms and Conditions, Privacy Policy, Shipping & Return, Jewelry Care).
> - Contact popover (ORDER NOW): overlay, không phải route riêng; chỉ hiển thị số điện thoại + link Facebook/Instagram, không có form.
> - Admin: /admin/* (login, products, categories, blog, hero slides, settings, users), ghi role được truy cập (ADMIN / EDITOR).
> - AC: đủ 6 màn Figma (Home, Category, Product, Product + Contact popover, Blog list, Blog detail).
>
> if change, add promt and output summarize to ai_logs.md with time stamp, put in beginning of file so user can review

### Changes made

- Replaced the UI page list in `docs/REQUIREMENTS.md` §9.1 with a sitemap table using exactly four columns: `Route`, `Màn Figma`, `Các khối chính`, `Quyền truy cập`.
- Storefront routes: `/`, `/c/[slug]`, `/p/[slug]`, `/blog`, `/blog/[slug]`, plus the four footer pages `/terms-and-conditions`, `/privacy-policy`, `/shipping-and-return`, `/jewelry-care`.
- Added the Contact popover as an overlay row on `/p/[slug]` (explicitly not a separate route): phone number and Facebook/Instagram links only, no form.
- Added admin routes for login, products, categories, blog, hero slides, settings and users, with `ADMIN` / `EDITOR` access recorded per route; `EDITOR` is limited to content modules and `ADMIN` also manages settings/users.
- Added an explicit Figma coverage line proving all 6 screens are present (Home, Category, Product, Product + Contact popover, Blog list, Blog detail).
- Updated FR-005 and FR-007 flow references from the old observed paths (`/public/...`) to the sitemap routes (`/c/[slug]`, `/p/[slug]`) while keeping the old paths noted as historical observations.

### Output summary

`docs/REQUIREMENTS.md` §9.1 is now a route-level sitemap with the requested columns and access roles. Storefront, footer, contact overlay and admin routes are all covered, and the table explicitly maps to the six Figma screens. The detailed permission matrix remains tied to OI-004, so the new `EDITOR` role mapping to the SAD Staff actor is flagged rather than silently assumed.

---

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
