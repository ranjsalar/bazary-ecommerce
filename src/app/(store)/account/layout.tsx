import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getI18n } from "@/i18n/server";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/account");
  const { dict } = await getI18n();

  const navLink =
    "block rounded-lg px-2 py-2 text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-brand-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-brand-400";

  return (
    <div className="grid animate-fade-up gap-6 lg:grid-cols-4">
      <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:sticky lg:top-24">
        <p className="truncate px-2 pb-3 font-semibold">{session.user.name}</p>
        <nav className="space-y-1 border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800">
          <Link href="/account" className={navLink}>
            {dict.account.profileSettings}
          </Link>
          <Link href="/account/orders" className={navLink}>
            {dict.account.myOrders}
          </Link>
        </nav>
      </aside>
      <div className="lg:col-span-3">{children}</div>
    </div>
  );
}
