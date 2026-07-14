import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { productSchema, fieldErrors } from "@/lib/validation";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function uniqueSlug(name: string, excludeId?: string) {
  const base = slugify(name) || "product";
  let slug = base;
  for (let i = 2; ; i++) {
    const clash = await prisma.product.findUnique({ where: { slug } });
    if (!clash || clash.id === excludeId) return slug;
    slug = `${base}-${i}`;
  }
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ errors: { _form: "errors.forbidden" } }, { status: 403 });
  }
  try {
    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
    }
    const images: string[] = Array.isArray(body.images) ? body.images.filter(Boolean) : [];

    const product = await prisma.product.create({
      data: {
        ...parsed.data,
        compareAt: parsed.data.compareAt || null,
        slug: await uniqueSlug(parsed.data.name),
        images: {
          create: images.map((url, i) => ({ url, sort: i, alt: parsed.data.name })),
        },
      },
    });
    return NextResponse.json({ ok: true, id: product.id });
  } catch (e) {
    console.error("product create error", e);
    return NextResponse.json({ errors: { _form: "admin.products.couldNotSave" } }, { status: 500 });
  }
}
