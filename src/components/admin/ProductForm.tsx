"use client";

import Image from "next/image";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toaster";
import { useI18n } from "@/i18n/client";

export interface ProductFormValues {
  id?: string;
  name: string;
  description: string;
  price: number | "";
  compareAt: number | null;
  stock: number | "";
  categoryId: string;
  featured: boolean;
  active: boolean;
  images: string[];
}

const EMPTY: ProductFormValues = {
  name: "",
  description: "",
  price: "",
  compareAt: null,
  stock: "",
  categoryId: "",
  featured: false,
  active: true,
  images: [],
};

const card =
  "rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900";

export function ProductForm({
  categories,
  initial,
}: {
  categories: { id: string; name: string }[];
  initial?: ProductFormValues;
}) {
  const router = useRouter();
  const { t, tm } = useI18n();
  const { toast } = useToast();
  const editing = !!initial?.id;
  const [values] = useState<ProductFormValues>(initial ?? EMPTY);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [categoryList, setCategoryList] = useState(categories);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const d = (k: string) => t(`admin.products.${k}`);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setErrors((e) => ({ ...e, images: "" }));
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          setErrors((e) => ({ ...e, images: data.error ?? "admin.products.uploadFailed" }));
          continue;
        }
        setImages((imgs) => [...imgs, data.url]);
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function addCategory() {
    if (!newCategory.trim()) return;
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrors((e) => ({
        ...e,
        categoryId: data.errors?.name ?? "admin.products.couldNotAddCategory",
      }));
      return;
    }
    setCategoryList((l) => [...l, { id: data.category.id, name: data.category.name }]);
    setShowNewCategory(false);
    setNewCategory("");
    // select the new category
    const select = formRef.current?.elements.namedItem("categoryId") as HTMLSelectElement | null;
    if (select) select.value = data.category.id;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      description: form.get("description"),
      price: form.get("price"),
      compareAt: form.get("compareAt") || null,
      stock: form.get("stock"),
      categoryId: form.get("categoryId"),
      featured: form.get("featured") === "on",
      active: form.get("active") === "on",
      images,
    };
    setSaving(true);
    try {
      const res = await fetch(
        editing ? `/api/admin/products/${initial!.id}` : "/api/admin/products",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? { _form: "admin.products.couldNotSave" });
        return;
      }
      toast(t("admin.products.savedToast"));
      router.push("/admin/products");
      router.refresh();
    } catch {
      setErrors({ _form: "common.networkError" });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!editing) return;
    if (!confirm(t("admin.products.deleteConfirm", { name: initial!.name }))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${initial!.id}`, { method: "DELETE" });
      if (!res.ok) {
        setErrors({ _form: "admin.products.couldNotDelete" });
        return;
      }
      toast(t("admin.products.deletedToast"));
      router.push("/admin/products");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="max-w-2xl space-y-5" noValidate>
      {errors._form && <Alert kind="error">{tm(errors._form)}</Alert>}

      <section className={`space-y-4 ${card}`}>
        <Input
          name="name"
          label={d("name")}
          defaultValue={values.name}
          error={errors.name && tm(errors.name)}
        />
        <Textarea
          name="description"
          label={d("description")}
          rows={5}
          defaultValue={values.description}
          error={errors.description && tm(errors.description)}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            name="price"
            type="number"
            label={d("price")}
            min={0}
            step={250}
            defaultValue={values.price}
            error={errors.price && tm(errors.price)}
          />
          <Input
            name="compareAt"
            type="number"
            label={d("compareAt")}
            min={0}
            step={250}
            defaultValue={values.compareAt ?? ""}
            error={errors.compareAt && tm(errors.compareAt)}
            hint={d("compareAtHint")}
          />
          <Input
            name="stock"
            type="number"
            label={d("stock")}
            min={0}
            defaultValue={values.stock}
            error={errors.stock && tm(errors.stock)}
          />
        </div>

        <div>
          <div className="flex items-end gap-2">
            <Select
              name="categoryId"
              label={d("category")}
              defaultValue={values.categoryId}
              error={errors.categoryId && tm(errors.categoryId)}
              className="flex-1"
            >
              <option value="">{d("selectCategory")}</option>
              {categoryList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Button type="button" variant="outline" onClick={() => setShowNewCategory((v) => !v)}>
              {d("newCategory")}
            </Button>
          </div>
          {showNewCategory && (
            <div className="mt-2 flex gap-2">
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder={d("newCategoryPlaceholder")}
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
              />
              <Button type="button" onClick={addCategory}>
                {d("addCategory")}
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={values.featured}
              className="accent-indigo-600"
            />
            {d("featuredOnHome")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={values.active}
              className="accent-indigo-600"
            />
            {d("visibleInStore")}
          </label>
        </div>
      </section>

      <section className={card}>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{d("images")}</p>
        {errors.images && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{tm(errors.images)}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div
              key={url + i}
              className="group relative size-24 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <Image src={url} alt="" fill sizes="96px" className="object-cover" />
              <button
                type="button"
                aria-label={d("removeImage")}
                onClick={() => setImages((imgs) => imgs.filter((_, j) => j !== i))}
                className="absolute end-1 top-1 hidden size-6 items-center justify-center rounded-full bg-black/60 text-xs text-white group-hover:flex"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex size-24 flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 text-xs text-zinc-500 transition-colors hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
          >
            {uploading ? d("uploading") : d("addImage")}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            hidden
            onChange={(e) => uploadFiles(e.target.files)}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">{d("imagesHint")}</p>
      </section>

      <div className="flex gap-3">
        <Button type="submit" loading={saving}>
          {editing ? d("saveChanges") : d("createProduct")}
        </Button>
        {editing && (
          <Button type="button" variant="danger" loading={deleting} onClick={onDelete}>
            {d("deleteProduct")}
          </Button>
        )}
      </div>
    </form>
  );
}
