"use client";

import ChatWindow from "@/components/ChatWindow";
import Sidebar from "@/components/Sidebar";
import { useChatSessions } from "@/hooks/useChatSessions";
import { Sparkles, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Use the environment variable if provided, otherwise default to localhost for development.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 
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
    sessions, sessionIds, activeSession, activeSessionId,
    setActiveSessionId, createSession, renameSession, deleteSession,
    addMessage, isHydrated,
  } = useChatSessions();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Close mobile sidebar when a session is selected
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [activeSessionId]);

  const handleRename = (sessionId: string) => {
    const next = window.prompt("Rename session:", sessions[sessionId]?.title ?? "");
    if (next === null) return;
    renameSession(sessionId, next);
  };

  const handleDelete = (sessionId: string) => {
    if (!window.confirm("Delete this session?")) return;
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
        try { detail = ((await res.json()) as { detail?: string }).detail ?? ""; } catch { /* noop */ }
        throw new Error(
          res.status >= 500
            ? `Agents unreachable. Please try again.${detail ? ` (${detail})` : ""}`
            : `Request failed (${res.status}).${detail ? ` ${detail}` : ""}`,
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
        content: err instanceof Error
          ? err.message
          : "Agents unreachable. Please try again.",
        kind: "error",
      });
    }
  };

  /* Loading skeleton */
  if (!isHydrated) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-charcoal-50" style={{ background: "var(--c-50)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--c-900)" }}>
            <Sparkles size={24} className="animate-pulse text-white" />
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--c-500)" }}>Initializing workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden" style={{ background: "var(--c-100)" }}>
      {/* Desktop Sidebar */}
      <div className="hidden h-full w-[280px] shrink-0 p-3 lg:block">
        <Sidebar
          sessions={sessions}
          sessionIds={sessionIds}
          activeSessionId={activeSessionId}
          onNewSession={createSession}
          onSelectSession={setActiveSessionId}
          onRenameSession={handleRename}
          onDeleteSession={handleDelete}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] p-3 shadow-2xl lg:hidden"
              style={{ background: "var(--c-100)" }}
            >
              <div className="absolute right-[-40px] top-4">
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-charcoal-900 shadow-md"
                >
                  <X size={20} />
                </button>
              </div>
              <Sidebar
                sessions={sessions}
                sessionIds={sessionIds}
                activeSessionId={activeSessionId}
                onNewSession={createSession}
                onSelectSession={setActiveSessionId}
                onRenameSession={handleRename}
                onDeleteSession={handleDelete}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col overflow-hidden p-0 sm:p-3 sm:pl-0">
        {activeSessionId ? (
          <ChatWindow
            sessionId={activeSessionId}
            session={activeSession}
            onSendMessage={handleSendMessage}
            onOpenSidebar={() => setMobileSidebarOpen(true)}
          />
        ) : (
          <div className="card flex h-full flex-col sm:rounded-2xl border-0 sm:border">
            {/* Mobile Header for Empty State */}
            <div className="flex items-center border-b px-4 py-3 lg:hidden" style={{ borderColor: "var(--c-100)" }}>
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="mr-3 rounded-md p-1.5 hover:bg-charcoal-50"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2">
                 <div className="flex h-6 w-6 items-center justify-center rounded bg-charcoal-900">
                    <Sparkles size={12} className="text-white" />
                 </div>
                 <span className="font-heading text-sm font-bold">ScioAI</span>
              </div>
            </div>
            
            <div className="flex flex-1 items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--c-900)" }}>
                  <Sparkles size={24} className="text-white" />
                </div>
                <h2 className="font-heading text-xl font-bold sm:text-2xl" style={{ color: "var(--c-900)" }}>
                  No session selected
                </h2>
                <p className="mt-2 text-base" style={{ color: "var(--c-500)" }}>
                  Create a new session to start researching.
                </p>
                <button onClick={createSession} className="btn-primary mt-6 rounded-xl px-6 py-3 text-base">
                  New Research Session
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
