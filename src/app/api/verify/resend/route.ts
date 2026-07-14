import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { TOKEN_TYPES } from "@/lib/constants";
import { sendVerificationCode, isDev } from "@/lib/mock-mail";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

const RESEND_COOLDOWN_MS = 60 * 1000;

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "errors.emailInvalid" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    // Don't reveal whether the email is registered; pretend we sent it.
    if (!user || user.emailVerified) return NextResponse.json({ ok: true });

    const latest = await prisma.authToken.findFirst({
      where: { userId: user.id, type: TOKEN_TYPES.VERIFY_EMAIL },
      orderBy: { createdAt: "desc" },
    });
    if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil(
        (RESEND_COOLDOWN_MS - (Date.now() - latest.createdAt.getTime())) / 1000
      );
      return NextResponse.json(
        { error: `errors.waitBeforeResend|s=${wait}` },
        { status: 429 }
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.$transaction([
      prisma.authToken.deleteMany({
        where: { userId: user.id, type: TOKEN_TYPES.VERIFY_EMAIL },
      }),
      prisma.authToken.create({
        data: {
          userId: user.id,
          type: TOKEN_TYPES.VERIFY_EMAIL,
          token: code,
          expiresAt: new Date(Date.now() + 1000 * 60 * 30),
        },
      }),
    ]);
    sendVerificationCode(user.email, code);

    return NextResponse.json({ ok: true, ...(isDev ? { devCode: code } : {}) });
  } catch (e) {
    console.error("verify resend error", e);
    return NextResponse.json({ error: "common.somethingWrong" }, { status: 500 });
  }
}
