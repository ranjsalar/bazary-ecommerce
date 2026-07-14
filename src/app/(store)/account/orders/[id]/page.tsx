import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getI18n } from "@/i18n/server";
import { t, formatIQD, formatDate } from "@/i18n";
import { type OrderStatus } from "@/lib/constants";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";

export const metadata = { title: "Order details" };

// Progress steps shown for a normal (non-cancelled) order lifecycle.
const TRACK_STEPS: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

const card =
  "rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/account/orders");
  const { locale, dict } = await getI18n();

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  // Customers can only see their own orders (admins use the dashboard).
  if (!order || order.userId !== session.user.id) notFound();

  const stepIndex = TRACK_STEPS.indexOf(order.status as OrderStatus);
  const money = (v: number) => formatIQD(v, dict);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">
            {t(dict, "account.orderNum", { n: order.orderNumber })}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {formatDate(order.createdAt, locale)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Status tracker */}
      {order.status === "CANCELLED" ? (
        <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {dict.account.cancelledNote}
        </p>
      ) : (
        <ol className={`flex items-center ${card} !p-4`}>
          {TRACK_STEPS.map((step, i) => {
            const done = i <= stepIndex;
            return (
              <li key={step} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      done
                        ? "bg-brand-600 text-white"
                        : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400 sm:text-xs">
                    {t(dict, `status.${step}`)}
                  </span>
                </div>
                {i < TRACK_STEPS.length - 1 && (
                  <div
                    className={`mx-1 mb-4 h-0.5 flex-1 sm:mx-2 ${
                      i < stepIndex ? "bg-brand-600" : "bg-zinc-200 dark:bg-zinc-700"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      )}

      <section className={card}>
        <h2 className="font-semibold">{dict.account.items}</h2>
        <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                {item.image && (
                  <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {item.variant ? `${item.variant} · ` : ""}
                  {money(item.unitPrice)} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold">{money(item.unitPrice * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
          <div className="flex justify-between">
            <dt className="text-zinc-600 dark:text-zinc-400">{dict.account.subtotal}</dt>
            <dd className="font-medium">{money(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-600 dark:text-zinc-400">
              {t(dict, "account.deliveryTo", { city: order.city })}
            </dt>
            <dd className="font-medium">{money(order.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-semibold dark:border-zinc-800">
            <dt>{dict.account.total}</dt>
            <dd className="text-brand-700 dark:text-brand-400">{money(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className={`${card} text-sm text-zinc-700 dark:text-zinc-300`}>
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
          {dict.account.deliveryAddress}
        </h2>
        <p className="mt-2">
          {order.fullName} · <span className="force-ltr">{order.whatsapp}</span>
        </p>
        <p>
          {order.city}, {order.district}
        </p>
        {order.landmark && <p>{t(dict, "account.landmark", { v: order.landmark })}</p>}
        {order.addressNotes && <p>{t(dict, "account.notes", { v: order.addressNotes })}</p>}
      </section>
    </div>
  );
}
