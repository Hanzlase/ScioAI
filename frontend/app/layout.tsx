import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScioAI – Autonomous Research Platform",
  description:
    "ScioAI orchestrates specialized AI agents across web intelligence and critical review to produce citation-grounded research reports.",
  keywords: ["AI research", "LangGraph", "multi-agent", "Groq", "Tavily"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
