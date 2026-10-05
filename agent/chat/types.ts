import type { DailyUsage, UsageCounter } from "../quota.ts";
import type { DbClient } from "../supabase.ts";

export type { UsageCounter };

/**
 * The conversation schema, shared by client storage, the wire (both
 * directions), and rendering. Standard chat-API shape: only user/assistant
 * roles, each a list of content blocks. A tool round spans messages — a
 * `tool_use` block in an assistant message paired (by id) with a `tool_result`
 * block in a user message.
 */
export type ContentBlock = Record<string, unknown>;
export type ChatMessage = { role: ChatRole; content: ContentBlock[] };

export type ChatRole = "user" | "assistant";

export type AnswerRef =
  | { type: "text"; text: string }
  | { type: "product"; id: string }
  | { type: "wardrobe"; id: string };

export type ChatEvent =
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; content: unknown };

export interface ChatParams {
  userId: string;
  messages: ChatMessage[];
  onEvent?: (ev: ChatEvent) => void;
}

export interface ChatResult {
  blocks: ContentBlock[];
  /**
   * Every turn this run added to the conversation, in order: one message per
   * tool call, one per tool result, then the assistant's answer.
   */
  messages: ChatMessage[];
  usage: DailyUsage | null;
}

export const LIMITS = {
  /**
   * Window on replayed history: `toModelMessages` replays every turn verbatim,
   * so an unbounded conversation is an unbounded per-request cost. A longer
   * history is not refused — `windowHistory` drops its oldest whole turns, so
   * the conversation keeps working and forgets its beginning. The LINE
   * conversation store saves under the same window.
   */
  MAX_MESSAGES: 400,
  MAX_TEXT_LENGTH: 2000,
} as const;

export type ChatQuotaFactory = (userId: string) => UsageCounter;

export interface ChatContext {
  systemInstruction: string;
  categoryIdByCode: Map<string, string>;
}

export type ContextLoader = (
  client: DbClient,
  userId: string,
) => Promise<ChatContext>;

export interface AgentRequest {
  client: DbClient;
  userId: string;
  context: ChatContext;
  messages: ChatMessage[];
  onEvent?: (ev: ChatEvent) => void;
}

export interface AgentAnswer {
  output: Record<string, unknown> | null;
  rounds: ChatMessage[];
}

export type AgentRunner = (req: AgentRequest) => Promise<AgentAnswer>;

/**
 * Read-only and item-typed as `unknown`: an adapter hydrates whatever shape its
 * renderer needs (a db row for the app, a LINE card model for the webhook), and
 * the assembler only ever hands the item straight to a block.
 */
export interface AnswerRows {
  products: ReadonlyMap<string, unknown>;
  wardrobe: ReadonlyMap<string, unknown>;
}

export type AnswerHydrator = (
  client: DbClient,
  userId: string,
  refs: AnswerRef[],
) => Promise<AnswerRows>;
