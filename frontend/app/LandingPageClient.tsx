"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Cpu,
  FilePenLine,
  FileText,
  Github,
  Globe,
  Layers,
  Menu,
  Moon,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Telescope,
  X,
  Zap,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const up = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: EASE },
});

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.55, delay, ease: EASE },
});

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};

const fadeItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

const agents = [
  {
    step: "01",
    title: "The Researcher",
    subtitle: "Web Intelligence & Retrieval",
    desc: "Autonomous live web intelligence engine. Formulates targeted search queries, pulls primary sources via Tavily, and filters high-confidence factual evidence.",
    icon: Telescope,
    tag: "Tavily Search Engine",
    capabilities: ["Autonomous Query Planning", "Primary Source Filtering", "Real-Time Web Scraping"],
    statusSimulation: "Retrieved 8 authoritative sources in 1.4s",
  },
  {
    step: "02",
    title: "The Writer",
    subtitle: "Structured Synthesis & Briefing",
    desc: "High-throughput LLM synthesis unit. Organizes chaotic multi-source research into an executive-grade Markdown dossier complete with structured findings and citations.",
    icon: FilePenLine,
    tag: "LangGraph Synthesis",
    capabilities: ["Executive Summary Extraction", "Multi-Source Re-ranking", "Strict Markdown Formatting"],
    statusSimulation: "Synthesizing 2,400-word structured dossier",
  },
  {
    step: "03",
    title: "The Critic",
    subtitle: "Verification & Quality Assurance",
    desc: "Rigorous adversarial evaluator. Cross-references assertions against retrieved URLs, removes ungrounded extrapolations, and guarantees zero-hallucination fidelity.",
    icon: ShieldCheck,
    tag: "Factual QA & Audit",
    capabilities: ["Zero-Hallucination Audit", "Citation URL Verification", "Cyclic Revision Trigger"],
    statusSimulation: "100% assertions verified against primary citations",
  },
];

const features = [
  {
    icon: Layers,
    title: "LangGraph Multi-Agent State Machine",
    desc: "Cyclic multi-agent architecture where agents continuously critique and refine work until quality and factual thresholds are met.",
  },
  {
    icon: ShieldCheck,
    title: "Citation-Grounded Fact Verification",
    desc: "Every assertion maps directly to live indexed sources with clickable citations, preventing AI hallucinations.",
  },
  {
    icon: Zap,
    title: "Real-Time Streaming Protocol",
    desc: "Watch agent thoughts, search queries, and document generation stream live token-by-token with sub-second feedback.",
  },
  {
    icon: FileText,
    title: "Publication-Grade Markdown Reports",
    desc: "Produces cleanly formatted research documents with executive summaries, data tables, and formatted footnotes.",
  },
  {
    icon: RefreshCw,
    title: "Autonomous Self-Correction Loop",
    desc: "If the Critic identifies a weak argument or missing reference, the pipeline autonomously loops back to refine the draft.",
  },
  {
    icon: Brain,
    title: "Persistent Session Workspaces",
    desc: "Multi-session history preserved client-side with instant switching, custom naming, and export capabilities.",
  },
];

const stats = [
  { label: "Avg. research cycle", value: "~12s", icon: Zap, detail: "FastAPI + Groq ultra-low latency" },
  { label: "Primary citations / report", value: "6+", icon: Search, detail: "Direct authoritative links" },
  { label: "Autonomous agents", value: "3 Coordinated", icon: Brain, detail: "Researcher, Writer & Critic" },
  { label: "Web retrieval", value: "Live Tavily", icon: Globe, detail: "Zero training-cutoff limitations" },
];

const steps = [
  {
    n: "01",
    phase: "Input",
    title: "Formulate Your Research Question",
    desc: "Input any complex inquiry, emerging market question, technical topic, or deep-dive analysis request.",
    icon: Search,
  },
  {
    n: "02",
    phase: "Retrieval",
    title: "Researcher Gathers Evidence",
    desc: "Autonomous queries query real-time web indexes to extract raw factual evidence and source citations.",
    icon: Telescope,
  },
  {
    n: "03",
    phase: "Synthesis",
    title: "Writer Generates Deep Report",
    desc: "The synthesized intelligence is organized into an executive summary, core analysis, and reference table.",
    icon: FilePenLine,
  },
  {
    n: "04",
    phase: "Verification",
    title: "Critic Audits & Finalizes",
    desc: "A dedicated adversarial pass verifies all assertions and removes unsupported claims before delivery.",
    icon: ShieldCheck,
  },
];

const techStack = [
  { name: "LangGraph", role: "Agent Orchestration" },
  { name: "FastAPI", role: "High-Performance Backend" },
  { name: "Next.js 14", role: "App Router Frontend" },
  { name: "Groq", role: "LPU Inference Acceleration" },
  { name: "Tavily", role: "Real-time AI Search" },
  { name: "Tailwind CSS", role: "Design Architecture" },
  { name: "Framer Motion", role: "Fluid Motion System" },
];

const navLinks = [
  { href: "#agents", label: "Agents" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#stack", label: "Tech Stack" },
];

const footerLinks = [
  { href: "/dashboard", label: "Research Workspace" },
  { href: "#agents", label: "Agent Pipeline" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "Architecture" },
  { href: "#stack", label: "Infrastructure" },
];

export default function LandingPageClient() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, toggleTheme, isMounted } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main
      className="min-h-screen transition-colors duration-200"
      style={{ background: "var(--card-bg)", color: "var(--c-900)" }}
    >
      {/* ── Skip to main content (accessibility) ── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        style={{ background: "var(--c-900)" }}
      >
        Skip to main content
      </a>

      {/* ── Navigation ── */}
      <nav
        className={`glass-nav sticky top-0 z-50 border-b transition-all duration-200 ${
          isScrolled ? "is-scrolled border-neutral-200" : "border-neutral-100"
        }`}
        aria-label="Main navigation"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-6">
          {/* Logo */}
          <Link href="/" aria-label="ScioAI home" className="group flex items-center gap-2.5">
            <motion.div
              whileHover={{ rotate: 8, scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl shadow-sm ring-1 ring-white/10"
              style={{ background: "var(--c-900)" }}
              aria-hidden="true"
            >
              <Sparkles size={16} className="text-white" />
            </motion.div>
            <span className="font-heading text-lg font-extrabold tracking-tight" style={{ color: "var(--c-900)" }}>
              ScioAI
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-1 md:flex" role="list">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                role="listitem"
                className="rounded-full px-3.5 py-1.5 text-sm font-medium transition-all hover:bg-neutral-100 hover:text-neutral-900"
                style={{ color: "var(--c-600)" }}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* CTA + theme toggle + hamburger */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {isMounted && (
              <button
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-xl border transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
                style={{ borderColor: "var(--c-200)", color: "var(--c-700)" }}
                aria-label={`Toggle to ${theme === "dark" ? "light" : "dark"} mode`}
                title="Toggle Light/Dark Theme"
              >
                {theme === "dark" ? (
                  <Sun size={16} />
                ) : (
                  <Moon size={16} />
                )}
              </button>
            )}

            <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }}>
              <Link
                href="/dashboard"
                className="btn-primary group hidden shadow-sm transition-all sm:inline-flex"
              >
                <span>Launch App</span>
                <ArrowRight
                  size={15}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </motion.div>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-xl border transition hover:bg-neutral-50 md:hidden"
              style={{ borderColor: "var(--c-200)" }}
              onClick={() => setMobileMenuOpen((p) => !p)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: EASE }}
              className="overflow-hidden border-t md:hidden"
              style={{ borderColor: "var(--c-200)", background: "#fff" }}
            >
              <nav
                className="flex flex-col gap-1.5 px-5 py-5"
                aria-label="Mobile navigation"
              >
                {navLinks.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-neutral-100"
                    style={{ color: "var(--c-800)" }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {l.label}
                  </a>
                ))}
                <div className="mt-3 flex flex-col gap-2 border-t pt-3" style={{ borderColor: "var(--c-200)" }}>
                  {isMounted && (
                    <button
                      onClick={toggleTheme}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium"
                      style={{
                        borderColor: "var(--c-200)",
                        background: "var(--card-bg)",
                        color: "var(--c-800)",
                      }}
                    >
                      <span>Appearance</span>
                      <span className="flex items-center gap-1.5 text-xs font-semibold">
                        {theme === "dark" ? (
                          <>
                            <Sun size={14} />
                            <span>Light Mode</span>
                          </>
                        ) : (
                          <>
                            <Moon size={14} />
                            <span>Dark Mode</span>
                          </>
                        )}
                      </span>
                    </button>
                  )}
                  <Link
                    href="/dashboard"
                    className="btn-primary w-full justify-center py-3 text-base shadow-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Launch App <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Hero Section ── */}
      <section
        id="main-content"
        className="hero-surface relative border-b px-5 pb-20 pt-16 sm:pb-28 sm:pt-24 lg:pb-32 lg:pt-28"
        style={{ borderColor: "var(--c-100)" }}
        aria-labelledby="hero-heading"
      >
        <div className="subtle-dot-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

        <div className="relative mx-auto max-w-5xl text-center">
          {/* Status Eyebrow Badge (No green dot) */}
          <motion.div {...up(0)} className="mb-5 inline-flex justify-center">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-2xs"
              style={{
                borderColor: "var(--c-200)",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                color: "var(--c-700)",
              }}
            >
              <span>Autonomous Multi-Agent Intelligence Engine</span>
              <span className="text-neutral-300">|</span>
              <span className="font-semibold text-neutral-900">LangGraph Powered</span>
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            id="hero-heading"
            {...up(0.08)}
            className="font-heading text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
            style={{ color: "var(--c-900)", lineHeight: 1.1 }}
          >
            Deep research,
            <br />
            <span className="gradient-text">fully autonomous.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            {...up(0.16)}
            className="mx-auto mt-5 max-w-2xl text-base leading-relaxed sm:text-lg"
            style={{ color: "var(--c-500)" }}
          >
            A coordinated pipeline of three AI agents works in sequence to investigate any topic,
            synthesize structured findings, and verify every claim against live primary sources.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            {...up(0.24)}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/dashboard"
                className="btn-primary group w-full px-8 py-3.5 text-base font-semibold shadow-md sm:w-auto"
              >
                <span>Start Researching</span>
                <ArrowRight
                  size={17}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </motion.div>

            <motion.a
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.18 }}
              href="#how-it-works"
              className="btn-ghost w-full px-8 py-3.5 text-base font-medium sm:w-auto"
            >
              Explore Architecture
            </motion.a>
          </motion.div>

          {/* Micro Guarantee Note */}
          <motion.p
            {...up(0.3)}
            className="mt-4 text-xs font-medium"
            style={{ color: "var(--c-400)" }}
          >
            No account required · Zero hallucination guarantee · Export to Markdown
          </motion.p>

          {/* ── High-End Interactive Research Preview Card ── */}
          <motion.div
            {...up(0.36)}
            className="relative mx-auto mt-14 max-w-4xl text-left"
          >
            <div
              className="relative overflow-hidden rounded-2xl border bg-white shadow-2xl transition-all"
              style={{ borderColor: "var(--c-200)" }}
            >
              {/* Mock Window Top Bar */}
              <div
                className="flex items-center justify-between border-b px-4 py-3 sm:px-6"
                style={{ borderColor: "var(--c-100)", background: "var(--c-50)" }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-neutral-300" />
                  <div className="h-3 w-3 rounded-full bg-neutral-300" />
                  <div className="h-3 w-3 rounded-full bg-neutral-300" />
                  <span className="ml-2 font-mono text-xs text-neutral-500">
                    scioai.workspace / session-842
                  </span>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="inline-flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-0.5 text-xs font-medium text-neutral-600 shadow-2xs">
                    3 Agents Synchronized
                  </span>
                </div>
              </div>

              {/* Mock Query Box */}
              <div className="border-b p-5 sm:p-6" style={{ borderColor: "var(--c-100)" }}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ background: "var(--c-900)" }}
                    >
                      <Search size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                        Active Inquest
                      </p>
                      <h2 className="font-heading text-base font-bold text-neutral-900 sm:text-lg">
                        Solid-state battery commercialization bottlenecks & timelines (2025–2030)
                      </h2>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 self-start rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 sm:self-center"
                  >
                    <span>Inspect live in app</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                {/* Agent Execution Flow Pipeline Pill Bar */}
                <div className="mt-4 flex flex-wrap items-center gap-2 pt-1">
                  <div className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700">
                    <CheckCircle2 size={13} className="text-neutral-900" />
                    <span>Researcher: 8 sources parsed</span>
                  </div>
                  <span className="text-xs text-neutral-300">→</span>
                  <div className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700">
                    <CheckCircle2 size={13} className="text-neutral-900" />
                    <span>Writer: Synthesized 4 sections</span>
                  </div>
                  <span className="text-xs text-neutral-300">→</span>
                  <div className="inline-flex items-center gap-1.5 rounded-md border border-neutral-900 bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white shadow-xs">
                    <Sparkles size={12} className="text-neutral-200" />
                    <span>Critic: Citations Verified</span>
                  </div>
                </div>
              </div>

              {/* Mock Synthesized Intelligence Content */}
              <div className="p-5 sm:p-6">
                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Executive Summary & Key Findings
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                      Solid-state battery (SSB) cell-level adoption is shifting from prototype testing to pilot-scale automotive runs. High-silicon anodes and sulfide-based electrolytes represent the leading path to achieving volumetric density exceeding 450 Wh/kg{" "}
                      <span className="rounded bg-neutral-200 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-neutral-800">
                        [1] Nature Energy
                      </span>
                      . Scaling production remains constrained by roll-to-roll electrolyte uniformity and interfacial impedance degradation{" "}
                      <span className="rounded bg-neutral-200 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-neutral-800">
                        [2] BloombergNEF
                      </span>
                      .
                    </p>
                  </div>

                  {/* Verification & Citation Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-3 text-xs">
                    <div className="flex items-center gap-2 text-neutral-500">
                      <span className="font-semibold text-neutral-800">Grounded References:</span>
                      <span className="rounded border border-neutral-200 px-2 py-0.5 text-neutral-600">
                        nature.com/articles/energy-ssb
                      </span>
                      <span className="hidden rounded border border-neutral-200 px-2 py-0.5 text-neutral-600 sm:inline">
                        bnef.com/insights/battery-2025
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1 font-medium text-neutral-700">
                      <CheckCircle2 size={13} />
                      <span>Zero unsupported claims detected</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats & Verification Proof ── */}
      <section
        className="border-b px-5 py-12"
        style={{ borderColor: "var(--c-100)", background: "var(--c-50)" }}
        aria-label="Platform performance metrics"
      >
        <div className="mx-auto max-w-5xl">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
          >
            {stats.map(({ label, value, icon: Icon, detail }) => (
              <motion.div
                key={label}
                variants={fadeItem}
                whileHover={{ y: -3, transition: { duration: 0.18 } }}
                className="hover-lift flex flex-col justify-between rounded-2xl border bg-white p-5 text-left shadow-xs"
                style={{ borderColor: "var(--c-200)" }}
              >
                <div>
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg border text-neutral-700"
                    style={{ borderColor: "var(--c-200)", background: "var(--c-50)" }}
                  >
                    <Icon size={18} aria-hidden="true" />
                  </div>
                  <p
                    className="font-heading mt-4 text-3xl font-black tracking-tight"
                    style={{ color: "var(--c-900)" }}
                  >
                    {value}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-800">{label}</p>
                </div>
                <p className="mt-3 border-t pt-2.5 text-xs text-neutral-400" style={{ borderColor: "var(--c-100)" }}>
                  {detail}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Multi-Agent Section (Core Identity) ── */}
      <section
        id="agents"
        className="border-b px-5 py-24 sm:py-32"
        style={{ borderColor: "var(--c-100)" }}
        aria-labelledby="agents-heading"
      >
        <div className="mx-auto max-w-6xl">
          <motion.div {...inView(0)} className="mb-16 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
              Coordinated Multi-Agent System
            </p>
            <h2
              id="agents-heading"
              className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl"
              style={{ color: "var(--c-900)" }}
            >
              Three specialized agents.
              <br />
              One collaborative intelligence.
            </h2>
            <p
              className="mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg"
              style={{ color: "var(--c-500)" }}
            >
              Traditional AI models generate answers in isolation. ScioAI assigns discrete responsibilities to three
              distinct agents working in sequence with validation loops.
            </p>
          </motion.div>

          {/* Desktop Visual Connector Indicator */}
          <div className="relative">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map(({ step, title, subtitle, desc, icon: Icon, tag, capabilities, statusSimulation }, i) => (
                <motion.article
                  key={title}
                  {...inView(i * 0.1)}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="hover-lift hover-glow card relative flex flex-col justify-between overflow-hidden p-7"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl border text-neutral-900 shadow-2xs"
                        style={{ borderColor: "var(--c-200)", background: "var(--c-50)" }}
                        aria-hidden="true"
                      >
                        <Icon size={24} />
                      </div>
                      <span className="font-mono text-sm font-bold text-neutral-400">
                        {step}
                      </span>
                    </div>

                    <div className="mt-5">
                      <span
                        className="inline-block rounded-md border px-2.5 py-0.5 text-xs font-semibold"
                        style={{ borderColor: "var(--c-200)", background: "var(--c-100)", color: "var(--c-700)" }}
                      >
                        {tag}
                      </span>
                      <h3
                        className="font-heading mt-3 text-xl font-bold tracking-tight"
                        style={{ color: "var(--c-900)" }}
                      >
                        {title}
                      </h3>
                      <p className="text-xs font-medium text-neutral-400">{subtitle}</p>
                      <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                        {desc}
                      </p>
                    </div>

                    {/* Capabilities List */}
                    <div className="mt-5 space-y-2 border-t pt-4" style={{ borderColor: "var(--c-100)" }}>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                        Core Capabilities
                      </p>
                      {capabilities.map((c) => (
                        <div key={c} className="flex items-center gap-2 text-xs text-neutral-700">
                          <CheckCircle2 size={13} className="shrink-0 text-neutral-900" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Micro Simulation Footer (No green dot) */}
                  <div
                    className="mt-6 rounded-xl border p-2.5"
                    style={{ borderColor: "var(--c-200)", background: "var(--c-50)" }}
                  >
                    <p className="font-mono text-[11px] text-neutral-600 truncate">{statusSimulation}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features / Capabilities Grid ── */}
      <section
        id="features"
        className="border-b px-5 py-24 sm:py-32"
        style={{ borderColor: "var(--c-100)", background: "var(--c-50)" }}
        aria-labelledby="features-grid-heading"
      >
        <div className="mx-auto max-w-6xl">
          <motion.div {...inView(0)} className="mb-16 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
              Platform Features
            </p>
            <h2
              id="features-grid-heading"
              className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl"
              style={{ color: "var(--c-900)" }}
            >
              Engineered for uncompromised accuracy.
            </h2>
            <p
              className="mx-auto mt-4 max-w-xl text-base leading-relaxed sm:text-lg text-neutral-500"
            >
              Every layer of ScioAI is built to eliminate hallucinations and deliver reliable, audit-ready intelligence.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={fadeItem}
                whileHover={{ y: -4, transition: { duration: 0.18 } }}
                className="hover-lift card flex flex-col justify-between p-7 bg-white"
              >
                <div>
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl border text-neutral-800"
                    style={{ borderColor: "var(--c-200)", background: "var(--c-50)" }}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 className="font-heading mt-5 text-base font-bold text-neutral-900">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                    {desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Process / How It Works ── */}
      <section
        id="how-it-works"
        className="border-b px-5 py-24 sm:py-32"
        style={{ borderColor: "var(--c-100)" }}
        aria-labelledby="how-it-works-heading"
      >
        <div className="mx-auto max-w-6xl">
          <motion.div {...inView(0)} className="mb-16 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
              Execution Pipeline
            </p>
            <h2
              id="how-it-works-heading"
              className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl"
              style={{ color: "var(--c-900)" }}
            >
              From prompt to publication in 4 phases.
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {steps.map(({ n, phase, title, desc, icon: Icon }) => (
              <motion.div
                key={n}
                variants={fadeItem}
                whileHover={{ y: -5, transition: { duration: 0.18 } }}
                className="hover-lift card relative flex flex-col justify-between p-6"
              >
                <div>
                  <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--c-100)" }}>
                    <span className="font-mono text-xs font-bold uppercase text-neutral-400">
                      Phase {n} · {phase}
                    </span>
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                      style={{ background: "var(--c-900)" }}
                    >
                      <Icon size={15} />
                    </div>
                  </div>
                  <h3 className="font-heading mt-4 text-base font-bold text-neutral-900">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                    {desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section
        id="stack"
        className="border-b px-5 py-20"
        style={{ borderColor: "var(--c-100)", background: "var(--c-50)" }}
        aria-labelledby="stack-heading"
      >
        <div className="mx-auto max-w-6xl text-center">
          <motion.div {...inView(0)} className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
              Modern Open Infrastructure
            </p>
            <h2
              id="stack-heading"
              className="mt-2 font-heading text-3xl font-extrabold sm:text-4xl"
              style={{ color: "var(--c-900)" }}
            >
              Enterprise-grade AI engineering stack.
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="flex flex-wrap justify-center gap-3.5"
          >
            {techStack.map(({ name, role }) => (
              <motion.div
                key={name}
                variants={fadeItem}
                whileHover={{ y: -2, transition: { duration: 0.16 } }}
                className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 shadow-2xs"
                style={{ borderColor: "var(--c-200)" }}
              >
                <Cpu size={15} className="text-neutral-500" />
                <span className="text-sm font-bold text-neutral-900">{name}</span>
                <span className="text-xs text-neutral-300">•</span>
                <span className="text-xs text-neutral-500">{role}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── High-Impact Call-to-Action ── */}
      <section className="px-5 py-24 sm:py-32" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, ease: EASE }}
            className="relative overflow-hidden rounded-3xl p-10 text-center sm:p-16 shadow-xl"
            style={{ background: "var(--c-950)", color: "#fff" }}
          >
            {/* Subtle ambient lighting */}
            <div
              className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full opacity-20 blur-3xl"
              style={{ background: "#ffffff" }}
            />
            <div
              className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full opacity-15 blur-3xl"
              style={{ background: "var(--c-500)" }}
            />

            <div className="relative z-10 mx-auto max-w-2xl">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                <Sparkles size={22} className="text-white" />
              </div>
              <h2
                id="cta-heading"
                className="font-heading text-3xl font-black tracking-tight sm:text-5xl"
                style={{ color: "#fff" }}
              >
                Accelerate your research today.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-neutral-300 sm:text-lg">
                Enter any question and let our multi-agent pipeline formulate, synthesize, and verify a complete report.
                Zero setup required.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-neutral-950 shadow-md transition hover:bg-neutral-100"
                >
                  <span>Launch Workspace</span>
                  <ArrowRight
                    size={17}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-8 py-3.5 text-base font-medium text-white transition hover:bg-white/10"
                >
                  Review Pipeline
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="border-t px-5 py-12"
        style={{ borderColor: "var(--c-200)", background: "var(--c-50)" }}
        aria-label="Site footer"
      >
        <div className="mx-auto max-w-6xl">
          {/* Top row */}
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            {/* Brand */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 font-bold text-neutral-900">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-white"
                  style={{ background: "var(--c-900)" }}
                >
                  <Sparkles size={12} />
                </div>
                <span>ScioAI</span>
              </div>
              <p className="max-w-xs text-sm text-neutral-500">
                Autonomous deep research platform powered by LangGraph, FastAPI, and Groq.
              </p>
              <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
                <span>All Agent Systems Operational</span>
              </div>
            </div>

            {/* Footer Navigation */}
            <nav aria-label="Footer navigation">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                Navigation
              </p>
              <ul className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                {footerLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Bottom row */}
          <div
            className="mt-10 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: "var(--c-200)" }}
          >
            <p className="text-xs text-neutral-400">
              &copy; {new Date().getFullYear()} ScioAI Platform. Autonomous Multi-Agent Research.
            </p>
            <div className="flex items-center gap-5">
              <a
                href="https://github.com"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 transition hover:text-neutral-900"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ScioAI on GitHub (opens in new tab)"
              >
                <Github size={15} aria-hidden="true" />
                <span>GitHub Repository</span>
              </a>
              <span className="text-xs text-neutral-300">•</span>
              <p className="text-xs text-neutral-400">
                LangGraph · Groq · FastAPI · Next.js
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
