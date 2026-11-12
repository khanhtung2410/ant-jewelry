# Contributing Guide

Cảm ơn bạn đã quan tâm đóng góp cho **ANT JEWELRY**.
Tài liệu này mô tả quy trình làm việc, quy tắc code, commit và pull request.

> Đọc `README.md` trước để hiểu project làm gì và cách chạy local.

---

## 1. Quy trình làm việc

Mô hình: **GitHub Flow** — làm việc trên nhánh riêng rồi mở Pull Request về nhánh chính.

```
main      ← nhánh chính của repository
feature/*   ← nhánh tính năng
fix/*       ← nhánh sửa bug
chore/*     ← cấu hình, dependency, CI
docs/*      ← chỉ sửa tài liệu
```

**Các bước:**

1. Cập nhật `main` mới nhất:

   ```bash
   git switch main
   git pull --ff-only origin main
   ```

2. Tạo nhánh mới từ `main`:

   ```bash
   git switch -c feature/product-listing
   ```

3. Code, chạy các lệnh kiểm tra phù hợp ở mục Testing, rồi commit theo quy tắc bên dưới.

4. Push và mở Pull Request vào `main`:

   ```bash
   git push -u origin feature/product-listing
   ```

5. Đảm bảo các kiểm tra bắt buộc và review theo yêu cầu của repository đã hoàn tất trước khi merge. Sau khi merge, xóa nhánh đã hoàn thành.

**Quy tắc đặt tên nhánh:**

```
<type>/<kebab-case-mô-tả-ngắn>
```

Nếu có ticket ID, dùng `<type>/<ticket-id>-<kebab-case-mô-tả-ngắn>`.

Ví dụ:

- `feature/product-listing`
- `fix/product-sort-order`
- `chore/upgrade-next`
- `docs/update-contact-scope`

Chỉ dùng chữ ASCII, chữ số và dấu gạch ngang trong tên nhánh. Không có ticket ID thì dùng mô tả ngắn.

---

## 2. Quy tắc code

### Nguyên tắc chung

- **TypeScript strict** — không dùng `any`, không `// @ts-ignore` trừ khi có comment giải thích.
- **Không commit code chết** — không `console.log`, không code comment-out, không file `.bak`.
- **Không commit secret** — API key, mật khẩu, JWT secret để trong `.env` (đã có trong `.gitignore`).
- **Một hàm làm một việc** — hàm > 50 dòng nên tách.
- **Tên biến/hàm mô tả đúng ý nghĩa** — `getProductById` tốt hơn `getData`.
- **Ưu tiên dễ đọc hơn thông minh** — code được đọc nhiều lần hơn viết.

### Cấu trúc file

```text
src/app/          ← route, page, layout, route handler (hiện có)
src/types/        ← domain contracts (hiện có)
public/           ← static assets (hiện có)
docs/             ← tài liệu dự án (hiện có)
src/components/   ← component giao diện dùng chung (tạo khi cần)
src/lib/          ← tiện ích và logic dùng chung (tạo khi cần)
src/constants/    ← hằng số và cấu hình domain (tạo khi cần)
```

Alias `@/*` trong `tsconfig.json` trỏ về `src/*`. Đặt code gần route hoặc domain đang sử dụng; chỉ tạo thư mục dùng chung khi có nhiều nơi thực sự cần dùng.

### Server vs Client Component

- **Mặc định là Server Component** — không thêm `"use client"` trừ khi cần.
- Chỉ thêm `"use client"` khi dùng `useState`, `useEffect`, event handler, hoặc browser API.
- Trang có thể là Client Component nếu cần tương tác phía trình duyệt; nếu chỉ một phần cần tương tác, cân nhắc tách riêng phần đó.

### Tầng gọi API

- Kiến trúc đã chốt là **một Next.js application duy nhất**: read bằng Server Components, mutation bằng Server Actions, Route Handlers chỉ dùng cho upload. Không tạo NestJS hoặc tầng REST API riêng.
- Không gọi database trực tiếp từ component phía trình duyệt; database chỉ được truy cập trong server-side code, Server Action, query function hoặc route handler.
- Giữ query function và Server Action trong module server-side tương ứng; tránh lặp lại logic giữa các route.

### Database (đã chốt công nghệ, chưa cấu hình)

- Đã chốt **Prisma**; local dev dùng **SQLite**, production dùng **PostgreSQL**. Work tree chưa có schema, migration hoặc Prisma Client; không tạo schema/migration ngoài task tương ứng.
- Khi Database được bổ sung, mọi query phải dùng **parameterized query**, không nối chuỗi:

  ```ts
  // ❌ Sai — SQL injection
  db.query(`SELECT * FROM Products WHERE Name = '${name}'`);

  // ✅ Đúng — placeholder parameterized ($1) theo PostgreSQL
  db.query("SELECT * FROM products WHERE name = $1", [name]);
  ```

- Không viết SQL trong component; đặt truy vấn trong API route, route handler hoặc server-side module phù hợp.
- Mọi thay đổi schema phải có file migration, không sửa DB thủ công.

### Validation

- Validate dữ liệu không đáng tin cậy ở server, gồm body, query param, `FormData` và dữ liệu từ bên ngoài.
- Dùng **Zod** cho schema validation; đặt schema gần Server Action hoặc module nghiệp vụ sử dụng. Zod chưa được cài trong work tree hiện tại, bổ sung khi làm phase Database/Server Action.

### Testing

- Repository dùng **Vitest**; script `test` và `test:watch` đã có. Test đặt cạnh code trong `src/` với hậu tố `.test.ts` hoặc `.spec.ts`.
- E2E dùng **Playwright**; cài browser Chromium bằng `npx playwright install chromium`, sau đó chạy `npm run test:e2e`. Lệnh này tạo schema và seed riêng trong `prisma/e2e.db` trước khi khởi động ứng dụng, không dùng database local của Vitest.
- Với thay đổi giao diện hoặc logic hiện có, kiểm tra thủ công các luồng bị ảnh hưởng và ghi rõ trong Pull Request.
- Ưu tiên kiểm thử hàm thuần, validation schema và hành vi server-side có thể tái hiện ổn định.

### Format & Lint

- Repository cấu hình ESLint và Prettier; chưa cấu hình Husky pre-commit hook.

```bash
npm run lint             # kiểm tra ESLint
npm run lint -- --fix    # yêu cầu ESLint tự sửa lỗi có thể tự động sửa
npm run typecheck        # kiểm tra kiểu
npm run format           # Prettier ghi lại file
npm run format:check     # kiểm tra format, dùng trong CI/PR
```

---

## 3. Quy tắc commit

Áp dụng **Conventional Commits**.

### Format

```
<type>(<scope>): <mô tả ngắn ở thể mệnh lệnh>

[body tùy chọn — giải thích WHY, không phải WHAT]

[footer — ticket, breaking change]
```

### Type

| Type | Ý nghĩa |
|---|---|
| `feat` | Tính năng mới |
| `fix` | Sửa bug |
| `docs` | Chỉ sửa tài liệu |
| `style` | Format, dấu chấm phẩy (không đổi logic) |
| `refactor` | Tái cấu trúc, không đổi hành vi |
| `perf` | Cải thiện hiệu năng |
| `test` | Thêm/sửa test |
| `chore` | Build, CI, dependency |

### Scope (tùy chọn)

Dùng tên domain phù hợp với ANT JEWELRY: `home`, `products`, `blog`, `admin`, `ui`, `config`, `docs`. Khi các module `auth` hoặc `db` được bổ sung, có thể dùng thêm các scope đó.

### Ví dụ

```
feat(products): add product listing page

fix(products): keep filters when sort order changes

docs(requirements): scope contact to phone and social links

chore(config): enable turbopack css loader
```

```
refactor(ui): extract shared product card
```

### Quy tắc viết

- Dòng tiêu đề **≤ 72 ký tự**, không viết hoa đầu câu, không dấu chấm cuối.
- Dùng chữ ASCII trong commit message để thống nhất với tên nhánh và tránh lỗi encoding ở công cụ.
- Dùng **thể mệnh lệnh** bằng tiếng Anh: `add` thay vì `added`, `fix` thay vì `fixing`.
- Mỗi commit là một thay đổi logic hoàn chỉnh — build được, test pass (nếu đã có test).
- Body giải thích **tại sao**, không phải **cái gì** (cái gì thì diff đã thể hiện).
- Breaking change: thêm `!` sau type và ghi rõ trong footer:

  ```text
  feat(api)!: change products api response format

  BREAKING CHANGE: rename the items field to data; this affects all clients.
  ```

---

## 4. Quy trình Pull Request

### Trước khi mở PR

- [ ] Đã cập nhật từ `main` mới nhất và giải quyết conflict nếu có.
- [ ] `npm run lint` pass.
- [ ] `npm run typecheck` pass.
- [ ] `npm test` pass.
- [ ] `npm run format:check` pass.
- [ ] `npm run build` thành công.
- [ ] Đã tự review diff trên GitHub.
- [ ] Đã cập nhật README / docs nếu thay đổi hành vi hoặc cấu hình.

### Tiêu đề PR

Theo cùng format Conventional Commits:

```
feat(products): add product listing page
fix(products): keep filters when sort order changes
```

### Mô tả PR

Có thể dùng mẫu sau để mô tả PR:

```markdown
## What
Tóm tắt ngắn gọn thay đổi. 1–2 câu.

## Why
Lý do / ticket liên quan. Link tới issue nếu có.

## How
Cách tiếp cận chính. Điểm cần lưu ý khi review.
Ví dụ: "Tách logic fetch sản phẩm ra hook để test được không cần DOM."

## Testing (dán các output đầy đủ của các lệnh vào sau tick)
Liệt kê các kiểm tra đã chạy và kết quả.

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run format:check`
- [ ] `npm run build`
- [ ] Kiểm tra thủ công (nếu cần), nêu môi trường và kết quả

## Screenshots (nếu là UI)
| Trước | Sau |
|---|---|
| <ảnh> | <ảnh> |

## Checklist
- [ ] `npm test` pass
- [ ] `npm run lint` pass
- [ ] `npm run typecheck` pass
- [ ] `npm run format:check` pass
- [ ] Không có breaking change (hoặc đã ghi rõ ở footer commit)
- [ ] Đã cập nhật docs nếu cần
```

### Kích thước PR

- **Lý tưởng: < 400 dòng thay đổi.**
- PR > 800 dòng nên tách — reviewer sẽ bỏ sót bug.
- Nếu buộc phải to (VD: migration schema), ghi rõ trong mô tả để reviewer biết chỗ nào cần soi kỹ.

### Review

- Tuân theo yêu cầu review và kiểm tra bắt buộc được cấu hình cho repository.
- Tác giả không tự merge PR của mình (trừ hotfix khẩn cấp, phải báo team).

**Cách để lại comment:**

| Prefix | Ý nghĩa | Bắt buộc sửa? |
|---|---|---|
| `[blocking]` | Phải sửa trước khi merge | ✅ |
| `[question]` | Cần giải thích, có thể không sửa | ⚠️ Trả lời |
| `[nit]` | Nhỏ, tùy, không bắt buộc | ❌ |
| `[suggestion]` | Đề xuất cải thiện | ❌ |

Ví dụ:

```text
[blocking] Query này nối chuỗi trực tiếp → SQL injection.
Dùng parameterized query.

[nit] Tên biến `d` nên đổi thành `debouncedSearch` cho rõ.

[question] Tại sao debounce 350ms mà không phải 500ms?
```

### Merge

- Dùng phương thức merge được repository cho phép; ưu tiên **Squash and merge** để lịch sử nhánh chính gọn.
- Xóa nhánh sau khi merge nếu không còn cần dùng.

### Sau khi merge

- Kiểm tra môi trường triển khai nếu repository có cấu hình deploy; không mặc định CI hoặc staging đã được thiết lập.
- Nếu phát hiện lỗi → mở PR `fix/...` mới, không revert trừ khi nghiêm trọng.

---

## 5. Báo cáo bug / đề xuất tính năng

### Bug

Mở issue với template:

```markdown
**Môi trường:** Chrome 120, Windows 11 / local dev
**Bước tái hiện:**
1. Chạy `npm run dev` và mở http://localhost:3000
2. <mô tả thao tác gây lỗi>

**Kết quả mong đợi:** <hành vi mong đợi>
**Kết quả thực tế:** <hành vi thực tế>
**Ảnh / log:** <đính kèm>
```

### Feature request

Mô tả **vấn đề cần giải quyết** trước, giải pháp đề xuất sau:

```markdown
**Vấn đề:** Tôi không tìm được sản phẩm theo danh mục mong muốn.
**Đề xuất:** Thêm lựa chọn sắp xếp theo giá và tên trên trang danh sách sản phẩm.
**Ưu tiên:** Cao / Trung bình / Thấp
```

### Bảo mật

**Không** mở issue công khai. Gửi email tới `<security@example.com>` kèm:

- Mô tả lỗ hổng
- Cách tái hiện
- Mức độ ảnh hưởng

Sẽ phản hồi trong vòng 48 giờ.

---

## 6. Câu hỏi?

- Mở discussion trên GitHub
- Slack/Discord: `<#channel>`
- Maintainer: `<@handle>`
