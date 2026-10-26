"use client";

import { FormEvent, memo, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  FilePenLine,
  FileText,
  Globe,
  Layers,
  ListOrdered,
  LoaderCircle,
  Menu,
  RotateCcw,
  Search,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
  Telescope,
  User,
  X,
  Zap,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ChatSession } from "@/types/chat";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "https://scioai-backend-production.up.railway.app");

interface ChatWindowProps {
  sessionId: string | null;
  session: ChatSession | null;
  onSendMessage: (query: string, sessionId: string) => Promise<void>;
  onOpenSidebar?: () => void;
}

const loadingStages = [
  {
    step: "01",
    agent: "The Researcher",
    subtitle: "Tavily Web Retrieval",
    label: "Scouring live web intelligence & primary citations...",
    icon: Telescope,
  },
  {
    step: "02",
    agent: "The Writer",
    subtitle: "LLM Report Synthesis",
    label: "Structuring executive findings and comparative analysis...",
    icon: FilePenLine,
  },
  {
    step: "03",
    agent: "The Critic",
    subtitle: "Factual QA & Audit",
    label: "Verifying citations and eliminating ungrounded claims...",
    icon: ShieldCheck,
  },
] as const;

const agentStepLabels: Record<string, string> = {
  researcher: "Researcher",
  writer: "Writer",
  critic: "Critic",
};

const parseFilename = (h: string | null) => {
  if (!h) return null;
  return /filename="([^"]+)"/i.exec(h)?.[1] ?? null;
};

const buildBaseName = (title?: string) => {
  const ts = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
  const slug = (title ?? "Report")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `ScioAI-${slug || "Report"}-${ts}`;
};

const getMessageTitle = (msg: string) => {
  const h = /^\s*#\s+(.+)$/m.exec(msg)?.[1]?.trim();
  if (h) return h;
  const firstLine =
    msg
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? "Report";
  return firstLine.slice(0, 60);
};

/* Estimate word count & reading time for reports */
const getReadingMetrics = (text: string) => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return { words, minutes };
};

/* Structure for parsed Markdown TOC Headings */
interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

/* Structure for parsed Verified Sources */
interface CitationItem {
  title: string;
  url: string;
  domain: string;
}

function parseMarkdownStructure(markdown: string) {
  const headings: HeadingItem[] = [];
  const citations: CitationItem[] = [];
  const lines = markdown.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim().replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      if (id && text.length > 2) {
        headings.push({ id, text, level });
      }
    }
  }

  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let linkMatch;
  const seenUrls = new Set<string>();
  while ((linkMatch = linkRegex.exec(markdown)) !== null) {
    const title = linkMatch[1].trim();
    const url = linkMatch[2].trim();
    if (!seenUrls.has(url)) {
      seenUrls.add(url);
      try {
        const domain = new URL(url).hostname.replace(/^www\./, "");
        citations.push({ title, url, domain });
      } catch {
        citations.push({ title, url, domain: url.slice(0, 30) });
      }
    }
  }

  return { headings, citations };
}

/* Memoized AI message body with anchor headings and links */
const MemoizedAiMessage = memo(function AiMessage({
  content,
  idx,
}: {
  content: string;
  idx: number;
}) {
  return (
    <div id={`ai-message-${idx}`} className="w-full min-w-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        className="scio-markdown"
        components={{
          h1: ({ children, ...props }) => {
            const text = String(children);
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            return <h1 id={id} {...props}>{children}</h1>;
          },
          h2: ({ children, ...props }) => {
            const text = String(children);
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            return <h2 id={id} {...props}>{children}</h2>;
          },
          h3: ({ children, ...props }) => {
            const text = String(children);
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            return <h3 id={id} {...props}>{children}</h3>;
          },
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

export default function ChatWindow({
  sessionId,
  session,
  onSendMessage,
  onOpenSidebar,
}: ChatWindowProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [dlIndex, setDlIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [openSourcesIdx, setOpenSourcesIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Reset on session change */
  useEffect(() => {
    setQuery("");
    setIsLoading(false);
    setStageIndex(0);
    setElapsedSeconds(0);
    setDlIndex(null);
    setCopiedIndex(null);
    setPdfError(null);
    setOpenSourcesIdx(null);
  }, [sessionId]);

  /* Auto-scroll */
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    );
    return () => cancelAnimationFrame(id);
  }, [session?.messages.length, isLoading]);

  /* Loading stage simulation progression and elapsed timer */
  useEffect(() => {
    if (!isLoading) {
      setElapsedSeconds(0);
      return;
    }
    setStageIndex(0);
    const start = Date.now();
    const timerInterval = setInterval(() => {
      setElapsedSeconds(Number(((Date.now() - start) / 1000).toFixed(1)));
    }, 100);

    const stageInterval = setInterval(() => {
      setStageIndex((p) => (p < loadingStages.length - 1 ? p + 1 : p));
    }, 2400);

    return () => {
      clearInterval(timerInterval);
      clearInterval(stageInterval);
    };
  }, [isLoading]);

  /* Auto-resize textarea */
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, [query]);

  const canSend = useMemo(
    () => Boolean(query.trim()) && Boolean(sessionId) && !isLoading,
    [query, sessionId, isLoading]
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSend || !sessionId) return;
    const text = query.trim();
    setQuery("");
    setIsLoading(true);
    setPdfError(null);
    try {
      await onSendMessage(text, sessionId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend && sessionId) {
        const text = query.trim();
        setQuery("");
        setIsLoading(true);
        setPdfError(null);
        onSendMessage(text, sessionId).finally(() => setIsLoading(false));
      }
    }
  };

  const handleCopyMarkdown = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex((curr) => (curr === index ? null : curr));
    }, 2000);
  };

  const handleDownloadPdf = async (markdown: string, index: number) => {
    setPdfError(null);
    setDlIndex(index);
    try {
      const titleFromMsg = getMessageTitle(markdown);
      const baseName = buildBaseName(titleFromMsg);
      const msgEl = document.getElementById(`ai-message-${index}`);
      const html = msgEl?.innerHTML;

      const res = await fetch(`${API_BASE_URL}/api/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown, filename: baseName, html }),
      });

      if (!res.ok) {
        let detail = "";
        try {
          const data = (await res.json()) as { detail?: string };
          detail = data?.detail ?? "";
        } catch {
          /* noop */
        }
        throw new Error(
          detail || `Export failed with status ${res.status}. Please retry.`
        );
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/pdf")) {
        throw new Error("Export failed: server did not return a PDF.");
      }

      const blob = await res.blob();
      const name = parseFilename(res.headers.get("content-disposition")) ?? `${baseName}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "Export failed. Please retry.");
    } finally {
      setDlIndex(null);
    }
  };

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  /* ── Suggested Research Topics ── */
  const suggestedCards = [
    {
      category: "Technology",
      icon: Cpu,
      title: "Solid-state battery commercialization bottlenecks (2025–2030)",
      prompt: "Analyze the current engineering bottlenecks and realistic commercialization timelines for solid-state batteries in automotive applications from 2025 to 2030.",
    },
    {
      category: "AI Systems",
      icon: Layers,
      title: "Reasoning models: o1 vs DeepSeek-R1 vs Claude 3.7",
      prompt: "Provide a comparative analysis of modern AI reasoning paradigms: OpenAI o1, DeepSeek-R1, and Anthropic Claude 3.7 Sonnet in terms of inference compute and accuracy.",
    },
    {
      category: "Markets & Supply",
      icon: Globe,
      title: "Global semiconductor foundry supply chain resilience",
      prompt: "Assess geopolitical risks, fab redundancy, and packaging capacity constraints in the global leading-edge semiconductor supply chain.",
    },
    {
      category: "Clean Energy",
      icon: Zap,
      title: "Commercial nuclear fusion containment milestones",
      prompt: "Summarize recent breakthrough experimental metrics in magnetic and inertial confinement fusion and projected timelines for grid-scale pilot plants.",
    },
  ];

  const isEmpty = !session || session.messages.length === 0;

  return (
    <section
      className="flex h-full flex-col overflow-hidden rounded-2xl border shadow-xs transition-colors duration-200"
      style={{
        borderColor: "var(--c-200)",
        background: "var(--card-bg)",
      }}
      aria-label="Research workspace chat"
    >
      {/* ── Top Workspace Header ── */}
      <div
        className="flex items-center justify-between border-b px-4 py-3 sm:px-5"
        style={{
          borderColor: "var(--c-100)",
          background: "var(--card-bg)",
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          {onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              className="mr-0.5 rounded-lg border p-1.5 transition hover:bg-neutral-100 dark:hover:bg-neutral-800 lg:hidden"
              style={{ borderColor: "var(--c-200)", color: "var(--c-700)" }}
              aria-label="Open navigation sidebar"
            >
              <Menu size={18} aria-hidden="true" />
            </button>
          )}

          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-2xs"
            style={{ background: "var(--c-900)", color: "var(--c-50)" }}
          >
            <Sparkles size={16} />
          </div>

          <div className="min-w-0">
            <h1
              className="truncate font-heading text-sm font-semibold sm:text-base"
              style={{ color: "var(--c-900)" }}
            >
              {session?.title ?? "ScioAI Research Session"}
            </h1>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="hidden sm:inline" style={{ color: "var(--c-400)" }}>
                Tri-Agent Pipeline:
              </span>
              <span
                className="font-mono text-[11px] font-medium"
                style={{ color: "var(--c-600)" }}
              >
                Researcher / Writer / Critic
              </span>
            </div>
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2">
          <div
            className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium"
            style={{
              borderColor: "var(--c-200)",
              background: "var(--c-50)",
              color: "var(--c-700)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--ai-accent)" }}
            />
            <span className="hidden sm:inline">Pipeline Ready</span>
            <span className="sm:hidden">Ready</span>
          </div>
        </div>
      </div>

      {/* ── Central Canvas / Messages ── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ background: "var(--c-50)" }}
      >
        {isEmpty ? (
          /* ── Empty State ── */
          <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center px-4 py-4 sm:py-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="relative mb-3 flex h-11 w-11 items-center justify-center rounded-xl shadow-xs ring-1 ring-white/10"
              style={{ background: "var(--c-900)", color: "var(--c-50)" }}
            >
              <Sparkles size={20} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="text-center"
            >
              <h2
                className="font-heading text-xl font-bold tracking-tight sm:text-2xl"
                style={{ color: "var(--c-900)" }}
              >
                What would you like to investigate?
              </h2>
              <p
                className="mx-auto mt-1 max-w-md text-xs sm:text-sm leading-relaxed"
                style={{ color: "var(--c-500)" }}
              >
                Input any research inquiry. Our coordinated triad will search live web indexes,
                synthesize primary evidence, and verify assertions into an audit-ready dossier.
              </p>
            </motion.div>

            {/* Categorized Inquiry Suggestion Cards */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.12 }}
              className="mt-5 grid w-full max-w-2xl gap-3 sm:grid-cols-2"
            >
              {suggestedCards.map(({ category, icon: Icon, title, prompt }) => (
                <button
                  key={title}
                  onClick={() => {
                    if (sessionId) {
                      setQuery(prompt);
                      textareaRef.current?.focus();
                    }
                  }}
                  className="group flex flex-col justify-between rounded-xl border p-3.5 text-left shadow-2xs transition-all duration-120 hover:-translate-y-0.5 hover:shadow-xs"
                  style={{
                    borderColor: "var(--c-200)",
                    background: "var(--card-bg)",
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className="rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          borderColor: "var(--c-200)",
                          background: "var(--c-100)",
                          color: "var(--c-700)",
                        }}
                      >
                        {category}
                      </span>
                      <Icon
                        size={13}
                        className="transition-colors"
                        style={{ color: "var(--c-400)" }}
                      />
                    </div>
                    <p
                      className="mt-2 text-xs sm:text-[13px] font-semibold leading-snug"
                      style={{ color: "var(--c-800)" }}
                    >
                      {title}
                    </p>
                  </div>
                  <div
                    className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold"
                    style={{ color: "var(--c-500)" }}
                  >
                    <span>Populate inquiry</span>
                    <ArrowRight
                      size={11}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                </button>
              ))}
            </motion.div>

            {/* Feature Assurance Chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mt-5 flex flex-wrap justify-center gap-4 text-xs font-medium"
              style={{ color: "var(--c-500)" }}
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} style={{ color: "var(--c-600)" }} />
                Live Tavily Web Retrieval
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} style={{ color: "var(--c-600)" }} />
                Zero-Hallucination Audit
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} style={{ color: "var(--c-600)" }} />
                One-Click PDF Export
              </span>
            </motion.div>
          </div>
        ) : (
          /* ── Messages & Reports Feed ── */
          <div className="mx-auto max-w-3xl space-y-4 p-2.5 sm:p-4">
            <AnimatePresence initial={false}>
              {session.messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                const isError = msg.kind === "error";
                const metrics = !isUser && !isError ? getReadingMetrics(msg.content) : null;
                const parsed = !isUser && !isError ? parseMarkdownStructure(msg.content) : null;
                const hasHeadings = parsed && parsed.headings.length >= 2;
                const hasCitations = parsed && parsed.citations.length > 0;
                const isSourcesOpen = openSourcesIdx === idx;

                return (
                  <motion.div
                    key={`${idx}-${msg.role}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                  >
                    {/* Role Avatar */}
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border shadow-2xs`}
                      style={{
                        borderColor: isUser ? "transparent" : "var(--c-200)",
                        background: isUser ? "var(--c-900)" : "var(--card-bg)",
                        color: isUser ? "var(--c-50)" : "var(--c-900)",
                      }}
                    >
                      {isUser ? <User size={13} /> : <Bot size={13} />}
                    </div>

                    {/* Content Container */}
                    <div
                      className={`flex min-w-0 flex-1 flex-col ${
                        isUser ? "max-w-[80%] items-end" : "w-full items-start"
                      }`}
                    >
                      {isUser ? (
                        /* User Query Bubble */
                        <div
                          className="rounded-xl rounded-tr-xs px-3.5 py-2 text-xs sm:text-sm font-medium leading-relaxed shadow-xs sm:px-4 sm:py-2.5"
                          style={{ background: "var(--c-900)", color: "var(--c-50)" }}
                        >
                          <span className="whitespace-pre-wrap">{msg.content}</span>
                        </div>
                      ) : isError ? (
                        /* Error Banner */
                        <div
                          className="flex w-full items-center gap-2 rounded-xl border p-3 text-xs font-medium"
                          style={{
                            borderColor: "var(--c-200)",
                            background: "var(--c-100)",
                            color: "var(--c-700)",
                          }}
                        >
                          <RotateCcw size={13} className="text-red-500" />
                          <span>{msg.content}</span>
                        </div>
                      ) : (
                        /* Executive AI Research Dossier Card */
                        <div
                          className="w-full overflow-hidden rounded-2xl border shadow-2xs transition-colors duration-200"
                          style={{
                            borderColor: "var(--c-200)",
                            background: "var(--card-bg)",
                          }}
                        >
                          {/* Dossier Header Bar */}
                          <div
                            className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 text-[11px]"
                            style={{
                              borderColor: "var(--c-100)",
                              background: "var(--c-50)",
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="font-bold uppercase tracking-wider text-[10px]"
                                style={{ color: "var(--c-600)" }}
                              >
                                ScioAI Research Dossier
                              </span>
                              <span style={{ color: "var(--c-300)" }}>•</span>
                              <span
                                className="font-semibold"
                                style={{ color: "var(--c-800)" }}
                              >
                                Grounded Synthesis
                              </span>
                            </div>
                            {metrics && (
                              <div
                                className="flex items-center gap-2 text-xs"
                                style={{ color: "var(--c-500)" }}
                              >
                                <span>{metrics.words.toLocaleString()} words</span>
                                <span>•</span>
                                <span>~{metrics.minutes} min read</span>
                              </div>
                            )}
                          </div>

                          {/* Table of Contents Section Jumper (if multi-section report) */}
                          {hasHeadings && (
                            <div
                              className="border-b px-4 py-2"
                              style={{
                                borderColor: "var(--c-100)",
                                background: "var(--c-50)",
                              }}
                            >
                              <div className="flex items-center gap-1.5 pb-1.5 text-[11px] font-semibold" style={{ color: "var(--c-500)" }}>
                                <ListOrdered size={12} />
                                <span>Section Navigation</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 no-scrollbar">
                                {parsed.headings.slice(0, 6).map((h) => (
                                  <button
                                    key={h.id}
                                    onClick={() => scrollToHeading(h.id)}
                                    className="toc-pill"
                                    title={`Jump to ${h.text}`}
                                  >
                                    <span className="truncate max-w-[180px]">{h.text}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Markdown Body */}
                          <div className="p-4 sm:p-5">
                            <MemoizedAiMessage content={msg.content} idx={idx} />
                          </div>

                          {/* Primary Sources Collapsible Drawer */}
                          {hasCitations && (
                            <div
                              className="border-t px-4 py-2"
                              style={{ borderColor: "var(--c-100)" }}
                            >
                              <button
                                onClick={() =>
                                  setOpenSourcesIdx(isSourcesOpen ? null : idx)
                                }
                                className="flex w-full items-center justify-between text-xs font-semibold py-1 transition"
                                style={{ color: "var(--c-700)" }}
                                aria-label="Toggle verified sources"
                              >
                                <div className="flex items-center gap-1.5">
                                  <Bookmark size={12} style={{ color: "var(--c-700)" }} />
                                  <span>Verified Primary Sources ({parsed.citations.length})</span>
                                </div>
                                {isSourcesOpen ? (
                                  <ChevronUp size={14} />
                                ) : (
                                  <ChevronDown size={14} />
                                )}
                              </button>

                              <AnimatePresence>
                                {isSourcesOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.16 }}
                                    className="overflow-hidden pt-2"
                                  >
                                    <div className="grid gap-1.5 sm:grid-cols-2">
                                      {parsed.citations.map((c, cIdx) => (
                                        <a
                                          key={c.url}
                                          href={c.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center justify-between rounded-lg border p-2 text-xs transition hover:border-neutral-400"
                                          style={{
                                            borderColor: "var(--c-200)",
                                            background: "var(--c-50)",
                                          }}
                                        >
                                          <div className="min-w-0 pr-2">
                                            <p
                                              className="truncate font-semibold"
                                              style={{ color: "var(--c-800)" }}
                                            >
                                              {c.title || c.domain}
                                            </p>
                                            <span
                                              className="font-mono text-[10px]"
                                              style={{ color: "var(--c-500)" }}
                                            >
                                              {c.domain}
                                            </span>
                                          </div>
                                          <ExternalLink
                                            size={12}
                                            className="shrink-0"
                                            style={{ color: "var(--c-400)" }}
                                          />
                                        </a>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                          {/* Dossier Action Toolbar */}
                          <div
                            className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5 text-xs"
                            style={{
                              borderColor: "var(--c-100)",
                              background: "var(--c-50)",
                            }}
                          >
                            {/* Workflow steps pills */}
                            <div className="flex flex-wrap items-center gap-1">
                              {msg.workflowSteps && msg.workflowSteps.length > 0 ? (
                                msg.workflowSteps.map((step) => (
                                  <span
                                    key={`${idx}-${step}`}
                                    className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium"
                                    style={{
                                      borderColor: "var(--c-200)",
                                      background: "var(--card-bg)",
                                      color: "var(--c-700)",
                                    }}
                                  >
                                    <CheckCircle2 size={10} style={{ color: "var(--c-600)" }} />
                                    <span>{agentStepLabels[step] ?? step}</span>
                                  </span>
                                ))
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium"
                                  style={{
                                    borderColor: "var(--c-200)",
                                    background: "var(--card-bg)",
                                    color: "var(--c-700)",
                                  }}
                                >
                                  <CheckCircle2 size={10} style={{ color: "var(--c-600)" }} />
                                  <span>Citation Grounded</span>
                                </span>
                              )}
                            </div>

                            {/* Action Buttons: Copy Markdown + Download PDF */}
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleCopyMarkdown(msg.content, idx)}
                                className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition"
                                style={{
                                  borderColor: "var(--c-200)",
                                  background: "var(--card-bg)",
                                  color: "var(--c-800)",
                                }}
                                aria-label="Copy raw markdown to clipboard"
                              >
                                {copiedIndex === idx ? (
                                  <>
                                    <Check size={11} style={{ color: "var(--c-700)" }} />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} />
                                    <span>Copy Markdown</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleDownloadPdf(msg.content, idx)}
                                disabled={dlIndex === idx}
                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold shadow-xs transition disabled:opacity-50"
                                style={{ background: "var(--c-900)", color: "var(--c-50)" }}
                                aria-label="Download research report as PDF"
                              >
                                {dlIndex === idx ? (
                                  <>
                                    <LoaderCircle className="h-3 w-3 animate-spin" />
                                    <span>Rendering PDF…</span>
                                  </>
                                ) : (
                                  <>
                                    <Download size={11} />
                                    <span>Download PDF</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* ── Live Tri-Agent Stepper (Loading State) ── */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 sm:gap-3"
              >
                <div
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border shadow-2xs"
                  style={{
                    borderColor: "var(--c-200)",
                    background: "var(--card-bg)",
                    color: "var(--c-900)",
                  }}
                >
                  <Bot size={13} />
                </div>

                <div
                  className="w-full max-w-lg overflow-hidden rounded-2xl border p-4 shadow-sm"
                  style={{
                    borderColor: "var(--c-200)",
                    background: "var(--card-bg)",
                  }}
                >
                  {/* Stepper Header with live stopwatch timer */}
                  <div
                    className="flex items-center justify-between border-b pb-2"
                    style={{ borderColor: "var(--c-100)" }}
                  >
                    <div className="flex items-center gap-2">
                      <p
                        className="font-heading text-xs font-bold uppercase tracking-wider"
                        style={{ color: "var(--c-900)" }}
                      >
                        Autonomous Pipeline In Progress
                      </p>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[10px] font-mono font-semibold"
                        style={{
                          background: "var(--c-100)",
                          color: "var(--c-600)",
                        }}
                      >
                        <Clock size={10} />
                        {elapsedSeconds}s
                      </span>
                    </div>
                    <span
                      className="font-mono text-[10px]"
                      style={{ color: "var(--c-400)" }}
                    >
                      Cycle 1
                    </span>
                  </div>

                  {/* 3 Step Cards */}
                  <div className="mt-3 space-y-2">
                    {loadingStages.map(({ step, agent, subtitle, label, icon: Icon }, i) => {
                      const done = i < stageIndex;
                      const active = i === stageIndex;

                      return (
                        <div
                          key={agent}
                          className={`flex items-center justify-between rounded-xl border p-2.5 transition-all duration-200`}
                          style={{
                            borderColor: active
                              ? "var(--c-900)"
                              : done
                              ? "var(--c-200)"
                              : "var(--c-100)",
                            background: active
                              ? "var(--c-900)"
                              : done
                              ? "var(--c-100)"
                              : "var(--card-bg)",
                            color: active ? "var(--c-50)" : "var(--c-800)",
                            opacity: !active && !done ? 0.6 : 1,
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-lg`}
                              style={{
                                background: active
                                  ? "rgba(128,128,128,0.25)"
                                  : done
                                  ? "var(--card-bg)"
                                  : "var(--c-100)",
                                color: active
                                  ? "var(--c-50)"
                                  : done
                                  ? "var(--c-900)"
                                  : "var(--c-400)",
                              }}
                            >
                              {done ? (
                                <Check size={12} style={{ color: "var(--c-600)" }} />
                              ) : (
                                <Icon
                                  size={13}
                                  className={active ? "animate-pulse" : ""}
                                />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[9px] font-bold opacity-70">
                                  {step}
                                </span>
                                <span className="text-xs font-semibold">{agent}</span>
                                <span className="text-[10px] opacity-70">
                                  • {subtitle}
                                </span>
                              </div>
                              <p
                                className="text-[10px] mt-0.5"
                                style={{
                                  color: active
                                    ? "rgba(255,255,255,0.8)"
                                    : "var(--c-500)",
                                }}
                              >
                                {active
                                  ? label
                                  : done
                                  ? "Execution verified"
                                  : "Pending execution"}
                              </p>
                            </div>
                          </div>

                          {active && (
                            <div className="flex gap-1 pr-1">
                              <span className="loading-dot animate-dot-1 bg-white" />
                              <span className="loading-dot animate-dot-2 bg-white" />
                              <span className="loading-dot animate-dot-3 bg-white" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* PDF Error Display */}
            {pdfError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 rounded-xl border p-3 text-xs font-semibold"
              style={{
                borderColor: "var(--c-200)",
                background: "var(--c-100)",
                color: "var(--c-800)",
              }}
              >
                <RotateCcw size={13} />
                <span>{pdfError}</span>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Command Query Input Bar ── */}
      <form
        onSubmit={handleSubmit}
        className="border-t p-3 sm:p-4"
        style={{
          borderColor: "var(--c-100)",
          background: "var(--card-bg)",
        }}
      >
        <div
          className="relative rounded-2xl border transition-all duration-150 focus-within:ring-2 focus-within:ring-neutral-900/10"
          style={{
            borderColor: "var(--c-200)",
            background: "var(--c-50)",
          }}
        >
          {/* Textarea */}
          <div className="relative p-3 sm:p-3.5">
            <label htmlFor="chat-input" className="sr-only">
              Research query
            </label>
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Enter a research question and press Enter..."
              rows={2}
              id="chat-input"
              aria-label="Research query"
              aria-describedby="chat-input-hint"
              className="w-full resize-none bg-transparent text-sm sm:text-base leading-relaxed outline-none disabled:opacity-60"
              style={{
                color: "var(--c-900)",
                minHeight: "44px",
                maxHeight: "160px",
              }}
            />

            {/* Quick clear button */}
            {query.length > 0 && !isLoading && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3.5 top-3.5 rounded-full p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                aria-label="Clear query text"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Action Row inside command bar */}
          <div
            className="flex items-center justify-between border-t px-3 py-2 text-xs"
            style={{ borderColor: "var(--c-200)" }}
          >
            {/* Left mode badges */}
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-semibold"
                style={{
                  borderColor: "var(--c-200)",
                  background: "var(--card-bg)",
                  color: "var(--c-600)",
                }}
              >
                <Search size={11} style={{ color: "var(--c-500)" }} />
                Live Tavily
              </span>
              <span
                className="hidden rounded-md border px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-semibold sm:inline-flex"
                style={{
                  borderColor: "var(--c-200)",
                  background: "var(--card-bg)",
                  color: "var(--c-600)",
                }}
              >
                LangGraph Triad
              </span>
            </div>

            {/* Right Submit controls */}
            <div className="flex items-center gap-2.5">
              {query.length > 0 && (
                <span
                  className="font-mono text-[11px]"
                  style={{ color: "var(--c-400)" }}
                >
                  {query.length} chars
                </span>
              )}
              <span
                className="hidden font-mono text-xs sm:inline"
                style={{ color: "var(--c-400)" }}
              >
                ⏎ to research
              </span>
              <button
                type="submit"
                disabled={!canSend}
                id="chat-send-btn"
                aria-label={
                  isLoading ? "Generating research…" : "Submit research inquiry"
                }
                className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 shrink-0 items-center justify-center rounded-xl shadow-xs transition disabled:opacity-30 active:scale-95"
                style={{ background: "var(--c-900)", color: "var(--c-50)" }}
              >
                {isLoading ? (
                  <LoaderCircle
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <SendHorizontal className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        <p
          id="chat-input-hint"
          className="mt-1.5 text-center font-mono text-[11px]"
          style={{ color: "var(--c-400)" }}
        >
          ScioAI autonomously queries web sources · Verify primary citations for compliance-critical decisions
        </p>
      </form>
    </section>
  );
}
