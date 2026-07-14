import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { iraqPhoneSchema } from "@/lib/validation";
import { sendOrderOtp } from "@/lib/otp";
import { getSettings } from "@/lib/settings";

const schema = z.object({ whatsapp: iraqPhoneSchema });

// Sends a 6-digit order-confirmation code to the customer's WhatsApp number.
// Sign-in required (ordering itself is account-only, and this also keeps the
// send endpoint from being hit anonymously). Returns { required: false } when
// the admin has disabled checkout OTP.
export async function POST(req: Request) {
  try {
    if (!(await auth())) {
      return NextResponse.json({ errors: { _form: "errors.loginRequired" } }, { status: 401 });
    }
    const settings = await getSettings();
    if (!settings.otpEnabled) {
      return NextResponse.json({ ok: true, required: false });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { errors: { whatsapp: "errors.phoneInvalid" } },
        { status: 400 }
      );
    }

    const result = await sendOrderOtp(parsed.data.whatsapp);
    if (!result.ok) {
      return NextResponse.json(
        { errors: { _form: `errors.waitBeforeResend|s=${result.retryAfterSeconds}` } },
        { status: 429 }
      );
    }

    return NextResponse.json({
      ok: true,
      required: true,
      ...(result.devCode ? { devCode: result.devCode } : {}),
    });
  } catch (e) {
    console.error("checkout otp error", e);
    return NextResponse.json({ errors: { _form: "common.somethingWrong" } }, { status: 500 });
  }
}
