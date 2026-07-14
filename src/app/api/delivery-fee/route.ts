import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Looks up the delivery fee for a city. Returns { available: false } when the
// city has no active fee configured — checkout must block in that case rather
// than silently charging 0.
export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city")?.trim();
  if (!city) {
    return NextResponse.json({ error: "city is required" }, { status: 400 });
  }

  const record = await prisma.deliveryFee.findUnique({ where: { city } });
  if (!record || !record.active) {
    return NextResponse.json({ available: false, city });
  }
  return NextResponse.json({ available: true, city, fee: record.fee });
}
