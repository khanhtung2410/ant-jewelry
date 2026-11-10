import type { HeroSlide } from '@/types/domain';

export const heroSlides: HeroSlide[] = [
  {
    slide_id: 'hero-wedding-ring',
    imageUrl: '/mock/hero/wedding-bands.svg',
    alt: 'Bộ sưu tập nhẫn cưới AN JEWELRY',
    title: 'WEDDING RINGS',
    subtitle: 'Dấu ấn của một lời hứa bền lâu',
    linkUrl: '/c/wedding-ring',
    sortOrder: 1,
    status: 'VISIBLE',
  },
  {
    slide_id: 'hero-engagement-ring',
    imageUrl: '/mock/hero/engagement.svg',
    alt: 'Nhẫn đính hôn kim cương AN JEWELRY',
    title: 'ENGAGEMENT RINGS',
    subtitle: 'Khoảnh khắc bắt đầu từ một viên đá',
    linkUrl: '/c/engagement-ring',
    sortOrder: 2,
    status: 'VISIBLE',
  },
  {
    slide_id: 'hero-other-jewelry',
    imageUrl: '/mock/hero/ready-to-ship.svg',
    alt: 'Trang sức sẵn giao AN JEWELRY',
    title: 'OTHER JEWELRY',
    subtitle: 'Sẵn sàng trao gửi yêu thương',
    linkUrl: '/c/other-jewelry',
    sortOrder: 3,
    status: 'VISIBLE',
  },
];
