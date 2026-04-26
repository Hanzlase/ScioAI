"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  FilePenLine,
  LoaderCircle,
  Search,
  SendHorizontal,
  ShieldCheck,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ChatSession } from "@/types/chat";

interface ChatWindowProps {
  sessionId: string | null;
  session: ChatSession | null;
  onSendMessage: (query: string, sessionId: string) => Promise<void>;
}

const stageConfig = [
  {
    key: "researcher",
    label: "Researcher is gathering data...",
    Icon: Search,
    color: "text-cyan-700",
  },
  {
    key: "writer",
    label: "Writer is drafting...",
    Icon: FilePenLine,
    color: "text-orange-700",
  },
  {
    key: "critic",
    label: "Critic is verifying...",
    Icon: ShieldCheck,
    color: "text-emerald-700",
  },
] as const;

const parseFilename = (headerValue: string | null): string | null => {
  if (!headerValue) return null;
  const match = /filename="([^"]+)"/i.exec(headerValue);
  return match?.[1] ?? null;
};

const headingFilename = (markdownText: string): string => {
  const heading = /^#\s+(.+)$/m.exec(markdownText)?.[1] ?? "scioai-report";
  const safe = heading
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return safe || "scioai-report";
};

export default function ChatWindow({ sessionId, session, onSendMessage }: ChatWindowProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages.length, isLoading]);

  useEffect(() => {
    if (!isLoading) return;
    setStageIndex(0);

    const interval = setInterval(() => {
      setStageIndex((prev) => (prev < stageConfig.length - 1 ? prev + 1 : prev));
    }, 1250);

    return () => clearInterval(interval);
  }, [isLoading]);

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

  const handleDownloadPdf = async (markdownText: string, index: number) => {
    setPdfError(null);
    setDownloadingIndex(index);

    try {
      const fallbackName = headingFilename(markdownText);
      const response = await fetch("http://localhost:8000/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markdown: markdownText,
          filename: fallbackName,
        }),
      });

      if (!response.ok) {
        throw new Error(`PDF request failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const fileName =
        parseFilename(response.headers.get("content-disposition")) ?? `${fallbackName}.pdf`;
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : "Failed to download PDF.");
    } finally {
      setDownloadingIndex(null);
    }
  };

  return (
    <section className="relative flex h-full flex-col rounded-3xl border border-cyan-200 bg-white/80 shadow-glass">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
        {session?.messages.map((message, index) => {
          const isUser = message.role === "user";
          const isLatestAi = !isUser && index === lastAiMessageIndex;

          return (
            <div key={`${index}-${message.role}`} className={isUser ? "ml-auto max-w-[82%]" : "mr-auto max-w-[84%]"}>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? "border border-cyan-300 bg-cyan-100 text-cyan-950"
                    : "border border-emerald-300 bg-emerald-100 text-emerald-950"
                }`}
              >
                {isUser ? (
                  message.content
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} className="scio-markdown">
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>

              {!isUser && message.workflowSteps && message.workflowSteps.length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                  {message.workflowSteps.map((step) => (
                    <span
                      key={`${index}-${step}`}
                      className="rounded-full border border-cyan-300 bg-cyan-50 px-2 py-1 font-semibold text-cyan-800"
                    >
                      {step}
                    </span>
                  ))}
                </div>
              ) : null}

              {isLatestAi ? (
                <button
                  onClick={() => handleDownloadPdf(message.content, index)}
                  disabled={downloadingIndex === index}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl border border-fuchsia-500 bg-fuchsia-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-fuchsia-600 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300"
                >
                  {downloadingIndex === index ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Building PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download Report (PDF)
                    </>
                  )}
                </button>
              ) : null}
            </div>
          );
        })}

        {isLoading ? (
          <div className="mr-auto w-full max-w-[78%] rounded-2xl border border-fuchsia-300 bg-fuchsia-100 px-4 py-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-fuchsia-900">
              <LoaderCircle className="h-5 w-5 animate-spin text-fuchsia-700" />
              LangGraph pipeline running...
            </div>

            <div className="space-y-2">
              {stageConfig.map((stage, idx) => {
                const Icon = stage.Icon;
                const isDone = idx < stageIndex;
                const isActive = idx === stageIndex;
                return (
                  <div
                    key={stage.key}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                      isActive
                        ? "border-cyan-300 bg-cyan-50 text-cyan-900"
                        : "border-pink-200 bg-pink-50/70 text-slate-600"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Icon className={`h-4 w-4 ${stage.color} ${isActive ? "animate-pulse" : ""}`} />
                    )}
                    <span>{stage.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {pdfError ? (
          <div className="mr-auto max-w-[78%] rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            PDF download error: {pdfError}
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 mt-auto flex items-end gap-3 rounded-b-3xl border-t border-cyan-200 bg-gradient-to-r from-cyan-50 via-white to-amber-50 p-4"
      >
        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={isLoading}
          placeholder="Ask ScioAI to research a topic..."
          rows={2}
          className="max-h-40 min-h-[52px] flex-1 resize-y rounded-2xl border border-cyan-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-200 disabled:cursor-not-allowed disabled:opacity-75"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl border border-fuchsia-500 bg-fuchsia-500 text-white transition hover:bg-fuchsia-600 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300"
        >
          <SendHorizontal size={18} />
        </button>
      </form>
    </section>
  );
}
