import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  categories,
  categoryImagePath,
  collections,
  collectionImagePath,
  products,
  productImagePath,
  type ProductSeed,
} from "./catalog";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set — copy .env.example to .env first.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/** Deterministic per-variant SKU: EN-CL-001-M-A8412E → EN-CL-001-M-A8412E */
function variantSku(product: ProductSeed, size: string | null, code: string | null) {
  return [product.sku, size ?? "OS", code ? code.replace("#", "") : "STD"].join(
    "-",
  );
}

function variantRows(product: ProductSeed) {
  const sizes = product.sizes.length ? product.sizes : [null];
  const colors = product.colors.length ? product.colors : [null];
  const stock = product.stockPerVariant ?? 10;

  const rows: Array<{
    sku: string;
    size: string | null;
    colorFa: string | null;
    colorEn: string | null;
    colorCode: string | null;
    stock: number;
  }> = [];

  for (const size of sizes) {
    for (const color of colors) {
      rows.push({
        sku: variantSku(product, size, color?.code ?? null),
        size,
        colorFa: color?.fa ?? null,
        colorEn: color?.en ?? null,
        colorCode: color?.code ?? null,
        // Vary stock a little so the "only N left" badge has something to show
        stock:
          size === sizes[0] && color === colors[0]
            ? Math.max(1, Math.round(stock * 0.3))
            : stock,
      });
    }
  }
  return rows;
}

async function wipe() {
  // Order matters: children before parents, since some relations restrict.
  await prisma.stockReservation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  // Coupons only after the carts and orders pointing at them are gone.
  await prisma.coupon.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();
  await prisma.contactMessage.deleteMany();
}

async function main() {
  console.log("Clearing existing data…");
  await wipe();

  console.log("Seeding categories…");
  const categoryIds = new Map<string, string>();
  for (const [index, category] of categories.entries()) {
    const row = await prisma.category.create({
      data: {
        slug: category.slug,
        nameFa: category.nameFa,
        nameEn: category.nameEn,
        descFa: category.descFa,
        descEn: category.descEn,
        image: categoryImagePath(category.slug),
        featured: category.featured,
        position: index,
      },
    });
    categoryIds.set(category.slug, row.id);
  }

  console.log("Seeding collections…");
  const collectionIds = new Map<string, string>();
  for (const [index, collection] of collections.entries()) {
    const row = await prisma.collection.create({
      data: {
        slug: collection.slug,
        nameFa: collection.nameFa,
        nameEn: collection.nameEn,
        taglineFa: collection.taglineFa,
        taglineEn: collection.taglineEn,
        storyFa: collection.storyFa,
        storyEn: collection.storyEn,
        coverImage: collectionImagePath(collection.slug),
        season: collection.season,
        year: collection.year,
        featured: collection.featured,
        published: true,
        position: index,
        releasedAt: new Date(collection.year, index * 3, 12),
      },
    });
    collectionIds.set(collection.slug, row.id);
  }

  console.log("Seeding products…");
  for (const [index, product] of products.entries()) {
    const categoryId = categoryIds.get(product.category);
    if (!categoryId) {
      throw new Error(`Unknown category "${product.category}" on ${product.slug}`);
    }

    await prisma.product.create({
      data: {
        slug: product.slug,
        sku: product.sku,
        nameFa: product.nameFa,
        nameEn: product.nameEn,
        subtitleFa: product.subtitleFa,
        subtitleEn: product.subtitleEn,
        descFa: product.descFa,
        descEn: product.descEn,
        price: product.price,
        compareAtPrice: product.compareAtPrice ?? null,
        categoryId,
        collectionId: product.collection
          ? (collectionIds.get(product.collection) ?? null)
          : null,
        published: true,
        featured: product.featured ?? false,
        isNew: product.isNew ?? false,
        position: index,
        specs: product.specs,
        images: {
          create: product.images.map((_, imageIndex) => ({
            url: productImagePath(product.slug, imageIndex),
            altFa: `${product.nameFa} — تصویر ${imageIndex + 1}`,
            altEn: `${product.nameEn} — image ${imageIndex + 1}`,
            position: imageIndex,
          })),
        },
        variants: { create: variantRows(product) },
        // Stagger creation dates so "newest first" produces a stable order
        createdAt: new Date(Date.now() - index * 36 * 60 * 60 * 1000),
      },
    });
  }

  console.log("Seeding users…");
  const [adminPassword, customerPassword] = await Promise.all([
    bcrypt.hash("Admin!2345", 10),
    bcrypt.hash("Customer!2345", 10),
  ]);

  const admin = await prisma.user.create({
    data: {
      email: "admin@esmnadareh.com",
      passwordHash: adminPassword,
      name: "مدیر فروشگاه",
      phone: "09120000000",
      role: "ADMIN",
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: "customer@esmnadareh.com",
      passwordHash: customerPassword,
      name: "مهسا رضایی",
      phone: "09121111111",
      role: "CUSTOMER",
      addresses: {
        create: [
          {
            fullName: "مهسا رضایی",
            phone: "09121111111",
            province: "تهران",
            city: "تهران",
            line1: "خیابان ولیعصر، کوچه نیلوفر، پلاک ۱۲، واحد ۴",
            postalCode: "1591634311",
            isDefault: true,
          },
        ],
      },
    },
  });

  console.log("Seeding a sample order…");
  const sampleVariants = await prisma.productVariant.findMany({
    take: 2,
    include: {
      product: { include: { images: { take: 1, orderBy: { position: "asc" } } } },
    },
    orderBy: { sku: "asc" },
  });

  if (sampleVariants.length) {
    const items = sampleVariants.map((variant) => ({
      productId: variant.productId,
      variantId: variant.id,
      nameFa: variant.product.nameFa,
      nameEn: variant.product.nameEn,
      image: variant.product.images[0]?.url ?? null,
      size: variant.size,
      colorFa: variant.colorFa,
      colorEn: variant.colorEn,
      unitPrice: variant.product.price + variant.priceDelta,
      quantity: 1,
    }));
    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    await prisma.order.create({
      data: {
        number: "EN-100001",
        userId: customer.id,
        email: customer.email,
        phone: customer.phone ?? "",
        status: "DELIVERED",
        paymentStatus: "PAID",
        paymentRef: "SIM-000000001",
        subtotal,
        shipping: 0,
        total: subtotal,
        shipFullName: "مهسا رضایی",
        shipProvince: "تهران",
        shipCity: "تهران",
        shipLine1: "خیابان ولیعصر، کوچه نیلوفر، پلاک ۱۲، واحد ۴",
        shipPostalCode: "1591634311",
        items: { create: items },
      },
    });
  }

  console.log("Seeding a discount code and a few reviews…");
  await prisma.coupon.create({
    data: {
      code: "WELCOME10",
      type: "PERCENT",
      value: 10,
      maxDiscount: 1_500_000,
      perUserLimit: 1,
    },
  });

  // Approved so the product pages have real ratings to render; the moderation
  // queue in /admin/reviews is exercised by anything a buyer writes.
  const reviewed = await prisma.product.findMany({
    take: 3,
    orderBy: { position: "asc" },
    select: { id: true },
  });

  const sampleReviews = [
    {
      rating: 5,
      title: "دقیقاً همان‌طور که در عکس‌ها بود",
      body: "جنس پارچه سنگین و خوش‌دوخت است و اندازه‌ها درست‌اند. بعد از چند بار شست‌وشو هم فرم خودش را نگه داشته.",
    },
    {
      rating: 4,
      title: "خوش‌دوخت، کمی بزرگ",
      body: "کیفیت دوخت عالی است، ولی یک سایز بزرگ‌تر از انتظارم بود. اگر بین دو سایز مردد هستید، کوچک‌تر را بگیرید.",
    },
    {
      rating: 5,
      title: null,
      body: "بسته‌بندی و ارسال مرتب بود و رنگش دقیقاً همان آجری‌ای است که در تصویرها دیده می‌شود.",
    },
  ];

  for (const [index, product] of reviewed.entries()) {
    await prisma.review.create({
      data: {
        productId: product.id,
        userId: customer.id,
        verified: true,
        approved: true,
        ...sampleReviews[index % sampleReviews.length],
      },
    });
  }

  await prisma.newsletterSubscriber.createMany({
    data: [
      { email: "reza@example.com", locale: "fa" },
      { email: "sara@example.com", locale: "fa" },
      { email: "alex@example.com", locale: "en" },
    ],
  });

  const counts = {
    categories: await prisma.category.count(),
    collections: await prisma.collection.count(),
    products: await prisma.product.count(),
    variants: await prisma.productVariant.count(),
    images: await prisma.productImage.count(),
    reviews: await prisma.review.count(),
    coupons: await prisma.coupon.count(),
  };

  console.log("\nSeed complete:", counts);
  console.log(`  admin    → ${admin.email} / Admin!2345`);
  console.log(`  customer → ${customer.email} / Customer!2345\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
