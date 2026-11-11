import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jewelry Care',
  description: 'Hướng dẫn bảo quản và chăm sóc trang sức ANT JEWELRY.',
};

export default function JewelryCarePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <h1 className="text-center font-heading text-2xl tracking-[0.08em] sm:text-3xl">
        JEWELRY CARE
      </h1>
      <div className="mt-10 space-y-6 text-sm leading-7 text-muted sm:text-base">
        <section>
          <h2 className="font-heading text-base tracking-[0.08em] text-foreground">
            Sử dụng hằng ngày
          </h2>
          <p className="mt-2">
            Tháo trang sức trước khi tắm, bơi, tập luyện hoặc tiếp xúc với hóa chất như nước hoa, mỹ
            phẩm và chất tẩy rửa. Điều này giúp hạn chế xỉn màu và trầy xước.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-base tracking-[0.08em] text-foreground">Vệ sinh</h2>
          <p className="mt-2">
            Với trang sức vàng và kim cương, bạn có thể làm sạch nhẹ nhàng bằng bàn chải mềm, nước
            ấm và xà phòng dịu. Lau khô bằng khăn mềm, không xơ trước khi cất giữ.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-base tracking-[0.08em] text-foreground">Bảo quản</h2>
          <p className="mt-2">
            Cất từng món riêng trong hộp hoặc túi mềm để tránh va chạm. Nên kiểm tra chấu giữ đá
            định kỳ và mang đến cửa hàng để vệ sinh chuyên sâu khi cần.
          </p>
        </section>
      </div>
    </main>
  );
}
