import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = { title: { default: "Admin", template: "%s | Admin" } };

// Role-gated: everything under /admin requires an ADMIN session. API routes
// are separately protected by requireAdmin() — this is defense in the UI.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  return <AdminShell userName={session.user.name ?? "Admin"}>{children}</AdminShell>;
}
