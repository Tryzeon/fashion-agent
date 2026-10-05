import { PRODUCT_SELECT, WARDROBE_SELECT } from "./logic.ts";
import type { AnswerHydrator, AnswerRef } from "./types.ts";
import type { DbClient } from "../supabase.ts";

/**
 * The one thing this needs of a PostgREST query builder: `.in("id", …)`, then
 * awaited. Structural rather than the real builder type so callers keep the row
 * shape their `.select()` inferred without this signature naming the five
 * schema type parameters that would otherwise erase it.
 */
interface IdInFilter<Row> {
  in(column: "id", values: string[]): PromiseLike<{ data: Row[] | null; error: unknown }>;
}

export async function fetchRowsByIds<Row extends { id: string }, Block = Row>(
  query: IdInFilter<Row>,
  ids: string[],
  // The identity default is why `Block` defaults to `Row`; the two are only
  // unrelated to the compiler inside this body, hence the one assertion.
  toBlock: (row: Row) => Block | null = (row) => row as unknown as Block,
): Promise<Map<string, Block>> {
  const map = new Map<string, Block>();
  if (ids.length === 0) return map;
  const { data, error } = await query.in("id", ids);
  if (error) throw error;
  for (const row of data ?? []) {
    const block = toBlock(row);
    if (block) map.set(row.id, block);
  }
  return map;
}

type ItemRef = Extract<AnswerRef, { id: string }>;

export const idsOf = (refs: AnswerRef[], type: ItemRef["type"]): string[] =>
  refs.filter((r): r is ItemRef => r.type === type).map((r) => r.id);

export const supabaseAnswerRows: AnswerHydrator = async (
  client: DbClient,
  userId: string,
  refs: AnswerRef[],
) => {
  const [products, wardrobe] = await Promise.all([
    fetchRowsByIds(
      client.from("products").select(PRODUCT_SELECT),
      idsOf(refs, "product"),
    ),
    fetchRowsByIds(
      client.from("wardrobe_items").select(WARDROBE_SELECT).eq("user_id", userId),
      idsOf(refs, "wardrobe"),
    ),
  ]);
  return { products, wardrobe };
};
