import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/i18n/server";
import { t, formatIQD } from "@/i18n";
import { Badge } from "@/components/ui/Badge";
import { AddToCart } from "@/components/storefront/AddToCart";
import { ImageGallery } from "@/components/storefront/ImageGallery";
import { ProductCard } from "@/components/storefront/ProductCard";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { dict } = await getI18n();
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sort: "asc" } },
      variants: true,
      category: true,
    },
  });
  if (!product || !product.active) notFound();

  const related = await prisma.product.findMany({
    where: { active: true, categoryId: product.categoryId, id: { not: product.id } },
    include: { images: { orderBy: { sort: "asc" }, take: 1 }, category: true },
    take: 4,
  });

  const onSale = product.compareAt != null && product.compareAt > product.price;
  const crumb = "transition-colors hover:text-brand-700 dark:hover:text-brand-400";

  return (
    <div className="animate-fade-up space-y-12">
      <nav className="text-sm text-zinc-500 dark:text-zinc-400" aria-label="Breadcrumb">
        <Link href="/products" className={crumb}>
          {dict.product.breadcrumbProducts}
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/products?category=${product.category.slug}`} className={crumb}>
          {product.category.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-800 dark:text-zinc-200">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ImageGallery images={product.images} name={product.name} />

        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-2xl font-bold text-brand-700 dark:text-brand-400">
              {formatIQD(product.price, dict)}
            </span>
            {onSale && (
              <>
                <span className="text-zinc-400 line-through dark:text-zinc-500">
                  {formatIQD(product.compareAt!, dict)}
                </span>
                <Badge className="bg-accent-500 text-white">
                  {t(dict, "product.off", {
                    n: Math.round((1 - product.price / product.compareAt!) * 100),
                  })}
                </Badge>
              </>
            )}
          </div>

          <div className="mt-6">
            <AddToCart
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                stock: product.stock,
                image: product.images[0]?.url,
              }}
              variants={product.variants}
            />
          </div>

          <div className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {dict.product.description}
            </h2>
            <p className="mt-2 whitespace-pre-line text-zinc-700 dark:text-zinc-300">
              {product.description}
            </p>
          </div>

          <div className="mt-6 rounded-xl bg-brand-50 p-4 text-sm text-brand-900 dark:bg-brand-500/10 dark:text-brand-300">
            {dict.product.codNote}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold">{dict.product.youMayAlsoLike}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {related.map((p) => (
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
    </div>
  );
}
