import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "ScioAI | Research Agent",
  description: "Phase 1 ScioAI chat workspace",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${manrope.variable}`}>{children}</body>
    </html>
  );
}
