import { nonEmptyStr } from "./text.ts";

export class ValidationError extends Error {}

export function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new ValidationError(`${label} is required`);
  }
  return value;
}

export function normalizeText(value: unknown): string | undefined {
  return nonEmptyStr(value) ?? undefined;
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function parseJsonObject(rawBody: string): Record<string, unknown> {
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    throw new ValidationError("body must be valid JSON");
  }
  if (typeof body !== "object" || body === null) {
    throw new ValidationError("body must be an object");
  }
  return body as Record<string, unknown>;
}
