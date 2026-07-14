import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/i18n/server";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { dict } = await getI18n();
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { sort: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  return (
    <div className="animate-fade-up space-y-4">
      <h1 className="text-2xl font-semibold">{dict.admin.products.editTitle}</h1>
      <ProductForm
        categories={categories}
        initial={{
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          compareAt: product.compareAt,
          stock: product.stock,
          categoryId: product.categoryId,
          featured: product.featured,
          active: product.active,
          images: product.images.map((i) => i.url),
        }}
      />
    </div>
  );
}
