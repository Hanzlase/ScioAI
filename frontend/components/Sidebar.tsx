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
import { motion, AnimatePresence } from "framer-motion";

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
    <aside className="flex h-full flex-col overflow-hidden sm:rounded-2xl border" style={{ background: "#fff", borderColor: "var(--c-200)" }}>

      {/* ── Header ── */}
      <div className="border-b px-5 py-5" style={{ borderColor: "var(--c-100)" }}>
        {/* Logo */}
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "var(--c-900)" }}>
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="font-heading text-base font-bold" style={{ color: "var(--c-900)" }}>ScioAI</span>
          <Link
            href="/"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-xl border transition hover:bg-charcoal-50"
            style={{ borderColor: "var(--c-200)", color: "var(--c-600)" }}
            title="Home"
          >
            <ArrowLeft size={14} />
          </Link>
        </div>

        {/* New session */}
        <button
          onClick={onNewSession}
          id="sidebar-new-chat-btn"
          className="btn-primary w-full py-2.5 text-sm rounded-xl"
        >
          <Plus size={16} />
          New Research
        </button>
      </div>

      {/* ── Count label ── */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--c-400)" }}>
          Sessions · {sessionIds.length}
        </p>
      </div>

      {/* ── Session list ── */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {sessionIds.length === 0 ? (
          <p className="mt-10 text-center text-sm" style={{ color: "var(--c-400)" }}>
            No sessions yet.
          </p>
        ) : (
          <ul className="space-y-1 pt-1">
            <AnimatePresence>
              {sessionIds.map((id) => {
                const session = sessions[id];
                const isActive = id === activeSessionId;
                const msgCount = session?.messages.length ?? 0;

                return (
                  <motion.li 
                    key={id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      className="group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition-all duration-150"
                      style={{ 
                        background: isActive ? "var(--c-900)" : "transparent",
                        color: isActive ? "#fff" : "var(--c-700)"
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--c-50)" }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent" }}
                      onClick={() => { setMenuOpen(null); onSelectSession(id); }}
                      onKeyDown={(e) => e.key === "Enter" && onSelectSession(id)}
                    >
                      {/* Icon */}
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition"
                        style={{
                           background: isActive ? "rgba(255,255,255,0.2)" : "var(--c-100)",
                           color: isActive ? "#fff" : "var(--c-500)"
                        }}
                      >
                        <MessageSquare size={14} />
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold" style={{ color: isActive ? "#fff" : "var(--c-900)" }}>
                          {session?.title ?? "Untitled Research"}
                        </p>
                        {msgCount > 0 && (
                          <p className="text-xs mt-0.5" style={{ color: isActive ? "rgba(255,255,255,0.6)" : "var(--c-400)" }}>
                            {msgCount} message{msgCount !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>

                      {/* More button */}
                      <button
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-0 transition focus:opacity-100 group-hover:opacity-100"
                        style={{
                           color: isActive ? "#fff" : "var(--c-500)",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = isActive ? "rgba(255,255,255,0.2)" : "var(--c-200)" }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                        onClick={(e) => toggleMenu(id, e)}
                        aria-label="Session options"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {/* Dropdown */}
                      <AnimatePresence>
                        {menuOpen === id && (
                          <motion.div
                            initial={{ opacity: 0, y: -5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-2 top-11 z-50 min-w-[150px] overflow-hidden rounded-xl border shadow-lg"
                            style={{ background: "#fff", borderColor: "var(--c-200)" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="flex w-full items-center gap-3 px-4 py-3 text-sm transition"
                              style={{ color: "var(--c-800)" }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-50)"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                              onClick={() => { setMenuOpen(null); onRenameSession(id); }}
                            >
                              <PencilLine size={14} />
                              Rename
                            </button>
                            <button
                              className="flex w-full items-center gap-3 px-4 py-3 text-sm transition"
                              style={{ color: "var(--c-600)" }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-50)"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                              onClick={() => { setMenuOpen(null); onDeleteSession(id); }}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="border-t px-5 py-4" style={{ borderColor: "var(--c-100)", background: "var(--c-50)" }}>
        <p className="text-xs font-medium" style={{ color: "var(--c-400)" }}>ScioAI · Agents</p>
      </div>
    </aside>
  );
}
