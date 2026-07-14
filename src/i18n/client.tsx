"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "./config";
import { LOCALE_DIR } from "./config";
import { t, tMessage, formatIQD, formatDate, type Dictionary } from "./index";

interface I18nContextValue {
  locale: Locale;
  dict: Dictionary;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, dict, dir: LOCALE_DIR[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Client-side i18n. Returns the dictionary plus helpers:
 *  - t(key, params)   — translate a dotted key
 *  - tm(message)      — translate a server/zod message key (with |k=v params)
 *  - money(amount)    — format IQD with the locale's currency label
 *  - date(d)          — locale-aware date-time
 */
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  const { locale, dict, dir } = ctx;
  return {
    locale,
    dict,
    dir,
    t: (key: string, params?: Record<string, string | number>) => t(dict, key, params),
    tm: (message: string) => tMessage(dict, message),
    money: (amount: number) => formatIQD(amount, dict),
    date: (d: Date | string) => formatDate(d, locale),
  };
}
