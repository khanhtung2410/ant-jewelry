## What

<!-- Tóm tắt ngắn gọn thay đổi. 1-2 câu. -->

## Why

<!-- Lý do / ticket liên quan. Link tới issue nếu có. -->

## How

<!-- Cách tiếp cận chính và điểm cần lưu ý khi review. -->

## Verification

Dán output đầy đủ của 4 lệnh dưới đây vào code block (không chỉ ghi "pass"):

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`

```text
# Output của 4 lệnh
```

## Screenshots (so với Figma)

<!-- Bắt buộc với thay đổi UI. Dùng bảng Trước / Sau nếu có. -->

| Trước | Sau |
|---|---|
|  |  |

## Checklist

- [ ] Đã cập nhật từ `main` mới nhất và giải quyết conflict nếu có
- [ ] Lint, type-check, test và build pass
- [ ] `npm run format:check` pass (nếu có thay đổi file)
- [ ] Không có breaking change (hoặc đã ghi rõ ở footer commit)
- [ ] Đã cập nhật README / docs nếu thay đổi hành vi hoặc cấu hình
