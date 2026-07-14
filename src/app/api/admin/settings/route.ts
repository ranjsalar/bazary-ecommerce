import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getSettings, saveSettings } from "@/lib/settings";
import { iraqPhoneSchema, fieldErrors } from "@/lib/validation";

const schema = z.object({
  storeName: z.string().trim().min(1).max(100),
  // optional — empty string means "not set"
  supportWhatsapp: z.union([z.literal(""), iraqPhoneSchema]),
  otpEnabled: z.boolean(),
});

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "errors.forbidden" }, { status: 403 });
  }
  return NextResponse.json(await getSettings());
}

export async function PUT(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ errors: { _form: "errors.forbidden" } }, { status: 403 });
  }
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
    }
    await saveSettings(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("settings save error", e);
    return NextResponse.json({ errors: { _form: "common.somethingWrong" } }, { status: 500 });
  }
}
