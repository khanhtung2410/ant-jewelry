# Hướng dẫn vận hành cho chủ cửa hàng

Tài liệu này dành cho người quản lý nội dung ANT JEWELRY. Chỉ thực hiện sau khi ứng dụng được deploy, ADMIN đầu tiên được bàn giao và trang `/admin/login` hoạt động. Không gửi mật khẩu, link chứa token hoặc thông tin database qua email/chat không an toàn.

## 1. Đăng nhập

1. Mở `https://<domain-da-duoc-duyet>/admin/login`.
2. Đăng nhập bằng email và mật khẩu ADMIN đã nhận qua kênh bàn giao riêng.
3. Dùng trình quản lý mật khẩu để lưu thông tin đăng nhập; không dùng chung tài khoản ADMIN.
4. Chọn **Log out** khi dùng xong trên máy dùng chung.

Nếu không đăng nhập được, không tạo tài khoản mới hoặc sửa database thủ công. Liên hệ người quản trị kỹ thuật để kiểm tra trạng thái tài khoản hoặc cấp lại quyền.

## 2. Thêm sản phẩm

1. Mở **Products** trong khu vực quản trị và chọn tạo sản phẩm.
2. Điền tên, slug, danh mục, loại sản phẩm, thương hiệu, giá VND, mô tả và thông số. Slug tạo thành địa chỉ công khai `/p/<slug>`; dùng chữ thường, không dấu, ngăn cách từ bằng dấu gạch ngang và không trùng sản phẩm khác.
3. Tải ảnh JPG, PNG hoặc WebP đã được cửa hàng duyệt. Mỗi ảnh tối đa 5 MiB. Chọn ảnh bìa và ảnh hover, sắp xếp ảnh, rồi gán ảnh vào màu tương ứng nếu cần.
4. Kiểm tra giá và chính tả. Để sản phẩm ở trạng thái hiển thị khi nội dung sẵn sàng; dùng **Ẩn** nếu cần tạm gỡ sản phẩm khỏi storefront.
5. Lưu và mở trang sản phẩm công khai để kiểm tra ảnh, màu, thông tin và nút liên hệ.

Không tải lên ảnh mà cửa hàng không có quyền sử dụng. Nếu ảnh tải lên lỗi, thử lại một lần; nếu tiếp tục lỗi, báo người quản trị kỹ thuật kiểm tra thư mục lưu ảnh và quyền ghi trên máy chủ, không gửi ảnh qua kênh công khai.

## 3. Viết và xuất bản Blog

1. Mở **Blog** và tạo bài viết mới.
2. Nhập tiêu đề, slug, tóm tắt, ngày xuất bản, URL ảnh bìa và nội dung. Slug phải duy nhất; bài viết sẽ có địa chỉ `/blog/<slug>`.
3. Dùng chế độ soạn thảo phù hợp trong trường nội dung; kiểm tra dấu tiếng Việt, xuống dòng, liên kết và nội dung trên màn hình nhỏ.
4. Lưu ở trạng thái bản nháp để duyệt. Chỉ chuyển sang **Published** sau khi nội dung, ngày xuất bản và ảnh bìa được kiểm tra.
5. Mở bài viết công khai sau khi lưu để xác nhận nội dung hiển thị đúng.

Không đưa dữ liệu khách hàng, mật khẩu, thông tin nội bộ hoặc nội dung chưa được cửa hàng duyệt lên Blog.

## 4. Đổi thông tin cửa hàng

1. Mở **Settings**.
2. Cập nhật các trường **Site name**, **Phone number**, **Email**, **Address**, **Facebook URL** và **Instagram URL** theo thông tin chính thức.
3. Kiểm tra số điện thoại và URL mạng xã hội bằng cách mở thử trên trình duyệt.
4. Lưu thay đổi, sau đó xem header, footer và hộp liên hệ trên website công khai.

Thông tin liên hệ hiển thị công khai. Chỉ nhập số điện thoại, địa chỉ email và liên kết mạng xã hội mà cửa hàng cho phép công bố.

## 5. Hỗ trợ và an toàn vận hành

- Thông báo lỗi, không tải được ảnh, hoặc trang quản trị không lưu: ghi lại thời điểm và thao tác; không ghi mật khẩu, cookie, secret hoặc connection string.
- Không chạy demo seed trên production và không tự sửa dữ liệu/database bằng SQL.
- Không xóa sản phẩm hoặc bài viết đang được dùng nếu chưa có người quản lý duyệt.
- Hệ thống là website giới thiệu sản phẩm: khách hàng liên hệ cửa hàng trực tiếp; không có giỏ hàng hay thanh toán trực tuyến.
- Sao lưu và khôi phục database do người quản trị hạ tầng thực hiện theo [`DEPLOY.md`](./DEPLOY.md).
