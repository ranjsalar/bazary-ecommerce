// Locale configuration shared by server and client code.

export const LOCALES = ["en", "ckb", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "locale";

// ckb and ar are right-to-left; <html dir> is driven by this map in the root layout.
export const LOCALE_DIR: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  ckb: "rtl",
  ar: "rtl",
};

// Native names shown in the language switcher.
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  ckb: "کوردی سۆرانی",
  ar: "العربية",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
