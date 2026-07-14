import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Liveness + readiness probe: verifies the process is serving requests and
// the database connection is alive. Must never be cached.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "up" });
  } catch {
    return NextResponse.json(
      { status: "error", database: "down" },
      { status: 500 }
    );
  }
}
