"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCart, cartCount } from "@/store/cart";
import { useHydrated } from "@/lib/useHydrated";
import { useI18n } from "@/i18n/client";
import { LanguageSwitcher } from "@/components/providers/LanguageSwitcher";
import { ThemeToggle } from "@/components/providers/ThemeToggle";

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    </svg>
  );
}

const menuItem =
  "block px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-700/50";

export function Navbar() {
  const router = useRouter();
  const { t } = useI18n();
  const { data: session } = useSession();
  const items = useCart((s) => s.items);
  // Avoid hydration mismatch: cart is read from localStorage on the client only.
  const hydrated = useHydrated();
  const count = hydrated ? cartCount(items) : 0;
  const [menuOpen, setMenuOpen] = useState(false);

  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  }

  const searchInput =
    "w-full rounded-full border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm transition-shadow focus:outline-2 focus:outline-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500";

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6">
        <Link href="/" className="shrink-0 text-xl font-bold text-brand-700 dark:text-brand-400">
          {t("common.brand")}
          <span className="text-accent-500">{t("common.brandTld")}</span>
        </Link>

        <form onSubmit={onSearch} className="hidden flex-1 sm:block">
          <input
            name="q"
            type="search"
            placeholder={t("nav.searchPlaceholder")}
            className={`max-w-md ${searchInput}`}
          />
        </form>

        <nav className="ms-auto flex items-center gap-0.5 sm:gap-1">
          <Link
            href="/products"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:block"
          >
            {t("nav.products")}
          </Link>
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            href="/cart"
            aria-label={t("nav.cart")}
            className="relative rounded-lg p-2 text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <CartIcon />
            {count > 0 && (
              <span className="absolute -end-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-accent-500 text-[11px] font-bold text-white">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          <div className="relative">
            <button
              aria-label={t("nav.accountMenu")}
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-lg p-2 text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <UserIcon />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute end-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                  {session ? (
                    <>
                      <p className="truncate border-b border-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                        {session.user.name}
                      </p>
                      <Link href="/account" onClick={() => setMenuOpen(false)} className={menuItem}>
                        {t("nav.myAccount")}
                      </Link>
                      <Link
                        href="/account/orders"
                        onClick={() => setMenuOpen(false)}
                        className={menuItem}
                      >
                        {t("nav.myOrders")}
                      </Link>
                      {session.user.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setMenuOpen(false)}
                          className={`${menuItem} font-medium text-brand-700 dark:text-brand-400`}
                        >
                          {t("nav.adminDashboard")}
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="block w-full px-4 py-2 text-start text-sm text-red-600 transition-colors hover:bg-zinc-50 dark:text-red-400 dark:hover:bg-zinc-700/50"
                      >
                        {t("nav.signOut")}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setMenuOpen(false)} className={menuItem}>
                        {t("nav.signIn")}
                      </Link>
                      <Link href="/register" onClick={() => setMenuOpen(false)} className={menuItem}>
                        {t("nav.createAccount")}
                      </Link>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile search */}
      <form
        onSubmit={onSearch}
        className="border-t border-zinc-100 px-4 py-2 dark:border-zinc-800 sm:hidden"
      >
        <input name="q" type="search" placeholder={t("nav.searchPlaceholder")} className={searchInput} />
      </form>
    </header>
  );
}
