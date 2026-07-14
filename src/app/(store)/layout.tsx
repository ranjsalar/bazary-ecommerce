import { ReactNode } from "react";
import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
      <Footer />
    </>
  );
}
