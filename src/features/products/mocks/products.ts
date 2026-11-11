import type {
  Product,
  ProductColor,
  ProductDetails,
  ProductImage,
  ProductStatus,
  ProductType,
} from '@/features/shared/domain/domain';
import { createVndPrice } from '@/features/shared/domain/domain';

type JewelryForm = 'RING' | 'NECKLACE' | 'BRACELET' | 'EARRING';

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

const imageByType: Record<ProductType, string> = {
  'WEDDING RING': '/mock/products/wedding-bands.svg',
  'ENGAGEMENT RING': '/mock/products/engagement.svg',
  NECKLACE: '/mock/products/everyday.svg',
  'OTHER JEWELRY': '/mock/products/ready-to-ship.svg',
};

/** `ring-5-2` is the second photo of the `ring-5` product. */
const productPhoto = (name: string) => `/mock/products/${name}.webp`;

interface ProductSeed {
  product_id: string;
  name: string;
  slug: string;
  type: ProductType;
  form: JewelryForm;
  price: number;
  description: string;
  material: string;
  colors: ProductColor[];
  /** First URL is the front photo, the rest are gallery photos in order. */
  images?: string[];
  /** Optional per-colour gallery; colours without an entry use `images`. */
  colorImages?: Partial<Record<string, string[]>>;
  status?: ProductStatus;
}

function buildDetails(seed: ProductSeed): ProductDetails {
  const base: ProductDetails = { 'Chất liệu': seed.material };

  if (seed.form === 'RING') {
    return {
      ...base,
      'Bản nhẫn': '2.0 mm',
      'Kích thước đá': '6.5 mm',
      'Loại đá': 'Kim cương',
    };
  }

  if (seed.form === 'NECKLACE') {
    return {
      ...base,
      'Độ dài': '40 - 45 cm',
      'Loại đá': 'Kim cương',
      'Kiểu khóa': 'Móc chữ S',
    };
  }

  if (seed.form === 'BRACELET') {
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
  // Products without a dedicated photo fall back to the type placeholder twice
  // so gallery screens still have a front image and a detail image.
  const urls = seed.images ?? [imageByType[seed.type], imageByType[seed.type]];

  return urls.map((url, index) => {
    const isFront = index === 0;

    return {
      imageId: isFront
        ? `${seed.product_id}-front`
        : `${seed.product_id}-detail${index > 1 ? `-${index}` : ''}`,
      url,
      alt: `${seed.name} - ${isFront ? 'ảnh chính' : index === 1 ? 'ảnh chi tiết' : `ảnh chi tiết ${index}`}`,
      isFront,
      sortOrder: index + 1,
    };
  });
}

function buildColorImages(seed: ProductSeed, color: ProductColor): ProductImage[] | undefined {
  const urls = seed.colorImages?.[color.colorId];

  if (!urls || urls.length === 0) {
    return undefined;
  }

  return urls.map((url, index) => {
    const isFront = index === 0;

    return {
      imageId: `${seed.product_id}-${color.colorId}-${isFront ? 'front' : `detail-${index}`}`,
      url,
      alt: `${seed.name} - ${color.name} - ${isFront ? 'ảnh chính' : `ảnh chi tiết ${index}`}`,
      isFront,
      sortOrder: index + 1,
    };
  });
}

function buildProduct(seed: ProductSeed): Product {
  return {
    product_id: seed.product_id,
    name: seed.name,
    slug: seed.slug,
    brand: 'Ant Jewelry',
    type: seed.type,
    description: seed.description,
    details: buildDetails(seed),
    colors: seed.colors.map((color) => {
      const images = buildColorImages(seed, color);

      return images ? { ...color, images } : color;
    }),
    images: buildImages(seed),
    price: createVndPrice(seed.price),
    status: seed.status ?? 'VISIBLE',
  };
}

const seeds: ProductSeed[] = [
  {
    product_id: 'prd-aurora-band',
    name: 'Aurora Band',
    slug: 'aurora-band',
    type: 'WEDDING RING',
    form: 'RING',
    price: 12500000,
    description:
      'Nhẫn cưới tròn cổ điển với bề mặt đánh bóng, phù hợp cho cả lễ cưới và sử dụng hằng ngày.',
    material: 'Vàng 18K',
    colors: [gold, whiteGold],
    images: [productPhoto('ring-6')],
    colorImages: {
      'color-gold-18k': [
        '/mock/products/aurora-band-gold-1.svg',
        '/mock/products/aurora-band-gold-2.svg',
        '/mock/products/aurora-band-gold-3.svg',
        '/mock/products/aurora-band-gold-4.svg',
      ],
    },
  },
  {
    product_id: 'prd-eclipse-pave-band',
    name: 'Eclipse Pavé Band',
    slug: 'eclipse-pave-band',
    type: 'WEDDING RING',
    form: 'RING',
    price: 18900000,
    description: 'Nhẫn cưới pavé với dải kim cương nhỏ chạy quanh thân nhẫn, tạo ánh sáng tinh tế.',
    material: 'Vàng trắng 18K',
    colors: [whiteGold, roseGold],
    images: [productPhoto('ring-4')],
  },
  {
    product_id: 'prd-serenade-twisted-band',
    name: 'Serenade Twisted Band',
    slug: 'serenade-twisted-band',
    type: 'WEDDING RING',
    form: 'RING',
    price: 14200000,
    description:
      'Thiết kế xoắn mềm mại lấy cảm hứng từ dải lụa, tôn lên vẻ thanh thoát của bàn tay.',
    material: 'Vàng hồng 18K',
    colors: [roseGold, gold],
    images: [productPhoto('ring-5'), productPhoto('ring-5-2')],
  },
  {
    product_id: 'prd-vow-classic-band',
    name: 'Vow Classic Band',
    slug: 'vow-classic-band',
    type: 'WEDDING RING',
    form: 'RING',
    price: 9800000,
    description: 'Nhẫn cưới tối giản với phom tròn truyền thống, dễ phối cùng nhẫn đính hôn.',
    material: 'Vàng 18K',
    colors: [gold, silver],
  },
  {
    product_id: 'prd-halo-eternity-band',
    name: 'Halo Eternity Band',
    slug: 'halo-eternity-band',
    type: 'WEDDING RING',
    form: 'RING',
    price: 22500000,
    description:
      'Nhẫn eternity đính kim cương quanh toàn bộ thân nhẫn, biểu tượng của tình yêu trọn vẹn.',
    material: 'Vàng trắng 18K',
    colors: [whiteGold],
    images: [productPhoto('ring-7')],
  },
  {
    product_id: 'prd-lumiere-slim-band',
    name: 'Lumiere Slim Band',
    slug: 'lumiere-slim-band',
    type: 'WEDDING RING',
    form: 'RING',
    price: 8900000,
    description: 'Bản nhẫn mảnh nhẹ nhàng, phù hợp làm nhẫn cưới hoặc nhẫn stacking hằng ngày.',
    material: 'Vàng 18K',
    colors: [gold, silver],
    images: [productPhoto('ring-9')],
  },
  {
    product_id: 'prd-solitaire-grace',
    name: 'Solitaire Grace',
    slug: 'solitaire-grace',
    type: 'ENGAGEMENT RING',
    form: 'RING',
    price: 32000000,
    description: 'Nhẫn đính hôn solitaire với viên kim cương chủ đặt trên bệ 4 chấu thanh mảnh.',
    material: 'Vàng trắng 18K',
    colors: [whiteGold, gold],
    images: [productPhoto('ring-1')],
  },
  {
    product_id: 'prd-celeste-halo',
    name: 'Celeste Halo',
    slug: 'celeste-halo',
    type: 'ENGAGEMENT RING',
    form: 'RING',
    price: 41500000,
    description: 'Viên kim cương trung tâm được bao quanh bởi dải halo, mang lại độ sáng rực rỡ.',
    material: 'Vàng trắng 18K',
    colors: [whiteGold],
  },
  {
    product_id: 'prd-petite-promise',
    name: 'Petite Promise',
    slug: 'petite-promise',
    type: 'ENGAGEMENT RING',
    form: 'RING',
    price: 24800000,
    description: 'Thiết kế nhỏ gọn với viên đá nổi bật, dành cho người yêu thích sự tinh tế.',
    material: 'Vàng hồng 18K',
    colors: [roseGold, whiteGold],
    images: [productPhoto('ring-8')],
  },
  {
    product_id: 'prd-regal-emerald-cut',
    name: 'Regal Emerald Cut',
    slug: 'regal-emerald-cut',
    type: 'ENGAGEMENT RING',
    form: 'RING',
    price: 56000000,
    description: 'Viên kim cương giác cắt emerald tạo nét sang trọng, cổ điển và đầy cá tính.',
    material: 'Vàng trắng 18K',
    colors: [whiteGold, gold],
    images: [productPhoto('ring-10')],
  },
  {
    product_id: 'prd-blossom-three-stone',
    name: 'Blossom Three Stone',
    slug: 'blossom-three-stone',
    type: 'ENGAGEMENT RING',
    form: 'RING',
    price: 38900000,
    description: 'Ba viên đá tượng trưng cho quá khứ, hiện tại và tương lai của một mối quan hệ.',
    material: 'Vàng 18K',
    colors: [gold, roseGold],
    images: [productPhoto('ring-3')],
  },
  {
    product_id: 'prd-etoile-pave',
    name: 'Étoile Pavé',
    slug: 'etoile-pave',
    type: 'ENGAGEMENT RING',
    form: 'RING',
    price: 29500000,
    description: 'Thân nhẫn pavé ôm lấy viên đá chủ, tạo hiệu ứng lấp lánh như những vì sao.',
    material: 'Vàng trắng 18K',
    colors: [whiteGold],
    images: [productPhoto('ring-2'), productPhoto('ring-2-1')],
  },
  {
    product_id: 'prd-luna-pendant',
    name: 'Luna Pendant',
    slug: 'luna-pendant',
    type: 'NECKLACE',
    form: 'NECKLACE',
    price: 6900000,
    description:
      'Mặt dây chuyền hình trăng khuyết nhỏ, phù hợp để đeo riêng hoặc layer cùng dây khác.',
    material: 'Vàng 18K',
    colors: [gold, whiteGold],
  },
  {
    product_id: 'prd-ciel-chain',
    name: 'Ciel Chain',
    slug: 'ciel-chain',
    type: 'NECKLACE',
    form: 'NECKLACE',
    price: 5400000,
    description:
      'Dây chuyền mảnh với các mắt xích nhỏ, tạo điểm nhấn nhẹ nhàng cho trang phục hằng ngày.',
    material: 'Vàng 18K',
    colors: [gold, silver],
  },
  {
    product_id: 'prd-iris-huggie-earrings',
    name: 'Iris Huggie Earrings',
    slug: 'iris-huggie-earrings',
    type: 'OTHER JEWELRY',
    form: 'EARRING',
    price: 4800000,
    description: 'Khuyên tai huggie ôm sát tai, thiết kế tối giản và thoải mái khi đeo cả ngày.',
    material: 'Vàng 18K',
    colors: [gold, whiteGold],
  },
  {
    product_id: 'prd-vale-bracelet',
    name: 'Vale Bracelet',
    slug: 'vale-bracelet',
    type: 'OTHER JEWELRY',
    form: 'BRACELET',
    price: 7200000,
    description: 'Vòng tay mảnh với khóa điều chỉnh, dễ dàng phối cùng đồng hồ hoặc vòng khác.',
    material: 'Vàng hồng 18K',
    colors: [roseGold, gold],
  },
  {
    product_id: 'prd-nova-stacking-ring',
    name: 'Nova Stacking Ring',
    slug: 'nova-stacking-ring',
    type: 'OTHER JEWELRY',
    form: 'RING',
    price: 3900000,
    description: 'Nhẫn mảnh dùng để stacking, có thể đeo nhiều chiếc cùng lúc để tạo dấu ấn riêng.',
    material: 'Bạc 925',
    colors: [silver, gold],
  },
  {
    product_id: 'prd-muse-pearl-necklace',
    name: 'Muse Pearl Necklace',
    slug: 'muse-pearl-necklace',
    type: 'NECKLACE',
    form: 'NECKLACE',
    price: 8600000,
    description:
      'Dây chuyền ngọc trai kết hợp điểm nhấn kim loại, mang vẻ đẹp dịu dàng và hiện đại.',
    material: 'Vàng 18K',
    colors: [gold],
  },
  {
    product_id: 'prd-aster-signet-ring',
    name: 'Aster Signet Ring',
    slug: 'aster-signet-ring',
    type: 'OTHER JEWELRY',
    form: 'RING',
    price: 7800000,
    description: 'Nhẫn signet với mặt phẳng tối giản, sẵn sàng để khắc chữ theo yêu cầu.',
    material: 'Vàng 18K',
    colors: [gold, silver],
  },
  {
    product_id: 'prd-sable-cuff',
    name: 'Sable Cuff',
    slug: 'sable-cuff',
    type: 'OTHER JEWELRY',
    form: 'BRACELET',
    price: 9200000,
    description: 'Vòng tay cuff ôm nhẹ cổ tay, bề mặt xước mờ tạo cảm giác mềm mại và hiện đại.',
    material: 'Vàng hồng 18K',
    colors: [roseGold],
  },
  {
    product_id: 'prd-opal-drop-earrings',
    name: 'Opal Drop Earrings',
    slug: 'opal-drop-earrings',
    type: 'OTHER JEWELRY',
    form: 'EARRING',
    price: 11400000,
    description: 'Khuyên tai dáng giọt với đá opal nhiều màu, tạo điểm nhấn nổi bật cho khuôn mặt.',
    material: 'Vàng trắng 18K',
    colors: [whiteGold, gold],
  },
  {
    product_id: 'prd-ember-pendant',
    name: 'Ember Pendant',
    slug: 'ember-pendant',
    type: 'NECKLACE',
    form: 'NECKLACE',
    price: 6200000,
    description: 'Mặt dây chuyền đá đỏ nhỏ ấm áp, phù hợp làm quà tặng hoặc đeo hằng ngày.',
    material: 'Vàng 18K',
    colors: [gold, roseGold],
  },
  {
    product_id: 'prd-ivy-tennis-bracelet',
    name: 'Ivy Tennis Bracelet',
    slug: 'ivy-tennis-bracelet',
    type: 'OTHER JEWELRY',
    form: 'BRACELET',
    price: 15600000,
    description: 'Vòng tay tennis với dải đá liền mạch, thiết kế thanh lịch cho mọi dịp.',
    material: 'Vàng trắng 18K',
    colors: [whiteGold],
  },
  {
    product_id: 'prd-dawn-stud-earrings',
    name: 'Dawn Stud Earrings',
    slug: 'dawn-stud-earrings',
    type: 'OTHER JEWELRY',
    form: 'EARRING',
    price: 5100000,
    description: 'Khuyên tai nụ nhỏ với viên đá tròn, món trang sức cơ bản cho mọi bộ sưu tập.',
    material: 'Vàng 18K',
    colors: [gold, whiteGold],
    status: 'HIDDEN',
  },
];

export const products: Product[] = seeds.map(buildProduct);
