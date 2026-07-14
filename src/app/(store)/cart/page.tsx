"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart, cartSubtotal } from "@/store/cart";
import { Button } from "@/components/ui/Button";
import { useHydrated } from "@/lib/useHydrated";
import { useI18n } from "@/i18n/client";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";

export default function CartPage() {
  const { items, remove, setQuantity } = useCart();
  const hydrated = useHydrated();
  const { t, money } = useI18n();

  if (!hydrated) return <ProductGridSkeleton count={4} />;

  if (items.length === 0) {
    return (
      <div className="flex min-h-[50vh] animate-fade-up flex-col items-center justify-center text-center">
        <p className="text-5xl">🛒</p>
        <h1 className="mt-4 text-xl font-semibold">{t("cart.emptyTitle")}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("cart.emptyText")}</p>
        <Link href="/products" className="mt-6">
          <Button size="lg">{t("cart.startShopping")}</Button>
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);

  return (
    <div className="grid animate-fade-up gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <h1 className="text-2xl font-semibold">{t("cart.title")}</h1>
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variantId ?? ""}`}
            className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <Link
              href={`/products/${item.slug}`}
              className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 sm:size-24"
            >
              {item.image && (
                <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
              )}
            </Link>
            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/products/${item.slug}`}
                    className="line-clamp-2 text-sm font-medium text-zinc-900 transition-colors hover:text-brand-700 dark:text-zinc-100 dark:hover:text-brand-400"
                  >
                    {item.name}
                  </Link>
                  {item.variantName && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {t("cart.option", { name: item.variantName })}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => remove(item.productId, item.variantId)}
                  aria-label={t("cart.remove", { name: item.name })}
                  className="text-zinc-400 transition-colors hover:text-red-600 dark:hover:text-red-400"
                >
                  ✕
                </button>
              </div>
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex items-center rounded-lg border border-zinc-300 dark:border-zinc-600">
                  <button
                    aria-label={t("product.decreaseQty")}
                    onClick={() => setQuantity(item.productId, item.variantId, item.quantity - 1)}
                    className="px-2.5 py-1 text-zinc-600 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    aria-label={t("product.increaseQty")}
                    onClick={() => setQuantity(item.productId, item.variantId, item.quantity + 1)}
                    disabled={item.quantity >= item.maxStock}
                    className="px-2.5 py-1 text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {money(item.unitPrice * item.quantity)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="h-fit rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">{t("cart.orderSummary")}</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-600 dark:text-zinc-400">{t("cart.subtotal")}</dt>
            <dd className="font-medium">{money(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-600 dark:text-zinc-400">{t("cart.delivery")}</dt>
            <dd className="text-zinc-500 dark:text-zinc-400">{t("cart.calculatedAtCheckout")}</dd>
          </div>
        </dl>
        <Link href="/checkout" className="mt-5 block">
          <Button size="lg" className="w-full">
            {t("cart.proceedToCheckout")}
          </Button>
        </Link>
        <p className="mt-3 text-center text-xs text-zinc-400 dark:text-zinc-500">
          {t("cart.codEverywhere")}
        </p>
      </div>
    </div>
  );
}
