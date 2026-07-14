import { Suspense } from "react";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/i18n/server";
import { t } from "@/i18n";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductFilters } from "@/components/storefront/ProductFilters";

export const dynamic = "force-dynamic";

export const metadata = { title: "Products" };

const PAGE_SIZE = 12;

interface Params {
  q?: string;
  category?: string;
  min?: string;
  max?: string;
  sort?: string;
  page?: string;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const { dict } = await getI18n();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const min = parseInt(params.min ?? "", 10);
  const max = parseInt(params.max ?? "", 10);

  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q } },
            { description: { contains: params.q } },
          ],
        }
      : {}),
    ...(params.category ? { category: { slug: params.category } } : {}),
    ...(Number.isFinite(min) || Number.isFinite(max)
      ? {
          price: {
            ...(Number.isFinite(min) ? { gte: min } : {}),
            ...(Number.isFinite(max) ? { lte: max } : {}),
          },
        }
      : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.sort === "price-asc"
      ? { price: "asc" }
      : params.sort === "price-desc"
        ? { price: "desc" }
        : params.sort === "name"
          ? { name: "asc" }
          : { createdAt: "desc" };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      include: { images: { orderBy: { sort: "asc" }, take: 1 }, category: true },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageLink = (p: number) => {
    const next = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v != null) as [string, string][]
    );
    next.set("page", String(p));
    return `/products?${next.toString()}`;
  };

  const pageBtn =
    "rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800";

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">
          {params.q ? t(dict, "products.resultsFor", { q: params.q }) : dict.products.allProducts}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {total === 1 ? dict.products.countOne : t(dict, "products.count", { n: total })}
        </p>
      </div>

      <Suspense>
        <ProductFilters categories={categories} />
      </Suspense>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-lg font-medium text-zinc-700 dark:text-zinc-200">
            {dict.products.noneTitle}
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{dict.products.noneText}</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
          >
            {dict.products.clearFilters}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
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
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 pt-2" aria-label="Pagination">
          {page > 1 && (
            <Link href={pageLink(page - 1)} className={pageBtn}>
              {dict.products.previous}
            </Link>
          )}
          <span className="px-2 text-sm text-zinc-500 dark:text-zinc-400">
            {t(dict, "products.pageOf", { page, total: totalPages })}
          </span>
          {page < totalPages && (
            <Link href={pageLink(page + 1)} className={pageBtn}>
              {dict.products.next}
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
