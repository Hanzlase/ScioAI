"use client";

import ChatWindow from "@/components/ChatWindow";
import Sidebar from "@/components/Sidebar";
import { useChatSessions } from "@/hooks/useChatSessions";
import { Sparkles, Menu, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Use environment variable if provided, otherwise default to localhost in development.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "https://scioai-backend-production.up.railway.app");

interface ChatApiResponse {
  response: string;
  current_step: string;
  workflow_steps: string[];
}

export default function AppPage() {
  const {
    sessions,
    sessionIds,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    createSession,
    renameSession,
    deleteSession,
    addMessage,
    isHydrated,
  } = useChatSessions();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Close mobile sidebar when a session is selected
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [activeSessionId]);

  const handleRename = (sessionId: string, title: string) => {
    renameSession(sessionId, title);
  };

  const handleDelete = (sessionId: string) => {
    deleteSession(sessionId);
  };

  const handleSendMessage = async (query: string, sessionId: string) => {
    addMessage(sessionId, { role: "user", content: query, kind: "normal" });

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, query }),
      });

      if (!res.ok) {
        let detail = "";
        try {
          detail = ((await res.json()) as { detail?: string }).detail ?? "";
        } catch {
          /* noop */
        }
        throw new Error(
          res.status >= 500
            ? `Agents unreachable. Please try again.${detail ? ` (${detail})` : ""}`
            : `Request failed (${res.status}).${detail ? ` ${detail}` : ""}`
        );
      }

      const data: ChatApiResponse = await res.json();
      addMessage(sessionId, {
        role: "ai",
        content: data.response,
        workflowSteps: data.workflow_steps,
        kind: "normal",
      });
    } catch (err) {
      addMessage(sessionId, {
        role: "ai",
        content:
          err instanceof Error
            ? err.message
            : "Agents unreachable. Please try again.",
        kind: "error",
      });
    }
  };

  /* Loading skeleton during client hydration */
  if (!isHydrated) {
    return (
      <div
        className="flex h-[100dvh] items-center justify-center"
        style={{ background: "var(--c-50)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-md ring-1 ring-white/20"
            style={{ background: "var(--c-900)" }}
          >
            <Sparkles size={22} className="animate-pulse text-white" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Initializing ScioAI Workspace…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-[100dvh] overflow-hidden"
      style={{ background: "var(--c-100)" }}
    >
      {/* Desktop Sidebar (Collapsible: 275px -> 84px) */}
      <div
        className={`hidden h-full shrink-0 p-2 sm:p-2.5 lg:block transition-all duration-200 ${
          isSidebarCollapsed ? "w-[84px]" : "w-[275px]"
        }`}
      >
        <Sidebar
          sessions={sessions}
          sessionIds={sessionIds}
          activeSessionId={activeSessionId}
          onNewSession={createSession}
          onSelectSession={setActiveSessionId}
          onRenameSession={handleRename}
          onDeleteSession={handleDelete}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-[300px] flex-col p-2 shadow-2xl lg:hidden"
              style={{ background: "var(--c-100)" }}
            >
              <div className="mb-2 flex items-center justify-between px-2 pt-1">
                <span className="font-heading text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Navigation
                </span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 shadow-2xs"
                  aria-label="Close navigation sidebar"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                <Sidebar
                  sessions={sessions}
                  sessionIds={sessionIds}
                  activeSessionId={activeSessionId}
                  onNewSession={() => {
                    createSession();
                    setMobileSidebarOpen(false);
                  }}
                  onSelectSession={(id) => {
                    setActiveSessionId(id);
                    setMobileSidebarOpen(false);
                  }}
                  onRenameSession={handleRename}
                  onDeleteSession={handleDelete}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Workspace Canvas */}
      <div className="flex flex-1 flex-col overflow-hidden p-0 sm:p-2.5 sm:pl-0">
        {activeSessionId ? (
          <ChatWindow
            sessionId={activeSessionId}
            session={activeSession}
            onSendMessage={handleSendMessage}
            onOpenSidebar={() => setMobileSidebarOpen(true)}
          />
        ) : (
          <div
            className="flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-xs"
            style={{ borderColor: "var(--c-200)" }}
          >
            {/* Mobile Header for Empty State */}
            <div
              className="flex items-center justify-between border-b px-4 py-3 lg:hidden"
              style={{ borderColor: "var(--c-100)" }}
            >
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="rounded-lg border border-neutral-200 p-1.5 hover:bg-neutral-50"
                aria-label="Open sidebar menu"
              >
                <Menu size={18} />
              </button>
              <div className="flex items-center gap-2">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-white"
                  style={{ background: "var(--c-900)" }}
                >
                  <Sparkles size={12} />
                </div>
                <span className="font-heading text-sm font-bold text-neutral-900">
                  ScioAI
                </span>
              </div>
              <div className="w-8" />
            </div>

            <div className="flex flex-1 items-center justify-center p-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md"
              >
                <div
                  className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md ring-1 ring-white/20"
                  style={{ background: "var(--c-900)" }}
                >
                  <Sparkles size={24} />
                </div>
                <h2
                  className="font-heading text-2xl font-bold tracking-tight"
                  style={{ color: "var(--c-900)" }}
                >
                  No active session selected
                </h2>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: "var(--c-500)" }}
                >
                  Choose an existing research session from the sidebar or launch a fresh inquest.
                </p>
                <button
                  onClick={createSession}
                  className="btn-primary mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-xs"
                >
                  <Plus size={16} />
                  <span>Start New Research</span>
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
