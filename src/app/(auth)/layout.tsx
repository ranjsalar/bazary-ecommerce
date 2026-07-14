import Link from "next/link";
import { ReactNode } from "react";
import { getI18n } from "@/i18n/server";
import { LanguageSwitcher } from "@/components/providers/LanguageSwitcher";
import { ThemeToggle } from "@/components/providers/ThemeToggle";

// Split-screen auth shell: brand panel on the inline-start side, form card on
// the other. Collapses to a centered card on small screens.
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const { dict } = await getI18n();

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <aside className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -end-32 size-[28rem] rounded-full bg-accent-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -start-24 -top-24 size-80 rounded-full bg-white/10 blur-2xl"
        />
        <Link href="/" className="relative text-2xl font-bold">
          {dict.common.brand}
          <span className="text-accent-400">{dict.common.brandTld}</span>
        </Link>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight">{dict.home.heroTitle}</h2>
          <p className="mt-4 text-brand-100">{dict.home.heroText}</p>
        </div>
        <p className="relative text-sm text-brand-200">{dict.footer.tagline}</p>
      </aside>

      {/* Form side */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
        <div className="absolute end-4 top-4 flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <Link
          href="/"
          className="mb-6 text-2xl font-bold text-brand-700 dark:text-brand-400 lg:hidden"
        >
          {dict.common.brand}
          <span className="text-accent-500">{dict.common.brandTld}</span>
        </Link>
        <div className="w-full max-w-md animate-fade-up rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          {children}
        </div>
        <Link
          href="/"
          className="mt-6 text-sm text-zinc-500 transition-colors hover:text-brand-700 dark:text-zinc-400 dark:hover:text-brand-400"
        >
          ← {dict.admin.backToStore}
        </Link>
      </div>
    </div>
  );
}
