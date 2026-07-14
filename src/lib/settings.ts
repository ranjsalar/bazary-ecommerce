import { prisma } from "./prisma";

// Store-wide settings persisted in the Setting key/value table.
// Reads fall back to these defaults until the admin saves them.

export interface StoreSettings {
  storeName: string;
  supportWhatsapp: string;
  otpEnabled: boolean;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Bazary.iq",
  supportWhatsapp: "",
  otpEnabled: true,
};

export async function getSettings(): Promise<StoreSettings> {
  const rows = await prisma.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    storeName: map.get("storeName") ?? DEFAULT_SETTINGS.storeName,
    supportWhatsapp: map.get("supportWhatsapp") ?? DEFAULT_SETTINGS.supportWhatsapp,
    otpEnabled: (map.get("otpEnabled") ?? String(DEFAULT_SETTINGS.otpEnabled)) === "true",
  };
}

export async function saveSettings(settings: StoreSettings): Promise<void> {
  const entries: Array<[string, string]> = [
    ["storeName", settings.storeName],
    ["supportWhatsapp", settings.supportWhatsapp],
    ["otpEnabled", String(settings.otpEnabled)],
  ];
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
    )
  );
}
