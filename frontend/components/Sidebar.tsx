"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  MessageSquare,
  MoreHorizontal,
  PencilLine,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { ChatSessions } from "@/types/chat";

interface SidebarProps {
  sessions: ChatSessions;
  sessionIds: string[];
  activeSessionId: string | null;
  onNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, title: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

// ── Inline rename input ──────────────────────────────────────────────────────
function RenameInput({
  initialValue,
  onSave,
  onCancel,
}: {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const save = () => {
    const trimmed = value.trim();
    if (trimmed) onSave(trimmed);
    else onCancel();
  };

  return (
    <div className="flex w-full items-center gap-1">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") onCancel();
        }}
        onBlur={save}
        className="min-w-0 flex-1 rounded border px-2 py-0.5 text-sm font-semibold outline-none focus:ring-2"
        style={{
          background: "#fff",
          borderColor: "var(--c-300)",
          color: "var(--c-900)",
        }}
        aria-label="Rename session"
        maxLength={60}
      />
      <button
        onMouseDown={(e) => { e.preventDefault(); save(); }}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
        style={{ color: "var(--c-700)" }}
        aria-label="Confirm rename"
      >
        <Check size={13} />
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); onCancel(); }}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
        style={{ color: "var(--c-500)" }}
        aria-label="Cancel rename"
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ── Delete confirmation inline ───────────────────────────────────────────────
function DeleteConfirm({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      className="overflow-hidden"
    >
      <div
        className="mx-3 mt-1 rounded-xl border px-3 py-2.5 text-xs"
        style={{ borderColor: "var(--c-200)", background: "var(--c-50)" }}
      >
        <p className="mb-2 font-semibold" style={{ color: "var(--c-700)" }}>
          Delete this session?
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg border px-2 py-1 text-xs font-semibold transition"
            style={{ borderColor: "var(--c-900)", background: "var(--c-900)", color: "#fff" }}
            aria-label="Confirm delete session"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border px-2 py-1 text-xs font-semibold transition"
            style={{ borderColor: "var(--c-200)", background: "#fff", color: "var(--c-700)" }}
            aria-label="Cancel delete"
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Sidebar ─────────────────────────────────────────────────────────────
export default function Sidebar({
  sessions,
  sessionIds,
  activeSessionId,
  onNewSession,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
}: SidebarProps) {
  const [menuOpen, setMenuOpen]       = useState<string | null>(null);
  const [renamingId, setRenamingId]   = useState<string | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);

  const openMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen((prev) => (prev === id ? null : id));
    setDeletingId(null);
  };

  const startRename = (id: string) => {
    setMenuOpen(null);
    setDeletingId(null);
    setRenamingId(id);
  };

  const confirmRename = (id: string, title: string) => {
    onRenameSession(id, title);
    setRenamingId(null);
  };

  const startDelete = (id: string) => {
    setMenuOpen(null);
    setDeletingId(id);
  };

  const confirmDelete = (id: string) => {
    onDeleteSession(id);
    setDeletingId(null);
  };

  return (
    <aside
      className="flex h-full flex-col overflow-hidden sm:rounded-2xl border"
      style={{ background: "#fff", borderColor: "var(--c-200)" }}
      aria-label="Research sessions"
    >
      {/* ── Header ── */}
      <div className="border-b px-5 py-5" style={{ borderColor: "var(--c-100)" }}>
        {/* Logo */}
        <div className="mb-5 flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: "var(--c-900)" }}
            aria-hidden="true"
          >
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="font-heading text-base font-bold" style={{ color: "var(--c-900)" }}>
            ScioAI
          </span>
          <Link
            href="/"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-xl border transition hover:bg-charcoal-50"
            style={{ borderColor: "var(--c-200)", color: "var(--c-600)" }}
            aria-label="Back to home page"
            title="Back to home"
          >
            <ArrowLeft size={14} aria-hidden="true" />
          </Link>
        </div>

        {/* New session */}
        <button
          onClick={onNewSession}
          id="sidebar-new-chat-btn"
          className="btn-primary w-full py-2.5 text-sm rounded-xl"
          aria-label="Create a new research session"
        >
          <Plus size={16} aria-hidden="true" />
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
          <ul className="space-y-1 pt-1" role="listbox" aria-label="Research sessions">
            <AnimatePresence>
              {sessionIds.map((id) => {
                const session  = sessions[id];
                const isActive = id === activeSessionId;
                const msgCount = session?.messages.length ?? 0;
                const isRenaming = renamingId === id;
                const isDeleting = deletingId === id;

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
                      role="option"
                      aria-selected={isActive}
                      tabIndex={0}
                      className="group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition-all duration-150"
                      style={{
                        background: isActive ? "var(--c-900)" : "transparent",
                        color: isActive ? "#fff" : "var(--c-700)",
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--c-50)"; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                      onClick={() => { if (!isRenaming) { setMenuOpen(null); setDeletingId(null); onSelectSession(id); } }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isRenaming) onSelectSession(id);
                        if (e.key === "Escape") { setMenuOpen(null); setDeletingId(null); setRenamingId(null); }
                      }}
                    >
                      {/* Icon */}
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition"
                        style={{
                          background: isActive ? "rgba(255,255,255,0.2)" : "var(--c-100)",
                          color: isActive ? "#fff" : "var(--c-500)",
                        }}
                        aria-hidden="true"
                      >
                        <MessageSquare size={14} />
                      </div>

                      {/* Text / Rename input */}
                      <div className="min-w-0 flex-1">
                        {isRenaming ? (
                          <RenameInput
                            initialValue={session?.title ?? ""}
                            onSave={(title) => confirmRename(id, title)}
                            onCancel={() => setRenamingId(null)}
                          />
                        ) : (
                          <>
                            <p
                              className="truncate text-sm font-semibold"
                              style={{ color: isActive ? "#fff" : "var(--c-900)" }}
                            >
                              {session?.title ?? "Untitled Research"}
                            </p>
                            {msgCount > 0 && (
                              <p
                                className="text-xs mt-0.5"
                                style={{ color: isActive ? "rgba(255,255,255,0.6)" : "var(--c-400)" }}
                              >
                                {msgCount} message{msgCount !== 1 ? "s" : ""}
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      {/* More button (hidden when renaming) */}
                      {!isRenaming && (
                        <button
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-0 transition focus:opacity-100 group-hover:opacity-100"
                          style={{ color: isActive ? "#fff" : "var(--c-500)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = isActive ? "rgba(255,255,255,0.2)" : "var(--c-200)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          onClick={(e) => openMenu(id, e)}
                          aria-label={`Options for session "${session?.title ?? "Untitled Research"}"`}
                          aria-haspopup="menu"
                          aria-expanded={menuOpen === id}
                        >
                          <MoreHorizontal size={16} aria-hidden="true" />
                        </button>
                      )}

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
                            role="menu"
                            aria-label="Session options"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              role="menuitem"
                              className="flex w-full items-center gap-3 px-4 py-3 text-sm transition"
                              style={{ color: "var(--c-800)" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--c-50)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                              onClick={() => startRename(id)}
                            >
                              <PencilLine size={14} aria-hidden="true" />
                              Rename
                            </button>
                            <button
                              role="menuitem"
                              className="flex w-full items-center gap-3 px-4 py-3 text-sm transition"
                              style={{ color: "var(--c-600)" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--c-50)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                              onClick={() => startDelete(id)}
                            >
                              <Trash2 size={14} aria-hidden="true" />
                              Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Inline delete confirmation */}
                    <AnimatePresence>
                      {isDeleting && (
                        <DeleteConfirm
                          onConfirm={() => confirmDelete(id)}
                          onCancel={() => setDeletingId(null)}
                        />
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="border-t px-5 py-4" style={{ borderColor: "var(--c-100)", background: "var(--c-50)" }}>
        <p className="text-xs font-medium" style={{ color: "var(--c-400)" }}>
          ScioAI · Autonomous Research
        </p>
      </div>
    </aside>
  );
}
