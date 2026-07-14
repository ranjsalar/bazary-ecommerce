import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { deliveryFeeSchema, fieldErrors } from "@/lib/validation";

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ errors: { _form: "errors.forbidden" } }, { status: 403 });
  }
  try {
    const parsed = deliveryFeeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
    }
    const existing = await prisma.deliveryFee.findUnique({
      where: { city: parsed.data.city },
    });
    if (existing) {
      return NextResponse.json(
        { errors: { city: "admin.fees.alreadyExists" } },
        { status: 409 }
      );
    }
    const fee = await prisma.deliveryFee.create({ data: parsed.data });
    return NextResponse.json({ ok: true, fee });
  } catch (e) {
    console.error("delivery fee create error", e);
    return NextResponse.json({ errors: { _form: "admin.fees.couldNotSaveFee" } }, { status: 500 });
  }
}
