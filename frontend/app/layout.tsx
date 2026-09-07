// Root layout – ScioAI Frontend
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// ── Google Font ─────────────────────────────────────────────────────────────
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  // Only load weights we actually use — reduces bundle size
  weight: ["400", "500", "600", "700", "800"],
});

// ── Site constants ──────────────────────────────────────────────────────────
const SITE_URL = "https://scioai.up.railway.app";
const SITE_NAME = "ScioAI";
const DEFAULT_TITLE = "ScioAI – Autonomous Research Platform";
const DEFAULT_DESCRIPTION =
  "ScioAI deploys a coordinated team of AI agents — Researcher, Writer, and Critic — to produce citation-grounded, objective research reports in seconds.";

// ── Root metadata ────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: DEFAULT_TITLE,
    template: "%s – ScioAI",
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "AI research platform",
    "autonomous research agents",
    "LangGraph",
    "multi-agent AI",
    "Groq",
    "Tavily search",
    "AI report generation",
    "research automation",
  ],
  authors: [{ name: "ScioAI" }],
  creator: "ScioAI",
  publisher: "ScioAI",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  // ── Open Graph ──────────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ScioAI – Autonomous Research Platform powered by multi-agent AI",
      },
    ],
  },
  // ── Twitter / X ─────────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  // ── Icons ────────────────────────────────────────────────────────────────
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
    other: [
      { rel: "manifest", url: "/site.webmanifest" },
    ],
  },
  // ── Alternate ────────────────────────────────────────────────────────────
  alternates: {
    canonical: SITE_URL,
  },
};

// ── Viewport ─────────────────────────────────────────────────────────────────
export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
