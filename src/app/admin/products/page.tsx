import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/i18n/server";
import { formatIQD } from "@/i18n";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const { dict } = await getI18n();
  const products = await prisma.product.findMany({
    include: { category: true, images: { orderBy: { sort: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
  const d = dict.admin.products;

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{d.title}</h1>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          {d.newProduct}
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
              <th className="px-4 py-3 text-start font-medium">{d.thProduct}</th>
              <th className="px-4 py-3 text-start font-medium">{d.thCategory}</th>
              <th className="px-4 py-3 text-end font-medium">{d.thPrice}</th>
              <th className="px-4 py-3 text-end font-medium">{d.thStock}</th>
              <th className="px-4 py-3 text-center font-medium">{d.thStatus}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.id}
                className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
              >
                <td className="px-4 py-2">
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      {p.images[0] && (
                        <Image src={p.images[0].url} alt="" fill sizes="40px" className="object-cover" />
                      )}
                    </div>
                    <span className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                      {p.name}
                    </span>
                    {p.featured && (
                      <Badge className="bg-accent-500/15 text-accent-600 dark:text-accent-400">
                        {d.featured}
                      </Badge>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{p.category.name}</td>
                <td className="px-4 py-2 text-end" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatIQD(p.price, dict)}
                </td>
                <td
                  className={`px-4 py-2 text-end ${p.stock === 0 ? "font-medium text-red-600 dark:text-red-400" : ""}`}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {p.stock}
                </td>
                <td className="px-4 py-2 text-center">
                  <Badge
                    className={
                      p.active
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400"
                        : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                    }
                  >
                    {p.active ? d.active : d.hidden}
                  </Badge>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                  {d.none}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
