"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_NAMES, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { setLocale } from "@/i18n/actions";

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0a8.949 8.949 0 0 0 3.5-9 8.949 8.949 0 0 0-3.5-9m0 18a8.949 8.949 0 0 1-3.5-9 8.949 8.949 0 0 1 3.5-9M3.6 9h16.8M3.6 15h16.8"
      />
    </svg>
  );
}

/** Globe dropdown that persists the language cookie and re-renders the app. */
export function LanguageSwitcher({ variant = "light" }: { variant?: "light" | "dark" }) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  const buttonStyle =
    variant === "dark"
      ? "text-zinc-300 hover:bg-zinc-800 hover:text-white"
      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800";

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t("nav.language")}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 rounded-lg p-2 transition-colors ${buttonStyle} ${pending ? "opacity-50" : ""}`}
      >
        <GlobeIcon />
        <span className="hidden text-xs font-semibold uppercase sm:block">{locale}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute end-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
            {LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => choose(l)}
                className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700/50 ${
                  l === locale
                    ? "font-semibold text-brand-700 dark:text-brand-400"
                    : "text-zinc-700 dark:text-zinc-200"
                }`}
              >
                {LOCALE_NAMES[l]}
                {l === locale && <span aria-hidden>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
