"use client";

import ChatWindow from "@/components/ChatWindow";
import Sidebar from "@/components/Sidebar";
import { useChatSessions } from "@/hooks/useChatSessions";
import { Sparkles } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

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

  const handleRename = (sessionId: string) => {
    const existing = sessions[sessionId]?.title ?? "";
    const nextTitle = window.prompt("Rename this session:", existing);
    if (nextTitle === null) return;
    renameSession(sessionId, nextTitle);
  };

  const handleDelete = (sessionId: string) => {
    const confirmed = window.confirm("Delete this chat session?");
    if (!confirmed) return;
    deleteSession(sessionId);
  };

  const handleSendMessage = async (query: string, sessionId: string) => {
    addMessage(sessionId, { role: "user", content: query, kind: "normal" });

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, query }),
      });

      if (!response.ok) {
        let backendDetail = "";
        try {
          const payload = (await response.json()) as { detail?: string };
          backendDetail = payload.detail ? ` (${payload.detail})` : "";
        } catch {
          backendDetail = "";
        }

        if (response.status >= 500) {
          throw new Error(
            `The research agents are currently unreachable. Please try again.${backendDetail}`,
          );
        }
        throw new Error(`Request failed with status ${response.status}.${backendDetail}`);
      }

      const data: ChatApiResponse = await response.json();
      addMessage(sessionId, {
        role: "ai",
        content: data.response,
        workflowSteps: data.workflow_steps,
        kind: "normal",
      });
    } catch (error) {
      const message = (() => {
        if (error instanceof TypeError) {
          return "The research agents are currently unreachable. Please try again.";
        }
        if (error instanceof Error) return error.message;
        return "The research agents are currently unreachable. Please try again.";
      })();

      addMessage(sessionId, { role: "ai", content: message, kind: "error" });
    }
  };

  /* Loading skeleton */
  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl brand-gradient shadow-glass-md">
            <Sparkles size={26} className="animate-pulse text-white" />
          </div>
          <p className="text-sm font-medium text-slate-500">Initializing ScioAI workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      {/* ── Sidebar ── */}
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

      {/* ── Main chat area ── */}
      <div className="flex flex-1 flex-col overflow-hidden p-3 lg:pl-0">
        {activeSessionId ? (
          <ChatWindow
            sessionId={activeSessionId}
            session={activeSession}
            onSendMessage={handleSendMessage}
          />
        ) : (
          /* No sessions state */
          <div className="flex h-full items-center justify-center rounded-2xl border border-surface-200 bg-white shadow-glass">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl brand-gradient shadow-glass-md">
                <Sparkles size={26} className="text-white" />
              </div>
              <h2 className="font-heading text-xl font-bold text-slate-900">
                No session selected
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Create a new research session to get started.
              </p>
              <button onClick={createSession} className="btn-primary mt-6 rounded-xl px-6 py-2.5">
                Start New Research
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
