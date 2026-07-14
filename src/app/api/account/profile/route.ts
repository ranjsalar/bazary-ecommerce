import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { profileSchema, fieldErrors } from "@/lib/validation";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ errors: { _form: "errors.notSignedIn" } }, { status: 401 });
  }
  try {
    const parsed = profileSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name, phone: parsed.data.phone },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("profile update error", e);
    return NextResponse.json(
      { errors: { _form: "common.somethingWrong" } },
      { status: 500 }
    );
  }
}
