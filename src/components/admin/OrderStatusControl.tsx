"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toaster";
import { useI18n } from "@/i18n/client";

export function OrderStatusControl({
  orderId,
  current,
}: {
  orderId: string;
  current: string;
}) {
  const router = useRouter();
  const { t, tm } = useI18n();
  const { toast } = useToast();
  const [status, setStatus] = useState(current);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(tm(data.error ?? "admin.orders.couldNotUpdate"));
        return;
      }
      toast(t("admin.orders.statusUpdatedToast"));
      router.refresh();
    } catch {
      setError(tm("common.networkError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-end gap-2">
      <Select
        label={t("admin.orders.orderStatus")}
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        error={error}
        className="w-44"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {t(`status.${s}`)}
          </option>
        ))}
      </Select>
      <Button onClick={save} loading={saving} disabled={status === current}>
        {t("admin.orders.update")}
      </Button>
    </div>
  );
}
