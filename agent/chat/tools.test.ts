import { assertEquals, assertStringIncludes } from "@std/assert";
import { runSearchProducts, runSearchWardrobe } from "./tools.ts";
import type { DbClient } from "../supabase.ts";

const CATEGORIES = new Map([["pants", "cat-pants"]]);

const rpcMustNotRun = {
  rpc: () => {
    throw new Error("rpc must not be called");
  },
} as unknown as DbClient;

/** Records every filter the wardrobe search applied to the query builder. */
function fakeWardrobeClient(rows: Record<string, unknown>[] = []) {
  const eqCalls: Array<[string, string]> = [];
  const containsCalls: Array<[string, string[]]> = [];
  const chain = {
    eq(column: string, value: string) {
      eqCalls.push([column, value]);
      return chain;
    },
    order: () => chain,
    limit: () => chain,
    contains(column: string, value: string[]) {
      containsCalls.push([column, value]);
      return chain;
    },
    then(resolve: (r: { data: unknown; error: null }) => unknown) {
      return Promise.resolve({ data: rows, error: null }).then(resolve);
    },
  };
  const client = {
    from: () => ({ select: () => chain }),
  } as unknown as DbClient;
  return { client, eqCalls, containsCalls };
}

Deno.test("runSearchProducts rejects an unknown category_code without reaching the RPC", async () => {
  const result = await runSearchProducts(
    rpcMustNotRun,
    { category_code: "長褲" },
    CATEGORIES,
  );
  assertEquals(result.items, []);
  assertStringIncludes(result.error ?? "", "長褲");
});

Deno.test("runSearchProducts resolves a known category_code into the RPC's id filter", async () => {
  const seen: Record<string, unknown>[] = [];
  const client = {
    rpc: (_name: string, params: Record<string, unknown>) => {
      seen.push(params);
      return Promise.resolve({ data: [{ id: "p1", name: "褲" }], error: null });
    },
  } as unknown as DbClient;

  const result = await runSearchProducts(client, { category_code: "pants" }, CATEGORIES);

  assertEquals(seen.length, 1);
  assertEquals(seen[0].p_category_ids, ["cat-pants"]);
  assertEquals(result.error, undefined);
  assertEquals(result.items.map((i) => i.id), ["p1"]);
});

Deno.test("runSearchWardrobe filters on garment_type", async () => {
  const { client, eqCalls } = fakeWardrobeClient([{ id: "w1" }]);
  const result = await runSearchWardrobe(client, "u1", { garment_type: "pants" });

  assertEquals(eqCalls, [["user_id", "u1"], ["garment_type", "pants"]]);
  assertEquals(result, { items: [{ id: "w1" }] });
});

Deno.test("runSearchWardrobe applies no garment_type filter when none is given", async () => {
  const { client, eqCalls, containsCalls } = fakeWardrobeClient();
  await runSearchWardrobe(client, "u1", { tags: ["寬鬆"] });

  assertEquals(eqCalls, [["user_id", "u1"]]);
  assertEquals(containsCalls, [["tags", ["寬鬆"]]]);
});
