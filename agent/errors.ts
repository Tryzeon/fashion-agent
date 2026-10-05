/**
 * There is deliberately no "the model failed" kind. Whether an unusable model
 * result is an error at all is the feature's call: try-on raises one, chat
 * degrades to fallback text. That makes it a feature arm, never a shared one.
 */
import { type DailyUsage, QuotaExceededError } from "./quota.ts";
import { ValidationError } from "./validation.ts";

export class ServiceBusyError extends Error {}

export type CoreErrorInfo =
  | { kind: "validation"; message: string }
  | { kind: "quota"; usage: DailyUsage | null }
  | { kind: "busy" };

export const CORE_ERROR_CODE: Record<CoreErrorInfo["kind"], string> = {
  validation: "VALIDATION_ERROR",
  quota: "RATE_LIMIT_EXCEEDED",
  busy: "SERVICE_BUSY",
};

export function classifyCoreError(err: unknown): CoreErrorInfo | null {
  if (err instanceof ValidationError) {
    return { kind: "validation", message: err.message };
  }
  if (err instanceof QuotaExceededError) {
    return { kind: "quota", usage: err.usage };
  }
  if (err instanceof ServiceBusyError) {
    return { kind: "busy" };
  }
  return null;
}
