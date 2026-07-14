import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/i18n/server";
import { t, formatIQD, formatDate } from "@/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "Order confirmed" };

const card =
  "rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { locale, dict } = await getI18n();
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) notFound();

  const money = (v: number) => formatIQD(v, dict);

  const detail = (label: string, value: string, ltr = false) => (
    <p>
      <span className="font-medium">{label}:</span>{" "}
      <span className={ltr ? "force-ltr" : undefined}>{value}</span>
    </p>
  );

  return (
    <div className="mx-auto max-w-2xl animate-fade-up space-y-6">
      <div className="rounded-2xl bg-emerald-50 p-6 text-center dark:bg-emerald-500/10">
        <p className="text-4xl">✅</p>
        <h1 className="mt-2 text-2xl font-semibold text-emerald-900 dark:text-emerald-300">
          {dict.confirmation.successTitle}
        </h1>
        <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-400">
          <span className="font-mono font-semibold">
            {t(dict, "account.orderNum", { n: order.orderNumber })}
          </span>{" "}
          · {formatDate(order.createdAt, locale)}
        </p>
        <p className="mt-3 text-sm text-emerald-800 dark:text-emerald-400">
          {t(dict, "confirmation.whatsappNote", { phone: order.whatsapp })}{" "}
          {t(dict, "confirmation.payNote", { total: money(order.total) })}
        </p>
      </div>

      <section className={card}>
        <h2 className="font-semibold">{dict.confirmation.items}</h2>
        <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                {item.image && (
                  <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.name}</p>
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
            <dt className="text-zinc-600 dark:text-zinc-400">{dict.confirmation.subtotal}</dt>
            <dd className="font-medium">{money(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-600 dark:text-zinc-400">
              {t(dict, "confirmation.deliveryTo", { city: order.city })}
            </dt>
            <dd className="font-medium">{money(order.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-semibold dark:border-zinc-800">
            <dt>{dict.confirmation.totalCod}</dt>
            <dd className="text-brand-700 dark:text-brand-400">{money(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className={card}>
        <h2 className="font-semibold">{dict.confirmation.deliveryDetails}</h2>
        <div className="mt-3 space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
          {detail(dict.confirmation.name, order.fullName)}
          {detail(dict.confirmation.whatsapp, order.whatsapp, true)}
          {detail(dict.confirmation.city, order.city)}
          {detail(dict.confirmation.district, order.district)}
          {order.landmark && detail(dict.confirmation.landmark, order.landmark)}
          {order.addressNotes && detail(dict.confirmation.notes, order.addressNotes)}
          {order.orderNotes && detail(dict.confirmation.orderNotes, order.orderNotes)}
        </div>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href="/products" className="flex-1">
          <span className="block rounded-lg bg-brand-600 px-5 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-brand-700">
            {dict.confirmation.continueShopping}
          </span>
        </Link>
        <Link href="/account/orders" className="flex-1">
          <span className="block rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-center text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
            {dict.confirmation.viewMyOrders}
          </span>
        </Link>
      </div>
    </div>
  );
}
