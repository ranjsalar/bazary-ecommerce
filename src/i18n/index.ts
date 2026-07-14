import type { Dictionary } from "./dictionaries/en";
import { en } from "./dictionaries/en";
import { ckb } from "./dictionaries/ckb";
import { ar } from "./dictionaries/ar";
import type { Locale } from "./config";

export type { Dictionary };
export * from "./config";

const dictionaries: Record<Locale, Dictionary> = { en, ckb, ar };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

type Params = Record<string, string | number>;

function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m));
}

/**
 * Resolves a dotted key ("checkout.placeOrder") against a dictionary with
 * {placeholder} interpolation. Unknown keys are returned unchanged, so raw
 * (already-translated or legacy) strings pass through safely.
 */
export function t(dict: Dictionary, key: string, params?: Params): string {
  let node: unknown = dict;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null || !(part in node)) return interpolate(key, params);
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? interpolate(node, params) : key;
}

/**
 * Translates messages produced by API routes / zod schemas. Supports either a
 * bare key ("errors.emailExists") or a key with inline params
 * ("errors.onlyNLeft|n=3|name=Power Bank"). Non-key strings pass through.
 */
export function tMessage(dict: Dictionary, message: string): string {
  const [key, ...pairs] = message.split("|");
  const params: Params = {};
  for (const pair of pairs) {
    const eq = pair.indexOf("=");
    if (eq > 0) params[pair.slice(0, eq)] = pair.slice(eq + 1);
  }
  return t(dict, key, params);
}

/** Formats integer IQD amounts with the locale's currency label. */
export function formatIQD(amount: number, dict?: Dictionary): string {
  const label = dict?.common.currency ?? "IQD";
  return `${amount.toLocaleString("en-US")} ${label}`;
}

const DATE_LOCALES: Record<Locale, string> = {
  en: "en-GB",
  // Western (latn) digits — the convention for prices/dates in Iraqi commerce.
  ckb: "ckb-IQ-u-nu-latn",
  ar: "ar-IQ-u-nu-latn",
};

export function formatDate(date: Date | string, locale: Locale = "en"): string {
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  try {
    return new Date(date).toLocaleDateString(DATE_LOCALES[locale], opts);
  } catch {
    return new Date(date).toLocaleDateString("en-GB", opts);
  }
}
