"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clock,
  MessageSquare,
  Moon,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  PencilLine,
  Plus,
  Search,
  Sparkles,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { ChatSessions } from "@/types/chat";
import { useTheme } from "@/hooks/useTheme";

interface SidebarProps {
  sessions: ChatSessions;
  sessionIds: string[];
  activeSessionId: string | null;
  onNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, title: string) => void;
  onDeleteSession: (sessionId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
    <div className="flex w-full items-center gap-1.5 py-0.5">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") onCancel();
        }}
        onBlur={save}
        className="min-w-0 flex-1 rounded-lg border px-2 py-1 text-xs font-semibold outline-none transition"
        style={{
          background: "var(--input-bg)",
          borderColor: "var(--c-300)",
          color: "var(--c-900)",
        }}
        aria-label="Rename session"
        maxLength={60}
      />
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          save();
        }}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white transition"
        style={{ background: "var(--c-900)" }}
        aria-label="Confirm rename"
      >
        <Check size={12} />
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          onCancel();
        }}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition hover:bg-neutral-100"
        style={{ borderColor: "var(--c-200)", color: "var(--c-600)" }}
        aria-label="Cancel rename"
      >
        <X size={12} />
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
      transition={{ duration: 0.16 }}
      className="overflow-hidden"
    >
      <div
        className="mx-1 mt-1.5 rounded-xl border p-3 text-xs shadow-xs"
        style={{ borderColor: "var(--c-200)", background: "var(--c-100)" }}
      >
        <p className="mb-2 font-semibold" style={{ color: "var(--c-800)" }}>
          Delete this research session?
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
            aria-label="Confirm delete session"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition"
            style={{
              borderColor: "var(--c-200)",
              background: "var(--card-bg)",
              color: "var(--c-700)",
            }}
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
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, toggleTheme, isMounted } = useTheme();

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

  // Filtered session list based on search query
  const filteredSessionIds = useMemo(() => {
    if (!searchQuery.trim()) return sessionIds;
    const q = searchQuery.toLowerCase().trim();
    return sessionIds.filter((id) => {
      const s = sessions[id];
      if (!s) return false;
      return (
        s.title.toLowerCase().includes(q) ||
        s.messages.some((m) => m.content.toLowerCase().includes(q))
      );
    });
  }, [sessionIds, sessions, searchQuery]);

  // ── Collapsed Sidebar View ──
  if (isCollapsed) {
    return (
      <aside
        className="flex h-full w-full flex-col items-center justify-between overflow-hidden rounded-2xl border p-2.5 shadow-xs transition-all duration-200"
        style={{
          borderColor: "var(--c-200)",
          background: "var(--card-bg)",
        }}
        aria-label="Collapsed research navigation"
      >
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-2xs transition hover:scale-105"
            style={{ background: "var(--c-900)" }}
            title="ScioAI Home"
            aria-label="Return to ScioAI home"
          >
            <Sparkles size={18} />
          </Link>

          <button
            onClick={onNewSession}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs transition hover:scale-105 active:scale-95"
            style={{ background: "var(--c-900)" }}
            title="New Research Session (⌘N)"
            aria-label="New research session"
          >
            <Plus size={18} />
          </button>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="flex h-9 w-9 items-center justify-center rounded-lg border text-neutral-500 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
              style={{ borderColor: "var(--c-200)", color: "var(--c-600)" }}
              title="Expand Sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>
          )}

          <div className="my-1 h-px w-6" style={{ background: "var(--c-200)" }} />

          {/* Collapsed Session Icons */}
          <div className="flex max-h-[50vh] flex-col gap-1.5 overflow-y-auto no-scrollbar">
            {sessionIds.slice(0, 7).map((id) => {
              const isActive = id === activeSessionId;
              const s = sessions[id];
              return (
                <button
                  key={id}
                  onClick={() => onSelectSession(id)}
                  title={s?.title ?? "Research Session"}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                    isActive
                      ? "text-white shadow-xs"
                      : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                  style={{
                    background: isActive ? "var(--c-900)" : "transparent",
                  }}
                  aria-label={`Select session ${s?.title}`}
                >
                  <MessageSquare size={16} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer actions in collapsed mode */}
        <div className="flex flex-col items-center gap-2">
          {isMounted && (
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg border transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
              style={{ borderColor: "var(--c-200)", color: "var(--c-600)" }}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          )}

          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-lg border text-neutral-500 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
            style={{ borderColor: "var(--c-200)", color: "var(--c-600)" }}
            title="Back to Landing Page"
            aria-label="Back to landing page"
          >
            <ArrowLeft size={15} />
          </Link>
        </div>
      </aside>
    );
  }

  // ── Full Expanded Sidebar View ──
  return (
    <aside
      className="flex h-full w-full flex-col overflow-hidden rounded-2xl border shadow-xs transition-colors duration-200"
      style={{
        borderColor: "var(--c-200)",
        background: "var(--card-bg)",
      }}
      aria-label="Research sessions"
    >
      {/* ── Top Workspace Header ── */}
      <div className="border-b p-3.5" style={{ borderColor: "var(--c-100)" }}>
        {/* Brand Bar */}
        <div className="mb-3.5 flex items-center justify-between">
          <Link
            href="/"
            aria-label="ScioAI Workspace Home"
            className="group flex items-center gap-2.5"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-2xs transition group-hover:scale-105"
              style={{ background: "var(--c-900)" }}
              aria-hidden="true"
            >
              <Sparkles size={15} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className="font-heading text-sm font-bold tracking-tight"
                  style={{ color: "var(--c-900)" }}
                >
                  ScioAI
                </span>
                <span
                  className="rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold"
                  style={{
                    background: "var(--c-100)",
                    color: "var(--c-600)",
                  }}
                >
                  Workspace
                </span>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden h-8 w-8 items-center justify-center rounded-lg border text-neutral-500 transition hover:bg-neutral-100 dark:hover:bg-neutral-800 lg:flex"
                style={{ borderColor: "var(--c-200)", color: "var(--c-600)" }}
                aria-label="Collapse sidebar"
                title="Collapse Sidebar"
              >
                <PanelLeftClose size={15} />
              </button>
            )}

            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-lg border text-neutral-500 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
              style={{ borderColor: "var(--c-200)", color: "var(--c-600)" }}
              aria-label="Back to landing page"
              title="Return to Home"
            >
              <ArrowLeft size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* New Research CTA Button */}
        <button
          onClick={onNewSession}
          id="sidebar-new-chat-btn"
          className="group relative flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:opacity-95 active:scale-[0.99]"
          style={{ background: "var(--c-900)" }}
          aria-label="Create a new research session"
        >
          <div className="flex items-center gap-2">
            <Plus
              size={15}
              className="transition-transform group-hover:rotate-90"
              aria-hidden="true"
            />
            <span>New Research</span>
          </div>
          <span
            className="rounded px-1.5 py-0.5 font-mono text-[10px]"
            style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
          >
            ⌘N
          </span>
        </button>

        {/* Live Search & Filter Bar */}
        {sessionIds.length > 2 && (
          <div className="mt-2.5 relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--c-400)" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search research..."
              className="w-full rounded-lg pl-8 pr-7 py-1.5 text-xs outline-none transition"
              style={{
                background: "var(--c-100)",
                borderColor: "var(--c-200)",
                color: "var(--c-900)",
              }}
              aria-label="Filter research sessions"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-neutral-400 hover:text-neutral-700"
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Sessions Count & Section Title ── */}
      <div className="flex items-center justify-between px-3.5 pb-2 pt-3">
        <div
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--c-500)" }}
        >
          <Clock size={13} />
          <span>Research Dossiers</span>
        </div>
        <span
          className="rounded-full px-2 py-0.5 font-mono text-xs font-semibold"
          style={{
            background: "var(--c-100)",
            color: "var(--c-600)",
          }}
        >
          {filteredSessionIds.length}
        </span>
      </div>

      {/* ── Session History List ── */}
      <div className="flex-1 overflow-y-auto px-1.5 pb-2">
        {filteredSessionIds.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center px-3 text-center">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg border"
              style={{
                borderColor: "var(--c-200)",
                background: "var(--c-100)",
                color: "var(--c-400)",
              }}
            >
              <MessageSquare size={14} />
            </div>
            <p
              className="mt-2 text-xs font-semibold"
              style={{ color: "var(--c-700)" }}
            >
              {searchQuery ? "No matching dossiers" : "No sessions yet"}
            </p>
            <p
              className="mt-0.5 text-[10px]"
              style={{ color: "var(--c-400)" }}
            >
              {searchQuery
                ? "Try a different search query."
                : "Start an inquest to launch multi-agent research."}
            </p>
          </div>
        ) : (
          <ul
            className="space-y-0.5"
            role="listbox"
            aria-label="Research sessions"
          >
            <AnimatePresence>
              {filteredSessionIds.map((id) => {
                const session = sessions[id];
                const isActive = id === activeSessionId;
                const msgCount = session?.messages.length ?? 0;
                const isRenaming = renamingId === id;
                const isDeleting = deletingId === id;

                return (
                  <motion.li
                    key={id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.14 }}
                  >
                    <div
                      role="option"
                      aria-selected={isActive}
                      tabIndex={0}
                      className={`group relative flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-120 ${
                        isActive
                          ? "shadow-xs text-white"
                          : "hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                      }`}
                      style={{
                        background: isActive ? "var(--c-900)" : "transparent",
                        color: isActive ? "#fff" : "var(--c-800)",
                      }}
                      onClick={() => {
                        if (!isRenaming) {
                          setMenuOpen(null);
                          setDeletingId(null);
                          onSelectSession(id);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isRenaming)
                          onSelectSession(id);
                        if (e.key === "Escape") {
                          setMenuOpen(null);
                          setDeletingId(null);
                          setRenamingId(null);
                        }
                      }}
                    >
                      {/* Left icon with active status dot */}
                      <div
                        className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition`}
                        style={{
                          background: isActive
                            ? "rgba(255, 255, 255, 0.16)"
                            : "var(--c-100)",
                          color: isActive ? "#fff" : "var(--c-600)",
                        }}
                        aria-hidden="true"
                      >
                        <MessageSquare size={14} />
                        {isActive && (
                          <span
                            className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full"
                            style={{ background: "var(--ai-accent)" }}
                          />
                        )}
                      </div>

                      {/* Title / Input */}
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
                              className={`truncate text-xs sm:text-[13px] font-semibold leading-tight`}
                              style={{
                                color: isActive ? "#fff" : "var(--c-900)",
                              }}
                            >
                              {session?.title ?? "Untitled Research"}
                            </p>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span
                                className="text-[11px] font-medium"
                                style={{
                                  color: isActive
                                    ? "rgba(255, 255, 255, 0.7)"
                                    : "var(--c-500)",
                                }}
                              >
                                {msgCount > 0
                                  ? `${msgCount} turn${msgCount !== 1 ? "s" : ""}`
                                  : "Fresh session"}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Options menu trigger button */}
                      {!isRenaming && (
                        <button
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md opacity-0 transition focus:opacity-100 group-hover:opacity-100 ${
                            isActive
                              ? "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                              : "text-neutral-400 hover:bg-neutral-200 hover:text-neutral-900 dark:hover:bg-neutral-700"
                          }`}
                          onClick={(e) => openMenu(id, e)}
                          aria-label={`Options for session "${session?.title ?? "Untitled Research"}"`}
                          aria-haspopup="menu"
                          aria-expanded={menuOpen === id}
                        >
                          <MoreHorizontal size={14} aria-hidden="true" />
                        </button>
                      )}

                      {/* Dropdown menu */}
                      <AnimatePresence>
                        {menuOpen === id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.12 }}
                            className="absolute right-2 top-10 z-30 min-w-[120px] rounded-lg border p-1 shadow-lg ring-1 ring-black/5"
                            style={{
                              background: "var(--card-bg)",
                              borderColor: "var(--c-200)",
                            }}
                            role="menu"
                            aria-orientation="vertical"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              role="menuitem"
                              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              style={{ color: "var(--c-800)" }}
                              onClick={() => startRename(id)}
                            >
                              <PencilLine size={12} aria-hidden="true" />
                              Rename
                            </button>
                            <button
                              role="menuitem"
                              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/40"
                              onClick={() => startDelete(id)}
                            >
                              <Trash2 size={12} aria-hidden="true" />
                              Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Inline delete confirmation banner */}
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

      {/* ── Footer: Theme Toggle & Engine Status ── */}
      <div
        className="border-t p-3 text-xs"
        style={{ borderColor: "var(--c-100)", background: "var(--c-50)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ background: "var(--ai-accent)" }}
            />
            <span
              className="font-medium text-xs"
              style={{ color: "var(--c-700)" }}
            >
              Triad Engine Online
            </span>
          </div>

          {isMounted && (
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
              style={{
                borderColor: "var(--c-200)",
                background: "var(--card-bg)",
                color: "var(--c-700)",
              }}
              aria-label={`Toggle to ${theme === "dark" ? "light" : "dark"} mode`}
              title="Toggle Light/Dark Theme"
            >
              {theme === "dark" ? (
                <>
                  <Sun size={12} />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon size={12} className="text-neutral-600" />
                  <span>Dark</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
