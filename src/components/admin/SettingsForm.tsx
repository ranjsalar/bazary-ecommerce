"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { StoreSettings } from "@/lib/settings";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toaster";
import { useI18n } from "@/i18n/client";

export function SettingsForm({ initial }: { initial: StoreSettings }) {
  const router = useRouter();
  const { t, tm } = useI18n();
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const d = (k: string) => t(`admin.settings.${k}`);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const form = new FormData(e.currentTarget);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: form.get("storeName"),
          supportWhatsapp: String(form.get("supportWhatsapp") ?? "").trim(),
          otpEnabled: form.get("otpEnabled") === "on",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? { _form: "common.somethingWrong" });
        return;
      }
      toast(t("admin.settings.savedToast"));
      router.refresh();
    } catch {
      setErrors({ _form: "common.networkError" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-xl space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
      noValidate
    >
      {errors._form && <Alert kind="error">{tm(errors._form)}</Alert>}

      <Input
        name="storeName"
        label={d("storeName")}
        defaultValue={initial.storeName}
        error={errors.storeName && tm(errors.storeName)}
      />
      <Input
        name="supportWhatsapp"
        type="tel"
        dir="ltr"
        label={d("supportWhatsapp")}
        defaultValue={initial.supportWhatsapp}
        placeholder="+964 770 123 4567"
        hint={d("supportWhatsappHint")}
        error={errors.supportWhatsapp && tm(errors.supportWhatsapp)}
      />

      <label className="flex items-start gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <input
          type="checkbox"
          name="otpEnabled"
          defaultChecked={initial.otpEnabled}
          className="mt-0.5 accent-indigo-600"
        />
        <span>
          <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {d("otpEnabled")}
          </span>
          <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
            {d("otpEnabledDesc")}
          </span>
        </span>
      </label>

      <Button type="submit" loading={saving}>
        {d("save")}
      </Button>
    </form>
  );
}
