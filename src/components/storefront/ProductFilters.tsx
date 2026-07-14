"use client";

import { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useI18n } from "@/i18n/client";

export function ProductFilters({
  categories,
}: {
  categories: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();

  function apply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    const q = params.get("q");
    if (q) next.set("q", q);
    for (const key of ["category", "min", "max", "sort"]) {
      const v = String(form.get(key) ?? "").trim();
      if (v) next.set(key, v);
    }
    router.push(`/products?${next.toString()}`);
  }

  return (
    <form
      onSubmit={apply}
      className="grid grid-cols-2 items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-3 lg:grid-cols-5"
    >
      <Select label={t("products.category")} name="category" defaultValue={params.get("category") ?? ""}>
        <option value="">{t("products.allCategories")}</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </Select>
      <Input
        label={t("products.minPrice")}
        name="min"
        type="number"
        min={0}
        step={500}
        defaultValue={params.get("min") ?? ""}
        placeholder="0"
      />
      <Input
        label={t("products.maxPrice")}
        name="max"
        type="number"
        min={0}
        step={500}
        defaultValue={params.get("max") ?? ""}
        placeholder={t("products.anyPlaceholder")}
      />
      <Select label={t("products.sortBy")} name="sort" defaultValue={params.get("sort") ?? "newest"}>
        <option value="newest">{t("products.newest")}</option>
        <option value="price-asc">{t("products.priceAsc")}</option>
        <option value="price-desc">{t("products.priceDesc")}</option>
        <option value="name">{t("products.nameAz")}</option>
      </Select>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          {t("common.apply")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/products")}>
          {t("common.reset")}
        </Button>
      </div>
    </form>
  );
}
