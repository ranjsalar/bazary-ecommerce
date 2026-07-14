import { prisma } from "@/lib/prisma";
import { getI18n } from "@/i18n/server";
import { formatIQD, formatDate } from "@/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "Customers" };

export default async function CustomersPage() {
  const { locale, dict } = await getI18n();
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: {
      orders: { select: { total: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const d = dict.admin.customers;

  return (
    <div className="animate-fade-up space-y-4">
      <h1 className="text-2xl font-semibold">{d.title}</h1>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
              <th className="px-4 py-3 text-start font-medium">{d.thName}</th>
              <th className="px-4 py-3 text-start font-medium">{d.thEmail}</th>
              <th className="px-4 py-3 text-start font-medium">{d.thPhone}</th>
              <th className="px-4 py-3 text-start font-medium">{d.thJoined}</th>
              <th className="px-4 py-3 text-end font-medium">{d.thOrders}</th>
              <th className="px-4 py-3 text-end font-medium">{d.thTotalSpent}</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const counted = c.orders.filter((o) => o.status !== "CANCELLED");
              return (
                <tr key={c.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{c.email}</td>
                  <td
                    className="force-ltr px-4 py-3 text-zinc-600 dark:text-zinc-400"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {c.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {formatDate(c.createdAt, locale)}
                  </td>
                  <td className="px-4 py-3 text-end" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {counted.length}
                  </td>
                  <td className="px-4 py-3 text-end" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatIQD(
                      counted.reduce((s, o) => s + o.total, 0),
                      dict
                    )}
                  </td>
                </tr>
              );
            })}
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
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
