import { assertEquals, assertThrows } from "@std/assert";
import { APICallError, RetryError } from "ai";
import { ServiceBusyError } from "../errors.ts";
import { rethrowAsBusy } from "./errors.ts";

const MODEL_URL =
  "https://aiplatform.googleapis.com/v1beta1/projects/p/locations/global/publishers/google/models/gemini-3.1-flash-image:generateContent";

function apiError(statusCode: number, message: string): APICallError {
  return new APICallError({
    message,
    url: MODEL_URL,
    requestBodyValues: {},
    statusCode,
    isRetryable: true,
  });
}

function retryError(errors: unknown[]): RetryError {
  return new RetryError({
    message: `Failed after ${errors.length} attempts.`,
    reason: "maxRetriesExceeded",
    errors,
  });
}

Deno.test("rethrowAsBusy maps an exhausted quota to ServiceBusyError", () => {
  // The shape a 429 actually reaches us in: the SDK retries, then wraps every
  // attempt in one RetryError.
  const exhausted = retryError([
    apiError(429, "Resource has been exhausted (e.g. check quota)."),
    apiError(429, "Resource has been exhausted (e.g. check quota)."),
    apiError(429, "Resource has been exhausted (e.g. check quota)."),
  ]);

  const err = assertThrows(() => rethrowAsBusy(exhausted), ServiceBusyError);
  assertEquals(err.cause, exhausted, "the original failure stays reachable for logs");
});

Deno.test("rethrowAsBusy maps an overloaded model to ServiceBusyError", () => {
  assertThrows(
    () => rethrowAsBusy(apiError(503, "The service is currently unavailable.")),
    ServiceBusyError,
  );
});

Deno.test("rethrowAsBusy leaves a rejected request alone", () => {
  // 400 is our bug, not Vertex's capacity — mapping it to "busy" would tell the
  // user to retry something that can never succeed.
  const rejected = apiError(400, "Invalid image data.");
  assertEquals(assertThrows(() => rethrowAsBusy(rejected)), rejected);
});

Deno.test("rethrowAsBusy leaves a retry that ended on a non-busy failure alone", () => {
  // The last attempt is the verdict: a 429 earlier in the run that resolved
  // into a 500 is a 500.
  const mixed = retryError([apiError(429, "exhausted"), apiError(500, "internal")]);
  assertEquals(assertThrows(() => rethrowAsBusy(mixed)), mixed);
});

Deno.test("rethrowAsBusy leaves a foreign error alone", () => {
  const foreign = new TypeError("boom");
  assertEquals(assertThrows(() => rethrowAsBusy(foreign)), foreign);
});
