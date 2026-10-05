/**
 * What it checks is the transcript's *structure* — roles, shape, size — and not
 * the block vocabulary. `toModelMessages` already ignores blocks it has no
 * mapping for, and a guard that rejected unknown types would have to be edited
 * every time the answer format grows a case, breaking stored conversations
 * written by an older deploy. Size is the exception: replay cost is unbounded
 * without a cap, so an over-long text block is rejected and an over-long
 * history is cut to its latest `MAX_MESSAGES` by `windowHistory`.
 */
import { requireString, ValidationError } from "../validation.ts";
import { windowHistory } from "./logic.ts";
import { LIMITS } from "./types.ts";
import type { ChatMessage, ChatParams } from "./types.ts";

const ROLES = new Set(["user", "assistant"]);

function checkMessage(message: ChatMessage, index: number): void {
  if (typeof message !== "object" || message === null) {
    throw new ValidationError(`messages[${index}] must be an object`);
  }
  if (!ROLES.has(message.role)) {
    throw new ValidationError(
      `messages[${index}].role must be 'user' or 'assistant'`,
    );
  }
  if (!Array.isArray(message.content)) {
    throw new ValidationError(`messages[${index}].content must be an array`);
  }

  for (let i = 0; i < message.content.length; i++) {
    const block = message.content[i];
    if (typeof block !== "object" || block === null) {
      throw new ValidationError(
        `messages[${index}].content[${i}] must be an object`,
      );
    }
    if (typeof block.text === "string" && block.text.length > LIMITS.MAX_TEXT_LENGTH) {
      throw new ValidationError(
        `messages[${index}].content[${i}].text too long ` +
          `(max ${LIMITS.MAX_TEXT_LENGTH})`,
      );
    }
  }
}

export function validateChatParams(params: ChatParams): ChatParams {
  requireString(params.userId, "userId");

  if (!Array.isArray(params.messages) || params.messages.length === 0) {
    throw new ValidationError("messages must be a non-empty array");
  }
  params.messages.forEach(checkMessage);

  const messages = windowHistory(params.messages);
  if (messages.length === 0) {
    throw new ValidationError(
      `no user turn within the last ${LIMITS.MAX_MESSAGES} messages`,
    );
  }

  return { ...params, messages };
}
