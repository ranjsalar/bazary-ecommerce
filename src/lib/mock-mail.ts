// Mock message delivery. Replace with a real email/SMS/WhatsApp provider later —
// everything else already goes through these two functions.

export function sendVerificationCode(to: string, code: string) {
  console.log(`\n[MOCK MAIL] Verification code for ${to}: ${code}\n`);
}

export function sendPasswordResetLink(to: string, url: string) {
  console.log(`\n[MOCK MAIL] Password reset link for ${to}: ${url}\n`);
}

/** In dev we surface tokens to the UI so the flows are testable without a mail provider. */
export const isDev = process.env.NODE_ENV !== "production";
