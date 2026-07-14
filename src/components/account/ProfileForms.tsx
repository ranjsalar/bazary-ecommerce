"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toaster";
import { useI18n } from "@/i18n/client";
import { profileSchema, fieldErrors } from "@/lib/validation";

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const router = useRouter();
  const { t, tm } = useI18n();
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const form = new FormData(e.currentTarget);
    const parsed = profileSchema.safeParse({
      name: form.get("name"),
      phone: form.get("phone"),
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? { _form: "common.somethingWrong" });
        return;
      }
      toast(t("account.profileUpdated"));
      router.refresh();
    } catch {
      setErrors({ _form: "common.networkError" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {errors._form && <Alert kind="error">{tm(errors._form)}</Alert>}
      <Input
        name="name"
        label={t("auth.fullName")}
        defaultValue={name}
        error={errors.name && tm(errors.name)}
      />
      <Input
        name="phone"
        type="tel"
        dir="ltr"
        label={t("auth.phone")}
        defaultValue={phone}
        error={errors.phone && tm(errors.phone)}
      />
      <Button type="submit" loading={loading}>
        {t("account.saveChanges")}
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const { t, tm } = useI18n();
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const current = String(form.get("current") ?? "");
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password !== confirm) {
      setErrors({ confirm: "errors.passwordsNoMatch" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? { _form: "common.somethingWrong" });
        return;
      }
      toast(t("account.passwordChanged"));
      formEl.reset();
    } catch {
      setErrors({ _form: "common.networkError" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {errors._form && <Alert kind="error">{tm(errors._form)}</Alert>}
      <Input
        name="current"
        type="password"
        label={t("account.currentPassword")}
        error={errors.current && tm(errors.current)}
        autoComplete="current-password"
      />
      <Input
        name="password"
        type="password"
        label={t("account.newPassword")}
        error={errors.password && tm(errors.password)}
        hint={t("auth.passwordHint")}
        autoComplete="new-password"
      />
      <Input
        name="confirm"
        type="password"
        label={t("account.confirmNewPassword")}
        error={errors.confirm && tm(errors.confirm)}
        autoComplete="new-password"
      />
      <Button type="submit" variant="outline" loading={loading}>
        {t("account.changePassword")}
      </Button>
    </form>
  );
}
