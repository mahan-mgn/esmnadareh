/**
 * The Esm Nadareh catalogue.
 *
 * This file is the single source of truth for the demo assortment: the seed
 * script writes it into Postgres, and `scripts/generate-images.mjs` renders a
 * matching SVG for every image referenced here. Change a product and both
 * stay in step.
 */

export type Tone =
  | "ink"
  | "rust"
  | "bone"
  | "sand"
  | "ash"
  | "clay"
  | "olive"
  | "wine";

export type Composition =
  | "drape"
  | "column"
  | "arc"
  | "collage"
  | "fold"
  | "still";

export type ImageSpec = {
  tone: Tone;
  composition: Composition;
};

export type SpecRow = {
  labelFa: string;
  labelEn: string;
  valueFa: string;
  valueEn: string;
};

export type ColorOption = {
  fa: string;
  en: string;
  code: string;
};

export type CategorySeed = {
  slug: string;
  nameFa: string;
  nameEn: string;
  descFa: string;
  descEn: string;
  featured: boolean;
  tone: Tone;
  composition: Composition;
};

export type CollectionSeed = {
  slug: string;
  nameFa: string;
  nameEn: string;
  taglineFa: string;
  taglineEn: string;
  storyFa: string;
  storyEn: string;
  season: string;
  year: number;
  featured: boolean;
  tone: Tone;
  composition: Composition;
};

export type ProductSeed = {
  slug: string;
  sku: string;
  nameFa: string;
  nameEn: string;
  subtitleFa: string;
  subtitleEn: string;
  descFa: string;
  descEn: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  collection?: string;
  featured?: boolean;
  isNew?: boolean;
  sizes: string[];
  colors: ColorOption[];
  specs: SpecRow[];
  images: ImageSpec[];
  stockPerVariant?: number;
};

// ---------------------------------------------------------------- categories

export const categories: CategorySeed[] = [
  {
    slug: "clothing",
    nameFa: "پوشاک",
    nameEn: "Clothing",
    descFa: "کت، پیراهن، بافت و شلوار — ستون اصلی هر کالکشن.",
    descEn: "Coats, shirts, knits and trousers — the spine of every collection.",
    featured: true,
    tone: "ink",
    composition: "column",
  },
  {
    slug: "bags",
    nameFa: "کیف",
    nameEn: "Bags",
    descFa: "چرم طبیعی، ساختار ساده، دوام بلندمدت.",
    descEn: "Full-grain leather, plain structure, built to outlast the season.",
    featured: true,
    tone: "clay",
    composition: "still",
  },
  {
    slug: "shoes",
    nameFa: "کفش",
    nameEn: "Shoes",
    descFa: "فرم‌های کلاسیک با نسبت‌های امروزی.",
    descEn: "Classic lasts, redrawn to modern proportions.",
    featured: true,
    tone: "ash",
    composition: "still",
  },
  {
    slug: "accessories",
    nameFa: "اکسسوری",
    nameEn: "Accessories",
    descFa: "کمربند، شال، کلاه و آنچه یک ست را تمام می‌کند.",
    descEn: "Belts, scarves, caps — whatever finishes the look.",
    featured: true,
    tone: "sand",
    composition: "collage",
  },
  {
    slug: "fragrance",
    nameFa: "عطر",
    nameEn: "Fragrance",
    descFa: "ترکیب‌های محدود، ساخته‌شده در تیراژ کوچک.",
    descEn: "Limited compositions, blended in small batches.",
    featured: false,
    tone: "wine",
    composition: "arc",
  },
  {
    slug: "jewelry",
    nameFa: "جواهرات",
    nameEn: "Jewelry",
    descFa: "نقره و برنج، دست‌ساز، بدون تزئین اضافه.",
    descEn: "Silver and brass, handmade, with nothing extra bolted on.",
    featured: false,
    tone: "bone",
    composition: "arc",
  },
  {
    slug: "decor",
    nameFa: "دکور",
    nameEn: "Decor",
    descFa: "اشیای کوچک برای فضایی که در آن زندگی می‌کنید.",
    descEn: "Small objects for the room you actually live in.",
    featured: false,
    tone: "olive",
    composition: "still",
  },
];

// ---------------------------------------------------------------- collections

export const collections: CollectionSeed[] = [
  {
    slug: "no-name-01",
    nameFa: "بی‌نام ۰۱",
    nameEn: "No Name 01",
    taglineFa: "اولین چیزی که ساختیم",
    taglineEn: "The first thing we made",
    storyFa:
      "کالکشن اول از یک سؤال ساده شروع شد: اگر برچسب برند را برداریم، چه چیزی باقی می‌ماند؟ نتیجه هفت قطعه بود با کمترین جزئیات ممکن — پارچه سنگین، دوخت پیدا، و هیچ لوگویی روی بیرون لباس. هر قطعه در ۶۰ عدد ساخته شد و دیگر تکرار نشد.",
    storyEn:
      "The first collection began with a simple question: strip the label off, and what is left? The answer was seven pieces with the fewest possible details — heavy cloth, visible stitching, and no logo anywhere on the outside. Each piece was made in a run of 60 and never repeated.",
    season: "پاییز / Autumn",
    year: 2024,
    featured: true,
    tone: "ink",
    composition: "drape",
  },
  {
    slug: "paper-cut",
    nameFa: "کاغذ بریده",
    nameEn: "Paper Cut",
    taglineFa: "الهام‌گرفته از نشان برند",
    taglineEn: "Taken from our own mark",
    storyFa:
      "نشان اسم نداره از تکه‌های کاغذ بریده ساخته شده. این کالکشن همان منطق را وارد لباس کرد: لبه‌های خام، پنل‌های دوخته‌شده روی هم، و رنگ آجری که از خود نشان بیرون آمده. چیزی که از دور مرتب به نظر می‌رسد و از نزدیک دست‌ساز است.",
    storyEn:
      "Our mark is built from torn paper cut-outs. This collection pushed that logic into the garments: raw edges, panels laid over one another, and the brick red lifted straight out of the logo. Tidy from across the room, handmade up close.",
    season: "بهار / Spring",
    year: 2025,
    featured: true,
    tone: "rust",
    composition: "collage",
  },
  {
    slug: "after-dark",
    nameFa: "بعد از تاریکی",
    nameEn: "After Dark",
    taglineFa: "برای ساعت‌هایی که کسی نگاه نمی‌کند",
    taglineEn: "For the hours nobody is watching",
    storyFa:
      "کالکشن شب: پارچه‌های مات، سیاه روی سیاه، و جزئیاتی که فقط زیر نور مستقیم دیده می‌شوند. طراحی شده برای پوشیدن از ساعت نه شب به بعد.",
    storyEn:
      "The night collection: matte cloth, black on black, and details that only appear under direct light. Designed to be worn from nine in the evening onwards.",
    season: "زمستان / Winter",
    year: 2025,
    featured: true,
    tone: "ink",
    composition: "fold",
  },
  {
    slug: "raw-edit",
    nameFa: "ویرایش خام",
    nameEn: "Raw Edit",
    taglineFa: "نمونه‌هایی که نگه داشتیم",
    taglineEn: "The samples we kept",
    storyFa:
      "هر فصل ده‌ها نمونه می‌سازیم و بیشترشان هرگز منتشر نمی‌شوند. این کالکشن همان‌هاست: قطعه‌هایی که در تعداد خیلی کم ساخته شدند، دقیقاً به همان شکلی که در کارگاه بودند.",
    storyEn:
      "We build dozens of samples a season and most never ship. This collection is those: pieces made in very small numbers, exactly as they stood in the studio.",
    season: "تابستان / Summer",
    year: 2025,
    featured: false,
    tone: "sand",
    composition: "still",
  },
];

// ---------------------------------------------------------------- helpers

const SIZES_APPAREL = ["S", "M", "L", "XL"];
const SIZES_SHOES = ["40", "41", "42", "43", "44"];
const ONE_SIZE: string[] = [];

const C = {
  black: { fa: "مشکی", en: "Black", code: "#141211" },
  offWhite: { fa: "شکری", en: "Off-white", code: "#EDE7DE" },
  rust: { fa: "آجری", en: "Rust", code: "#A8412E" },
  sand: { fa: "شنی", en: "Sand", code: "#C9B79C" },
  ash: { fa: "خاکستری", en: "Ash", code: "#6E6A66" },
  olive: { fa: "زیتونی", en: "Olive", code: "#5A5B45" },
  brown: { fa: "قهوه‌ای", en: "Brown", code: "#4A342A" },
  silver: { fa: "نقره‌ای", en: "Silver", code: "#B9BCC0" },
  brass: { fa: "برنجی", en: "Brass", code: "#A9884C" },
} satisfies Record<string, ColorOption>;

function spec(
  labelFa: string,
  labelEn: string,
  valueFa: string,
  valueEn: string,
): SpecRow {
  return { labelFa, labelEn, valueFa, valueEn };
}

// ---------------------------------------------------------------- products

export const products: ProductSeed[] = [
  {
    slug: "unnamed-wool-coat",
    sku: "EN-CL-001",
    nameFa: "پالتوی پشمی بی‌نام",
    nameEn: "Unnamed Wool Coat",
    subtitleFa: "پشم فشرده، بدون آستر",
    subtitleEn: "Boiled wool, unlined",
    descFa:
      "پالتوی بلند از پشم فشرده ۷۸۰ گرمی، بدون آستر تا فرم پارچه دیده شود. یقه پهن، دو جیب پنهان در درز و بسته‌شدن با یک دکمه شاخی. الگو به‌عمد کمی گشاد گرفته شده تا روی بافت هم پوشیده شود.",
    descEn:
      "A long coat in 780gsm boiled wool, left unlined so the cloth keeps its own shape. Wide collar, two pockets hidden in the seam, and a single horn button. The pattern is cut deliberately roomy so it layers over a knit.",
    price: 12_800_000,
    compareAtPrice: 15_400_000,
    category: "clothing",
    collection: "no-name-01",
    featured: true,
    isNew: true,
    sizes: SIZES_APPAREL,
    colors: [C.black, C.ash, C.rust],
    specs: [
      spec("جنس", "Material", "۱۰۰٪ پشم فشرده", "100% boiled wool"),
      spec("وزن پارچه", "Fabric weight", "۷۸۰ گرم بر متر", "780 gsm"),
      spec("آستر", "Lining", "ندارد", "None"),
      spec("تولید", "Made in", "تهران", "Tehran"),
      spec("نگهداری", "Care", "خشک‌شویی", "Dry clean only"),
    ],
    images: [
      { tone: "ink", composition: "drape" },
      { tone: "ash", composition: "fold" },
      { tone: "ink", composition: "column" },
    ],
    stockPerVariant: 8,
  },
  {
    slug: "raw-edge-shirt",
    sku: "EN-CL-002",
    nameFa: "پیراهن لبه‌خام",
    nameEn: "Raw Edge Shirt",
    subtitleFa: "کتان شسته، درزهای بیرونی",
    subtitleEn: "Washed cotton, exposed seams",
    descFa:
      "پیراهن اورسایز از کتان شسته با درزهای بیرون‌دوخته و لبه‌های بدون سجاف. بعد از چند بار شست‌وشو لبه‌ها کمی باز می‌شوند — این بخشی از طراحی است، نه ایراد آن.",
    descEn:
      "An oversized shirt in washed cotton with seams stitched on the outside and hems left unfinished. After a few washes the edges fray slightly — that is part of the design, not a fault in it.",
    price: 3_950_000,
    category: "clothing",
    collection: "paper-cut",
    featured: true,
    isNew: true,
    sizes: SIZES_APPAREL,
    colors: [C.offWhite, C.black, C.sand],
    specs: [
      spec("جنس", "Material", "۱۰۰٪ کتان شسته", "100% washed cotton"),
      spec("فیت", "Fit", "اورسایز", "Oversized"),
      spec("دکمه", "Buttons", "صدفی مات", "Matte shell"),
      spec("نگهداری", "Care", "شست‌وشوی ماشینی ۳۰ درجه", "Machine wash 30°"),
    ],
    images: [
      { tone: "bone", composition: "drape" },
      { tone: "sand", composition: "collage" },
      { tone: "bone", composition: "still" },
    ],
    stockPerVariant: 14,
  },
  {
    slug: "night-shift-trousers",
    sku: "EN-CL-003",
    nameFa: "شلوار شیفت شب",
    nameEn: "Night Shift Trousers",
    subtitleFa: "کمر کشی، فرم مستقیم",
    subtitleEn: "Elastic waist, straight leg",
    descFa:
      "شلوار مستقیم با کمر کشی پنهان و پارچه مات که نور را برنمی‌گرداند. طراحی‌شده برای اینکه بتوان تمام شب پوشیدش و صبح هم هنوز فرمش را داشته باشد.",
    descEn:
      "A straight-leg trouser with a concealed elastic waist, cut in a matte cloth that refuses to bounce light. Made to be worn all night and still hold its line by morning.",
    price: 4_600_000,
    category: "clothing",
    collection: "after-dark",
    isNew: true,
    sizes: SIZES_APPAREL,
    colors: [C.black, C.olive],
    specs: [
      spec("جنس", "Material", "۶۵٪ پشم، ۳۵٪ ویسکوز", "65% wool, 35% viscose"),
      spec("فیت", "Fit", "مستقیم", "Straight"),
      spec("قد پا", "Inseam", "۷۸ سانتی‌متر", "78 cm"),
      spec("نگهداری", "Care", "خشک‌شویی", "Dry clean"),
    ],
    images: [
      { tone: "ink", composition: "column" },
      { tone: "ink", composition: "fold" },
      { tone: "ash", composition: "still" },
    ],
    stockPerVariant: 11,
  },
  {
    slug: "heavy-knit-sweater",
    sku: "EN-CL-004",
    nameFa: "بافت سنگین",
    nameEn: "Heavy Knit Sweater",
    subtitleFa: "پشم مرینوس، بافت درشت",
    subtitleEn: "Merino wool, chunky gauge",
    descFa:
      "بافت یقه‌گرد با نخ دولا مرینوس. یقه و مچ‌ها با کش دوبل بافته شده‌اند تا بعد از یک زمستان هم فرمشان را نگه دارند.",
    descEn:
      "A crew-neck knit in two-ply merino. The collar and cuffs are ribbed double so they still hold their shape after a winter of wear.",
    price: 5_400_000,
    compareAtPrice: 6_200_000,
    category: "clothing",
    collection: "no-name-01",
    sizes: SIZES_APPAREL,
    colors: [C.sand, C.black, C.rust, C.olive],
    specs: [
      spec("جنس", "Material", "۱۰۰٪ پشم مرینوس", "100% merino wool"),
      spec("ضخامت", "Gauge", "۵ گیج", "5 gauge"),
      spec("فیت", "Fit", "معمولی", "Regular"),
      spec("نگهداری", "Care", "شست‌وشوی دستی", "Hand wash"),
    ],
    images: [
      { tone: "sand", composition: "fold" },
      { tone: "bone", composition: "drape" },
      { tone: "sand", composition: "still" },
    ],
    stockPerVariant: 9,
  },
  {
    slug: "studio-jacket",
    sku: "EN-CL-005",
    nameFa: "کت کارگاه",
    nameEn: "Studio Jacket",
    subtitleFa: "کتان ضخیم، سه جیب",
    subtitleEn: "Heavy cotton, three pockets",
    descFa:
      "کت کوتاه کارگاهی با سه جیب بزرگ و دکمه‌های فلزی مات. کپی مستقیمی است از کتی که در کارگاه خودمان می‌پوشیم.",
    descEn:
      "A short workwear jacket with three deep pockets and matte metal buttons. It is a direct copy of the one we wear in our own studio.",
    price: 6_100_000,
    category: "clothing",
    collection: "raw-edit",
    featured: true,
    sizes: SIZES_APPAREL,
    colors: [C.olive, C.black, C.sand],
    specs: [
      spec("جنس", "Material", "کتان ۳۲۰ گرمی", "320gsm cotton canvas"),
      spec("جیب", "Pockets", "۳ عدد بیرونی", "3 external"),
      spec("فیت", "Fit", "کمی گشاد", "Relaxed"),
      spec("نگهداری", "Care", "ماشینی ۳۰ درجه", "Machine wash 30°"),
    ],
    images: [
      { tone: "olive", composition: "column" },
      { tone: "olive", composition: "collage" },
      { tone: "ash", composition: "fold" },
    ],
    stockPerVariant: 7,
  },
  {
    slug: "cut-panel-tee",
    sku: "EN-CL-006",
    nameFa: "تی‌شرت پنل‌بریده",
    nameEn: "Cut Panel Tee",
    subtitleFa: "پنبه سنگین، پنل دوخته‌شده",
    subtitleEn: "Heavy cotton, applied panel",
    descFa:
      "تی‌شرت پنبه ۲۴۰ گرمی با یک پنل آجری که مثل تکه کاغذ روی سینه دوخته شده. ساده‌ترین قطعه کالکشن کاغذ بریده.",
    descEn:
      "A 240gsm cotton tee with a rust panel stitched across the chest like a scrap of paper. The simplest piece in the Paper Cut collection.",
    price: 1_850_000,
    category: "clothing",
    collection: "paper-cut",
    isNew: true,
    sizes: SIZES_APPAREL,
    colors: [C.offWhite, C.black],
    specs: [
      spec("جنس", "Material", "پنبه ۲۴۰ گرمی", "240gsm cotton"),
      spec("چاپ", "Application", "پنل دوخته‌شده", "Stitched panel"),
      spec("فیت", "Fit", "معمولی", "Regular"),
      spec("نگهداری", "Care", "ماشینی ۳۰ درجه", "Machine wash 30°"),
    ],
    images: [
      { tone: "bone", composition: "collage" },
      { tone: "rust", composition: "still" },
      { tone: "bone", composition: "column" },
    ],
    stockPerVariant: 22,
  },

  {
    slug: "single-fold-tote",
    sku: "EN-BG-001",
    nameFa: "توت تک‌تا",
    nameEn: "Single Fold Tote",
    subtitleFa: "چرم گاوی، یک تکه",
    subtitleEn: "Full-grain leather, one piece",
    descFa:
      "کیف دوشی از یک تکه چرم گاوی که فقط یک بار تا خورده و در دو طرف دوخته شده. بدون آستر، بدون سگک — با گذشت زمان رنگش عمیق‌تر می‌شود.",
    descEn:
      "A shoulder bag from a single piece of full-grain leather, folded once and stitched at two edges. No lining, no hardware — it only darkens with age.",
    price: 8_900_000,
    category: "bags",
    collection: "no-name-01",
    featured: true,
    sizes: ONE_SIZE,
    colors: [C.brown, C.black, C.rust],
    specs: [
      spec("جنس", "Material", "چرم گاوی گیاهی‌دباغ", "Veg-tanned full grain"),
      spec("ابعاد", "Dimensions", "۴۰ × ۳۲ × ۱۲ سانتی‌متر", "40 × 32 × 12 cm"),
      spec("آستر", "Lining", "ندارد", "None"),
      spec("ساخت", "Made in", "دست‌دوز، تهران", "Hand-stitched, Tehran"),
    ],
    images: [
      { tone: "clay", composition: "still" },
      { tone: "clay", composition: "arc" },
      { tone: "sand", composition: "collage" },
    ],
    stockPerVariant: 6,
  },
  {
    slug: "document-case",
    sku: "EN-BG-002",
    nameFa: "کیف مدارک",
    nameEn: "Document Case",
    subtitleFa: "تخت، بدون زیپ",
    subtitleEn: "Flat, zip-free",
    descFa:
      "کیف تخت برای لپ‌تاپ ۱۳ اینچ و چند برگ کاغذ. بسته‌شدن با یک نوار چرمی که دور خودش می‌پیچد.",
    descEn:
      "A flat case for a 13-inch laptop and a few sheets of paper. It closes with a leather strap that simply wraps around itself.",
    price: 5_200_000,
    category: "bags",
    collection: "raw-edit",
    sizes: ONE_SIZE,
    colors: [C.black, C.brown],
    specs: [
      spec("جنس", "Material", "چرم گاوی", "Full-grain leather"),
      spec("ابعاد", "Dimensions", "۳۶ × ۲۶ سانتی‌متر", "36 × 26 cm"),
      spec("گنجایش", "Fits", "لپ‌تاپ ۱۳ اینچ", "13-inch laptop"),
      spec("ساخت", "Made in", "تهران", "Tehran"),
    ],
    images: [
      { tone: "ink", composition: "still" },
      { tone: "ash", composition: "collage" },
    ],
    stockPerVariant: 10,
  },
  {
    slug: "night-pouch",
    sku: "EN-BG-003",
    nameFa: "پوچ شب",
    nameEn: "Night Pouch",
    subtitleFa: "کوچک، برای ضروری‌ها",
    subtitleEn: "Small, for the essentials",
    descFa:
      "پوچ کوچک با بند بلند قابل جداشدن. اندازه‌اش دقیقاً برای موبایل، کارت و کلید حساب شده و نه بیشتر.",
    descEn:
      "A small pouch with a long detachable strap. It is sized for a phone, a card and a key — and nothing beyond that.",
    price: 3_400_000,
    category: "bags",
    collection: "after-dark",
    isNew: true,
    sizes: ONE_SIZE,
    colors: [C.black, C.rust],
    specs: [
      spec("جنس", "Material", "چرم مات", "Matte leather"),
      spec("ابعاد", "Dimensions", "۲۰ × ۱۳ سانتی‌متر", "20 × 13 cm"),
      spec("بند", "Strap", "جداشونده", "Detachable"),
    ],
    images: [
      { tone: "ink", composition: "arc" },
      { tone: "wine", composition: "still" },
    ],
    stockPerVariant: 15,
  },

  {
    slug: "flat-sole-derby",
    sku: "EN-SH-001",
    nameFa: "دربی کف‌تخت",
    nameEn: "Flat Sole Derby",
    subtitleFa: "چرم صیقلی، زیره لاستیکی",
    subtitleEn: "Polished leather, rubber sole",
    descFa:
      "دربی کلاسیک با قالبی کمی پهن‌تر از استاندارد و زیره لاستیکی تخت. برای پوشیدن روزانه ساخته شده، نه برای ویترین.",
    descEn:
      "A classic derby on a slightly wider last with a flat rubber sole. Built to be worn daily, not displayed.",
    price: 9_600_000,
    compareAtPrice: 11_200_000,
    category: "shoes",
    collection: "no-name-01",
    featured: true,
    sizes: SIZES_SHOES,
    colors: [C.black, C.brown],
    specs: [
      spec("رویه", "Upper", "چرم گاوی", "Full-grain leather"),
      spec("زیره", "Sole", "لاستیک طبیعی", "Natural rubber"),
      spec("قالب", "Last", "پهن", "Wide"),
      spec("ساخت", "Construction", "دوخت گودیر", "Goodyear welt"),
    ],
    images: [
      { tone: "ink", composition: "still" },
      { tone: "ash", composition: "arc" },
      { tone: "ink", composition: "collage" },
    ],
    stockPerVariant: 5,
  },
  {
    slug: "canvas-low-sneaker",
    sku: "EN-SH-002",
    nameFa: "کتانی برزنتی",
    nameEn: "Canvas Low Sneaker",
    subtitleFa: "برزنت ضخیم، بدون لوگو",
    subtitleEn: "Heavy canvas, unbranded",
    descFa:
      "کتانی ساده با رویه برزنتی و هیچ نشانی روی آن. تنها علامت، برچسب کوچک داخل زبانه است.",
    descEn:
      "A plain sneaker with a canvas upper and no marking anywhere on it. The only sign is a small tab inside the tongue.",
    price: 4_200_000,
    category: "shoes",
    collection: "raw-edit",
    isNew: true,
    sizes: SIZES_SHOES,
    colors: [C.offWhite, C.black, C.olive],
    specs: [
      spec("رویه", "Upper", "برزنت ۱۴ اونس", "14oz canvas"),
      spec("زیره", "Sole", "لاستیک ولکانیزه", "Vulcanised rubber"),
      spec("کفی", "Insole", "قابل تعویض", "Removable"),
    ],
    images: [
      { tone: "bone", composition: "still" },
      { tone: "ash", composition: "collage" },
    ],
    stockPerVariant: 12,
  },

  {
    slug: "torn-edge-scarf",
    sku: "EN-AC-001",
    nameFa: "شال لبه‌پاره",
    nameEn: "Torn Edge Scarf",
    subtitleFa: "پشم و ابریشم، لبه دست‌پاره",
    subtitleEn: "Wool-silk, hand-torn edge",
    descFa:
      "شال بزرگ از ترکیب پشم و ابریشم که لبه‌هایش به‌جای برش، دست‌پاره شده‌اند. همان منطق کاغذ بریده، این بار روی پارچه.",
    descEn:
      "A large wool-silk scarf whose edges are torn by hand instead of cut. The same paper-cut logic, applied to cloth.",
    price: 2_900_000,
    category: "accessories",
    collection: "paper-cut",
    featured: true,
    isNew: true,
    sizes: ONE_SIZE,
    colors: [C.rust, C.black, C.sand],
    specs: [
      spec("جنس", "Material", "۷۰٪ پشم، ۳۰٪ ابریشم", "70% wool, 30% silk"),
      spec("ابعاد", "Dimensions", "۱۹۰ × ۷۰ سانتی‌متر", "190 × 70 cm"),
      spec("لبه", "Edge", "دست‌پاره", "Hand-torn"),
    ],
    images: [
      { tone: "rust", composition: "drape" },
      { tone: "rust", composition: "fold" },
      { tone: "sand", composition: "collage" },
    ],
    stockPerVariant: 18,
  },
  {
    slug: "plain-leather-belt",
    sku: "EN-AC-002",
    nameFa: "کمربند ساده",
    nameEn: "Plain Leather Belt",
    subtitleFa: "سگک برنجی مات",
    subtitleEn: "Matte brass buckle",
    descFa:
      "کمربند چرمی با سگک برنجی که هیچ حکاکی ندارد. با گذشت زمان سگک تیره می‌شود و چرم نرم.",
    descEn:
      "A leather belt with an unengraved brass buckle. In time the buckle dulls and the leather softens.",
    price: 1_950_000,
    category: "accessories",
    sizes: ["80", "85", "90", "95", "100"],
    colors: [C.brown, C.black],
    specs: [
      spec("جنس", "Material", "چرم گیاهی‌دباغ", "Veg-tanned leather"),
      spec("سگک", "Buckle", "برنج مات", "Matte brass"),
      spec("عرض", "Width", "۳٫۵ سانتی‌متر", "3.5 cm"),
    ],
    images: [
      { tone: "clay", composition: "still" },
      { tone: "sand", composition: "arc" },
    ],
    stockPerVariant: 20,
  },
  {
    slug: "six-panel-cap",
    sku: "EN-AC-003",
    nameFa: "کلاه شش‌ترک",
    nameEn: "Six Panel Cap",
    subtitleFa: "کتان شسته، فرم نرم",
    subtitleEn: "Washed cotton, soft crown",
    descFa:
      "کلاه شش‌ترک با فرم نرم و بند فلزی قابل تنظیم. بعد از چند بار پوشیدن شکل سر را می‌گیرد.",
    descEn:
      "A six-panel cap with a soft crown and an adjustable metal strap. It takes the shape of your head after a few wears.",
    price: 1_450_000,
    category: "accessories",
    collection: "raw-edit",
    sizes: ONE_SIZE,
    colors: [C.black, C.olive, C.sand],
    specs: [
      spec("جنس", "Material", "کتان شسته", "Washed cotton"),
      spec("بند", "Strap", "فلزی قابل تنظیم", "Adjustable metal"),
      spec("سایز", "Size", "تک‌سایز", "One size"),
    ],
    images: [
      { tone: "ash", composition: "still" },
      { tone: "olive", composition: "arc" },
    ],
    stockPerVariant: 25,
  },

  {
    slug: "eau-de-nothing",
    sku: "EN-FR-001",
    nameFa: "ادوپرفیوم هیچ",
    nameEn: "Eau de Nothing",
    subtitleFa: "چوب سدر، فلفل سیاه، کاغذ",
    subtitleEn: "Cedar, black pepper, paper",
    descFa:
      "عطری با نت آغازین فلفل سیاه، قلب چوب سدر و ته‌مایه‌ای که عمداً شبیه بوی کاغذ کهنه است. در بطری‌های ۵۰ میلی و تیراژ ۳۰۰ عددی.",
    descEn:
      "Black pepper on top, a cedar heart, and a base built deliberately to smell like old paper. Bottled at 50ml in a run of 300.",
    price: 4_800_000,
    category: "fragrance",
    collection: "no-name-01",
    featured: true,
    sizes: ONE_SIZE,
    colors: [],
    specs: [
      spec("حجم", "Volume", "۵۰ میلی‌لیتر", "50 ml"),
      spec("غلظت", "Concentration", "ادوپرفیوم", "Eau de parfum"),
      spec("ماندگاری", "Longevity", "۶ تا ۸ ساعت", "6–8 hours"),
      spec("تیراژ", "Run", "۳۰۰ عدد", "300 units"),
    ],
    images: [
      { tone: "wine", composition: "arc" },
      { tone: "ink", composition: "still" },
      { tone: "clay", composition: "collage" },
    ],
    stockPerVariant: 40,
  },
  {
    slug: "after-dark-parfum",
    sku: "EN-FR-002",
    nameFa: "پرفیوم بعد از تاریکی",
    nameEn: "After Dark Parfum",
    subtitleFa: "چرم، دخانی، وانیل خشک",
    subtitleEn: "Leather, smoke, dry vanilla",
    descFa:
      "غلیظ‌تر و تیره‌تر از بقیه. برای شب ساخته شده و روی پوست گرم بهتر باز می‌شود.",
    descEn:
      "Denser and darker than the rest. Built for the night, and it opens better on warm skin.",
    price: 5_600_000,
    category: "fragrance",
    collection: "after-dark",
    isNew: true,
    sizes: ONE_SIZE,
    colors: [],
    specs: [
      spec("حجم", "Volume", "۵۰ میلی‌لیتر", "50 ml"),
      spec("غلظت", "Concentration", "پرفیوم", "Parfum"),
      spec("ماندگاری", "Longevity", "۸ تا ۱۰ ساعت", "8–10 hours"),
    ],
    images: [
      { tone: "ink", composition: "arc" },
      { tone: "wine", composition: "fold" },
    ],
    stockPerVariant: 30,
  },

  {
    slug: "hammered-silver-ring",
    sku: "EN-JW-001",
    nameFa: "انگشتر نقره چکشی",
    nameEn: "Hammered Silver Ring",
    subtitleFa: "نقره ۹۲۵، دست‌ساز",
    subtitleEn: "925 silver, handmade",
    descFa:
      "انگشتر پهن نقره با سطح چکش‌کاری‌شده. هیچ دو عددی دقیقاً شبیه هم نیستند.",
    descEn:
      "A wide silver band with a hammered surface. No two come out exactly alike.",
    price: 2_300_000,
    category: "jewelry",
    collection: "paper-cut",
    sizes: ["16", "17", "18", "19", "20"],
    colors: [C.silver],
    specs: [
      spec("جنس", "Material", "نقره ۹۲۵", "925 sterling silver"),
      spec("عرض", "Width", "۸ میلی‌متر", "8 mm"),
      spec("پرداخت", "Finish", "چکشی مات", "Hammered matte"),
    ],
    images: [
      { tone: "bone", composition: "arc" },
      { tone: "ash", composition: "still" },
    ],
    stockPerVariant: 8,
  },
  {
    slug: "brass-chain-necklace",
    sku: "EN-JW-002",
    nameFa: "گردنبند زنجیر برنجی",
    nameEn: "Brass Chain Necklace",
    subtitleFa: "برنج خام، بدون آبکاری",
    subtitleEn: "Raw brass, unplated",
    descFa:
      "زنجیر برنجی بدون آبکاری که با گذشت زمان پتینه می‌شود. اگر برق اولیه را می‌خواهید، با یک پارچه نرم پاکش کنید.",
    descEn:
      "An unplated brass chain that patinas over time. If you want the original shine back, a soft cloth brings it up.",
    price: 1_780_000,
    category: "jewelry",
    sizes: ONE_SIZE,
    colors: [C.brass],
    specs: [
      spec("جنس", "Material", "برنج خام", "Raw brass"),
      spec("طول", "Length", "۵۵ سانتی‌متر", "55 cm"),
      spec("قفل", "Clasp", "فنری", "Spring clasp"),
    ],
    images: [
      { tone: "sand", composition: "arc" },
      { tone: "clay", composition: "still" },
    ],
    stockPerVariant: 16,
  },

  {
    slug: "unglazed-vase",
    sku: "EN-DC-001",
    nameFa: "گلدان بدون لعاب",
    nameEn: "Unglazed Vase",
    subtitleFa: "سفال چرخ‌کار، دست‌ساز",
    subtitleEn: "Wheel-thrown stoneware",
    descFa:
      "گلدان چرخ‌کار بدون لعاب بیرونی. سطح زبر است و خطوط انگشت سازنده روی آن باقی مانده.",
    descEn:
      "A wheel-thrown vase left unglazed on the outside. The surface stays rough and the maker's finger lines remain on it.",
    price: 2_650_000,
    category: "decor",
    collection: "raw-edit",
    featured: true,
    sizes: ONE_SIZE,
    colors: [C.sand, C.rust],
    specs: [
      spec("جنس", "Material", "سفال استون‌ور", "Stoneware"),
      spec("ارتفاع", "Height", "۲۸ سانتی‌متر", "28 cm"),
      spec("لعاب", "Glaze", "فقط داخل", "Interior only"),
      spec("ساخت", "Made", "دست‌ساز", "Handmade"),
    ],
    images: [
      { tone: "sand", composition: "column" },
      { tone: "clay", composition: "arc" },
      { tone: "bone", composition: "still" },
    ],
    stockPerVariant: 9,
  },
  {
    slug: "paper-weight-block",
    sku: "EN-DC-002",
    nameFa: "وزنه کاغذ",
    nameEn: "Paper Weight Block",
    subtitleFa: "برنج توپر، ۹۰۰ گرم",
    subtitleEn: "Solid brass, 900g",
    descFa:
      "یک مکعب برنجی توپر. کار دیگری نمی‌کند جز اینکه کاغذها را سر جایشان نگه دارد.",
    descEn:
      "A solid brass block. It does nothing except keep your paper where you left it.",
    price: 1_320_000,
    category: "decor",
    collection: "paper-cut",
    sizes: ONE_SIZE,
    colors: [C.brass],
    specs: [
      spec("جنس", "Material", "برنج توپر", "Solid brass"),
      spec("وزن", "Weight", "۹۰۰ گرم", "900 g"),
      spec("ابعاد", "Dimensions", "۶ × ۶ × ۴ سانتی‌متر", "6 × 6 × 4 cm"),
    ],
    images: [
      { tone: "sand", composition: "still" },
      { tone: "olive", composition: "collage" },
    ],
    stockPerVariant: 24,
  },
  {
    slug: "matte-ceramic-tray",
    sku: "EN-DC-003",
    nameFa: "سینی سرامیک مات",
    nameEn: "Matte Ceramic Tray",
    subtitleFa: "برای کلید و ساعت",
    subtitleEn: "For keys and a watch",
    descFa:
      "سینی کوچک مات برای کنار در ورودی. لبه‌اش عمداً نامنظم است.",
    descEn:
      "A small matte tray for the hallway table. Its rim is deliberately uneven.",
    price: 890_000,
    category: "decor",
    sizes: ONE_SIZE,
    colors: [C.black, C.offWhite],
    specs: [
      spec("جنس", "Material", "سرامیک", "Ceramic"),
      spec("قطر", "Diameter", "۱۶ سانتی‌متر", "16 cm"),
      spec("پرداخت", "Finish", "مات", "Matte"),
    ],
    images: [
      { tone: "ash", composition: "arc" },
      { tone: "bone", composition: "still" },
    ],
    stockPerVariant: 30,
  },
  {
    slug: "black-on-black-hoodie",
    sku: "EN-CL-007",
    nameFa: "هودی سیاه روی سیاه",
    nameEn: "Black on Black Hoodie",
    subtitleFa: "پنبه ۴۲۰ گرمی، بدون کش",
    subtitleEn: "420gsm cotton, no drawcord",
    descFa:
      "هودی سنگین بدون بند و بدون هیچ چاپی. تمام جزئیات — درزها، کاپ کلاه، جیب — با نخ هم‌رنگ دوخته شده‌اند.",
    descEn:
      "A heavy hoodie with no drawcord and no print. Every detail — seams, hood, pocket — is stitched in matching thread.",
    price: 4_900_000,
    category: "clothing",
    collection: "after-dark",
    featured: true,
    sizes: SIZES_APPAREL,
    colors: [C.black],
    specs: [
      spec("جنس", "Material", "پنبه ۴۲۰ گرمی", "420gsm cotton"),
      spec("کلاه", "Hood", "دولایه", "Double layer"),
      spec("فیت", "Fit", "کمی گشاد", "Relaxed"),
      spec("نگهداری", "Care", "ماشینی ۳۰ درجه، پشت‌ورو", "Machine wash 30°, inside out"),
    ],
    images: [
      { tone: "ink", composition: "drape" },
      { tone: "ink", composition: "collage" },
      { tone: "ink", composition: "fold" },
    ],
    stockPerVariant: 13,
  },
  {
    slug: "wide-leg-denim",
    sku: "EN-CL-008",
    nameFa: "جین پاچه‌گشاد",
    nameEn: "Wide Leg Denim",
    subtitleFa: "دنیم خام ۱۴ اونس",
    subtitleEn: "14oz raw denim",
    descFa:
      "جین پاچه‌گشاد از دنیم خام که با پوشیدن رنگ می‌بازد و شکل صاحبش را می‌گیرد. اولین شست‌وشو را تا حد ممکن به تعویق بیندازید.",
    descEn:
      "A wide-leg jean in raw denim that fades with wear and takes the shape of whoever owns it. Put off the first wash as long as you can.",
    price: 4_300_000,
    compareAtPrice: 4_900_000,
    category: "clothing",
    collection: "raw-edit",
    sizes: ["30", "32", "34", "36"],
    colors: [C.black, C.ash],
    specs: [
      spec("جنس", "Material", "دنیم خام ۱۴ اونس", "14oz raw denim"),
      spec("فیت", "Fit", "پاچه‌گشاد", "Wide leg"),
      spec("دکمه", "Fly", "دکمه‌ای", "Button fly"),
      spec("نگهداری", "Care", "کمتر بشویید", "Wash sparingly"),
    ],
    images: [
      { tone: "ink", composition: "column" },
      { tone: "ash", composition: "fold" },
    ],
    stockPerVariant: 10,
  },
];

// ---------------------------------------------------------------- image paths

export function productImagePath(slug: string, index: number) {
  return `/media/products/${slug}-${index + 1}.svg`;
}

export function collectionImagePath(slug: string) {
  return `/media/collections/${slug}.svg`;
}

export function categoryImagePath(slug: string) {
  return `/media/categories/${slug}.svg`;
}
