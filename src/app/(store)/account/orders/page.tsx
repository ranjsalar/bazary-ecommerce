import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getI18n } from "@/i18n/server";
import { t, formatIQD, formatDate } from "@/i18n";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";

export const metadata = { title: "My orders" };

export default async function MyOrdersPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/account/orders");
  const { locale, dict } = await getI18n();

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: { select: { quantity: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-lg font-semibold">{dict.account.myOrders}</h1>
      {orders.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-white py-14 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="font-medium text-zinc-700 dark:text-zinc-200">
            {dict.account.noOrdersYet}
          </p>
          <Link
            href="/products"
            className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
          >
            {dict.account.startShopping}
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition-colors hover:border-brand-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-brand-700"
              >
                <div>
                  <p className="font-medium">
                    {t(dict, "account.orderNum", { n: order.orderNumber })}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {formatDate(order.createdAt, locale)} ·{" "}
                    {t(dict, "account.itemsCount", {
                      n: order.items.reduce((n, i) => n + i.quantity, 0),
                    })}{" "}
                    · {order.city}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-brand-700 dark:text-brand-400">
                    {formatIQD(order.total, dict)}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
