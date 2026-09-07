// Dashboard layout with metadata – server component wrapper
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research Workspace",
  description:
    "ScioAI research workspace. Ask a question and let the AI agents research the web, synthesise evidence, and deliver a citation-grounded report.",
  // Exclude the app workspace from search engine indexing
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  alternates: {
    canonical: "https://scioai.up.railway.app/dashboard",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
