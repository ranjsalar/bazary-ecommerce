import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { t } from "@/i18n";

export async function Footer() {
  const { dict } = await getI18n();
  const link = "transition-colors hover:text-brand-700 dark:hover:text-brand-400";

  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-brand-700 dark:text-brand-400">
            {dict.common.brand}
            <span className="text-accent-500">{dict.common.brandTld}</span>
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{dict.footer.tagline}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {dict.footer.shop}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              <Link href="/products" className={link}>
                {dict.footer.allProducts}
              </Link>
            </li>
            <li>
              <Link href="/cart" className={link}>
                {dict.footer.cart}
              </Link>
            </li>
            <li>
              <Link href="/account/orders" className={link}>
                {dict.footer.trackOrder}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {dict.footer.delivery}
          </p>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{dict.footer.deliveryText}</p>
        </div>
      </div>
      <div className="border-t border-zinc-100 py-4 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
        {t(dict, "footer.rights", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
