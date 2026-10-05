/**
 * Maps the AI SDK's failures onto the shared taxonomy. Only Vertex callers
 * import this, which keeps `@ai-sdk` out of every function that merely reads
 * `classifyCoreError`.
 */
import { APICallError, RetryError } from "ai";
import { ServiceBusyError } from "../errors.ts";

/**
 * `generateText({ ... }).catch(rethrowAsBusy)`.
 *
 * Around the call, not under it: `wrapLanguageModel` would cover every caller
 * at once, but middleware runs inside the SDK's retry loop, whose `shouldRetry`
 * only retries an `APICallError` flagged retryable. A translated error fails
 * that test, trading every built-in retry for the first 429 we saw.
 */
export function rethrowAsBusy(err: unknown): never {
  if (!isBusy(err)) throw err;
  // The last place holding the status, the URL and the attempt count — a 503
  // answer never reaches the caller's error log.
  console.warn("Vertex refused for capacity:", err);
  throw new ServiceBusyError("vertex is at capacity", { cause: err });
}

/**
 * 429 is quota spent, 503 is the model overloaded; both mean "not now". The SDK
 * nests every attempt in one `RetryError`, and the last one is the verdict — a
 * 429 that later turned into a 500 is a 500.
 */
export function isBusy(err: unknown): boolean {
  if (RetryError.isInstance(err)) return isBusy(err.lastError);
  if (!APICallError.isInstance(err)) return false;
  return err.statusCode === 429 || err.statusCode === 503;
}
