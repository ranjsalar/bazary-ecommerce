"use client";

import Image from "next/image";
import { useState } from "react";
import { useI18n } from "@/i18n/client";

export function ImageGallery({
  images,
  name,
}: {
  images: { url: string; alt: string | null }[];
  name: string;
}) {
  const { t } = useI18n();
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
        {t("product.noImage")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={images[active].url}
          alt={images[active].alt ?? name}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === active ? "border-brand-600 dark:border-brand-400" : "border-transparent"
              }`}
              aria-label={t("product.imageN", { n: i + 1 })}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
