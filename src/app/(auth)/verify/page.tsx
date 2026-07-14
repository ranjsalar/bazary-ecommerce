"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/i18n/client";

function VerifyForm() {
  const router = useRouter();
  const { t, tm } = useI18n();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const callbackUrl = searchParams.get("callbackUrl");
  // Dev convenience: the register API returns the code in development so the
  // flow is testable without a mail provider.
  const [devCode, setDevCode] = useState(searchParams.get("devCode"));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function resend() {
    setError("");
    setNotice("");
    setResending(true);
    try {
      const res = await fetch("/api/verify/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(tm(data.error ?? "common.somethingWrong"));
        return;
      }
      if (data.devCode) setDevCode(data.devCode);
      setNotice(t("auth.newCodeSent"));
      setCooldown(60);
    } catch {
      setError(tm("common.networkError"));
    } finally {
      setResending(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const code = String(new FormData(e.currentTarget).get("code") ?? "").trim();
    if (code.length !== 6) {
      setError(tm("errors.enterCode6"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(tm(data.error ?? "common.somethingWrong"));
        return;
      }
      router.push(
        `/login?verified=1${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`
      );
    } catch {
      setError(tm("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">{t("auth.verifyTitle")}</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {t("auth.verifySent")}{" "}
        <span className="force-ltr font-medium text-zinc-700 dark:text-zinc-300">{email}</span>
      </p>
      {devCode && (
        <Alert kind="warning" className="mt-3">
          {t("auth.devCodeIs")} <span className="font-mono font-bold">{devCode}</span>
        </Alert>
      )}
      {notice && (
        <Alert kind="success" className="mt-3">
          {notice}
        </Alert>
      )}
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <Input
          name="code"
          label={t("auth.verificationCode")}
          placeholder="123456"
          inputMode="numeric"
          dir="ltr"
          maxLength={6}
          error={error}
        />
        <Button type="submit" loading={loading} className="w-full">
          {t("auth.verify")}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
        {t("auth.noCode")}{" "}
        <button
          type="button"
          onClick={resend}
          disabled={resending || cooldown > 0}
          className="font-medium text-brand-700 transition-colors hover:underline disabled:cursor-not-allowed disabled:text-zinc-400 disabled:no-underline dark:text-brand-400 dark:disabled:text-zinc-500"
        >
          {cooldown > 0
            ? t("auth.resendIn", { s: cooldown })
            : resending
              ? t("auth.sending")
              : t("auth.resendCode")}
        </button>
      </p>
    </>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
