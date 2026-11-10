import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: 'Điều khoản và điều kiện sử dụng website AN JEWELRY.',
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <h1 className="text-center font-heading text-2xl tracking-[0.08em] sm:text-3xl">
        TERMS AND CONDITIONS
      </h1>
      <div className="mt-10 space-y-6 text-sm leading-7 text-muted sm:text-base">
        <p>
          Khi truy cập và sử dụng website AN JEWELRY, bạn đồng ý tuân thủ các điều khoản dưới đây.
          Nội dung trên website được cung cấp nhằm giới thiệu sản phẩm và thông tin liên hệ.
        </p>
        <section>
          <h2 className="font-heading text-base tracking-[0.08em] text-foreground">
            Sản phẩm và giá
          </h2>
          <p className="mt-2">
            Hình ảnh, mô tả và giá sản phẩm có thể được cập nhật theo thời điểm. Giá hiển thị bằng
            VND và chưa bao gồm các chi phí phát sinh (nếu có) trừ khi được ghi rõ.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-base tracking-[0.08em] text-foreground">
            Liên hệ và đặt hàng
          </h2>
          <p className="mt-2">
            Website không hỗ trợ thanh toán trực tuyến. Để đặt hàng hoặc tư vấn, vui lòng liên hệ
            qua số điện thoại, Facebook hoặc Instagram được công bố trên website.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-base tracking-[0.08em] text-foreground">
            Quyền sở hữu nội dung
          </h2>
          <p className="mt-2">
            Mọi hình ảnh, văn bản và thiết kế trên website thuộc quyền sở hữu của AN JEWELRY hoặc
            đối tác được cấp phép. Vui lòng không sao chép hoặc sử dụng cho mục đích thương mại khi
            chưa có sự đồng ý.
          </p>
        </section>
      </div>
    </main>
  );
}
