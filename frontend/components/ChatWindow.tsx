"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  CheckCircle2,
  Download,
  LoaderCircle,
  Menu,
  RotateCcw,
  ScanSearch,
  SendHorizontal,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ChatSession } from "@/types/chat";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 
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
  { label: "Agents analyzing your request…",    icon: Zap },
  { label: "Searching the web for intelligence…", icon: ScanSearch },
  { label: "Drafting and reviewing report…",    icon: Sparkles },
] as const;

const agentStepLabels: Record<string, string> = {
  researcher: "Researcher",
  writer:     "Writer",
  critic:     "Critic",
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
  const firstLine = msg
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0) ?? "Report";
  return firstLine.slice(0, 60);
};

/* ─────────────────────────────────────────────────── */

export default function ChatWindow({ sessionId, session, onSendMessage, onOpenSidebar }: ChatWindowProps) {
  const [query, setQuery]             = useState("");
  const [isLoading, setIsLoading]     = useState(false);
  const [stageIndex, setStageIndex]   = useState(0);
  const [dlIndex, setDlIndex]         = useState<number | null>(null);
  const [pdfError, setPdfError]       = useState<string | null>(null);
  const messagesEndRef                = useRef<HTMLDivElement | null>(null);
  const textareaRef                   = useRef<HTMLTextAreaElement>(null);

  /* Reset on session change */
  useEffect(() => {
    setQuery(""); setIsLoading(false); setStageIndex(0); setDlIndex(null); setPdfError(null);
  }, [sessionId]);

  /* Auto-scroll */
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    );
    return () => cancelAnimationFrame(id);
  }, [session?.messages.length, isLoading, stageIndex]);

  /* Loading stage cycle */
  useEffect(() => {
    if (!isLoading) return;
    setStageIndex(0);
    const iv = setInterval(() =>
      setStageIndex((p) => (p < loadingStages.length - 1 ? p + 1 : p)), 1800
    );
    return () => clearInterval(iv);
  }, [isLoading]);

  /* Auto-resize textarea */
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [query]);

  const canSend = useMemo(
    () => Boolean(query.trim()) && Boolean(sessionId) && !isLoading,
    [query, sessionId, isLoading],
  );

  const lastAiIdx = useMemo(() => {
    if (!session) return -1;
    for (let i = session.messages.length - 1; i >= 0; i--) {
      if (session.messages[i].role === "ai") return i;
    }
    return -1;
  }, [session]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSend || !sessionId) return;
    const text = query.trim();
    setQuery(""); setIsLoading(true); setPdfError(null);
    try { await onSendMessage(text, sessionId); } finally { setIsLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend && sessionId) {
        const text = query.trim();
        setQuery(""); setIsLoading(true); setPdfError(null);
        onSendMessage(text, sessionId).finally(() => setIsLoading(false));
      }
    }
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
          // ignore
        }
        throw new Error(detail ? `Export failed: ${detail}` : "Export failed. Please retry.");
      }

      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/pdf")) {
        throw new Error("Export failed: server did not return a PDF.");
      }

      const blob = await res.blob();
      const name = parseFilename(res.headers.get("content-disposition")) ?? `${baseName}.pdf`;
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
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

  /* ── Suggestion prompt ── */
  const suggestions = [
    "What are the latest advances in quantum computing?",
    "Explain the impact of AI on healthcare diagnostics.",
    "Summarize the current state of renewable energy.",
  ];

  /* ── Empty state ── */
  const isEmpty = !session || session.messages.length === 0;

  return (
    <section className="flex h-full flex-col overflow-hidden sm:rounded-2xl border bg-white" style={{ borderColor: "var(--c-200)" }}>

      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-4 sm:px-6 sm:py-5" style={{ borderColor: "var(--c-100)" }}>
        {onOpenSidebar && (
          <button 
            onClick={onOpenSidebar}
            className="mr-1 rounded-md p-1.5 transition hover:bg-charcoal-50 lg:hidden"
          >
            <Menu size={22} />
          </button>
        )}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10" style={{ background: "var(--c-900)" }}>
          <Sparkles size={14} className="text-white sm:size-[16px]" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-sm font-bold sm:text-lg" style={{ color: "var(--c-900)" }}>
            {session?.title ?? "ScioAI Research Agent"}
          </h1>
          <p className="truncate text-[10px] sm:text-sm" style={{ color: "var(--c-500)" }}>
            Researcher · Writer · Critic · High-Performance LLMs
          </p>
        </div>
        <span className="hidden sm:flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium" style={{ borderColor: "var(--c-200)", color: "var(--c-600)" }}>
          <span className="h-2 w-2 rounded-full animate-pulse2" style={{ background: "var(--c-400)" }} />
          Online
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          /* Empty state */
          <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-16 text-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.4 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl" 
              style={{ background: "var(--c-900)" }}
            >
              <Sparkles size={30} className="text-white" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
              <h2 className="font-heading text-xl font-bold sm:text-2xl" style={{ color: "var(--c-900)" }}>
                Start a research session
              </h2>
              <p className="mt-2 max-w-md text-base" style={{ color: "var(--c-500)" }}>
                Ask anything. Agents will research the web and deliver
                a citation-grounded report.
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-4 flex flex-wrap justify-center gap-3"
            >
              {suggestions.map((s) => (
                <button
                  key={s}
                  className="rounded-xl border px-4 py-2.5 text-sm transition"
                  style={{ borderColor: "var(--c-200)", background: "var(--c-50)", color: "var(--c-700)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "var(--c-400)"; e.currentTarget.style.color = "var(--c-900)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--c-50)"; e.currentTarget.style.borderColor = "var(--c-200)"; e.currentTarget.style.color = "var(--c-700)"; }}
                  onClick={() => { if (sessionId) { setQuery(s); textareaRef.current?.focus(); } }}
                >
                  {s}
                </button>
              ))}
            </motion.div>
          </div>
        ) : (
          /* Messages */
          <div className="space-y-6 p-3 sm:p-6 lg:p-8 overflow-x-hidden">
            <AnimatePresence initial={false}>
              {session.messages.map((msg, idx) => {
                const isUser   = msg.role === "user";
                const isError  = msg.kind === "error";

                return (
                  <motion.div
                    key={`${idx}-${msg.role}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-start gap-2 sm:gap-4 ${isUser ? "flex-row-reverse" : ""}`}
                  >
                    {/* Avatar */}
                    <div className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border mt-1" 
                      style={{
                        background: isUser ? "var(--c-900)" : isError ? "var(--c-100)" : "#fff",
                        borderColor: isUser ? "var(--c-900)" : "var(--c-200)",
                        color: isUser ? "#fff" : isError ? "var(--c-500)" : "var(--c-700)"
                      }}
                    >
                      {isUser ? <User size={14} className="sm:size-[16px]" /> : <Bot size={14} className="sm:size-[16px]" />}
                    </div>

                    <div className={`flex min-w-0 w-full max-w-[85%] flex-col gap-2 overflow-hidden ${isUser ? "items-end" : "items-start"}`}>
                      {/* Bubble */}
                      <div
                        className="rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-base leading-relaxed w-full overflow-hidden break-words"
                        style={{
                           background: isUser ? "var(--c-900)" : isError ? "var(--c-50)" : "#fff",
                           border: isUser ? "none" : "1px solid var(--c-200)",
                           color: isUser ? "#fff" : isError ? "var(--c-600)" : "var(--c-900)",
                           borderTopRightRadius: isUser ? "4px" : "1rem",
                           borderTopLeftRadius: !isUser ? "4px" : "1rem",
                        }}
                      >
                        {isUser || isError ? (
                          <span className="whitespace-pre-wrap">{msg.content}</span>
                        ) : (
                          <div id={`ai-message-${idx}`} className="w-full min-w-0">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              className="scio-markdown"
                              components={{
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
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>

                      {/* Workflow steps */}
                      {!isUser && !isError && msg.workflowSteps && msg.workflowSteps.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {msg.workflowSteps.map((step) => (
                            <span key={`${idx}-${step}`} className="step-pill done">
                              <CheckCircle2 size={12} />
                              {agentStepLabels[step] ?? step}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* PDF download */}
                      {!isUser && !isError && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          onClick={() => handleDownloadPdf(msg.content, idx)}
                          disabled={dlIndex === idx}
                          className="mt-2 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition disabled:opacity-50"
                          style={{ borderColor: "var(--c-200)", background: "#fff", color: "var(--c-700)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--c-400)";
                            e.currentTarget.style.color = "var(--c-900)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--c-200)";
                            e.currentTarget.style.color = "var(--c-700)";
                          }}
                        >
                          {dlIndex === idx ? (
                            <><LoaderCircle className="h-4 w-4 animate-spin" />Generating PDF…</>
                          ) : (
                            <><Download className="h-4 w-4" />Download as PDF</>
                          )}
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Loading */}
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 sm:gap-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border mt-1" style={{ borderColor: "var(--c-200)", background: "#fff", color: "var(--c-700)" }}>
                  <Bot size={16} />
                </div>
                <div className="max-w-sm rounded-2xl rounded-tl-[4px] border p-5 shadow-sm" style={{ borderColor: "var(--c-200)", background: "#fff" }}>
                  <p className="mb-4 text-sm font-bold" style={{ color: "var(--c-700)" }}>
                    Multi-agent pipeline running
                  </p>
                  <div className="space-y-2">
                    {loadingStages.map(({ label, icon: Icon }, i) => {
                      const done   = i < stageIndex;
                      const active = i === stageIndex;
                      return (
                        <div
                          key={label}
                          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-300"
                          style={{
                             border: active ? "1px solid var(--c-900)" : done ? "1px solid var(--c-200)" : "1px solid var(--c-100)",
                             background: active ? "var(--c-900)" : done ? "var(--c-50)" : "#fff",
                             color: active ? "#fff" : done ? "var(--c-700)" : "var(--c-400)"
                          }}
                        >
                          {done ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Icon className={`h-4 w-4 ${active ? "animate-pulse" : ""}`} />
                          )}
                          <span className="font-medium">{label}</span>
                          {active && (
                            <span className="ml-auto flex gap-1">
                              <span className="loading-dot animate-dot-1" style={{ background: "var(--c-400)" }} />
                              <span className="loading-dot animate-dot-2" style={{ background: "var(--c-400)" }} />
                              <span className="loading-dot animate-dot-3" style={{ background: "var(--c-400)" }} />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* PDF error */}
            {pdfError && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="ml-[3.25rem] flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium"
                style={{ borderColor: "var(--c-200)", background: "var(--c-50)", color: "var(--c-700)" }}
              >
                <RotateCcw size={14} />
                {pdfError}
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t px-3 py-4 sm:px-6 sm:py-5"
        style={{ borderColor: "var(--c-100)", background: "var(--c-50)" }}
      >
        <div
          className="flex items-end gap-2 rounded-2xl border px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3.5 transition-shadow focus-within:shadow-md"
          style={{
            borderColor: "var(--c-200)",
            background: "#fff",
            boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
          }}
        >
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask ScioAI to research a topic… (Enter to send)"
            rows={1}
            id="chat-input"
            className="flex-1 resize-none bg-transparent text-base outline-none disabled:opacity-60"
            style={{ color: "var(--c-900)", minHeight: "28px", maxHeight: "200px" }}
          />
          <button
            type="submit"
            disabled={!canSend}
            id="chat-send-btn"
            className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl transition disabled:opacity-30"
            style={{ background: "var(--c-900)", color: "#fff" }}
            onMouseEnter={(e) => { if (canSend) e.currentTarget.style.background = "var(--c-800)" }}
            onMouseLeave={(e) => { if (canSend) e.currentTarget.style.background = "var(--c-900)" }}
          >
            {isLoading
              ? <LoaderCircle className="h-4 w-4 animate-spin" />
              : <SendHorizontal className="size-[18px]" />}
          </button>
        </div>
        <p className="mt-3 text-center text-xs font-medium" style={{ color: "var(--c-400)" }}>
          ScioAI may produce errors · Verify important information
        </p>
      </form>
    </section>
  );
}
