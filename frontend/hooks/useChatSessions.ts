"use client";

import { useEffect, useMemo, useState } from "react";

import { ChatMessage, ChatSession, ChatSessions } from "@/types/chat";

const STORAGE_KEY = "scioai.sessions.v1";
const ACTIVE_KEY = "scioai.activeSession.v1";

const newSession = (): ChatSession => ({
  title: "Untitled Research",
  messages: [],
});

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<ChatSessions>({});
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const createSession = () => {
    const sessionId = crypto.randomUUID();
    setSessions((prev) => ({
      [sessionId]: newSession(),
      ...prev,
    }));
    setActiveSessionId(sessionId);
    return sessionId;
  };

  useEffect(() => {
    try {
      const rawSessions = localStorage.getItem(STORAGE_KEY);
      const rawActiveId = localStorage.getItem(ACTIVE_KEY);

      if (rawSessions) {
        const parsed: ChatSessions = JSON.parse(rawSessions);
        const keys = Object.keys(parsed);
        setSessions(parsed);

        if (rawActiveId && parsed[rawActiveId]) {
          setActiveSessionId(rawActiveId);
        } else {
          setActiveSessionId(keys[0] ?? null);
        }
      } else {
        const sessionId = crypto.randomUUID();
        const initial = { [sessionId]: newSession() };
        setSessions(initial);
        setActiveSessionId(sessionId);
      }
    } catch {
      const sessionId = crypto.randomUUID();
      const initial = { [sessionId]: newSession() };
      setSessions(initial);
      setActiveSessionId(sessionId);
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions, isHydrated]);

  useEffect(() => {
    if (!isHydrated || !activeSessionId) return;
    localStorage.setItem(ACTIVE_KEY, activeSessionId);
  }, [activeSessionId, isHydrated]);

  const renameSession = (sessionId: string, title: string) => {
    const cleaned = title.trim();
    if (!cleaned) return;

    setSessions((prev) => {
      const session = prev[sessionId];
      if (!session) return prev;
      return {
        ...prev,
        [sessionId]: {
          ...session,
          title: cleaned,
        },
      };
    });
  };

  const deleteSession = (sessionId: string) => {
    setSessions((prev) => {
      const next = { ...prev };
      delete next[sessionId];

      setActiveSessionId((prevActive) => {
        if (prevActive !== sessionId) return prevActive;
        return Object.keys(next)[0] ?? null;
      });

      return next;
    });
  };

  useEffect(() => {
    if (!isHydrated) return;
    if (Object.keys(sessions).length === 0) {
      const sessionId = crypto.randomUUID();
      setSessions({ [sessionId]: newSession() });
      setActiveSessionId(sessionId);
    }
  }, [sessions, isHydrated]);

  const addMessage = (sessionId: string, message: ChatMessage) => {
    setSessions((prev) => {
      const current = prev[sessionId];
      if (!current) return prev;

      let title = current.title;
      if (
        current.messages.length === 0 &&
        message.role === "user" &&
        current.title === "Untitled Research"
      ) {
        title = message.content.slice(0, 45).trim() || "Untitled Research";
      }

      return {
        ...prev,
        [sessionId]: {
          ...current,
          title,
          messages: [...current.messages, message],
        },
      };
    });
  };

  const activeSession = useMemo(() => {
    if (!activeSessionId) return null;
    return sessions[activeSessionId] ?? null;
  }, [sessions, activeSessionId]);

  const sessionIds = useMemo(() => Object.keys(sessions), [sessions]);

  return {
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
  };
};
