"use client";

import ChatWindow from "@/components/ChatWindow";
import Sidebar from "@/components/Sidebar";
import { useChatSessions } from "@/hooks/useChatSessions";

interface ChatApiResponse {
  response: string;
  current_step: string;
  workflow_steps: string[];
}

export default function HomePage() {
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
    addMessage(sessionId, { role: "user", content: query });

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          query,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data: ChatApiResponse = await response.json();
      addMessage(sessionId, {
        role: "ai",
        content: data.response,
        workflowSteps: data.workflow_steps,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? `Backend error: ${error.message}`
          : "Backend error: unable to complete this request.";
      addMessage(sessionId, { role: "ai", content: message });
    }
  };

  if (!isHydrated) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="rounded-2xl border border-cyan-200 bg-white/85 px-6 py-4 text-sm font-medium text-cyan-900 shadow-glass">
          Initializing ScioAI workspace...
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 gap-4 p-4 lg:grid-cols-[320px_1fr] lg:p-6">
      <Sidebar
        sessions={sessions}
        sessionIds={sessionIds}
        activeSessionId={activeSessionId}
        onNewSession={createSession}
        onSelectSession={setActiveSessionId}
        onRenameSession={handleRename}
        onDeleteSession={handleDelete}
      />

      <div className="flex min-h-[85vh] flex-col gap-3">
        <header className="rounded-3xl border border-cyan-200 bg-white/80 px-6 py-4 shadow-glass">
          <h1 className="text-2xl font-bold text-slate-900">ScioAI Research Agent</h1>
          <p className="text-sm text-slate-600">
            Search + Vector Context + LLM responses in one fast research loop.
          </p>
        </header>

        <div className="min-h-0 flex-1">
          <ChatWindow
            sessionId={activeSessionId}
            session={activeSession}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </main>
  );
}
