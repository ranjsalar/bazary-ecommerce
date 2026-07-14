"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/client";

export interface ProductCardData {
  slug: string;
  name: string;
  price: number;
  compareAt: number | null;
  stock: number;
  image?: string | null;
  categoryName?: string;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const { t, money } = useI18n();
  const onSale = product.compareAt != null && product.compareAt > product.price;
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400 dark:text-zinc-500">
            {t("product.noImage")}
          </div>
        )}
        {onSale && (
          <Badge className="absolute start-2 top-2 bg-accent-500 text-white">
            {t("product.sale")}
          </Badge>
        )}
        {product.stock === 0 && (
          <Badge className="absolute end-2 top-2 bg-zinc-800 text-white dark:bg-zinc-700">
            {t("product.outOfStock")}
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        {product.categoryName && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">{product.categoryName}</p>
        )}
        <h3 className="mt-0.5 line-clamp-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {product.name}
        </h3>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="font-semibold text-brand-700 dark:text-brand-400">
            {money(product.price)}
          </span>
          {onSale && (
            <span className="text-xs text-zinc-400 line-through dark:text-zinc-500">
              {money(product.compareAt!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
