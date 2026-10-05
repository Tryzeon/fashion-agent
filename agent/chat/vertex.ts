/**
 * Owns the transcript rule: a tool call is an assistant turn, its result a user
 * turn. That rule belongs wherever the loop is observed, because only here is
 * the pairing still known; every consumer downstream gets messages that are
 * already correct.
 */
import { Output, stepCountIs, streamText } from "ai";
import { chatModel } from "../vertex/config.ts";
import { vertexModel } from "../vertex/provider.ts";
import { toModelMessages } from "./logic.ts";
import { answerSchema, buildTools } from "./tools.ts";
import type {
  AgentRunner,
  ChatEvent,
  ChatMessage,
  ChatRole,
} from "./types.ts";

const MAX_AGENT_STEPS = 10;

export const runVertexAgent: AgentRunner = async (req) => {
  const tools = buildTools({
    client: req.client,
    userId: req.userId,
    categoryIdByCode: req.context.categoryIdByCode,
  });

  // The SDK runs the loop: search_* tools have `execute`, so it calls them and
  // re-prompts automatically (capped by stopWhen). The final answer is produced
  // as structured `output`, not as a tool call.
  const result = streamText({
    model: vertexModel(chatModel()),
    system: req.context.systemInstruction,
    messages: toModelMessages(req.messages),
    tools,
    output: Output.object({ schema: answerSchema }),
    stopWhen: stepCountIs(MAX_AGENT_STEPS),
  });

  const rounds: ChatMessage[] = [];

  const record = (role: ChatRole, block: ChatEvent) => {
    rounds.push({ role, content: [block] });
    req.onEvent?.(block);
  };

  for await (const part of result.fullStream) {
    if (part.type === "tool-call") {
      record("assistant", {
        type: "tool_use",
        id: part.toolCallId,
        name: part.toolName,
        input: part.input,
      });
    } else if (part.type === "tool-result") {
      record("user", {
        type: "tool_result",
        tool_use_id: part.toolCallId,
        content: part.output,
      });
    }
  }

  // `result.output` rejects when the model produced nothing matching the
  // schema. That is an answer we could not read, not a fault: the turn ran and
  // the core degrades to fallback text, so it is reported as a null output
  // rather than raised.
  try {
    return { output: await result.output as Record<string, unknown>, rounds };
  } catch (err) {
    console.error("Structured output unavailable:", err);
    return { output: null, rounds };
  }
};
