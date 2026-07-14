import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/i18n/server";
import { t, formatIQD, formatDate } from "@/i18n";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";

export const dynamic = "force-dynamic";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale, dict } = await getI18n();
  const { status } = await searchParams;
  const filter = ORDER_STATUSES.includes(status as OrderStatus) ? status : undefined;
  const d = dict.admin.orders;

  const orders = await prisma.order.findMany({
    where: filter ? { status: filter } : undefined,
    include: { items: { select: { quantity: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-sm transition-colors ${
      active
        ? "bg-indigo-600 text-white"
        : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
    }`;

  return (
    <div className="animate-fade-up space-y-4">
      <h1 className="text-2xl font-semibold">{d.title}</h1>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/orders" className={pill(!filter)}>
          {d.all}
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={pill(filter === s)}>
            {t(dict, `status.${s}`)}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
              <th className="px-4 py-3 text-start font-medium">{d.thOrder}</th>
              <th className="px-4 py-3 text-start font-medium">{d.thDate}</th>
              <th className="px-4 py-3 text-start font-medium">{d.thCustomer}</th>
              <th className="px-4 py-3 text-start font-medium">{d.thCity}</th>
              <th className="px-4 py-3 text-end font-medium">{d.thItems}</th>
              <th className="px-4 py-3 text-end font-medium">{d.thTotal}</th>
              <th className="px-4 py-3 text-center font-medium">{d.thStatus}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    #{o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {formatDate(o.createdAt, locale)}
                </td>
                <td className="px-4 py-3">{o.fullName}</td>
                <td className="px-4 py-3">{o.city}</td>
                <td className="px-4 py-3 text-end" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {o.items.reduce((n, i) => n + i.quantity, 0)}
                </td>
                <td className="px-4 py-3 text-end font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatIQD(o.total, dict)}
                </td>
                <td className="px-4 py-3 text-center">
                  <OrderStatusBadge status={o.status} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                  {filter
                    ? t(dict, "admin.orders.noneWithStatus", {
                        status: t(dict, `status.${filter}`),
                      })
                    : d.noneYet}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
