import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { productSchema, fieldErrors } from "@/lib/validation";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ errors: { _form: "errors.forbidden" } }, { status: 403 });
  }
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
    }
    const images: string[] | undefined = Array.isArray(body.images)
      ? body.images.filter(Boolean)
      : undefined;

    await prisma.product.update({
      where: { id },
      data: {
        ...parsed.data,
        compareAt: parsed.data.compareAt || null,
        ...(images
          ? {
              images: {
                deleteMany: {},
                create: images.map((url, i) => ({ url, sort: i, alt: parsed.data.name })),
              },
            }
          : {}),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("product update error", e);
    return NextResponse.json({ errors: { _form: "admin.products.couldNotSave" } }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ errors: { _form: "errors.forbidden" } }, { status: 403 });
  }
  try {
    const { id } = await ctx.params;
    // Order items keep a snapshot and their productId becomes null (SetNull),
    // so deleting a product never breaks order history.
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("product delete error", e);
    return NextResponse.json({ errors: { _form: "admin.products.couldNotDelete" } }, { status: 500 });
  }
}
