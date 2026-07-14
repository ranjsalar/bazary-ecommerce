"use client";

import { FormEvent, Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/i18n/client";
import { loginSchema, fieldErrors } from "@/lib/validation";

function LoginForm() {
  const router = useRouter();
  const { t, tm } = useI18n();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  // Success notices from the flows that land here.
  const justVerified = searchParams.get("verified") === "1";
  const justReset = searchParams.get("reset") === "1";
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setUnverifiedEmail(null);
    const form = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setLoading(true);
    const res = await signIn("credentials", { ...parsed.data, redirect: false });
    setLoading(false);
    if (res?.error) {
      if (res.error === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(parsed.data.email);
        return;
      }
      setErrors({ _form: "auth.incorrectCredentials" });
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">{t("auth.welcomeBack")}</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("auth.signInSubtitle")}</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {justVerified && !errors._form && !unverifiedEmail && (
          <Alert kind="success">{t("auth.emailVerifiedBanner")}</Alert>
        )}
        {justReset && !errors._form && !unverifiedEmail && (
          <Alert kind="success">{t("auth.passwordResetBanner")}</Alert>
        )}
        {unverifiedEmail && (
          <Alert kind="warning">
            {t("auth.notVerifiedPrefix")}{" "}
            <Link
              href={`/verify?email=${encodeURIComponent(unverifiedEmail)}`}
              className="font-medium underline"
            >
              {t("auth.verifyNow")}
            </Link>{" "}
            {t("auth.notVerifiedSuffix")}
          </Alert>
        )}
        {errors._form && <Alert kind="error">{tm(errors._form)}</Alert>}
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
          name="password"
          type="password"
          label={t("auth.password")}
          error={errors.password && tm(errors.password)}
          autoComplete="current-password"
        />
        <div className="text-end">
          <Link
            href="/forgot-password"
            className="text-sm text-brand-700 transition-colors hover:underline dark:text-brand-400"
          >
            {t("auth.forgotPassword")}
          </Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">
          {t("auth.signIn")}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        {t("auth.newHere")}{" "}
        <Link
          href="/register"
          className="font-medium text-brand-700 transition-colors hover:underline dark:text-brand-400"
        >
          {t("auth.createAccountLink")}
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
