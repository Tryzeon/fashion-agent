import { assertEquals, assertStringIncludes } from "@std/assert";
import {
  assembleAnswerBlocks,
  mapSearchProductsArgs,
  parseAnswerRefs,
  resolveCategoryFilter,
  SEARCH_LIMIT,
  toModelMessages,
  toSearchResultItem,
  validateVocabularyFilters,
  windowHistory,
} from "./logic.ts";
import type { ChatMessage } from "./types.ts";

const CATEGORIES = new Map([["tops", "cat-1"], ["dresses", "cat-2"]]);

// Answer-block ids are row ids, so the fixtures are uuids: `parseAnswerRefs`
// rejects anything else.
const PRODUCT_ID = "f8f49d33-e34a-4121-a6b9-f654e0614971";
const WARDROBE_ID = "0b2c3d4e-5f60-4718-8293-a4b5c6d7e8f9";

Deno.test("resolveCategoryFilter maps a known code to its id", () => {
  const r = resolveCategoryFilter("tops", CATEGORIES);
  assertEquals(r, { ok: true, categoryIds: ["cat-1"] });
});

Deno.test("resolveCategoryFilter treats a missing code as no category filter", () => {
  assertEquals(resolveCategoryFilter(undefined, CATEGORIES), { ok: true, categoryIds: null });
  assertEquals(resolveCategoryFilter("   ", CATEGORIES), { ok: true, categoryIds: null });
});

Deno.test("resolveCategoryFilter rejects an unknown code instead of dropping the filter", () => {
  const r = resolveCategoryFilter("dress_pants", CATEGORIES);
  assertEquals(r.ok, false);
  if (r.ok) throw new Error("expected a rejection");
  assertStringIncludes(r.error, "dress_pants");
  assertStringIncludes(r.error, "category_code");
});

Deno.test("resolveCategoryFilter does not accept a display name where a code is expected", () => {
  const r = resolveCategoryFilter("上衣", CATEGORIES);
  assertEquals(r.ok, false);
});

Deno.test("mapSearchProductsArgs trims query, keeps non-empty arrays, drops empties", () => {
  const p = mapSearchProductsArgs(
    { query: "  白襯衫 ", styles: ["casual"], materials: [], min_price: 100 },
    { categoryIds: ["c1"], filters: { gender: "female" } },
  );
  assertEquals(p.p_search_query, "白襯衫");
  assertEquals(p.p_styles, ["casual"]);
  assertEquals(p.p_materials, undefined);
  assertEquals(p.p_min_price, 100);
  assertEquals(p.p_category_ids, ["c1"]);
  assertEquals(p.p_gender, "female");
  assertEquals(p.p_limit, SEARCH_LIMIT);
});

Deno.test("mapSearchProductsArgs omits absent filters so the RPC applies its SQL defaults", () => {
  const p = mapSearchProductsArgs({}, { categoryIds: null, filters: {} });
  assertEquals(p.p_search_query, undefined);
  assertEquals(p.p_category_ids, undefined);
  assertEquals(p.p_gender, undefined);
  assertEquals(p.p_limit, SEARCH_LIMIT);
});

Deno.test("mapSearchProductsArgs takes the enum-backed filters from the validated set, not raw args", () => {
  const p = mapSearchProductsArgs(
    { fits: ["tight"], channels: ["carrier-pigeon"] },
    { categoryIds: null, filters: { fits: ["slim"] } },
  );
  assertEquals(p.p_fits, ["slim"]);
  assertEquals(p.p_channels, undefined);
});

Deno.test("assembleAnswerBlocks keeps the model's order across both kinds", () => {
  const blocks = assembleAnswerBlocks(
    [
      { type: "text", text: "上身" },
      { type: "product", id: "p1" },
      { type: "text", text: "下身" },
      { type: "wardrobe", id: "w1" },
    ],
    {
      products: new Map([["p1", { id: "p1", name: "襯衫" }]]),
      wardrobe: new Map([["w1", { id: "w1" }]]),
    },
  );
  assertEquals(blocks, [
    { type: "text", text: "上身" },
    { type: "product", item: { id: "p1", name: "襯衫" } },
    { type: "text", text: "下身" },
    { type: "wardrobe", item: { id: "w1" } },
  ]);
});

Deno.test("assembleAnswerBlocks drops a ref whose row is gone, keeping the rest", () => {
  const blocks = assembleAnswerBlocks(
    [
      { type: "product", id: "deleted" },
      { type: "text", text: "還有這件" },
      { type: "product", id: "p1" },
    ],
    { products: new Map([["p1", { id: "p1" }]]), wardrobe: new Map() },
  );
  assertEquals(blocks, [
    { type: "text", text: "還有這件" },
    { type: "product", item: { id: "p1" } },
  ]);
});

Deno.test("parseAnswerRefs keeps ordered text + labelled product/wardrobe ids", () => {
  const refs = parseAnswerRefs({
    blocks: [
      { type: "text", text: "上身白襯衫" },
      { type: "product", id: PRODUCT_ID },
      { type: "wardrobe", id: WARDROBE_ID },
    ],
  });
  assertEquals(refs, [
    { type: "text", text: "上身白襯衫" },
    { type: "product", id: PRODUCT_ID },
    { type: "wardrobe", id: WARDROBE_ID },
  ]);
});

Deno.test("parseAnswerRefs drops empty text and id-less product/wardrobe blocks", () => {
  const refs = parseAnswerRefs({
    blocks: [
      { type: "text", text: "   " },
      { type: "product" },
      { type: "wardrobe", id: "" },
      { type: "product", id: PRODUCT_ID },
    ],
  });
  assertEquals(refs, [{ type: "product", id: PRODUCT_ID }]);
});

Deno.test("parseAnswerRefs drops ids that are not uuids", () => {
  const refs = parseAnswerRefs({
    blocks: [
      { type: "product", id: "f8f49d33-e34a-4121-a6b9-f654e061497" }, // one char short
      { type: "wardrobe", id: "不是 uuid" },
      { type: "text", text: "這件如何？" },
      { type: "product", id: PRODUCT_ID },
    ],
  });
  assertEquals(refs, [
    { type: "text", text: "這件如何？" },
    { type: "product", id: PRODUCT_ID },
  ]);
});

Deno.test("toModelMessages maps a paired tool_use/tool_result conversation to ModelMessages", () => {
  const out = toModelMessages([
    { role: "user", content: [{ type: "text", text: "找裙子" }] },
    {
      role: "assistant",
      content: [{ type: "tool_use", id: "tu_0", name: "search_products", input: { query: "裙" } }],
    },
    {
      role: "user",
      content: [{ type: "tool_result", tool_use_id: "tu_0", content: { items: [{ id: "p1" }] } }],
    },
    { role: "assistant", content: [{ type: "text", text: "找到這件" }, { type: "product", id: "p1" }] },
  ]);
  assertEquals(out, [
    { role: "user", content: "找裙子" },
    {
      role: "assistant",
      content: [{ type: "tool-call", toolCallId: "tu_0", toolName: "search_products", input: { query: "裙" } }],
    },
    {
      role: "tool",
      content: [{
        type: "tool-result",
        toolCallId: "tu_0",
        toolName: "search_products",
        output: { type: "json", value: { items: [{ id: "p1" }] } },
      }],
    },
    { role: "assistant", content: "找到這件\n（推薦商品 id:p1）" },
  ]);
});

Deno.test("toModelMessages drops blank text and empty turns", () => {
  const out = toModelMessages([
    { role: "user", content: [{ type: "text", text: "   " }] },
    { role: "assistant", content: [{ type: "text", text: "嗨" }] },
  ]);
  assertEquals(out, [{ role: "assistant", content: "嗨" }]);
});

const SHOP_ROW = {
  id: "8f3a-p1",
  store_id: "11aa-s1",
  name: "白襯衫",
  category_ids: ["cat-1", "cat-2"],
  price: 1200,
  image_paths: ["stores/s1/p1.jpg"],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
  purchase_link: "https://shop.example/p1",
  material: "棉",
  elasticity: "low",
  fit: "regular",
  thickness: null,
  styles: ["minimalist"],
  seasons: [],
  gender: "female",
  product_variants: [
    { id: "v1", product_id: "8f3a-p1", name: "S", created_at: "x", measurements: { chest: 90 } },
    { id: "v2", product_id: "8f3a-p1", name: "M", created_at: "x", measurements: { chest: 94 } },
  ],
  store_profiles: {
    id: "11aa-s1",
    name: "某店",
    address: "台北市…",
    logo_path: "stores/s1/logo.jpg",
    channels: ["online"],
  },
};

Deno.test("toSearchResultItem keeps what the model judges and cites on", () => {
  assertEquals(toSearchResultItem(SHOP_ROW), {
    id: "8f3a-p1",
    name: "白襯衫",
    price: 1200,
    store: "某店",
    channels: ["online"],
    sizes: ["S", "M"],
    gender: "female",
    material: "棉",
    fit: "regular",
    elasticity: "low",
    styles: ["minimalist"],
  });
});

Deno.test("toSearchResultItem ships no uuid but the one the model must copy", () => {
  const item = toSearchResultItem(SHOP_ROW);
  // The whole point of the projection: `store_id`, `category_ids` and each
  // variant's own id are uuids that look exactly like the citable one, and
  // copying the wrong one drops the card with no error raised anywhere.
  for (const key of ["store_id", "category_ids", "product_variants", "store_profiles"]) {
    assertEquals(key in item, false, `${key} must not reach the model`);
  }
  assertStringIncludes(JSON.stringify(item), "8f3a-p1");
  assertEquals(JSON.stringify(item).includes("11aa-s1"), false);
});

Deno.test("toSearchResultItem drops unset attributes rather than sending nulls", () => {
  const item = toSearchResultItem(SHOP_ROW);
  assertEquals("thickness" in item, false);
  assertEquals("seasons" in item, false);
});

Deno.test("toSearchResultItem tolerates a row with no variants and no store", () => {
  const item = toSearchResultItem({ id: "p9", name: "褲", price: 500 });
  assertEquals(item, { id: "p9", name: "褲", price: 500 });
});

Deno.test("validateVocabularyFilters returns the accepted values, typed, rather than a bare pass", () => {
  const r = validateVocabularyFilters({
    fits: ["slim", "regular"],
    seasons: ["summer"],
    elasticities: ["high"],
    thicknesses: ["low"],
    channels: ["online"],
    gender: "female",
  });
  assertEquals(r, {
    ok: true,
    filters: {
      fits: ["slim", "regular"],
      seasons: ["summer"],
      elasticities: ["high"],
      thicknesses: ["low"],
      channels: ["online"],
      gender: "female",
    },
  });
});

Deno.test("validateVocabularyFilters treats absent and empty fields as no filter", () => {
  assertEquals(validateVocabularyFilters({ fits: [] }), {
    ok: true,
    filters: {
      fits: undefined,
      seasons: undefined,
      elasticities: undefined,
      thicknesses: undefined,
      channels: undefined,
      gender: undefined,
    },
  });
});

Deno.test("validateVocabularyFilters rejects a value outside the enum vocabulary instead of dropping it", () => {
  const r = validateVocabularyFilters({ fits: ["tight"] });
  assertEquals(r.ok, false);
  if (r.ok) throw new Error("expected a rejection");
  assertStringIncludes(r.error, "fits");
  assertStringIncludes(r.error, "tight");
});

Deno.test("validateVocabularyFilters rejects gender outside the enum vocabulary", () => {
  const r = validateVocabularyFilters({ gender: "boy" });
  assertEquals(r.ok, false);
  if (r.ok) throw new Error("expected a rejection");
  assertStringIncludes(r.error, "gender");
  assertStringIncludes(r.error, "boy");
});

Deno.test("validateVocabularyFilters rejects a filter mixing valid and invalid values rather than narrowing to the valid ones", () => {
  const r = validateVocabularyFilters({ fits: ["slim", "tight"] });
  assertEquals(r.ok, false);
  if (r.ok) throw new Error("expected a rejection");
  assertStringIncludes(r.error, "tight");
});

const userText = (text: string): ChatMessage => ({
  role: "user",
  content: [{ type: "text", text }],
});

const toolTurn = (n: number): ChatMessage[] => [
  userText(`q${n}`),
  {
    role: "assistant",
    content: [{ type: "tool_use", id: `t${n}`, name: "search_products", input: {} }],
  },
  {
    role: "user",
    content: [{ type: "tool_result", tool_use_id: `t${n}`, content: { items: [] } }],
  },
  { role: "assistant", content: [{ type: "text", text: `a${n}` }] },
];

Deno.test("windowHistory leaves a history within the window untouched", () => {
  const messages = [...toolTurn(1), ...toolTurn(2)];
  assertEquals(windowHistory(messages, 8), messages);
});

Deno.test("windowHistory drops the oldest whole turns, never half a tool round", () => {
  const messages = [...toolTurn(1), ...toolTurn(2), userText("q3")];
  // A cut at 6 would start on turn 1's tool_result, orphaned from its tool_use.
  assertEquals(windowHistory(messages, 6), [...toolTurn(2), userText("q3")]);
});

Deno.test("windowHistory is empty when the window holds no turn start", () => {
  assertEquals(windowHistory(toolTurn(1), 3), []);
});
