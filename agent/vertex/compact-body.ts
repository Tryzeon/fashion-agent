/**
 * Deno hands each network read to JS as a few kilobytes viewing a 64 KB buffer
 * of its own, and the AI SDK holds every chunk until the body ends before it
 * parses a response. An inline video therefore held about sixteen times its
 * size in memory and ran the edge function out. Copying each chunk to its own
 * length lets the large buffer go as soon as the chunk is read.
 */
export function compactResponseChunks(response: Response): Response {
  if (!response.body) return response;
  const body = response.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        controller.enqueue(chunk.slice());
      },
    }),
  );
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

/** Resolves `fetch` per call, so a test that stubs it still sees the request. */
export const compactingFetch: typeof fetch = async (input, init) =>
  compactResponseChunks(await fetch(input, init));
