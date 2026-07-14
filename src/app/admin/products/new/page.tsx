import { prisma } from "@/lib/prisma";
import { getI18n } from "@/i18n/server";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const { dict } = await getI18n();
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="animate-fade-up space-y-4">
      <h1 className="text-2xl font-semibold">{dict.admin.products.newTitle}</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
