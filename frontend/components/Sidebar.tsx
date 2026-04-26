"use client";

import { PlusCircle, PencilLine, Trash2 } from "lucide-react";

import { ChatSessions } from "@/types/chat";

interface SidebarProps {
  sessions: ChatSessions;
  sessionIds: string[];
  activeSessionId: string | null;
  onNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export default function Sidebar({
  sessions,
  sessionIds,
  activeSessionId,
  onNewSession,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
}: SidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col rounded-3xl border border-amber-300 bg-gradient-to-b from-amber-100 via-orange-100 to-pink-100 p-4 shadow-glass">
      <button
        onClick={onNewSession}
        className="mb-4 flex items-center justify-center gap-2 rounded-2xl border border-orange-400 bg-orange-500 px-4 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-orange-600"
      >
        <PlusCircle size={18} />
        New Chat
      </button>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {sessionIds.map((id) => {
          const session = sessions[id];
          const isActive = id === activeSessionId;

          return (
            <div
              key={id}
              className={`group cursor-pointer rounded-2xl border p-3 transition ${
                isActive
                  ? "border-fuchsia-500 bg-fuchsia-100/80"
                  : "border-orange-200 bg-white/70 hover:border-cyan-400 hover:bg-cyan-50"
              }`}
              onClick={() => onSelectSession(id)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm font-semibold text-slate-800">{session.title}</p>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    aria-label="Rename session"
                    className="rounded-lg p-1 text-cyan-700 hover:bg-cyan-200"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRenameSession(id);
                    }}
                  >
                    <PencilLine size={16} />
                  </button>
                  <button
                    aria-label="Delete session"
                    className="rounded-lg p-1 text-rose-700 hover:bg-rose-200"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteSession(id);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
