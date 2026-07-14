import { prisma } from "@/lib/prisma";
import { getI18n } from "@/i18n/server";
import { DeliveryFeeManager } from "@/components/admin/DeliveryFeeManager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Delivery fees" };

export default async function DeliveryFeesPage() {
  const { dict } = await getI18n();
  const fees = await prisma.deliveryFee.findMany({ orderBy: { city: "asc" } });

  return (
    <div className="animate-fade-up space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{dict.admin.fees.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          {dict.admin.fees.desc}
        </p>
      </div>
      <DeliveryFeeManager
        fees={fees.map((f) => ({ id: f.id, city: f.city, fee: f.fee, active: f.active }))}
      />
    </div>
  );
}
