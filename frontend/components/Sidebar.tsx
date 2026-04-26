"use client";

import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  MoreHorizontal,
  PencilLine,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState } from "react";

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
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen((prev) => (prev === id ? null : id));
  };

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-glass">
      {/* ── Header ── */}
      <div className="border-b border-surface-100 px-4 py-4">
        {/* Logo row */}
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg brand-gradient shadow-sm">
            <Sparkles size={15} className="text-white" />
          </div>
          <span className="font-heading text-base font-bold text-slate-900">ScioAI</span>
          <span className="ml-auto">
            <Link
              href="/"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-200 text-slate-500 transition hover:bg-surface-50 hover:text-indigo-600"
              title="Back to Home"
            >
              <ArrowLeft size={14} />
            </Link>
          </span>
        </div>

        {/* New Chat button */}
        <button
          onClick={onNewSession}
          className="btn-primary w-full rounded-xl py-2.5 text-sm"
          id="sidebar-new-chat-btn"
        >
          <Plus size={16} />
          New Research
        </button>
      </div>

      {/* ── Session count ── */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Sessions · {sessionIds.length}
        </p>
      </div>

      {/* ── Session list ── */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {sessionIds.length === 0 ? (
          <div className="mt-8 text-center text-sm text-slate-400">
            No sessions yet. Start a new research!
          </div>
        ) : (
          <ul className="space-y-1 pt-1">
            {sessionIds.map((id) => {
              const session = sessions[id];
              const isActive = id === activeSessionId;
              const msgCount = session?.messages.length ?? 0;

              return (
                <li key={id}>
                  <div
                    role="button"
                    tabIndex={0}
                    className={`group relative flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-150 ${
                      isActive
                        ? "border-brand-200 bg-brand-50 shadow-sm"
                        : "border-transparent hover:border-surface-200 hover:bg-surface-50"
                    }`}
                    onClick={() => {
                      setMenuOpen(null);
                      onSelectSession(id);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && onSelectSession(id)}
                  >
                    {/* Icon */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                        isActive
                          ? "brand-gradient text-white shadow-sm"
                          : "bg-surface-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                      }`}
                    >
                      <MessageSquare size={14} />
                    </div>

                    {/* Title + count */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-semibold ${
                          isActive ? "text-brand-700" : "text-slate-800"
                        }`}
                      >
                        {session?.title ?? "Untitled Research"}
                      </p>
                      {msgCount > 0 && (
                        <p className="text-xs text-slate-400">
                          {msgCount} message{msgCount !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>

                    {/* Context menu trigger */}
                    <button
                      className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 opacity-0 transition hover:bg-surface-200 hover:text-slate-700 group-hover:opacity-100"
                      onClick={(e) => toggleMenu(id, e)}
                      aria-label="Session options"
                    >
                      <MoreHorizontal size={14} />
                    </button>

                    {/* Dropdown menu */}
                    {menuOpen === id && (
                      <div
                        className="absolute right-2 top-10 z-50 min-w-[140px] overflow-hidden rounded-xl border border-surface-200 bg-white shadow-glass-md"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                          onClick={() => {
                            setMenuOpen(null);
                            onRenameSession(id);
                          }}
                        >
                          <PencilLine size={14} />
                          Rename
                        </button>
                        <button
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50"
                          onClick={() => {
                            setMenuOpen(null);
                            onDeleteSession(id);
                          }}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-surface-100 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles size={12} className="text-indigo-400" />
          <span>ScioAI · Multi-Agent Research</span>
        </div>
      </div>
    </aside>
  );
}
