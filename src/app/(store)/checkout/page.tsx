"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart, cartSubtotal } from "@/store/cart";
import { useHydrated } from "@/lib/useHydrated";
import { IRAQ_CITIES } from "@/lib/constants";
import { checkoutSchema, fieldErrors, type CheckoutInput } from "@/lib/validation";
import { useI18n } from "@/i18n/client";
import { useToast } from "@/components/ui/Toaster";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";

type FeeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; fee: number }
  | { status: "unavailable" };

const card =
  "rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900";

export default function CheckoutPage() {
  const router = useRouter();
  const { t, tm, money } = useI18n();
  const { toast } = useToast();
  const { data: session, status: sessionStatus } = useSession();
  const { items, clear } = useCart();
  const hydrated = useHydrated();
  const [city, setCity] = useState("");
  const [feeState, setFeeState] = useState<FeeState>({ status: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  // guards against out-of-order responses when the city changes quickly
  const lookupSeq = useRef(0);

  // --- WhatsApp OTP step -------------------------------------------------
  // After the form validates, a code goes to the customer's WhatsApp number
  // and this dialog collects it; the order request carries the code.
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpDevCode, setOtpDevCode] = useState<string | null>(null);
  const [otpNotice, setOtpNotice] = useState("");
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [pendingOrder, setPendingOrder] = useState<CheckoutInput | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  function onCityChange(next: string) {
    setCity(next);
    const seq = ++lookupSeq.current;
    if (!next) {
      setFeeState({ status: "idle" });
      return;
    }
    setFeeState({ status: "loading" });
    fetch(`/api/delivery-fee?city=${encodeURIComponent(next)}`)
      .then((r) => r.json())
      .then((data) => {
        if (seq !== lookupSeq.current) return;
        setFeeState(data.available ? { status: "ok", fee: data.fee } : { status: "unavailable" });
      })
      .catch(() => {
        if (seq === lookupSeq.current) setFeeState({ status: "unavailable" });
      });
  }

  if (!hydrated || sessionStatus === "loading") {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  // Ordering is account-only — the orders API enforces this too.
  if (!session) {
    return (
      <div className="flex min-h-[50vh] animate-fade-up flex-col items-center justify-center text-center">
        <p className="text-5xl">🔒</p>
        <h1 className="mt-4 text-xl font-semibold">{t("checkout.loginRequiredTitle")}</h1>
        <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          {t("checkout.loginRequiredText")}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link href="/login?callbackUrl=/checkout">
            <Button size="lg" className="w-full sm:w-auto">
              {t("nav.signIn")}
            </Button>
          </Link>
          <Link href="/register?callbackUrl=/checkout">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              {t("nav.createAccount")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[50vh] animate-fade-up flex-col items-center justify-center text-center">
        <h1 className="text-xl font-semibold">{t("checkout.nothingTitle")}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("checkout.nothingText")}</p>
        <Link href="/products" className="mt-6">
          <Button size="lg">{t("checkout.browseProducts")}</Button>
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);
  const fee = feeState.status === "ok" ? feeState.fee : null;
  const canSubmit = feeState.status === "ok" && !submitting;

  async function requestOtp(whatsapp: string): Promise<
    { status: "skip" } | { status: "sent"; devCode?: string } | { status: "error"; message: string }
  > {
    try {
      const res = await fetch("/api/checkout/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp }),
      });
      const data = await res.json();
      if (res.ok) {
        return data.required === false
          ? { status: "skip" }
          : { status: "sent", devCode: data.devCode };
      }
      return { status: "error", message: data.errors?._form ?? "common.somethingWrong" };
    } catch {
      return { status: "error", message: "common.networkError" };
    }
  }

  async function placeOrder(input: CheckoutInput, otpCode?: string) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errs: Record<string, string> = data.errors ?? { _form: "common.somethingWrong" };
        if (errs.otp) {
          // wrong/expired code — keep the dialog open with the message
          setOtpError(tm(errs.otp));
          return;
        }
        setOtpOpen(false);
        setErrors(errs);
        return;
      }
      setOtpOpen(false);
      clear();
      toast(t("checkout.orderPlacedToast"));
      router.push(`/orders/confirmation/${data.orderId}`);
    } catch {
      setOtpError("");
      setOtpOpen(false);
      setErrors({ _form: "common.networkError" });
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const form = new FormData(e.currentTarget);
    const parsed = checkoutSchema.safeParse({
      fullName: form.get("fullName"),
      whatsapp: form.get("whatsapp"),
      city: form.get("city"),
      district: form.get("district"),
      landmark: form.get("landmark"),
      addressNotes: form.get("addressNotes"),
      orderNotes: form.get("orderNotes"),
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setSubmitting(true);
    const otp = await requestOtp(parsed.data.whatsapp);
    setSubmitting(false);

    if (otp.status === "error") {
      setErrors({ _form: otp.message });
      return;
    }
    if (otp.status === "skip") {
      await placeOrder(parsed.data);
      return;
    }
    setPendingOrder(parsed.data);
    setOtpDevCode(otp.devCode ?? null);
    setOtpError("");
    setOtpNotice("");
    setCooldown(60);
    setOtpOpen(true);
  }

  async function onOtpSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOtpError("");
    setOtpNotice("");
    const code = String(new FormData(e.currentTarget).get("otpCode") ?? "").trim();
    if (code.length !== 6) {
      setOtpError(tm("errors.enterCode6"));
      return;
    }
    if (pendingOrder) await placeOrder(pendingOrder, code);
  }

  async function onResend() {
    if (!pendingOrder || cooldown > 0) return;
    setResending(true);
    setOtpError("");
    setOtpNotice("");
    const otp = await requestOtp(pendingOrder.whatsapp);
    setResending(false);
    if (otp.status === "error") {
      setOtpError(tm(otp.message));
      return;
    }
    if (otp.status === "sent") {
      setOtpDevCode(otp.devCode ?? null);
      setOtpNotice(t("otp.sent"));
      setCooldown(60);
    }
  }

  return (
    <div className="grid animate-fade-up gap-6 lg:grid-cols-3">
      <form id="checkout-form" onSubmit={onSubmit} className="space-y-6 lg:col-span-2" noValidate>
        <h1 className="text-2xl font-semibold">{t("checkout.title")}</h1>

        {errors._form && <Alert kind="error">{tm(errors._form)}</Alert>}

        <section className={card}>
          <h2 className="font-semibold">{t("checkout.contactDetails")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              name="fullName"
              label={t("checkout.fullName")}
              defaultValue={session?.user.name ?? ""}
              error={errors.fullName && tm(errors.fullName)}
              autoComplete="name"
            />
            <Input
              name="whatsapp"
              type="tel"
              dir="ltr"
              label={t("checkout.whatsappNumber")}
              defaultValue="+964"
              error={errors.whatsapp && tm(errors.whatsapp)}
              hint={t("checkout.whatsappHint")}
              autoComplete="tel"
            />
          </div>
        </section>

        <section className={card}>
          <h2 className="font-semibold">{t("checkout.deliveryAddress")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Select
              name="city"
              label={t("checkout.cityLabel")}
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              error={errors.city && tm(errors.city)}
            >
              <option value="">{t("checkout.selectCity")}</option>
              {IRAQ_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Input
              name="district"
              label={t("checkout.district")}
              placeholder={t("checkout.districtPlaceholder")}
              error={errors.district && tm(errors.district)}
            />
            <Input
              name="landmark"
              label={t("checkout.landmark")}
              placeholder={t("checkout.landmarkPlaceholder")}
              error={errors.landmark && tm(errors.landmark)}
              className="sm:col-span-2"
            />
            <Textarea
              name="addressNotes"
              label={t("checkout.addressNotes")}
              placeholder={t("checkout.addressNotesPlaceholder")}
              error={errors.addressNotes && tm(errors.addressNotes)}
              className="sm:col-span-2"
            />
          </div>

          {feeState.status === "loading" && (
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              {t("checkout.checkingFee")}
            </p>
          )}
          {feeState.status === "ok" && (
            <Alert kind="info" className="mt-3">
              {t("checkout.feeTo", { city })}{" "}
              <span className="font-semibold">{money(feeState.fee)}</span>
            </Alert>
          )}
          {feeState.status === "unavailable" && (
            <Alert kind="error" className="mt-3">
              {t("checkout.feeUnavailable", { city })}
            </Alert>
          )}
        </section>

        <section className={card}>
          <h2 className="font-semibold">{t("checkout.orderNotes")}</h2>
          <Textarea
            name="orderNotes"
            label=""
            placeholder={t("checkout.orderNotesPlaceholder")}
            error={errors.orderNotes && tm(errors.orderNotes)}
            className="mt-2"
          />
        </section>

        <section className={card}>
          <h2 className="font-semibold">{t("checkout.payment")}</h2>
          <label className="mt-3 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-500/10">
            <input type="radio" checked readOnly className="accent-brand-600" />
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {t("checkout.cod")}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("checkout.codDesc")}</p>
            </div>
          </label>
        </section>

        <Button
          type="submit"
          size="lg"
          className="w-full lg:hidden"
          disabled={!canSubmit}
          loading={submitting}
        >
          {fee != null
            ? t("checkout.placeOrderTotal", { total: money(subtotal + fee) })
            : t("checkout.selectCityToContinue")}
        </Button>
      </form>

      {/* Summary */}
      <div className={`h-fit ${card} lg:sticky lg:top-24`}>
        <h2 className="text-lg font-semibold">{t("checkout.summary")}</h2>
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={`${item.productId}-${item.variantId ?? ""}`} className="flex items-center gap-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                {item.image && (
                  <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-zinc-800 dark:text-zinc-200">{item.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {item.variantName ? `${item.variantName} · ` : ""}× {item.quantity}
                </p>
              </div>
              <p className="text-sm font-medium">{money(item.unitPrice * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
          <div className="flex justify-between">
            <dt className="text-zinc-600 dark:text-zinc-400">{t("checkout.subtotal")}</dt>
            <dd className="font-medium">{money(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-600 dark:text-zinc-400">{t("checkout.deliveryFee")}</dt>
            <dd className="font-medium">
              {feeState.status === "ok"
                ? money(feeState.fee)
                : feeState.status === "unavailable"
                  ? "—"
                  : t("checkout.selectCityDash")}
            </dd>
          </div>
          <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-semibold dark:border-zinc-800">
            <dt>{t("checkout.total")}</dt>
            <dd className="text-brand-700 dark:text-brand-400">
              {fee != null ? money(subtotal + fee) : `${money(subtotal)} ${t("checkout.plusDelivery")}`}
            </dd>
          </div>
        </dl>
        <Button
          type="submit"
          form="checkout-form"
          size="lg"
          className="mt-5 hidden w-full lg:flex"
          disabled={!canSubmit}
          loading={submitting}
        >
          {fee != null ? t("checkout.placeOrder") : t("checkout.selectCityToContinue")}
        </Button>
      </div>

      {/* WhatsApp OTP dialog */}
      {otpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !submitting && setOtpOpen(false)}
          />
          <div className="relative w-full max-w-md animate-toast-in rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">{t("otp.title")}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {t("otp.text", { phone: pendingOrder?.whatsapp ?? "" })}
            </p>
            {otpDevCode && (
              <Alert kind="warning" className="mt-3">
                {t("otp.devCode")} <span className="font-mono font-bold">{otpDevCode}</span>
              </Alert>
            )}
            {otpNotice && (
              <Alert kind="success" className="mt-3">
                {otpNotice}
              </Alert>
            )}
            <form onSubmit={onOtpSubmit} className="mt-4 space-y-4" noValidate>
              <Input
                name="otpCode"
                label={t("otp.codeLabel")}
                placeholder="123456"
                inputMode="numeric"
                dir="ltr"
                maxLength={6}
                autoFocus
                error={otpError}
                className="[&_input]:text-center [&_input]:font-mono [&_input]:text-lg [&_input]:tracking-[0.5em]"
              />
              <Button type="submit" loading={submitting} className="w-full">
                {t("otp.verifyAndPlace")}
              </Button>
            </form>
            <div className="mt-4 flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => !submitting && setOtpOpen(false)}
                className="text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                {t("otp.changeNumber")}
              </button>
              <button
                type="button"
                onClick={onResend}
                disabled={resending || cooldown > 0}
                className="font-medium text-brand-700 transition-colors hover:underline disabled:cursor-not-allowed disabled:text-zinc-400 disabled:no-underline dark:text-brand-400 dark:disabled:text-zinc-500"
              >
                {cooldown > 0
                  ? t("otp.resendIn", { s: cooldown })
                  : resending
                    ? t("otp.sending")
                    : t("otp.resend")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
