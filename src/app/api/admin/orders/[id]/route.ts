import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/constants";

const schema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "errors.forbidden" }, { status: 403 });
  }
  try {
    const { id } = await ctx.params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "admin.orders.couldNotUpdate" }, { status: 400 });
    }
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: parsed.data.status,
        // COD: mark as paid when delivered
        ...(parsed.data.status === "DELIVERED" ? { paymentStatus: "PAID" } : {}),
      },
    });
    return NextResponse.json({ ok: true, status: order.status });
  } catch (e) {
    console.error("order status update error", e);
    return NextResponse.json({ error: "admin.orders.couldNotUpdate" }, { status: 500 });
  }
}
