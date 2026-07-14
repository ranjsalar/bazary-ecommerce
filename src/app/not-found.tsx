import Link from "next/link";
import { getI18n } from "@/i18n/server";

export default async function NotFound() {
  const { dict } = await getI18n();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-brand-200 dark:text-brand-800">404</p>
      <h1 className="mt-4 text-xl font-semibold">{dict.notFound.title}</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{dict.notFound.text}</p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        {dict.notFound.backHome}
      </Link>
    </div>
  );
}
