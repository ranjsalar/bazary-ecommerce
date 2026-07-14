import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getI18n } from "@/i18n/server";
import { ProfileForm, PasswordForm } from "@/components/account/ProfileForms";

export const metadata = { title: "My account" };

const card =
  "rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900";

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/account");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");
  const { dict } = await getI18n();

  return (
    <div className="space-y-6">
      <section className={card}>
        <h1 className="text-lg font-semibold">{dict.account.profileSettings}</h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
        <div className="mt-5 max-w-md">
          <ProfileForm name={user.name} phone={user.phone ?? "+964"} />
        </div>
      </section>

      <section className={card}>
        <h2 className="text-lg font-semibold">{dict.account.changePassword}</h2>
        <div className="mt-5 max-w-md">
          <PasswordForm />
        </div>
      </section>
    </div>
  );
}
