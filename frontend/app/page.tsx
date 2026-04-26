"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  ArrowRight, Brain, Database, FilePenLine,
  Globe, Menu, Search, ShieldCheck, Sparkles, Telescope, X, Zap,
} from "lucide-react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const up = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: EASE },
});
const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-30px" },
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
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

const agents = [
  { title: "The Researcher", desc: "Scours live web intelligence via Tavily and retrieves contextual chunks from your Pinecone vector store.", icon: Telescope, tag: "Web · Vector" },
  { title: "The Writer",     desc: "Synthesizes all evidence into a structured Markdown report — executive summary, findings, analysis, citations.", icon: FilePenLine, tag: "LLM Synthesis" },
  { title: "The Critic",     desc: "Reviews every draft: verifies citations, removes unsupported claims, enforces objective tone before delivery.", icon: ShieldCheck, tag: "QA · Review" },
  { title: "Shared Memory",  desc: "Pinecone vector retrieval enriches every query with semantically relevant document chunks beyond live search.", icon: Database, tag: "Vector DB" },
];

const stats = [
  { label: "Avg. response", value: "~12s",       icon: Zap },
  { label: "Sources / query", value: "6+",        icon: Search },
  { label: "Agent pipeline",  value: "3 agents",  icon: Brain },
  { label: "Search",          value: "Real-time", icon: Globe },
];

const steps = [
  { n: "01", title: "You ask a question",        desc: "Enter any research topic. Sessions are persisted locally.", icon: Search },
  { n: "02", title: "Researcher gathers evidence", desc: "Tavily searches the web and Pinecone retrieves semantic document chunks.", icon: Telescope },
  { n: "03", title: "Writer drafts the report",  desc: "Llama 3.3 70B synthesizes evidence into a structured Markdown report with citations.", icon: FilePenLine },
  { n: "04", title: "Critic reviews & refines",  desc: "A second LLM pass verifies citations and ensures objective, accurate output.", icon: ShieldCheck },
];

const navLinks = [
  { href: "#features",      label: "Features" },
  { href: "#how-it-works",  label: "How it works" },
  { href: "#stack",         label: "Tech stack" },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white" style={{ color: "var(--c-900)" }}>

      {/* ── Nav ── */}
      <nav
        className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md"
        style={{ borderColor: "var(--c-200)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <motion.div
              whileHover={{ rotate: 6, scale: 1.04 }}
              transition={{ duration: 0.2 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "var(--c-900)" }}
            >
              <Sparkles size={16} className="text-white" />
            </motion.div>
            <span className="font-heading text-lg font-extrabold" style={{ color: "var(--c-900)" }}>ScioAI</span>
          </div>

          {/* Desktop links */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium transition-colors hover:opacity-70"
                style={{ color: "var(--c-600)" }}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* CTA + hamburger */}
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }}>
              <Link href="/dashboard" className="btn-primary hidden sm:inline-flex">
                Launch App <ArrowRight size={15} />
              </Link>
            </motion.div>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg border transition md:hidden"
              style={{ borderColor: "var(--c-200)" }}
              onClick={() => setMobileMenuOpen((p) => !p)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="overflow-hidden border-t md:hidden"
              style={{ borderColor: "var(--c-100)" }}
            >
              <div className="flex flex-col gap-1 px-5 py-4" style={{ background: "var(--c-50)" }}>
                {navLinks.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="py-2.5 text-base font-medium transition-colors"
                    style={{ color: "var(--c-700)" }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {l.label}
                  </a>
                ))}
                <Link href="/dashboard" className="btn-primary mt-2 w-full justify-center">
                  Launch App <ArrowRight size={15} />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Hero ── */}
      <section className="hero-surface border-b px-5 py-20 sm:py-28 lg:py-36" style={{ borderColor: "var(--c-100)" }}>
        <div className="mx-auto max-w-3xl text-center">
          <motion.div {...up(0)}>
            <span className="badge mb-6 inline-flex">
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--c-400)" }} />
              Autonomous Research · LangGraph + Groq
            </span>
          </motion.div>

          <motion.h1
            {...up(0.08)}
            className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
            style={{ color: "var(--c-900)", lineHeight: 1.1 }}
          >
            Deep research,<br />
            <span className="gradient-text">fully autonomous.</span>
          </motion.h1>

          <motion.p {...up(0.16)} className="mx-auto mt-6 max-w-xl text-lg leading-relaxed sm:text-xl" style={{ color: "var(--c-500)" }}>
            ScioAI deploys a coordinated team of AI agents — Researcher, Writer, Critic —
            to produce citation-grounded, objective reports in seconds.
          </motion.p>

          <motion.div {...up(0.24)} className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }} className="w-full sm:w-auto">
              <Link href="/dashboard" className="btn-primary w-full px-8 py-3.5 text-base sm:w-auto">
                Start Researching <ArrowRight size={18} />
              </Link>
            </motion.div>
            <motion.a
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              href="#how-it-works"
              className="btn-ghost w-full px-8 py-3.5 text-base sm:w-auto"
            >
              How it works
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-b px-5 py-10" style={{ borderColor: "var(--c-100)", background: "var(--c-50)" }}>
        <div className="mx-auto max-w-4xl">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl lg:grid-cols-4"
            style={{ background: "var(--c-200)" }}
          >
            {stats.map(({ label, value, icon: Icon }) => (
              <motion.div
                key={label}
                variants={fadeItem}
                whileHover={{ y: -3, transition: { duration: 0.18 } }}
                className="flex flex-col items-center gap-2 px-6 py-8 text-center"
                style={{ background: "#fff" }}
              >
                <Icon size={18} style={{ color: "var(--c-400)" }} />
                <p className="font-heading text-2xl font-extrabold sm:text-3xl" style={{ color: "var(--c-900)" }}>{value}</p>
                <p className="text-sm" style={{ color: "var(--c-500)" }}>{label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Agents ── */}
      <section id="features" className="border-b px-5 py-20" style={{ borderColor: "var(--c-100)" }}>
        <div className="mx-auto max-w-6xl">
          <motion.div {...inView(0)} className="mb-12">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--c-400)" }}>The multi-agent pipeline</p>
            <h2 className="mt-2 font-heading text-3xl font-extrabold sm:text-4xl" style={{ color: "var(--c-900)" }}>
              Three agents. One workflow.
            </h2>
            <p className="mt-3 max-w-lg text-base leading-relaxed sm:text-lg" style={{ color: "var(--c-500)" }}>
              Each agent has a distinct, specialized role, handing off work in sequence.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {agents.map(({ title, desc, icon: Icon, tag }, i) => (
              <motion.article
                key={title}
                {...inView(i * 0.08)}
                whileHover={{ y: -6, transition: { duration: 0.18 } }}
                className="card hover-lift hover-glow flex flex-col gap-4 p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border" style={{ borderColor: "var(--c-200)", background: "var(--c-50)", color: "var(--c-700)" }}>
                  <Icon size={22} />
                </div>
                <div>
                  <span className="badge-muted mb-2 inline-flex">{tag}</span>
                  <h3 className="font-heading text-base font-bold" style={{ color: "var(--c-900)" }}>{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--c-500)" }}>{desc}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="border-b px-5 py-20" style={{ borderColor: "var(--c-100)", background: "var(--c-50)" }}>
        <div className="mx-auto max-w-6xl">
          <motion.div {...inView(0)} className="mb-12">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--c-400)" }}>Workflow</p>
            <h2 className="mt-2 font-heading text-3xl font-extrabold sm:text-4xl" style={{ color: "var(--c-900)" }}>
              From query to report in seconds.
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {steps.map(({ n, title, desc, icon: Icon }) => (
              <motion.div
                key={n}
                variants={fadeItem}
                whileHover={{ y: -6, transition: { duration: 0.18 } }}
                className="card hover-lift hover-glow p-6"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="font-heading text-sm font-bold" style={{ color: "var(--c-300)" }}>{n}</span>
                  <motion.div
                    whileHover={{ rotate: -6, scale: 1.02 }}
                    transition={{ duration: 0.18 }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                    style={{ background: "var(--c-900)" }}
                  >
                    <Icon size={16} />
                  </motion.div>
                </div>
                <h3 className="font-heading text-base font-bold" style={{ color: "var(--c-900)" }}>{title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--c-500)" }}>{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Tech stack ── */}
      <section id="stack" className="border-b px-5 py-20" style={{ borderColor: "var(--c-100)" }}>
        <div className="mx-auto max-w-6xl">
          <motion.div {...inView(0)} className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--c-400)" }}>Powered by</p>
            <h2 className="mt-2 font-heading text-3xl font-extrabold sm:text-4xl" style={{ color: "var(--c-900)" }}>Best-in-class AI infrastructure.</h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="flex flex-wrap gap-3"
          >
            {[
              "Next.js 14",
              "FastAPI",
              "LangGraph",
              "Groq · Llama 3.3 70B",
              "Pinecone",
              "Tavily Search",
              "Tailwind CSS",
              "Framer Motion",
            ].map((t) => (
              <motion.span
                key={t}
                variants={fadeItem}
                whileHover={{ y: -2, transition: { duration: 0.16 } }}
                className="rounded-lg border px-4 py-2 text-sm font-medium"
                style={{ borderColor: "var(--c-200)", background: "#fff", color: "var(--c-700)" }}
              >
                {t}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-5 py-24">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, ease: EASE }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-heading text-3xl font-extrabold sm:text-4xl" style={{ color: "var(--c-900)" }}>
            Start your first research session.
          </h2>
          <p className="mt-4 text-base sm:text-lg" style={{ color: "var(--c-500)" }}>
            No setup required. Just ask ScioAI a question and get a grounded report.
          </p>
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.18 }} className="inline-flex">
            <Link href="/dashboard" className="btn-primary mt-8 inline-flex px-8 py-3.5 text-base">
              Launch ScioAI <ArrowRight size={18} />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t px-5 py-8" style={{ borderColor: "var(--c-100)", background: "var(--c-50)" }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 font-semibold" style={{ color: "var(--c-700)" }}>
            <Sparkles size={14} style={{ color: "var(--c-500)" }} />
            ScioAI
          </div>
          <p className="text-sm" style={{ color: "var(--c-400)" }}>LangGraph · Groq · Pinecone · Next.js · FastAPI</p>
        </div>
      </footer>
    </main>
  );
}
