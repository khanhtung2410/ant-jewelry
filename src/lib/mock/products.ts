import type {
  Product,
  ProductColor,
  ProductDetails,
  ProductImage,
  ProductStatus,
  ProductType,
} from '@/types/domain';
import { createVndPrice } from '@/types/domain';

const gold: ProductColor = {
  colorId: 'color-gold-18k',
  name: 'Vàng 18K',
  hex: '#D4AF37',
};

const whiteGold: ProductColor = {
  colorId: 'color-white-gold-18k',
  name: 'Vàng trắng 18K',
  hex: '#E5E4E2',
};

const roseGold: ProductColor = {
  colorId: 'color-rose-gold-18k',
  name: 'Vàng hồng 18K',
  hex: '#B76E79',
};

const silver: ProductColor = {
  colorId: 'color-silver-925',
  name: 'Bạc 925',
  hex: '#C0C0C0',
};

const imageByCategory: Record<string, string> = {
  'cat-wedding-bands': '/mock/products/wedding-bands.svg',
  'cat-engagement': '/mock/products/engagement.svg',
  'cat-everyday': '/mock/products/everyday.svg',
  'cat-ready-to-ship': '/mock/products/ready-to-ship.svg',
};

interface ProductSeed {
  product_id: string;
  categoryId: string;
  name: string;
  slug: string;
  type: ProductType;
  price: number;
  description: string;
  material: string;
  colors: ProductColor[];
  status?: ProductStatus;
}

function buildDetails(seed: ProductSeed): ProductDetails {
  const base: ProductDetails = { 'Chất liệu': seed.material };

  if (seed.type === 'RING') {
    return {
      ...base,
      'Bản nhẫn': '2.0 mm',
      'Kích thước đá': '6.5 mm',
      'Loại đá': 'Kim cương',
    };
  }

  if (seed.type === 'NECKLACE') {
    return {
      ...base,
      'Độ dài': '40 - 45 cm',
      'Loại đá': 'Kim cương',
      'Kiểu khóa': 'Móc chữ S',
    };
  }

  if (seed.type === 'BRACELET') {
    return {
      ...base,
      'Độ dài': '16 - 18 cm',
      'Loại đá': 'Kim cương',
      'Kiểu khóa': 'Khóa bấm',
    };
  }

  return {
    ...base,
    'Loại đá': 'Kim cương',
    'Kiểu khóa': 'Khóa bướm',
  };
}

function buildImages(seed: ProductSeed): ProductImage[] {
  const url = imageByCategory[seed.categoryId];

  return [
    {
      imageId: `${seed.product_id}-front`,
      url,
      alt: `${seed.name} - ảnh chính`,
      isFront: true,
      sortOrder: 1,
    },
    {
      imageId: `${seed.product_id}-detail`,
      url,
      alt: `${seed.name} - ảnh chi tiết`,
      isFront: false,
      sortOrder: 2,
    },
  ];
}

function buildProduct(seed: ProductSeed): Product {
  return {
    product_id: seed.product_id,
    categoryId: seed.categoryId,
    name: seed.name,
    slug: seed.slug,
    brand: 'Ant Jewelry',
    type: seed.type,
    description: seed.description,
    details: buildDetails(seed),
    colors: seed.colors,
    images: buildImages(seed),
    price: createVndPrice(seed.price),
    status: seed.status ?? 'VISIBLE',
  };
}

const seeds: ProductSeed[] = [
  {
    product_id: 'prd-aurora-band',
    categoryId: 'cat-wedding-bands',
    name: 'Aurora Band',
    slug: 'aurora-band',
    type: 'RING',
    price: 12500000,
    description:
      'Nhẫn cưới tròn cổ điển với bề mặt đánh bóng, phù hợp cho cả lễ cưới và sử dụng hằng ngày.',
    material: 'Vàng 18K',
    colors: [gold, whiteGold],
  },
  {
    product_id: 'prd-eclipse-pave-band',
    categoryId: 'cat-wedding-bands',
    name: 'Eclipse Pavé Band',
    slug: 'eclipse-pave-band',
    type: 'RING',
    price: 18900000,
    description: 'Nhẫn cưới pavé với dải kim cương nhỏ chạy quanh thân nhẫn, tạo ánh sáng tinh tế.',
    material: 'Vàng trắng 18K',
    colors: [whiteGold, roseGold],
  },
  {
    product_id: 'prd-serenade-twisted-band',
    categoryId: 'cat-wedding-bands',
    name: 'Serenade Twisted Band',
    slug: 'serenade-twisted-band',
    type: 'RING',
    price: 14200000,
    description:
      'Thiết kế xoắn mềm mại lấy cảm hứng từ dải lụa, tôn lên vẻ thanh thoát của bàn tay.',
    material: 'Vàng hồng 18K',
    colors: [roseGold, gold],
  },
  {
    product_id: 'prd-vow-classic-band',
    categoryId: 'cat-wedding-bands',
    name: 'Vow Classic Band',
    slug: 'vow-classic-band',
    type: 'RING',
    price: 9800000,
    description: 'Nhẫn cưới tối giản với phom tròn truyền thống, dễ phối cùng nhẫn đính hôn.',
    material: 'Vàng 18K',
    colors: [gold, silver],
  },
  {
    product_id: 'prd-halo-eternity-band',
    categoryId: 'cat-wedding-bands',
    name: 'Halo Eternity Band',
    slug: 'halo-eternity-band',
    type: 'RING',
    price: 22500000,
    description:
      'Nhẫn eternity đính kim cương quanh toàn bộ thân nhẫn, biểu tượng của tình yêu trọn vẹn.',
    material: 'Vàng trắng 18K',
    colors: [whiteGold],
  },
  {
    product_id: 'prd-lumiere-slim-band',
    categoryId: 'cat-wedding-bands',
    name: 'Lumiere Slim Band',
    slug: 'lumiere-slim-band',
    type: 'RING',
    price: 8900000,
    description: 'Bản nhẫn mảnh nhẹ nhàng, phù hợp làm nhẫn cưới hoặc nhẫn stacking hằng ngày.',
    material: 'Vàng 18K',
    colors: [gold, silver],
  },
  {
    product_id: 'prd-solitaire-grace',
    categoryId: 'cat-engagement',
    name: 'Solitaire Grace',
    slug: 'solitaire-grace',
    type: 'RING',
    price: 32000000,
    description: 'Nhẫn đính hôn solitaire với viên kim cương chủ đặt trên bệ 4 chấu thanh mảnh.',
    material: 'Vàng trắng 18K',
    colors: [whiteGold, gold],
  },
  {
    product_id: 'prd-celeste-halo',
    categoryId: 'cat-engagement',
    name: 'Celeste Halo',
    slug: 'celeste-halo',
    type: 'RING',
    price: 41500000,
    description: 'Viên kim cương trung tâm được bao quanh bởi dải halo, mang lại độ sáng rực rỡ.',
    material: 'Vàng trắng 18K',
    colors: [whiteGold],
  },
  {
    product_id: 'prd-petite-promise',
    categoryId: 'cat-engagement',
    name: 'Petite Promise',
    slug: 'petite-promise',
    type: 'RING',
    price: 24800000,
    description: 'Thiết kế nhỏ gọn với viên đá nổi bật, dành cho người yêu thích sự tinh tế.',
    material: 'Vàng hồng 18K',
    colors: [roseGold, whiteGold],
  },
  {
    product_id: 'prd-regal-emerald-cut',
    categoryId: 'cat-engagement',
    name: 'Regal Emerald Cut',
    slug: 'regal-emerald-cut',
    type: 'RING',
    price: 56000000,
    description: 'Viên kim cương giác cắt emerald tạo nét sang trọng, cổ điển và đầy cá tính.',
    material: 'Vàng trắng 18K',
    colors: [whiteGold, gold],
  },
  {
    product_id: 'prd-blossom-three-stone',
    categoryId: 'cat-engagement',
    name: 'Blossom Three Stone',
    slug: 'blossom-three-stone',
    type: 'RING',
    price: 38900000,
    description: 'Ba viên đá tượng trưng cho quá khứ, hiện tại và tương lai của một mối quan hệ.',
    material: 'Vàng 18K',
    colors: [gold, roseGold],
  },
  {
    product_id: 'prd-etoile-pave',
    categoryId: 'cat-engagement',
    name: 'Étoile Pavé',
    slug: 'etoile-pave',
    type: 'RING',
    price: 29500000,
    description: 'Thân nhẫn pavé ôm lấy viên đá chủ, tạo hiệu ứng lấp lánh như những vì sao.',
    material: 'Vàng trắng 18K',
    colors: [whiteGold],
  },
  {
    product_id: 'prd-luna-pendant',
    categoryId: 'cat-everyday',
    name: 'Luna Pendant',
    slug: 'luna-pendant',
    type: 'NECKLACE',
    price: 6900000,
    description:
      'Mặt dây chuyền hình trăng khuyết nhỏ, phù hợp để đeo riêng hoặc layer cùng dây khác.',
    material: 'Vàng 18K',
    colors: [gold, whiteGold],
  },
  {
    product_id: 'prd-ciel-chain',
    categoryId: 'cat-everyday',
    name: 'Ciel Chain',
    slug: 'ciel-chain',
    type: 'NECKLACE',
    price: 5400000,
    description:
      'Dây chuyền mảnh với các mắt xích nhỏ, tạo điểm nhấn nhẹ nhàng cho trang phục hằng ngày.',
    material: 'Vàng 18K',
    colors: [gold, silver],
  },
  {
    product_id: 'prd-iris-huggie-earrings',
    categoryId: 'cat-everyday',
    name: 'Iris Huggie Earrings',
    slug: 'iris-huggie-earrings',
    type: 'EARRING',
    price: 4800000,
    description: 'Khuyên tai huggie ôm sát tai, thiết kế tối giản và thoải mái khi đeo cả ngày.',
    material: 'Vàng 18K',
    colors: [gold, whiteGold],
  },
  {
    product_id: 'prd-vale-bracelet',
    categoryId: 'cat-everyday',
    name: 'Vale Bracelet',
    slug: 'vale-bracelet',
    type: 'BRACELET',
    price: 7200000,
    description: 'Vòng tay mảnh với khóa điều chỉnh, dễ dàng phối cùng đồng hồ hoặc vòng khác.',
    material: 'Vàng hồng 18K',
    colors: [roseGold, gold],
  },
  {
    product_id: 'prd-nova-stacking-ring',
    categoryId: 'cat-everyday',
    name: 'Nova Stacking Ring',
    slug: 'nova-stacking-ring',
    type: 'RING',
    price: 3900000,
    description: 'Nhẫn mảnh dùng để stacking, có thể đeo nhiều chiếc cùng lúc để tạo dấu ấn riêng.',
    material: 'Bạc 925',
    colors: [silver, gold],
  },
  {
    product_id: 'prd-muse-pearl-necklace',
    categoryId: 'cat-everyday',
    name: 'Muse Pearl Necklace',
    slug: 'muse-pearl-necklace',
    type: 'NECKLACE',
    price: 8600000,
    description:
      'Dây chuyền ngọc trai kết hợp điểm nhấn kim loại, mang vẻ đẹp dịu dàng và hiện đại.',
    material: 'Vàng 18K',
    colors: [gold],
  },
  {
    product_id: 'prd-aster-signet-ring',
    categoryId: 'cat-ready-to-ship',
    name: 'Aster Signet Ring',
    slug: 'aster-signet-ring',
    type: 'RING',
    price: 7800000,
    description: 'Nhẫn signet với mặt phẳng tối giản, sẵn sàng để khắc chữ theo yêu cầu.',
    material: 'Vàng 18K',
    colors: [gold, silver],
  },
  {
    product_id: 'prd-sable-cuff',
    categoryId: 'cat-ready-to-ship',
    name: 'Sable Cuff',
    slug: 'sable-cuff',
    type: 'BRACELET',
    price: 9200000,
    description: 'Vòng tay cuff ôm nhẹ cổ tay, bề mặt xước mờ tạo cảm giác mềm mại và hiện đại.',
    material: 'Vàng hồng 18K',
    colors: [roseGold],
  },
  {
    product_id: 'prd-opal-drop-earrings',
    categoryId: 'cat-ready-to-ship',
    name: 'Opal Drop Earrings',
    slug: 'opal-drop-earrings',
    type: 'EARRING',
    price: 11400000,
    description: 'Khuyên tai dáng giọt với đá opal nhiều màu, tạo điểm nhấn nổi bật cho khuôn mặt.',
    material: 'Vàng trắng 18K',
    colors: [whiteGold, gold],
  },
  {
    product_id: 'prd-ember-pendant',
    categoryId: 'cat-ready-to-ship',
    name: 'Ember Pendant',
    slug: 'ember-pendant',
    type: 'NECKLACE',
    price: 6200000,
    description: 'Mặt dây chuyền đá đỏ nhỏ ấm áp, phù hợp làm quà tặng hoặc đeo hằng ngày.',
    material: 'Vàng 18K',
    colors: [gold, roseGold],
  },
  {
    product_id: 'prd-ivy-tennis-bracelet',
    categoryId: 'cat-ready-to-ship',
    name: 'Ivy Tennis Bracelet',
    slug: 'ivy-tennis-bracelet',
    type: 'BRACELET',
    price: 15600000,
    description: 'Vòng tay tennis với dải đá liền mạch, thiết kế thanh lịch cho mọi dịp.',
    material: 'Vàng trắng 18K',
    colors: [whiteGold],
  },
  {
    product_id: 'prd-dawn-stud-earrings',
    categoryId: 'cat-ready-to-ship',
    name: 'Dawn Stud Earrings',
    slug: 'dawn-stud-earrings',
    type: 'EARRING',
    price: 5100000,
    description: 'Khuyên tai nụ nhỏ với viên đá tròn, món trang sức cơ bản cho mọi bộ sưu tập.',
    material: 'Vàng 18K',
    colors: [gold, whiteGold],
    status: 'HIDDEN',
  },
];

export const products: Product[] = seeds.map(buildProduct);
