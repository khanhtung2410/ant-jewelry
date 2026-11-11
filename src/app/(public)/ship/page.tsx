import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping and Return',
  description: 'Chính sách vận chuyển và đổi trả của ANT JEWELRY.',
};

export default function ShippingAndReturnPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <h1 className="text-center font-heading text-2xl tracking-[0.08em] sm:text-3xl">
        SHIPPING AND RETURN
      </h1>
      <div className="mt-10 space-y-6 text-sm leading-7 text-muted sm:text-base">
        <section>
          <h2 className="font-heading text-base tracking-[0.08em] text-foreground">Vận chuyển</h2>
          <p className="mt-2">
            ANT JEWELRY hỗ trợ giao hàng tại Việt Nam. Thời gian và phí vận chuyển được xác nhận khi
            bạn liên hệ đặt hàng, tùy theo khu vực và tình trạng sản phẩm.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-base tracking-[0.08em] text-foreground">
            Kiểm tra khi nhận hàng
          </h2>
          <p className="mt-2">
            Vui lòng kiểm tra tình trạng sản phẩm và đối chiếu thông tin trước khi nhận. Nếu có vấn
            đề về ngoại quan hoặc sai sản phẩm, hãy liên hệ ngay với chúng tôi để được hỗ trợ.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-base tracking-[0.08em] text-foreground">
            Đổi trả và bảo hành
          </h2>
          <p className="mt-2">
            Chính sách đổi trả và bảo hành được áp dụng theo từng dòng sản phẩm và tình trạng thực
            tế. Chúng tôi sẽ tư vấn cụ thể khi bạn cung cấp thông tin đơn hàng và sản phẩm.
          </p>
        </section>
      </div>
    </main>
  );
}
