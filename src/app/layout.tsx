import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Ethiopic } from "next/font/google";
import "./globals.css";
import { resolveLocale } from "@/i18n/server";
import { I18nProvider } from "@/i18n/provider";
import { isEthiopicLocale } from "@/i18n/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoEthiopic = Noto_Sans_Ethiopic({
  variable: "--font-ethiopic",
  subsets: ["ethiopic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EthioBudget Tracker",
  description:
    "Plan and monitor your monthly income and expenses, designed for Ethiopian users. Track manual entries or forward telebirr/bank SMS messages to a Telegram bot.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Look up the logged-in user's preferred locale (if any) so first-time
  // visits without a cookie still respect their choice. The explicit cookie
  // (set by LocaleSwitcher) always wins inside resolveLocale.
  let userPreferredLocale: string | null = null;
  try {
    const { getCurrentUser } = await import("@/lib/auth");
    const user = await getCurrentUser();
    userPreferredLocale = user?.preferredLocale ?? null;
  } catch {
    /* unauthenticated — that's fine */
  }
  const locale = await resolveLocale({ userPreferredLocale });

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${notoEthiopic.variable} h-full antialiased`}
      data-locale={locale}
      data-script={isEthiopicLocale(locale) ? "ethiopic" : "latin"}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
