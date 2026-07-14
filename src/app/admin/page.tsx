import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/i18n/server";
import { formatIQD } from "@/i18n";
import { DailyColumnChart, type DayPoint } from "@/components/admin/DailyColumnChart";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";

export const dynamic = "force-dynamic";

function lastNDays(n: number): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

const card =
  "rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900";

export default async function AdminOverviewPage() {
  const { dict } = await getI18n();
  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const [orderCount, customerCount, productCount, pendingCount, recentOrders, allRecent] =
    await Promise.all([
      prisma.order.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          orderNumber: true,
          fullName: true,
          city: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
        select: { createdAt: true, total: true },
      }),
    ]);

  const revenueAgg = await prisma.order.aggregate({
    _sum: { total: true },
    where: { status: { not: "CANCELLED" } },
  });
  const revenue = revenueAgg._sum.total ?? 0;

  // bucket last-30-day orders per day
  const days = lastNDays(30);
  const revenueByDay = new Map<string, number>(days.map((d) => [d, 0]));
  const ordersByDay = new Map<string, number>(days.map((d) => [d, 0]));
  for (const o of allRecent) {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (revenueByDay.has(key)) {
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + o.total);
      ordersByDay.set(key, (ordersByDay.get(key) ?? 0) + 1);
    }
  }
  const revenueSeries: DayPoint[] = days.map((d) => ({ date: d, value: revenueByDay.get(d) ?? 0 }));
  const ordersSeries: DayPoint[] = days.map((d) => ({ date: d, value: ordersByDay.get(d) ?? 0 }));

  const stats = [
    { label: dict.admin.overview.totalRevenue, value: formatIQD(revenue, dict), accent: "bg-indigo-500" },
    { label: dict.admin.overview.orders, value: orderCount.toLocaleString("en-US"), accent: "bg-sky-500" },
    { label: dict.admin.overview.pendingOrders, value: pendingCount.toLocaleString("en-US"), accent: "bg-amber-500" },
    { label: dict.admin.overview.customers, value: customerCount.toLocaleString("en-US"), accent: "bg-emerald-500" },
    { label: dict.admin.overview.products, value: productCount.toLocaleString("en-US"), accent: "bg-violet-500" },
  ];

  return (
    <div className="animate-fade-up space-y-6">
      <h1 className="text-2xl font-semibold">{dict.admin.overview.title}</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className={`relative overflow-hidden ${card} !p-4`}>
            <span className={`absolute inset-y-0 start-0 w-1 ${s.accent}`} aria-hidden />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.label}</p>
            <p
              className="mt-1 truncate text-lg font-semibold text-zinc-900 dark:text-zinc-100"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={card}>
          <h2 className="font-semibold">{dict.admin.overview.revenue30}</h2>
          <div className="mt-4">
            <DailyColumnChart data={revenueSeries} color="#6366f1" title={dict.admin.overview.revenue30} />
          </div>
        </section>
        <section className={card}>
          <h2 className="font-semibold">{dict.admin.overview.orders30}</h2>
          <div className="mt-4">
            <DailyColumnChart data={ordersSeries} color="#0ea5e9" title={dict.admin.overview.orders30} />
          </div>
        </section>
      </div>

      <section className={card}>
        <h2 className="font-semibold">{dict.admin.overview.latestOrders}</h2>
        {recentOrders.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            {dict.admin.overview.noOrders}
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  <th className="py-2 text-start font-medium">{dict.admin.overview.thOrder}</th>
                  <th className="py-2 text-start font-medium">{dict.admin.overview.thCustomer}</th>
                  <th className="py-2 text-start font-medium">{dict.admin.overview.thCity}</th>
                  <th className="py-2 text-end font-medium">{dict.admin.overview.thTotal}</th>
                  <th className="py-2 text-end font-medium">{dict.admin.overview.thStatus}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                    <td className="py-2.5 font-medium">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        #{o.orderNumber}
                      </Link>
                    </td>
                    <td className="py-2.5">{o.fullName}</td>
                    <td className="py-2.5">{o.city}</td>
                    <td className="py-2.5 text-end" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatIQD(o.total, dict)}
                    </td>
                    <td className="py-2.5 text-end">
                      <OrderStatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
