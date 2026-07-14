import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/i18n/server";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { dict } = await getI18n();
  const [featured, categories, latest] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, featured: true },
      include: { images: { orderBy: { sort: "asc" }, take: 1 }, category: true },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { active: true },
      include: { images: { orderBy: { sort: "asc" }, take: 1 }, category: true },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const sectionLink =
    "text-sm font-medium text-brand-700 transition-colors hover:underline dark:text-brand-400";

  return (
    <div className="animate-fade-up space-y-12">
      {/* Hero banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 px-6 py-12 text-white shadow-lg sm:px-12 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -end-24 -top-24 size-96 rounded-full bg-white/10 blur-2xl"
        />
        <div className="relative max-w-xl">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-100">
            {dict.home.heroTag}
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
            {dict.home.heroTitle}
          </h1>
          <p className="mt-3 text-brand-50">{dict.home.heroText}</p>
          <Link href="/products" className="mt-6 inline-block">
            <Button
              size="lg"
              className="bg-accent-500 text-zinc-900 shadow-md hover:bg-accent-400 focus-visible:outline-accent-500"
            >
              {dict.home.shopNow}
            </Button>
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-xl font-semibold">{dict.home.shopByCategory}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-800"
            >
              {c.image && (
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 20vw"
                  className="object-cover opacity-80 transition-transform duration-300 group-hover:scale-105"
                />
              )}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-sm font-semibold text-white">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{dict.home.featured}</h2>
            <Link href="/products" className={sectionLink}>
              {dict.home.viewAll}
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  slug: p.slug,
                  name: p.name,
                  price: p.price,
                  compareAt: p.compareAt,
                  stock: p.stock,
                  image: p.images[0]?.url,
                  categoryName: p.category.name,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* New arrivals */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{dict.home.newArrivals}</h2>
          <Link href="/products" className={sectionLink}>
            {dict.home.viewAll}
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {latest.map((p) => (
            <ProductCard
              key={p.id}
              product={{
                slug: p.slug,
                name: p.name,
                price: p.price,
                compareAt: p.compareAt,
                stock: p.stock,
                image: p.images[0]?.url,
                categoryName: p.category.name,
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
