"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { I18nProvider } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { ToastProvider } from "@/components/ui/Toaster";

export function Providers({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) {
  return (
    <SessionProvider>
      <I18nProvider locale={locale} dict={dict}>
        <ToastProvider>{children}</ToastProvider>
      </I18nProvider>
    </SessionProvider>
  );
}
