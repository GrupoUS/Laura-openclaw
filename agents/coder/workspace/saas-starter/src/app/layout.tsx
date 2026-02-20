import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "SaaS Starter | Launch Your Product Fast",
    template: "%s | SaaS Starter",
  },
  description: "The complete Next.js starter kit with Auth, Payments, and Database pre-configured.",
  keywords: ["saas", "nextjs", "starter kit", "stripe", "prisma", "authjs"],
  authors: [{ name: "OpenClaw" }],
  creator: "OpenClaw",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://saas-starter.example.com",
    title: "SaaS Starter",
    description: "Launch your SaaS in minutes, not months.",
    siteName: "SaaS Starter",
  },
  twitter: {
    card: "summary_large_image",
    title: "SaaS Starter",
    description: "Launch your SaaS in minutes, not months.",
    creator: "@openclaw",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
