"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/i18n/client";

export default function ForgotPasswordPage() {
  const { t, tm } = useI18n();
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(tm(data.error ?? "common.somethingWrong"));
        return;
      }
      setSent(true);
      if (data.devResetUrl) setDevResetUrl(data.devResetUrl);
    } catch {
      setError(tm("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  const backLink = (
    <Link
      href="/login"
      className="mt-6 block text-center text-sm font-medium text-brand-700 transition-colors hover:underline dark:text-brand-400"
    >
      {t("auth.backToSignIn")}
    </Link>
  );

  if (sent) {
    return (
      <>
        <h1 className="text-2xl font-semibold">{t("auth.checkEmailTitle")}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("auth.checkEmailText")}</p>
        {devResetUrl && (
          <Alert kind="warning" className="mt-3 break-all">
            {t("auth.devReset")}{" "}
            <Link href={devResetUrl} className="font-medium underline">
              {t("auth.openResetLink")}
            </Link>
          </Alert>
        )}
        {backLink}
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">{t("auth.forgotTitle")}</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("auth.forgotText")}</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <Input
          name="email"
          type="email"
          dir="ltr"
          label={t("auth.email")}
          placeholder={t("auth.emailPlaceholder")}
          error={error}
          autoComplete="email"
        />
        <Button type="submit" loading={loading} className="w-full">
          {t("auth.sendResetLink")}
        </Button>
      </form>
      {backLink}
    </>
  );
}
