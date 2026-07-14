"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { useI18n } from "@/i18n/client";

interface Variant {
  id: string;
  name: string;
  priceDiff: number;
  stock: number;
}

export function AddToCart({
  product,
  variants,
}: {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    stock: number;
    image?: string;
  };
  variants: Variant[];
}) {
  const router = useRouter();
  const { t, money } = useI18n();
  const { toast } = useToast();
  const add = useCart((s) => s.add);
  const [variantId, setVariantId] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const selectedVariant = variants.find((v) => v.id === variantId);
  const hasVariants = variants.length > 0;
  const effectiveStock = hasVariants ? (selectedVariant?.stock ?? 0) : product.stock;
  const effectivePrice = product.price + (selectedVariant?.priceDiff ?? 0);
  const outOfStock = hasVariants
    ? variants.every((v) => v.stock === 0)
    : product.stock === 0;

  function handleAdd(buyNow = false) {
    setError("");
    if (hasVariants && !selectedVariant) {
      setError(t("product.chooseOption"));
      return;
    }
    if (effectiveStock === 0) return;
    add(
      {
        productId: product.id,
        variantId: selectedVariant?.id,
        name: product.name,
        variantName: selectedVariant?.name,
        slug: product.slug,
        unitPrice: effectivePrice,
        image: product.image,
        maxStock: effectiveStock,
      },
      quantity
    );
    if (buyNow) {
      router.push("/cart");
      return;
    }
    toast(t("cart.addedToast"));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (outOfStock) {
    return (
      <p className="rounded-lg bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        {t("product.currentlyOutOfStock")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {hasVariants && (
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("product.options")}
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                disabled={v.stock === 0}
                onClick={() => {
                  setVariantId(v.id);
                  setQuantity(1);
                  setError("");
                }}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  variantId === v.id
                    ? "border-brand-600 bg-brand-50 font-medium text-brand-700 dark:border-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500"
                }`}
              >
                {v.name}
                {v.priceDiff > 0 && (
                  <span className="ms-1 text-xs text-zinc-500 dark:text-zinc-400">
                    +{money(v.priceDiff)}
                  </span>
                )}
              </button>
            ))}
          </div>
          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-zinc-300 dark:border-zinc-600">
          <button
            type="button"
            aria-label={t("product.decreaseQty")}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-zinc-600 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            aria-label={t("product.increaseQty")}
            onClick={() => setQuantity((q) => Math.min(effectiveStock || 99, q + 1))}
            className="px-3 py-2 text-zinc-600 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            +
          </button>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {effectiveStock > 0
            ? t("product.inStock", { n: effectiveStock })
            : hasVariants && !selectedVariant
              ? t("product.selectOption")
              : ""}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={() => handleAdd(false)} size="lg" className="flex-1">
          {added ? t("product.addedToCart") : t("product.addToCart")}
        </Button>
        <Button onClick={() => handleAdd(true)} size="lg" variant="secondary" className="flex-1">
          {t("product.buyNow")}
        </Button>
      </div>
    </div>
  );
}
