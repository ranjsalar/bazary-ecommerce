"use client";

import { Badge } from "@/components/ui/Badge";
import { ORDER_STATUS_COLORS, type OrderStatus } from "@/lib/constants";
import { useI18n } from "@/i18n/client";

export function OrderStatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const s = status as OrderStatus;
  return (
    <Badge
      className={ORDER_STATUS_COLORS[s] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}
    >
      {t(`status.${status}`)}
    </Badge>
  );
}
