export type ChatRole = "user" | "ai";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  workflowSteps?: string[];
  kind?: "normal" | "error";
}

export interface ChatSession {
  title: string;
  messages: ChatMessage[];
}

export type ChatSessions = Record<string, ChatSession>;
