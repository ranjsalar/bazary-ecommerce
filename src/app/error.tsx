"use client";

import { useEffect } from "react";
import { useI18n } from "@/i18n/client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold">{t("errorPage.title")}</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t("errorPage.text")}</p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        {t("common.tryAgain")}
      </button>
    </div>
  );
}
