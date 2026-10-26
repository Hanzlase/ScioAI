"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  FileSearch,
  Home,
  Sparkles,
  Telescope,
} from "lucide-react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function NotFoundClient() {
  return (
    <main
      className="hero-surface relative flex min-h-screen flex-col items-center justify-between px-5 py-8 text-center transition-colors duration-200"
      style={{ background: "var(--card-bg)", color: "var(--c-900)" }}
    >
      {/* Background Dot Texture */}
      <div className="subtle-dot-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

      {/* ── Top Header Bar ── */}
      <header className="relative z-10 w-full max-w-6xl">
        <div className="flex items-center justify-between py-2">
          <Link
            href="/"
            aria-label="Return to ScioAI home"
            className="group flex items-center gap-2.5"
          >
            <motion.div
              whileHover={{ rotate: 8, scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl shadow-xs ring-1 ring-white/10"
              style={{ background: "var(--c-900)" }}
              aria-hidden="true"
            >
              <Sparkles size={16} className="text-white" />
            </motion.div>
            <div className="flex items-center gap-2">
              <span
                className="font-heading text-lg font-extrabold tracking-tight"
                style={{ color: "var(--c-900)" }}
              >
                ScioAI
              </span>
              <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-semibold text-neutral-500">
                Workspace
              </span>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="hidden items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-2xs transition hover:border-neutral-400 hover:text-neutral-900 sm:inline-flex"
          >
            <span>Research Workspace</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {/* ── Central Hero Content ── */}
      <div className="relative z-10 my-auto flex max-w-2xl flex-col items-center py-12">
        {/* Status Eyebrow Badge */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="mb-6 inline-flex"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-1.5 text-xs font-semibold text-neutral-700 shadow-2xs">
            <span className="flex h-2 w-2 items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 animate-pulse" />
            </span>
            <span>HTTP 404</span>
            <span className="text-neutral-300">•</span>
            <span className="font-mono text-neutral-500">Resource Undefined</span>
          </div>
        </motion.div>

        {/* Large Visual 404 Watermark with Floating Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
          className="relative select-none"
        >
          <p
            className="font-heading text-8xl font-black tracking-tighter text-neutral-200 sm:text-9xl lg:text-[11rem]"
            style={{ lineHeight: 0.95 }}
            aria-hidden="true"
          >
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-white/90 text-neutral-900 shadow-lg backdrop-blur-xs">
              <Compass size={28} className="animate-spin-slow" />
            </div>
          </div>
        </motion.div>

        {/* Primary Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.16, ease: EASE }}
          className="mt-6 font-heading text-2xl font-black tracking-tight sm:text-4xl"
          style={{ color: "var(--c-900)" }}
        >
          Autonomous research couldn&apos;t locate this page.
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.22, ease: EASE }}
          className="mt-3 max-w-md text-sm leading-relaxed text-neutral-500 sm:text-base"
        >
          The endpoint you requested does not exist or has been relocated.
          Return to the home page or launch an inquest in the research workspace.
        </motion.p>

        {/* Agent Inquest Status Box */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.28, ease: EASE }}
          className="mt-6 w-full max-w-sm rounded-xl border border-neutral-200 bg-neutral-50/80 p-3 text-left shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Telescope size={14} className="text-neutral-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[11px] font-semibold text-neutral-700">
                Researcher: 0 indexed documents found
              </p>
              <p className="font-mono text-[10px] text-neutral-400">
                Diagnostic: Missing route segment
              </p>
            </div>
          </div>
        </motion.div>

        {/* Primary Actions */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.34, ease: EASE }}
          className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
        >
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto"
          >
            <Link
              href="/"
              className="btn-ghost flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold sm:w-auto"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Back to Home</span>
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto"
          >
            <Link
              href="/dashboard"
              className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-xs sm:w-auto"
            >
              <span>Launch Research Workspace</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Quick Nav Shortcuts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.42 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-400"
        >
          <span>Quick destinations:</span>
          <Link
            href="/#features"
            className="font-medium text-neutral-600 underline-offset-4 transition hover:text-neutral-900 hover:underline"
          >
            Agent Pipeline
          </Link>
          <span>•</span>
          <Link
            href="/#how-it-works"
            className="font-medium text-neutral-600 underline-offset-4 transition hover:text-neutral-900 hover:underline"
          >
            Architecture
          </Link>
          <span>•</span>
          <Link
            href="/#stack"
            className="font-medium text-neutral-600 underline-offset-4 transition hover:text-neutral-900 hover:underline"
          >
            Tech Stack
          </Link>
        </motion.div>
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-10 w-full max-w-6xl border-t border-neutral-100 py-4 text-center">
        <p className="text-xs text-neutral-400">
          &copy; {new Date().getFullYear()} ScioAI · Autonomous Multi-Agent Research
        </p>
      </footer>
    </main>
  );
}
