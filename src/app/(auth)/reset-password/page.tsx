"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/i18n/client";
import { resetPasswordSchema, fieldErrors } from "@/lib/validation";

function ResetPasswordForm() {
  const router = useRouter();
  const { t, tm } = useI18n();
  const token = useSearchParams().get("token") ?? "";
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password !== confirm) {
      setErrors({ confirm: "errors.passwordsNoMatch" });
      return;
    }
    const parsed = resetPasswordSchema.safeParse({ token, password });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? { _form: "common.somethingWrong" });
        return;
      }
      router.push("/login?reset=1");
    } catch {
      setErrors({ _form: "common.networkError" });
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return <Alert kind="error">{t("auth.invalidResetLink")}</Alert>;
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">{t("auth.resetTitle")}</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {errors._form && <Alert kind="error">{tm(errors._form)}</Alert>}
        <Input
          name="password"
          type="password"
          label={t("auth.newPassword")}
          error={errors.password && tm(errors.password)}
          hint={t("auth.passwordHint")}
          autoComplete="new-password"
        />
        <Input
          name="confirm"
          type="password"
          label={t("auth.confirmPassword")}
          error={errors.confirm && tm(errors.confirm)}
          autoComplete="new-password"
        />
        <Button type="submit" loading={loading} className="w-full">
          {t("auth.resetPassword")}
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
