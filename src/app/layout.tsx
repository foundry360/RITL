import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import { getStripePricing } from "@/lib/stripe/fetch-prices";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Functional Coffee | Focus. Clarity. Performance.",
  description:
    "Premium functional coffee and matcha for cognitive wellness. Clean energy, mental clarity, and daily performance ritual optimization.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialPricing = await getStripePricing();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-near-black text-text-primary">
        <Providers initialPricing={initialPricing}>{children}</Providers>
      </body>
    </html>
  );
}
