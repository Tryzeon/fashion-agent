import { tool } from "ai";
import { z } from "zod";
import {
  mapSearchProductsArgs,
  resolveCategoryFilter,
  SEARCH_LIMIT,
  toSearchResultItem,
  validateVocabularyFilters,
  WARDROBE_SELECT,
} from "./logic.ts";
import {
  CHANNEL_VALUES,
  ELASTICITY_VALUES,
  FIT_VALUES,
  GARMENT_TYPE_VALUES,
  GENDER_VALUES,
  SEASON_VALUES,
  STYLE_VALUES,
  THICKNESS_VALUES,
} from "../vocabularies.ts";
import type { DbClient } from "../supabase.ts";

// The error case is returned, not thrown: a throw would abort the agent loop,
// whereas an empty result carrying the reason lets the model correct the code
// (or drop the filter) and search again, which the system prompt already asks
// it to do when a search comes back empty.
type SearchResult = {
  items: Record<string, unknown>[];
  error?: string;
};

type SearchProductsArgs = z.infer<typeof SEARCH_PRODUCTS_SCHEMA>;
type SearchWardrobeArgs = z.infer<typeof SEARCH_WARDROBE_SCHEMA>;

export async function runSearchProducts(
  client: DbClient,
  args: SearchProductsArgs,
  categoryIdByCode: Map<string, string>,
): Promise<SearchResult> {
  const category = resolveCategoryFilter(args.category_code, categoryIdByCode);
  if (!category.ok) {
    return { items: [], error: category.error };
  }
  const vocabulary = validateVocabularyFilters(args);
  if (!vocabulary.ok) {
    return { items: [], error: vocabulary.error };
  }
  const params = mapSearchProductsArgs(args, {
    categoryIds: category.categoryIds,
    filters: vocabulary.filters,
  });
  const { data, error } = await client.rpc("list_shop_products", params);
  if (error) throw error;
  return { items: ((data ?? []) as Record<string, unknown>[]).map(toSearchResultItem) };
}

// The `.eq("user_id", …)` is the filter, not the guard: with a user-scoped `client`
// the wardrobe RLS policy refuses another user's rows independently of it.
export async function runSearchWardrobe(
  client: DbClient,
  userId: string,
  args: SearchWardrobeArgs,
): Promise<SearchResult> {
  let q = client
    .from("wardrobe_items")
    .select(WARDROBE_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(SEARCH_LIMIT);
  if (args.garment_type) q = q.eq("garment_type", args.garment_type);
  if (Array.isArray(args.tags) && args.tags.length > 0) {
    q = q.contains("tags", args.tags);
  }
  const { data, error } = await q;
  if (error) throw error;
  return { items: data ?? [] };
}

const SEARCH_PRODUCTS_SCHEMA = z.object({
  query: z.string().optional().describe(
    "只比對『商品名稱』與『店家/品牌名稱』。多個詞以空白分隔，且每個詞都必須出現在商品名稱中（AND），詞越多越容易 0 筆，所以一次只放『一個』最具代表性、最可能原封不動寫進商品名稱的詞。\n" +
      "適合放：品牌或店家名，系列、聯名、作品或角色等專有名詞（電影、動漫、遊戲，如『鬼滅』『蜘蛛人』『寶可夢』）。\n" +
      "不要放：材質、風格、季節、版型、彈性、厚度、性別、價格、分類——這些都有對應參數。也不要把品類和專有名詞併成同一個 query（『蜘蛛人 T恤』會要求名稱同時含這兩個詞），品類請改用 category_code。\n",
  ),
  category_code: z.string().optional().describe("商品分類 code，需與【可用商品分類清單】一致"),
  gender: z.enum(GENDER_VALUES).optional().describe(
    "選填。依商品適用性別篩選。可參考使用者資訊自行決定是否使用。",
  ),
  materials: z.array(z.string()).optional().describe(
    "選填。材質關鍵字（自由文字，子字串比對），如 棉、麻、羊毛、聚酯纖維。"
  ),
  styles: z.array(z.enum(STYLE_VALUES)).optional().describe("選填。風格。"),
  seasons: z.array(z.enum(SEASON_VALUES)).optional().describe("選填。季節。"),
  fits: z.array(z.enum(FIT_VALUES)).optional().describe(
    "選填。版型：slim（合身）, regular（常規）, loose（寬鬆）, oversize（超大寬版）。",
  ),
  elasticities: z.array(z.enum(ELASTICITY_VALUES)).optional().describe("選填。彈性。"),
  thicknesses: z.array(z.enum(THICKNESS_VALUES)).optional().describe("選填。厚度。"),
  channels: z.array(z.enum(CHANNEL_VALUES)).optional().describe(
    "選填。購物管道：physical（實體店面）, online（線上）。",
  ),
  min_price: z.number().optional().describe("選填。價格下限。"),
  max_price: z.number().optional().describe("選填。價格上限。"),
});

const SEARCH_WARDROBE_SCHEMA = z.object({
  garment_type: z.enum(GARMENT_TYPE_VALUES).optional().describe(
    "衣櫃單品類型：top（上衣）, pants（褲子）, skirt（裙子）, one_piece（連身：洋裝、連身褲）, outerwear（外套）, others（其他）。",
  ),
  tags: z.array(z.string()).optional(),
});

export const answerSchema = z.object({
  blocks: z.array(
    z.object({
      type: z.enum(["text", "product", "wardrobe"]).describe("text、product 或 wardrobe"),
      text: z.string().optional().describe("type=text 時的文字內容"),
      id: z.string().optional().describe(
        "type=product 時為 search_products 回傳的商品 id；type=wardrobe 時為 search_wardrobe 回傳的衣櫃單品 id",
      ),
    }),
  ),
});

export function buildTools(deps: {
  client: DbClient;
  userId: string;
  categoryIdByCode: Map<string, string>;
}) {
  const { client, userId, categoryIdByCode } = deps;
  return {
    search_products: tool({
      description:
        "搜尋商店真實上架商品。使用者提到任何想找、想買的商品時一律呼叫本工具查證，不可憑印象或常識回答有沒有；回傳的 id 之後用於最終回覆的 product block。除 query 與 category_code 外，其餘屬性參數皆為選填，只有當使用者明確提到該條件時才填，否則留空以免過度篩選而找不到商品。",
      inputSchema: SEARCH_PRODUCTS_SCHEMA,
      execute: (args) => runSearchProducts(client, args, categoryIdByCode),
    }),
    search_wardrobe: tool({
      description: "搜尋使用者衣櫃既有衣物；想用既有單品搭配時優先呼叫。",
      inputSchema: SEARCH_WARDROBE_SCHEMA,
      execute: (args) => runSearchWardrobe(client, userId, args),
    }),
  };
}
