import { createHash, randomInt } from "crypto";
import { prisma } from "./prisma";
import { sendWhatsAppOtp } from "./messaging";

const OTP_TTL_MS = 5 * 60 * 1000; // codes expire after 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // one send per phone per minute
const MAX_ATTEMPTS = 5;

const hash = (code: string) => createHash("sha256").update(code).digest("hex");

export type SendOtpResult =
  | { ok: true; devCode?: string }
  | { ok: false; error: "cooldown"; retryAfterSeconds: number };

/** Generates, stores and "sends" a checkout OTP for a normalized phone. */
export async function sendOrderOtp(phone: string): Promise<SendOtpResult> {
  const latest = await prisma.orderOtp.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
  });
  if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    return {
      ok: false,
      error: "cooldown",
      retryAfterSeconds: Math.ceil(
        (RESEND_COOLDOWN_MS - (Date.now() - latest.createdAt.getTime())) / 1000
      ),
    };
  }

  const code = randomInt(100000, 1000000).toString();
  await prisma.$transaction([
    prisma.orderOtp.deleteMany({ where: { phone } }),
    prisma.orderOtp.create({
      data: {
        phone,
        codeHash: hash(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    }),
  ]);
  await sendWhatsAppOtp(phone, code);

  return {
    ok: true,
    // surfaced in dev only so the flow is testable without a real provider
    ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
  };
}

export type VerifyOtpResult =
  | { ok: true }
  | { ok: false; error: "otpExpired" | "otpInvalid" | "otpTooManyAttempts" };

/** Checks a submitted code; marks it consumed on success. */
export async function verifyOrderOtp(phone: string, code: string): Promise<VerifyOtpResult> {
  const record = await prisma.orderOtp.findFirst({
    where: { phone, verifiedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!record || record.expiresAt < new Date()) {
    return { ok: false, error: "otpExpired" };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "otpTooManyAttempts" };
  }
  if (record.codeHash !== hash(code.trim())) {
    await prisma.orderOtp.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "otpInvalid" };
  }
  await prisma.orderOtp.update({
    where: { id: record.id },
    data: { verifiedAt: new Date() },
  });
  return { ok: true };
}
