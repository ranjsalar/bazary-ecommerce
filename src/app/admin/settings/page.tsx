import { getI18n } from "@/i18n/server";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const { dict } = await getI18n();
  const settings = await getSettings();

  return (
    <div className="animate-fade-up space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{dict.admin.settings.title}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{dict.admin.settings.desc}</p>
      </div>
      <SettingsForm initial={settings} />
    </div>
  );
}
