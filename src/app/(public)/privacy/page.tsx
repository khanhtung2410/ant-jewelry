import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Chính sách quyền riêng tư của ANT JEWELRY.',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <h1 className="text-center font-heading text-2xl tracking-[0.08em] sm:text-3xl">
        PRIVACY POLICY
      </h1>
      <div className="mt-10 space-y-6 text-sm leading-7 text-muted sm:text-base">
        <p>
          ANT JEWELRY tôn trọng quyền riêng tư của khách hàng. Chính sách này mô tả cách chúng tôi
          tiếp nhận và sử dụng thông tin khi bạn liên hệ với chúng tôi.
        </p>
        <section>
          <h2 className="font-heading text-base tracking-[0.08em] text-foreground">
            Thông tin thu thập
          </h2>
          <p className="mt-2">
            Website hiện không yêu cầu tạo tài khoản hay gửi biểu mẫu trực tuyến. Chúng tôi chỉ tiếp
            nhận thông tin bạn chủ động cung cấp khi liên hệ qua điện thoại hoặc mạng xã hội.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-base tracking-[0.08em] text-foreground">
            Mục đích sử dụng
          </h2>
          <p className="mt-2">
            Thông tin liên hệ được sử dụng để tư vấn, xác nhận nhu cầu và hỗ trợ bạn về sản phẩm.
            Chúng tôi không bán hoặc chia sẻ thông tin cá nhân cho bên thứ ba vì mục đích quảng cáo.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-base tracking-[0.08em] text-foreground">Liên hệ</h2>
          <p className="mt-2">
            Nếu bạn có câu hỏi về quyền riêng tư, vui lòng liên hệ qua các kênh được công bố trong
            mục Contact của website.
          </p>
        </section>
      </div>
    </main>
  );
}
