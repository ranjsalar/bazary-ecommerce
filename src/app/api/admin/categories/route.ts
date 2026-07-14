import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { categorySchema, fieldErrors } from "@/lib/validation";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ errors: { _form: "errors.forbidden" } }, { status: 403 });
  }
  try {
    const parsed = categorySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
    }
    const slug = slugify(parsed.data.name);
    const existing = await prisma.category.findFirst({
      where: { OR: [{ slug }, { name: parsed.data.name }] },
    });
    if (existing) {
      return NextResponse.json(
        { errors: { name: "admin.products.categoryExists" } },
        { status: 409 }
      );
    }
    const category = await prisma.category.create({
      data: { name: parsed.data.name, slug },
    });
    return NextResponse.json({ ok: true, category });
  } catch (e) {
    console.error("category create error", e);
    return NextResponse.json({ errors: { _form: "admin.fees.couldNotSaveFee" } }, { status: 500 });
  }
}
