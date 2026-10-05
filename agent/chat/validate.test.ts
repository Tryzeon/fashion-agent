import { assertEquals, assertThrows } from "@std/assert";
import { validateChatParams } from "./validate.ts";
import { ValidationError } from "../validation.ts";
import { LIMITS } from "./types.ts";
import type { ChatMessage, ChatParams } from "./types.ts";

const message = (text: string): ChatMessage => ({
  role: "user",
  content: [{ type: "text", text }],
});

const params = (overrides: Partial<ChatParams> = {}): ChatParams => ({
  userId: "u1",
  messages: [message("找白襯衫")],
  ...overrides,
});

Deno.test("returns the params with messages narrowed", () => {
  const input = params();
  const out = validateChatParams(input);
  assertEquals(out.userId, "u1");
  assertEquals(out.messages, input.messages);
});

Deno.test("carries onEvent through untouched", () => {
  const onEvent = () => {};
  assertEquals(validateChatParams(params({ onEvent })).onEvent, onEvent);
});

Deno.test("rejects a missing userId", () => {
  assertThrows(
    () => validateChatParams(params({ userId: "" })),
    ValidationError,
    "userId is required",
  );
});

Deno.test("rejects an empty or non-array history", () => {
  assertThrows(
    () => validateChatParams(params({ messages: [] })),
    ValidationError,
    "messages must be a non-empty array",
  );
  assertThrows(
    () =>
      validateChatParams(
        params({ messages: undefined as unknown as ChatMessage[] }),
      ),
    ValidationError,
  );
});

Deno.test("windows a history past MAX_MESSAGES instead of rejecting it", () => {
  const messages = Array.from(
    { length: LIMITS.MAX_MESSAGES + 5 },
    (_, i) => message(`m${i}`),
  );
  assertEquals(validateChatParams(params({ messages })).messages, messages.slice(5));
});

Deno.test("rejects a history whose window holds no user turn", () => {
  const toolResult: ChatMessage = {
    role: "user",
    content: [{ type: "tool_result", tool_use_id: "t", content: {} }],
  };
  const messages = Array.from({ length: LIMITS.MAX_MESSAGES + 1 }, () => toolResult);
  assertThrows(
    () => validateChatParams(params({ messages })),
    ValidationError,
    `no user turn within the last ${LIMITS.MAX_MESSAGES} messages`,
  );
});

Deno.test("accepts a history exactly at MAX_MESSAGES", () => {
  const messages = Array.from(
    { length: LIMITS.MAX_MESSAGES },
    () => message("hi"),
  );
  assertEquals(validateChatParams(params({ messages })).messages.length, LIMITS.MAX_MESSAGES);
});

Deno.test("rejects an unknown role", () => {
  const messages = [{ role: "system", content: [] }] as unknown as ChatMessage[];
  assertThrows(
    () => validateChatParams(params({ messages })),
    ValidationError,
    "messages[0].role must be 'user' or 'assistant'",
  );
});

Deno.test("rejects content that is not an array", () => {
  const messages = [{ role: "user", content: "hi" }] as unknown as ChatMessage[];
  assertThrows(
    () => validateChatParams(params({ messages })),
    ValidationError,
    "messages[0].content must be an array",
  );
});

Deno.test("rejects a text block past MAX_TEXT_LENGTH, naming its position", () => {
  const messages = [{
    role: "user",
    content: [
      { type: "text", text: "ok" },
      { type: "text", text: "x".repeat(LIMITS.MAX_TEXT_LENGTH + 1) },
    ],
  }] as ChatMessage[];
  assertThrows(
    () => validateChatParams(params({ messages })),
    ValidationError,
    "messages[0].content[1].text too long",
  );
});

Deno.test("leaves unknown block types alone — the vocabulary is not its business", () => {
  const messages = [{
    role: "assistant",
    content: [
      { type: "tool_use", id: "t0", name: "search_products", input: {} },
      { type: "something_added_later", payload: { a: 1 } },
    ],
  }] as ChatMessage[];
  assertEquals(validateChatParams(params({ messages })).messages, messages);
});
