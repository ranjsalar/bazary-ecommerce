import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import { getI18n } from "@/i18n/server";
import { LOCALE_DIR } from "@/i18n/config";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Arabic-script coverage for Kurdish Sorani and Arabic UI text.
const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Bazary.iq — Shop across Iraq & Kurdistan",
    template: "%s | Bazary.iq",
  },
  description:
    "Online shopping with delivery to every city in Iraq and the Kurdistan Region. Cash on delivery.",
};

// Applies the saved (or system) theme before first paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, dict } = await getI18n();

  return (
    <html
      lang={locale}
      dir={LOCALE_DIR[locale]}
      className={`${geistSans.variable} ${geistMono.variable} ${notoArabic.variable} h-full antialiased`}
      // data-theme is set by the inline script before hydration
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Providers locale={locale} dict={dict}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
