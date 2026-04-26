import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ScioAI – Autonomous Research Platform",
  description:
    "ScioAI orchestrates specialized AI agents across web intelligence, vector memory, and critical review to produce citation-grounded research reports.",
  keywords: ["AI research", "LangGraph", "multi-agent", "Groq", "Pinecone", "Tavily"],
  openGraph: {
    title: "ScioAI – Autonomous Research Platform",
    description: "Multi-agent AI research platform powered by LangGraph, Groq, and Pinecone.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} ${plusJakarta.variable} h-full antialiased`}>
        {children}
      </body>
    </html>
  );
}
