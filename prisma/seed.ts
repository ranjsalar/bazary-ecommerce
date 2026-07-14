import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Placeholder product images (picsum keeps the demo store non-empty without
// bundling binaries; admins upload real images via the dashboard).
const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/800`;

async function main() {
  // ---- Admin + demo customer ----------------------------------------------
  const adminPass = await bcrypt.hash("admin1234", 10);
  const customerPass = await bcrypt.hash("customer1234", 10);

  await prisma.user.upsert({
    where: { email: "admin@store.iq" },
    update: {},
    create: {
      name: "Store Admin",
      email: "admin@store.iq",
      phone: "+9647701111111",
      passwordHash: adminPass,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      name: "Demo Customer",
      email: "customer@example.com",
      phone: "+9647702222222",
      passwordHash: customerPass,
      role: "CUSTOMER",
      emailVerified: new Date(),
    },
  });

  // ---- Delivery fees (IQD) -------------------------------------------------
  const fees: Array<[string, number]> = [
    ["Sulaymaniyah", 3000],
    ["Baghdad", 5000],
    ["Erbil", 4000],
    ["Duhok", 5000],
    ["Kirkuk", 5000],
    ["Basra", 6000],
    ["Mosul", 6000],
    ["Halabja", 4000],
  ];
  for (const [city, fee] of fees) {
    await prisma.deliveryFee.upsert({
      where: { city },
      update: {},
      create: { city, fee, active: true },
    });
  }

  // ---- Categories -----------------------------------------------------------
  const categoryNames = ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports"];
  const categories: Record<string, string> = {};
  for (const name of categoryNames) {
    const c = await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name), image: img(slugify(name)) },
    });
    categories[name] = c.id;
  }

  // ---- Products --------------------------------------------------------------
  type P = {
    name: string;
    category: string;
    price: number;
    compareAt?: number;
    stock: number;
    featured?: boolean;
    description: string;
    variants?: Array<{ name: string; priceDiff?: number; stock: number }>;
  };

  const products: P[] = [
    {
      name: "Wireless Earbuds Pro",
      category: "Electronics",
      price: 45000,
      compareAt: 60000,
      stock: 40,
      featured: true,
      description:
        "True wireless earbuds with active noise cancellation, 30-hour battery life with the charging case, and touch controls. Ideal for calls and music on the go.",
    },
    {
      name: "Smart Watch Series X",
      category: "Electronics",
      price: 85000,
      stock: 25,
      featured: true,
      description:
        "1.9\" AMOLED display, heart-rate and sleep tracking, 7-day battery, and water resistance. Pairs with Android and iOS.",
      variants: [
        { name: "Black", stock: 15 },
        { name: "Silver", stock: 10 },
      ],
    },
    {
      name: "Power Bank 20000mAh",
      category: "Electronics",
      price: 30000,
      stock: 60,
      description:
        "Fast-charging 20000mAh power bank with dual USB output and USB-C input. Charges two devices at once — essential for long days and power cuts.",
    },
    {
      name: "Bluetooth Speaker Mini",
      category: "Electronics",
      price: 25000,
      compareAt: 35000,
      stock: 35,
      description:
        "Compact speaker with surprisingly deep bass, 12-hour playtime, and splash resistance. Fits in one hand.",
    },
    {
      name: "Men's Classic T-Shirt",
      category: "Fashion",
      price: 12000,
      stock: 100,
      featured: true,
      description:
        "Soft 100% cotton t-shirt with a regular fit. Pre-shrunk fabric that keeps its shape after washing.",
      variants: [
        { name: "M", stock: 30 },
        { name: "L", stock: 40 },
        { name: "XL", stock: 20 },
        { name: "XXL", priceDiff: 2000, stock: 10 },
      ],
    },
    {
      name: "Women's Summer Dress",
      category: "Fashion",
      price: 28000,
      compareAt: 38000,
      stock: 45,
      featured: true,
      description:
        "Lightweight floral summer dress with a flattering A-line cut. Breathable fabric for hot days.",
      variants: [
        { name: "S", stock: 15 },
        { name: "M", stock: 20 },
        { name: "L", stock: 10 },
      ],
    },
    {
      name: "Leather Wallet",
      category: "Fashion",
      price: 18000,
      stock: 50,
      description:
        "Genuine leather bifold wallet with 8 card slots, a coin pocket, and RFID protection.",
    },
    {
      name: "Stainless Steel Cookware Set",
      category: "Home & Kitchen",
      price: 95000,
      compareAt: 120000,
      stock: 15,
      featured: true,
      description:
        "10-piece stainless steel cookware set with tempered glass lids. Suitable for all stove types including induction.",
    },
    {
      name: "Electric Kettle 1.7L",
      category: "Home & Kitchen",
      price: 22000,
      stock: 30,
      description:
        "Fast-boil 2200W kettle with auto shut-off and boil-dry protection. Stainless steel body.",
    },
    {
      name: "Non-Stick Frying Pan 28cm",
      category: "Home & Kitchen",
      price: 15000,
      stock: 40,
      description:
        "Durable non-stick coating, even heat distribution, and a cool-touch handle. Easy to clean.",
    },
    {
      name: "Vitamin C Serum",
      category: "Beauty",
      price: 20000,
      stock: 55,
      description:
        "Brightening facial serum with 15% vitamin C and hyaluronic acid. Reduces dark spots and evens skin tone.",
    },
    {
      name: "Perfume Oud Royal 100ml",
      category: "Beauty",
      price: 55000,
      compareAt: 70000,
      stock: 20,
      featured: true,
      description:
        "Rich oud fragrance with notes of amber and sandalwood. Long-lasting eau de parfum, 100ml.",
    },
    {
      name: "Yoga Mat 6mm",
      category: "Sports",
      price: 17000,
      stock: 45,
      description:
        "Non-slip 6mm yoga mat with carrying strap. Cushioned support for joints on hard floors.",
    },
    {
      name: "Adjustable Dumbbells 20kg Pair",
      category: "Sports",
      price: 75000,
      stock: 12,
      description:
        "Pair of adjustable dumbbells, 2.5–20kg per hand, with secure spinlock collars. Home gym essential.",
    },
    {
      name: "Football Size 5",
      category: "Sports",
      price: 14000,
      stock: 70,
      description:
        "Match-quality size 5 football with durable stitched panels. Suitable for grass and turf.",
    },
  ];

  for (const p of products) {
    const slug = slugify(p.name);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) continue;
    await prisma.product.create({
      data: {
        name: p.name,
        slug,
        description: p.description,
        price: p.price,
        compareAt: p.compareAt ?? null,
        stock: p.stock,
        featured: p.featured ?? false,
        active: true,
        categoryId: categories[p.category],
        images: {
          create: [
            { url: img(slug), alt: p.name, sort: 0 },
            { url: img(slug + "-2"), alt: p.name, sort: 1 },
          ],
        },
        variants: p.variants
          ? {
              create: p.variants.map((v) => ({
                name: v.name,
                priceDiff: v.priceDiff ?? 0,
                stock: v.stock,
              })),
            }
          : undefined,
      },
    });
  }

  console.log("Seed complete.");
  console.log("  Admin login:    admin@store.iq / admin1234");
  console.log("  Customer login: customer@example.com / customer1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
