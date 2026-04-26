"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Database,
  FilePenLine,
  Globe,
  Search,
  ShieldCheck,
  Sparkles,
  Telescope,
  Zap,
} from "lucide-react";

/* ── Animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

/* ── Agent cards ── */
const agents = [
  {
    title: "The Researcher",
    description:
      "Scours live web intelligence via Tavily and retrieves contextual chunks from your Pinecone vector store to gather high-signal evidence.",
    icon: Telescope,
    accent: "indigo",
    tag: "Web + Vector",
  },
  {
    title: "The Writer",
    description:
      "Synthesizes multi-source findings into polished, structured Markdown reports with executive summaries, key findings, and deep analysis.",
    icon: FilePenLine,
    accent: "orange",
    tag: "LLM Synthesis",
  },
  {
    title: "The Critic",
    description:
      "Reviews every draft against the original query. Verifies citations, tests claims, removes unsupported assertions, and enforces objectivity.",
    icon: ShieldCheck,
    accent: "emerald",
    tag: "QA + Review",
  },
  {
    title: "Shared Memory",
    description:
      "Pinecone vector retrieval enriches every query with semantically relevant chunks, giving agents deep domain context beyond live search.",
    icon: Database,
    accent: "purple",
    tag: "Vector DB",
  },
];

const accentColors: Record<string, { bg: string; text: string; border: string; icon: string; badge: string }> = {
  indigo: {
    bg:     "bg-indigo-50",
    text:   "text-indigo-700",
    border: "border-indigo-200",
    icon:   "bg-indigo-100 text-indigo-600",
    badge:  "bg-indigo-100 text-indigo-700",
  },
  orange: {
    bg:     "bg-orange-50",
    text:   "text-orange-700",
    border: "border-orange-200",
    icon:   "bg-orange-100 text-orange-600",
    badge:  "bg-orange-100 text-orange-700",
  },
  emerald: {
    bg:     "bg-emerald-50",
    text:   "text-emerald-700",
    border: "border-emerald-200",
    icon:   "bg-emerald-100 text-emerald-600",
    badge:  "bg-emerald-100 text-emerald-700",
  },
  purple: {
    bg:     "bg-purple-50",
    text:   "text-purple-700",
    border: "border-purple-200",
    icon:   "bg-purple-100 text-purple-600",
    badge:  "bg-purple-100 text-purple-700",
  },
};

/* ── Stats ── */
const stats = [
  { label: "Avg. Response Time", value: "~12s", icon: Zap },
  { label: "Sources Checked", value: "6+ per query", icon: Search },
  { label: "Agents in Pipeline", value: "3 Specialized", icon: Brain },
  { label: "Search Coverage", value: "Real-time Web", icon: Globe },
];

/* ── Component ── */
export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* ── Background orbs ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-violet-100/50 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[450px] w-[450px] rounded-full bg-orange-100/40 blur-3xl" />
      </div>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-surface-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient shadow-sm">
              <Sparkles className="h-4.5 w-4.5 text-white" size={18} />
            </div>
            <span className="font-heading text-lg font-bold text-slate-900">ScioAI</span>
          </div>

          {/* Nav links */}
          <div className="hidden items-center gap-7 md:flex">
            {["Features", "How It Works", "Tech Stack"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600"
              >
                {item}
              </a>
            ))}
          </div>

          {/* CTA */}
          <Link
            href="/app"
            className="btn-primary rounded-xl px-5 py-2.5 text-sm"
          >
            Launch App
            <ArrowRight size={15} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-20 sm:pt-28">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="mx-auto max-w-4xl text-center"
        >
          {/* Eyebrow badge */}
          <motion.div variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Autonomous Research System · Powered by LangGraph
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            custom={1}
            className="mt-6 font-heading text-5xl font-extrabold leading-tight text-slate-900 sm:text-6xl lg:text-7xl"
          >
            Deep Research,{" "}
            <span className="brand-text-gradient">Fully Autonomous.</span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-6 max-w-2xl mx-auto text-lg leading-relaxed text-slate-600"
          >
            ScioAI deploys a coordinated team of specialized AI agents — Researcher, Writer, and Critic
            — that collaborate to produce citation-grounded, objective research reports you can trust.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            custom={3}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/app" className="btn-primary px-7 py-3 text-base rounded-2xl">
              Start Researching
              <ArrowRight size={18} />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-3 text-base font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
            >
              How It Works
            </a>
          </motion.div>
        </motion.div>

        {/* ── Stats strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {stats.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-surface-200 bg-white px-4 py-5 text-center shadow-card"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon size={18} />
              </div>
              <p className="font-heading text-xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Agents Grid ── */}
      <section
        id="features"
        className="relative mx-auto max-w-7xl px-5 py-20"
      >
        <div className="mb-12 text-center">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="badge badge-brand mb-3 text-xs tracking-widest uppercase"
          >
            The Multi-Agent Pipeline
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-heading text-3xl font-bold text-slate-900 sm:text-4xl"
          >
            Three Agents. One Unified Workflow.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-3 max-w-2xl mx-auto text-slate-600"
          >
            Purpose-built agents collaborate in sequence — each with a distinct role — to deliver
            robust, evidence-backed answers grounded in real sources.
          </motion.p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map((agent, idx) => {
            const Icon = agent.icon;
            const c = accentColors[agent.accent];
            return (
              <motion.article
                key={agent.title}
                variants={scaleIn}
                initial="hidden"
                whileInView="show"
                custom={idx}
                viewport={{ once: true, margin: "-50px" }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`relative overflow-hidden rounded-2xl border ${c.border} bg-white p-6 shadow-card transition-shadow hover:shadow-glass-md`}
              >
                {/* Agent icon */}
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${c.icon}`}>
                  <Icon size={22} />
                </div>

                {/* Tag */}
                <span className={`mt-4 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.badge}`}>
                  {agent.tag}
                </span>

                <h3 className="mt-3 font-heading text-lg font-bold text-slate-900">
                  {agent.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {agent.description}
                </p>

                {/* Decorative corner */}
                <div
                  className={`pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-bl-full opacity-10 ${c.bg}`}
                />
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20">
        <div className="mb-12 text-center">
          <span className="badge badge-brand mb-3 text-xs tracking-widest uppercase">
            Workflow
          </span>
          <h2 className="font-heading text-3xl font-bold text-slate-900 sm:text-4xl">
            From Query to Report in Seconds
          </h2>
        </div>

        <div className="relative mx-auto max-w-3xl">
          {/* Connector line */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-indigo-200 via-violet-200 to-orange-200" />

          {[
            {
              step: "01",
              title: "You Ask a Question",
              desc: "Enter any research topic into ScioAI's workspace. Multi-session history is persisted locally.",
              icon: Search,
              color: "bg-indigo-500",
            },
            {
              step: "02",
              title: "Researcher Gathers Evidence",
              desc: "Tavily live-searches the web (6 sources) and Pinecone retrieves semantically relevant document chunks.",
              icon: Telescope,
              color: "bg-violet-500",
            },
            {
              step: "03",
              title: "Writer Drafts the Report",
              desc: "Llama 3.3 70B synthesizes all evidence into a structured Markdown report with executive summary, findings, and citations.",
              icon: FilePenLine,
              color: "bg-purple-500",
            },
            {
              step: "04",
              title: "Critic Reviews & Refines",
              desc: "A second LLM pass verifies citations, removes unsupported claims, and ensures objectivity before delivery.",
              icon: ShieldCheck,
              color: "bg-orange-500",
            },
          ].map(({ step, title, desc, icon: Icon, color }, idx) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: idx * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex gap-6 pb-10 last:pb-0"
            >
              {/* Circle */}
              <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${color} shadow-md`}>
                <Icon size={20} className="text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 rounded-2xl border border-surface-200 bg-white p-5 shadow-card">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Step {step}</p>
                <h3 className="mt-1 font-heading text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section id="tech-stack" className="mx-auto max-w-7xl px-5 py-20">
        <div className="rounded-3xl border border-surface-200 bg-white p-10 shadow-glass text-center">
          <span className="badge badge-brand mb-4 text-xs tracking-widest uppercase">
            Powered By
          </span>
          <h2 className="font-heading text-2xl font-bold text-slate-900">
            Best-in-Class AI Infrastructure
          </h2>
          <p className="mt-3 text-slate-600 max-w-xl mx-auto text-sm">
            ScioAI is built on a carefully chosen stack of production-grade AI tools.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {[
              { name: "Next.js 14", color: "bg-slate-900 text-white" },
              { name: "FastAPI", color: "bg-emerald-600 text-white" },
              { name: "LangGraph", color: "bg-indigo-600 text-white" },
              { name: "Groq · Llama 3.3", color: "bg-orange-500 text-white" },
              { name: "Pinecone", color: "bg-teal-600 text-white" },
              { name: "Tavily Search", color: "bg-blue-600 text-white" },
              { name: "Tailwind CSS", color: "bg-sky-500 text-white" },
            ].map(({ name, color }) => (
              <span
                key={name}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm ${color}`}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="mx-auto max-w-7xl px-5 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl p-1"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)" }}
        >
          <div className="relative rounded-[calc(1.5rem-4px)] bg-white px-8 py-14 text-center">
            {/* Decorative blobs */}
            <div className="pointer-events-none absolute -top-20 -left-20 h-60 w-60 rounded-full bg-indigo-100/60 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-violet-100/60 blur-3xl" />

            <span className="badge badge-brand mb-4 text-xs tracking-widest uppercase">
              Ready to Research?
            </span>
            <h2 className="font-heading text-3xl font-bold text-slate-900 sm:text-4xl">
              Start Your First AI Research Session
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-slate-600">
              Get citation-grounded research reports in seconds. No setup required — just ask.
            </p>
            <Link
              href="/app"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-bold text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              Launch ScioAI Workspace
              <ArrowRight size={20} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-surface-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-5 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 font-heading font-bold text-slate-700">
            <Sparkles size={16} className="text-indigo-500" />
            ScioAI
          </div>
          <p className="text-sm text-slate-500">
            Built with LangGraph · Groq · Pinecone · Next.js · FastAPI
          </p>
        </div>
      </footer>
    </main>
  );
}
