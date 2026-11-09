import type { HeroSlide } from '@/types/domain';

export const heroSlides: HeroSlide[] = [
  {
    slide_id: 'hero-wedding-bands',
    imageUrl: '/mock/hero/wedding-bands.svg',
    alt: 'Bộ sưu tập nhẫn cưới AN JEWELRY',
    title: 'WEDDING BANDS',
    subtitle: 'Dấu ấn của một lời hứa bền lâu',
    linkUrl: '/c/wedding-bands',
    sortOrder: 1,
    status: 'VISIBLE',
  },
  {
    slide_id: 'hero-engagement',
    imageUrl: '/mock/hero/engagement.svg',
    alt: 'Nhẫn đính hôn kim cương AN JEWELRY',
    title: 'ENGAGEMENT',
    subtitle: 'Khoảnh khắc bắt đầu từ một viên đá',
    linkUrl: '/c/engagement',
    sortOrder: 2,
    status: 'VISIBLE',
  },
  {
    slide_id: 'hero-ready-to-ship',
    imageUrl: '/mock/hero/ready-to-ship.svg',
    alt: 'Trang sức sẵn giao AN JEWELRY',
    title: 'READY TO SHIP',
    subtitle: 'Sẵn sàng trao gửi yêu thương',
    linkUrl: '/c/ready-to-ship',
    sortOrder: 3,
    status: 'HIDDEN',
  },
];
