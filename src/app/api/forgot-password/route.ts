import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validation";
import { TOKEN_TYPES } from "@/lib/constants";
import { sendPasswordResetLink, isDev } from "@/lib/mock-mail";

export async function POST(req: Request) {
  try {
    const parsed = forgotPasswordSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "errors.emailInvalid" }, { status: 400 });
    }
    const { email } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    // Always respond ok — don't reveal whether the email is registered.
    if (!user) return NextResponse.json({ ok: true });

    const token = randomBytes(32).toString("hex");
    await prisma.authToken.deleteMany({
      where: { userId: user.id, type: TOKEN_TYPES.PASSWORD_RESET },
    });
    await prisma.authToken.create({
      data: {
        userId: user.id,
        type: TOKEN_TYPES.PASSWORD_RESET,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
      },
    });

    const url = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    sendPasswordResetLink(email, url);

    return NextResponse.json({ ok: true, ...(isDev ? { devResetUrl: url } : {}) });
  } catch (e) {
    console.error("forgot-password error", e);
    return NextResponse.json({ error: "common.somethingWrong" }, { status: 500 });
  }
}
