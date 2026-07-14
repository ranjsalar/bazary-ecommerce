import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/i18n/server";
import { t, formatIQD, formatDate } from "@/i18n";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";

export const dynamic = "force-dynamic";

export const metadata = { title: "Order detail" };

const card =
  "rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { locale, dict } = await getI18n();
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, user: { select: { email: true } } },
  });
  if (!order) notFound();
  const d = dict.admin.orders;
  const money = (v: number) => formatIQD(v, dict);

  const whatsappLink = `https://wa.me/${order.whatsapp.replace("+", "")}`;

  const field = (label: string, value: React.ReactNode, span2 = false) => (
    <p className={span2 ? "sm:col-span-2" : undefined}>
      <span className="font-medium">{label}:</span> {value}
    </p>
  );

  return (
    <div className="max-w-3xl animate-fade-up space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {t(dict, "account.orderNum", { n: order.orderNumber })}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {formatDate(order.createdAt, locale)} · {order.paymentMethod} ·{" "}
            {order.paymentStatus === "PAID" ? d.paid : d.unpaid}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <section className={card}>
        <OrderStatusControl orderId={order.id} current={order.status} />
      </section>

      <section className={card}>
        <h2 className="font-semibold">{d.customer}</h2>
        <div className="mt-3 grid gap-1.5 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
          {field(d.name, order.fullName)}
          {field(
            d.whatsapp,
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="force-ltr text-indigo-600 hover:underline dark:text-indigo-400"
            >
              {order.whatsapp}
            </a>
          )}
          {field(d.accountLabel, order.user?.email ?? d.guestCheckout)}
          {field(d.city, order.city)}
          {field(d.district, order.district, true)}
          {order.landmark && field(d.landmark, order.landmark, true)}
          {order.addressNotes && field(d.addressNotes, order.addressNotes, true)}
          {order.orderNotes && field(d.orderNotes, order.orderNotes, true)}
        </div>
      </section>

      <section className={card}>
        <h2 className="font-semibold">{d.items}</h2>
        <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                {item.image && (
                  <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {item.variant ? `${item.variant} · ` : ""}
                  {money(item.unitPrice)} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                {money(item.unitPrice * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
          <div className="flex justify-between">
            <dt className="text-zinc-600 dark:text-zinc-400">{d.subtotal}</dt>
            <dd className="font-medium">{money(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-600 dark:text-zinc-400">
              {t(dict, "admin.orders.deliveryCity", { city: order.city })}
            </dt>
            <dd className="font-medium">{money(order.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-semibold dark:border-zinc-800">
            <dt>{d.totalToCollect}</dt>
            <dd className="text-indigo-600 dark:text-indigo-400">{money(order.total)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
