"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { IRAQ_CITIES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toaster";
import { useI18n } from "@/i18n/client";

export interface FeeRow {
  id: string;
  city: string;
  fee: number;
  active: boolean;
}

export function DeliveryFeeManager({ fees }: { fees: FeeRow[] }) {
  const router = useRouter();
  const { t, tm, money } = useI18n();
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function addFee(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setAdding(true);
    try {
      const res = await fetch("/api/admin/delivery-fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: form.get("city"),
          fee: Number(form.get("fee")),
          active: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? { _form: "admin.fees.couldNotSaveFee" });
        return;
      }
      formEl.reset();
      toast(t("admin.fees.savedToast"));
      router.refresh();
    } catch {
      setErrors({ _form: "common.networkError" });
    } finally {
      setAdding(false);
    }
  }

  async function patchFee(id: string, patch: Partial<Pick<FeeRow, "fee" | "active" | "city">>) {
    setBusyId(id);
    setErrors({});
    try {
      const res = await fetch(`/api/admin/delivery-fees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrors(data.errors ?? { _form: "admin.fees.couldNotSaveFee" });
        return;
      }
      setEditingId(null);
      toast(t("admin.fees.savedToast"));
      router.refresh();
    } catch {
      setErrors({ _form: "common.networkError" });
    } finally {
      setBusyId(null);
    }
  }

  async function deleteFee(id: string, city: string) {
    if (!confirm(t("admin.fees.deleteConfirm", { city }))) {
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/delivery-fees/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setErrors({ _form: "admin.fees.couldNotDeleteFee" });
        return;
      }
      toast(t("admin.fees.deletedToast"));
      router.refresh();
    } catch {
      setErrors({ _form: "common.networkError" });
    } finally {
      setBusyId(null);
    }
  }

  const configured = new Set(fees.map((f) => f.city));
  const missing = IRAQ_CITIES.filter((c) => !configured.has(c));
  const d = (k: string) => t(`admin.fees.${k}`);

  return (
    <div className="space-y-5">
      {errors._form && <Alert kind="error">{tm(errors._form)}</Alert>}

      {/* Add form */}
      <form
        onSubmit={addFee}
        className="grid items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-3"
      >
        <div>
          <Input
            name="city"
            label={d("city")}
            list="city-suggestions"
            placeholder={d("cityPlaceholder")}
            error={errors.city && tm(errors.city)}
          />
          <datalist id="city-suggestions">
            {missing.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <Input
          name="fee"
          type="number"
          label={d("fee")}
          min={0}
          step={250}
          placeholder="3000"
          error={errors.fee && tm(errors.fee)}
        />
        <Button type="submit" loading={adding}>
          {d("addCityFee")}
        </Button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
              <th className="px-4 py-3 text-start font-medium">{d("thCity")}</th>
              <th className="px-4 py-3 text-end font-medium">{d("thFee")}</th>
              <th className="px-4 py-3 text-center font-medium">{d("thStatus")}</th>
              <th className="px-4 py-3 text-end font-medium">{d("thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((f) => (
              <tr key={f.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                <td className="px-4 py-3 font-medium">{f.city}</td>
                <td className="px-4 py-3 text-end" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {editingId === f.id ? (
                    <form
                      className="flex items-center justify-end gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const v = Number(new FormData(e.currentTarget).get("fee"));
                        patchFee(f.id, { fee: v });
                      }}
                    >
                      <input
                        name="fee"
                        type="number"
                        min={0}
                        step={250}
                        defaultValue={f.fee}
                        autoFocus
                        className="w-28 rounded-lg border border-zinc-300 px-2 py-1 text-end text-sm dark:border-zinc-600 dark:bg-zinc-900"
                      />
                      <Button size="sm" type="submit" loading={busyId === f.id}>
                        {t("common.save")}
                      </Button>
                      <Button size="sm" type="button" variant="ghost" onClick={() => setEditingId(null)}>
                        {t("common.cancel")}
                      </Button>
                    </form>
                  ) : (
                    money(f.fee)
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge
                    className={
                      f.active
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400"
                        : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                    }
                  >
                    {f.active ? d("active") : d("inactive")}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(f.id)}>
                      {t("common.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === f.id}
                      onClick={() => patchFee(f.id, { active: !f.active })}
                    >
                      {f.active ? d("deactivate") : d("activate")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 dark:text-red-400"
                      disabled={busyId === f.id}
                      onClick={() => deleteFee(f.id, f.city)}
                    >
                      {t("common.delete")}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {fees.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                  {d("noneConfigured")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {missing.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
          <p className="font-medium">{t("admin.fees.missingTitle", { n: missing.length })}</p>
          <p className="mt-1">{t("admin.fees.missingText", { cities: missing.join(", ") })}</p>
        </div>
      )}
    </div>
  );
}
