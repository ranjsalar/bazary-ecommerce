import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema, fieldErrors } from "@/lib/validation";
import { TOKEN_TYPES } from "@/lib/constants";
import { sendVerificationCode, isDev } from "@/lib/mock-mail";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
    }
    const { name, email, phone, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { errors: { email: "errors.emailExists" } },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, phone, passwordHash, role: "CUSTOMER" },
    });

    // 6-digit email verification code (mock delivery)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.authToken.create({
      data: {
        userId: user.id,
        type: TOKEN_TYPES.VERIFY_EMAIL,
        token: code,
        expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 min
      },
    });
    sendVerificationCode(email, code);

    return NextResponse.json({
      ok: true,
      email,
      // surfaced in dev only so the flow is testable without a mail provider
      ...(isDev ? { devCode: code } : {}),
    });
  } catch (e) {
    console.error("register error", e);
    return NextResponse.json(
      { errors: { _form: "common.somethingWrong" } },
      { status: 500 }
    );
  }
}
