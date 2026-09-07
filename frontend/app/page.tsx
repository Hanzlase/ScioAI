// ScioAI Landing Page - Autonomous Deep Research Platform
import type { Metadata } from "next";
import LandingPageClient from "./LandingPageClient";

// ── Page-level metadata (server component) ───────────────────────────────────
export const metadata: Metadata = {
  title: "ScioAI – Autonomous Research Platform",
  description:
    "ScioAI deploys a coordinated team of AI agents — Researcher, Writer, and Critic — to produce citation-grounded, objective research reports in seconds. Powered by LangGraph, Groq, and Tavily.",
  alternates: {
    canonical: "https://scioai.up.railway.app/",
  },
  openGraph: {
    title: "ScioAI – Autonomous Research Platform",
    description:
      "Deploy AI research agents that search the web, synthesise evidence, and deliver citation-grounded reports in ~12 seconds.",
    url: "https://scioai.up.railway.app/",
    type: "website",
  },
};

// Structured data (JSON-LD)
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://scioai.up.railway.app/#website",
      url: "https://scioai.up.railway.app/",
      name: "ScioAI",
      description:
        "Autonomous research platform that deploys AI agents to produce citation-grounded reports.",
      inLanguage: "en-US",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://scioai.up.railway.app/dashboard",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://scioai.up.railway.app/#app",
      name: "ScioAI",
      url: "https://scioai.up.railway.app/",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Multi-agent AI research platform. Ask a question and receive a structured, citation-grounded research report in seconds.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Real-time web search via Tavily",
        "Multi-agent LangGraph pipeline",
        "Citation-grounded Markdown reports",
        "PDF report export",
        "Persistent multi-session workspace",
      ],
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingPageClient />
    </>
  );
}
