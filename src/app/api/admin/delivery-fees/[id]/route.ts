import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { deliveryFeeSchema, fieldErrors } from "@/lib/validation";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ errors: { _form: "errors.forbidden" } }, { status: 403 });
  }
  try {
    const { id } = await ctx.params;
    const parsed = deliveryFeeSchema.partial().safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
    }
    const fee = await prisma.deliveryFee.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ ok: true, fee });
  } catch (e) {
    console.error("delivery fee update error", e);
    return NextResponse.json({ errors: { _form: "admin.fees.couldNotSaveFee" } }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ errors: { _form: "errors.forbidden" } }, { status: 403 });
  }
  try {
    const { id } = await ctx.params;
    await prisma.deliveryFee.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("delivery fee delete error", e);
    return NextResponse.json({ errors: { _form: "admin.fees.couldNotDeleteFee" } }, { status: 500 });
  }
}
