import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema, fieldErrors } from "@/lib/validation";
import { TOKEN_TYPES } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const parsed = resetPasswordSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
    }
    const { token, password } = parsed.data;

    const record = await prisma.authToken.findUnique({ where: { token } });
    if (
      !record ||
      record.type !== TOKEN_TYPES.PASSWORD_RESET ||
      record.expiresAt < new Date()
    ) {
      return NextResponse.json(
        { errors: { _form: "errors.resetInvalid" } },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.authToken.deleteMany({
        where: { userId: record.userId, type: TOKEN_TYPES.PASSWORD_RESET },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("reset-password error", e);
    return NextResponse.json(
      { errors: { _form: "common.somethingWrong" } },
      { status: 500 }
    );
  }
}
