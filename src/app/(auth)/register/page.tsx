"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/i18n/client";
import { registerSchema, fieldErrors } from "@/lib/validation";

function RegisterForm() {
  const router = useRouter();
  const { t, tm } = useI18n();
  // carried through verify → login so e.g. checkout signups land back there
  const callbackUrl = useSearchParams().get("callbackUrl");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const form = new FormData(e.currentTarget);
    const parsed = registerSchema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? { _form: "common.somethingWrong" });
        return;
      }
      const params = new URLSearchParams({ email: parsed.data.email });
      if (data.devCode) params.set("devCode", data.devCode);
      if (callbackUrl) params.set("callbackUrl", callbackUrl);
      router.push(`/verify?${params.toString()}`);
    } catch {
      setErrors({ _form: "common.networkError" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">{t("auth.createTitle")}</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("auth.createSubtitle")}</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {errors._form && <Alert kind="error">{tm(errors._form)}</Alert>}
        <Input
          name="name"
          label={t("auth.fullName")}
          placeholder={t("auth.namePlaceholder")}
          error={errors.name && tm(errors.name)}
          autoComplete="name"
        />
        <Input
          name="email"
          type="email"
          dir="ltr"
          label={t("auth.email")}
          placeholder={t("auth.emailPlaceholder")}
          error={errors.email && tm(errors.email)}
          autoComplete="email"
        />
        <Input
          name="phone"
          type="tel"
          dir="ltr"
          label={t("auth.phone")}
          placeholder={t("auth.phonePlaceholder")}
          defaultValue="+964"
          error={errors.phone && tm(errors.phone)}
          hint={t("auth.phoneHint")}
          autoComplete="tel"
        />
        <Input
          name="password"
          type="password"
          label={t("auth.password")}
          error={errors.password && tm(errors.password)}
          hint={t("auth.passwordHint")}
          autoComplete="new-password"
        />
        <Button type="submit" loading={loading} className="w-full">
          {t("auth.createAccount")}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        {t("auth.alreadyHave")}{" "}
        <Link
          href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}
          className="font-medium text-brand-700 transition-colors hover:underline dark:text-brand-400"
        >
          {t("auth.signInLink")}
        </Link>
      </p>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
