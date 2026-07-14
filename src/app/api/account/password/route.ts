import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { fieldErrors } from "@/lib/validation";

const schema = z.object({
  current: z.string().min(1, "errors.currentPasswordRequired"),
  password: z.string().min(8, "errors.passwordMin").max(100),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ errors: { _form: "errors.notSignedIn" } }, { status: 401 });
  }
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || !(await bcrypt.compare(parsed.data.current, user.passwordHash))) {
      return NextResponse.json(
        { errors: { current: "errors.currentPasswordWrong" } },
        { status: 400 }
      );
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(parsed.data.password, 10) },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("password change error", e);
    return NextResponse.json(
      { errors: { _form: "common.somethingWrong" } },
      { status: 500 }
    );
  }
}
