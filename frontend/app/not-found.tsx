// Custom 404 Not Found page – ScioAI
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist. Return to ScioAI and start a new research session.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-white px-5 text-center"
      style={{ color: "var(--c-900)" }}
    >
      {/* Logo */}
      <Link href="/" aria-label="Return to ScioAI home" className="mb-10 flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: "var(--c-900)" }}
          aria-hidden="true"
        >
          <Sparkles size={16} className="text-white" />
        </div>
        <span className="font-heading text-lg font-extrabold" style={{ color: "var(--c-900)" }}>
          ScioAI
        </span>
      </Link>

      {/* 404 Number */}
      <p
        className="font-heading text-8xl font-extrabold sm:text-9xl"
        style={{ color: "var(--c-200)", lineHeight: 1 }}
        aria-hidden="true"
      >
        404
      </p>

      {/* Heading */}
      <h1
        className="mt-6 font-heading text-2xl font-extrabold sm:text-3xl"
        style={{ color: "var(--c-900)" }}
      >
        Page not found
      </h1>

      {/* Description */}
      <p className="mt-3 max-w-sm text-base leading-relaxed" style={{ color: "var(--c-500)" }}>
        The page you were looking for doesn&apos;t exist or has been moved.
        Head back to the home page or start a new research session.
      </p>

      {/* Actions */}
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link href="/" className="btn-ghost inline-flex items-center gap-2 px-6 py-2.5">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Home
        </Link>
        <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5">
          Launch Research App <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
