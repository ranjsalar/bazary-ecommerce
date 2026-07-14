import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { requireAdmin } from "@/lib/auth";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Dev-friendly local upload to public/uploads. For production behind a CDN,
// swap this handler's storage for S3/R2 — the response contract ({ url })
// stays the same.
export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "errors.forbidden" }, { status: 403 });
  }
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP or GIF images are allowed" },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 400 });
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/gif" ? "gif" : "jpg";
    const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({ url: `/uploads/${name}` });
  } catch (e) {
    console.error("upload error", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
