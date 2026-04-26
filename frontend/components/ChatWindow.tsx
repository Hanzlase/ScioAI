"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Download,
  LoaderCircle,
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

interface ChatWindowProps {
  sessionId: string | null;
  session: ChatSession | null;
  onSendMessage: (query: string, sessionId: string) => Promise<void>;
}

const loadingStages = [
  { label: "Agents analyzing request…", icon: Zap },
  { label: "Searching web & vector store…", icon: ScanSearch },
  { label: "Drafting & reviewing report…", icon: Sparkles },
] as const;

const parseFilename = (headerValue: string | null): string | null => {
  if (!headerValue) return null;
  const match = /filename="([^"]+)"/i.exec(headerValue);
  return match?.[1] ?? null;
};

const buildDownloadBaseName = (sessionTitle: string | undefined) => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\..+$/, "")
    .replace("T", "-");
  const slug = (sessionTitle ?? "Report")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `ScioAI-${slug || "Report"}-${timestamp}`;
};

const agentStepLabels: Record<string, string> = {
  researcher: "Researcher",
  writer: "Writer",
  critic: "Critic",
};

const agentStepColors: Record<string, string> = {
  researcher: "badge-brand",
  writer: "badge-accent",
  critic: "badge-green",
};

export default function ChatWindow({ sessionId, session, onSendMessage }: ChatWindowProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /* Reset on session change */
  useEffect(() => {
    setQuery("");
    setIsLoading(false);
    setStageIndex(0);
    setDownloadingIndex(null);
    setPdfError(null);
  }, [sessionId]);

  /* Scroll to bottom on new content */
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    return () => cancelAnimationFrame(id);
  }, [session?.messages.length, isLoading, stageIndex]);

  /* Cycle loading stages */
  useEffect(() => {
    if (!isLoading) return;
    setStageIndex(0);
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev < loadingStages.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
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

  const lastAiMessageIndex = useMemo(() => {
    if (!session) return -1;
    for (let i = session.messages.length - 1; i >= 0; i -= 1) {
      if (session.messages[i].role === "ai") return i;
    }
    return -1;
  }, [session]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

  const handleDownloadPdf = async (markdownText: string, index: number) => {
    setPdfError(null);
    setDownloadingIndex(index);
    try {
      const baseName = buildDownloadBaseName(session?.title);
      const response = await fetch(`${API_BASE_URL}/api/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: markdownText, filename: baseName }),
      });
      if (!response.ok) throw new Error("The report could not be exported right now. Please retry.");
      const blob = await response.blob();
      const nameFromHeader = parseFilename(response.headers.get("content-disposition"));
      const fileName = nameFromHeader ?? `${baseName}.pdf`;
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setPdfError(
        error instanceof Error
          ? error.message
          : "The report could not be exported right now. Please retry.",
      );
    } finally {
      setDownloadingIndex(null);
    }
  };

  /* ── Empty state ── */
  if (!session || session.messages.length === 0) {
    return (
      <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-glass">
        {/* Chat header */}
        <ChatHeader session={session} />

        {/* Empty state */}
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl brand-gradient shadow-glass-md">
            <Sparkles size={30} className="text-white" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-900">
              Start a Research Session
            </h2>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Ask ScioAI anything. Our agents will research the web, retrieve relevant context, and deliver
              a citation-grounded report.
            </p>
          </div>

          {/* Suggestion chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "What are the latest advances in quantum computing?",
              "Explain the impact of AI on healthcare diagnostics.",
              "Summarize the current state of renewable energy.",
            ].map((suggestion) => (
              <button
                key={suggestion}
                className="rounded-xl border border-surface-200 bg-surface-50 px-4 py-2 text-xs font-medium text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                onClick={() => {
                  if (sessionId) {
                    setQuery(suggestion);
                    textareaRef.current?.focus();
                  }
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <ChatInput
          query={query}
          setQuery={setQuery}
          canSend={canSend}
          isLoading={isLoading}
          textareaRef={textareaRef}
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
        />
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-glass">
      {/* Chat header */}
      <ChatHeader session={session} />

      {/* Messages */}
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {session.messages.map((message, index) => {
          const isUser = message.role === "user";
          const isError = message.kind === "error";
          const isLatestAi = !isUser && index === lastAiMessageIndex;

          return (
            <div
              key={`${index}-${message.role}`}
              className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${
                  isUser
                    ? "bg-slate-900 text-white"
                    : isError
                      ? "bg-rose-100 text-rose-600"
                      : "brand-gradient text-white"
                }`}
              >
                {isUser ? <User size={14} /> : <Bot size={14} />}
              </div>

              <div className={`flex max-w-[82%] flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
                {/* Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? "rounded-tr-sm bg-slate-900 text-white"
                      : isError
                        ? "rounded-tl-sm border border-rose-200 bg-rose-50 text-rose-800"
                        : "rounded-tl-sm border border-surface-200 bg-surface-50 text-slate-800"
                  }`}
                >
                  {isUser || isError ? (
                    message.content
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      className="scio-markdown prose prose-sm max-w-none"
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>

                {/* Workflow step pills */}
                {!isUser && !isError && message.workflowSteps && message.workflowSteps.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {message.workflowSteps.map((step) => (
                      <span
                        key={`${index}-${step}`}
                        className={`step-pill done ${agentStepColors[step] ?? "badge-brand"}`}
                      >
                        <CheckCircle2 size={10} />
                        {agentStepLabels[step] ?? step}
                      </span>
                    ))}
                  </div>
                )}

                {/* PDF Download (latest AI only) */}
                {isLatestAi && !isError && (
                  <button
                    onClick={() => handleDownloadPdf(message.content, index)}
                    disabled={downloadingIndex === index}
                    id="download-pdf-btn"
                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloadingIndex === index ? (
                      <>
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                        Generating PDF…
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        Download Report (PDF)
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full brand-gradient text-white shadow-sm">
              <Bot size={14} />
            </div>
            <div className="max-w-sm rounded-2xl rounded-tl-sm border border-brand-200 bg-white p-4 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-pulse text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-700">
                  Multi-agent pipeline running
                </span>
              </div>
              <div className="space-y-2">
                {loadingStages.map(({ label, icon: Icon }, idx) => {
                  const isDone = idx < stageIndex;
                  const isActive = idx === stageIndex;
                  return (
                    <div
                      key={label}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition ${
                        isDone
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : isActive
                            ? "border border-brand-200 bg-brand-50 text-brand-700"
                            : "border border-surface-100 bg-surface-50 text-slate-400"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Icon
                          className={`h-3.5 w-3.5 ${isActive ? "animate-pulse text-indigo-500" : "text-slate-300"}`}
                        />
                      )}
                      <span>{label}</span>
                      {isActive && (
                        <span className="ml-auto flex gap-1">
                          <span className="loading-dot animate-dot-1" />
                          <span className="loading-dot animate-dot-2" />
                          <span className="loading-dot animate-dot-3" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PDF error */}
        {pdfError && (
          <div className="mx-auto flex max-w-sm items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
            <RotateCcw size={12} />
            {pdfError}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        query={query}
        setQuery={setQuery}
        canSend={canSend}
        isLoading={isLoading}
        textareaRef={textareaRef}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
      />
    </section>
  );
}

/* ── Sub-components ── */

function ChatHeader({ session }: { session: ChatSession | null }) {
  return (
    <div className="flex items-center gap-3 border-b border-surface-100 px-5 py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient shadow-sm">
        <Sparkles size={16} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-heading text-base font-bold text-slate-900">
          {session?.title ?? "ScioAI Research Agent"}
        </h1>
        <p className="text-xs text-slate-500">
          Researcher · Writer · Critic · Llama 3.3 70B
        </p>
      </div>
      {/* Status pill */}
      <span className="badge badge-green shrink-0">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Online
      </span>
    </div>
  );
}

interface ChatInputProps {
  query: string;
  setQuery: (v: string) => void;
  canSend: boolean;
  isLoading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

function ChatInput({
  query,
  setQuery,
  canSend,
  isLoading,
  textareaRef,
  onSubmit,
  onKeyDown,
}: ChatInputProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="border-t border-surface-100 bg-surface-50 px-4 py-3"
    >
      <div className="flex items-end gap-3 rounded-2xl border border-surface-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-brand-300 focus-within:shadow-card">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isLoading}
          placeholder="Ask ScioAI to research a topic… (Enter to send, Shift+Enter for newline)"
          rows={1}
          id="chat-input"
          className="flex-1 resize-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-70"
          style={{ minHeight: "24px", maxHeight: "160px" }}
        />
        <button
          type="submit"
          disabled={!canSend}
          id="chat-send-btn"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            background: canSend
              ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
              : "#cbd5e1",
          }}
        >
          {isLoading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizontal size={16} />
          )}
        </button>
      </div>
      <p className="mt-1.5 text-center text-[10px] text-slate-400">
        ScioAI may produce errors. Verify important information.
      </p>
    </form>
  );
}
