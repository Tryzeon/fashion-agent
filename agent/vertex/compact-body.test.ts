import { assertEquals } from "@std/assert";
import { compactResponseChunks } from "./compact-body.ts";

function oversizedChunkResponse(): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const text of ["hello ", "world"]) {
        const backing = new Uint8Array(65536);
        const bytes = new TextEncoder().encode(text);
        backing.set(bytes);
        controller.enqueue(backing.subarray(0, bytes.length));
      }
      controller.close();
    },
  });
  return new Response(body, {
    status: 201,
    statusText: "Created",
    headers: { "content-type": "application/json" },
  });
}

Deno.test("compactResponseChunks releases the buffer behind each chunk", async () => {
  const reader = compactResponseChunks(oversizedChunkResponse()).body!
    .getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  assertEquals(
    chunks.map((chunk) => chunk.buffer.byteLength),
    chunks.map((chunk) => chunk.byteLength),
  );
  assertEquals(
    new TextDecoder().decode(new Uint8Array(chunks.flatMap((c) => [...c]))),
    "hello world",
  );
});

Deno.test("compactResponseChunks keeps status and headers", async () => {
  const response = compactResponseChunks(oversizedChunkResponse());

  assertEquals(response.status, 201);
  assertEquals(response.statusText, "Created");
  assertEquals(response.headers.get("content-type"), "application/json");
  assertEquals(await response.text(), "hello world");
});

Deno.test("compactResponseChunks passes a bodiless response through", () => {
  const response = new Response(null, { status: 204 });

  assertEquals(compactResponseChunks(response), response);
});
