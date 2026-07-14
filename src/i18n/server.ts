import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { getDictionary, type Dictionary } from "./index";

/** Reads the visitor's locale from the persistent cookie (server-side). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Convenience: locale + dictionary in one call for server components. */
export async function getI18n(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await getLocale();
  return { locale, dict: getDictionary(locale) };
}
