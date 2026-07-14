import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { TOKEN_TYPES } from "@/lib/constants";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().length(6, "Enter the 6-digit code"),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "errors.enterCode6" }, { status: 400 });
    }
    const { email, code } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "errors.invalidCode" }, { status: 400 });
    }

    const token = await prisma.authToken.findFirst({
      where: {
        userId: user.id,
        type: TOKEN_TYPES.VERIFY_EMAIL,
        token: code,
        expiresAt: { gt: new Date() },
      },
    });
    if (!token) {
      return NextResponse.json({ error: "errors.invalidOrExpiredCode" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } }),
      prisma.authToken.deleteMany({
        where: { userId: user.id, type: TOKEN_TYPES.VERIFY_EMAIL },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("verify error", e);
    return NextResponse.json({ error: "common.somethingWrong" }, { status: 500 });
  }
}
