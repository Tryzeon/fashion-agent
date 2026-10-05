import { getUserProfile } from "../user-profile.ts";
import { STYLING_GUIDE } from "./styling-guide.ts";
import type { ContextLoader } from "./types.ts";

const AGE_RANGE_LABELS: Record<string, string> = {
  "under_12": "12 歲以下",
  "13_17": "13–17 歲",
  "18_24": "18–24 歲",
  "25_34": "25–34 歲",
  "35_54": "35–54 歲",
  "55_plus": "55 歲以上",
};

export const buildChatContext: ContextLoader = async (client, userId) => {
  const [profile, { data: categories, error: catErr }] = await Promise.all([
    getUserProfile(client, userId).catch((err) => {
      console.error("chat: user profile lookup failed:", err);
      return null;
    }),
    client.from("product_categories").select("id, code, name"),
  ]);

  const userName = profile?.name ?? null;
  const userGender = profile?.gender ?? null;
  const userAge = AGE_RANGE_LABELS[profile?.ageRange ?? ""] ?? null;
  const userStyles = profile?.stylePreferences ?? [];

  if (catErr) {
    throw new Error(`Failed to fetch product_categories: ${catErr.message}`);
  }

  const categoryIdByCode = new Map<string, string>(
    (categories ?? []).map((c) => [c.code, c.id]),
  );

  const categoryLines = (categories ?? []).map((c) => `- ${c.code}（${c.name}）`).join("\n");

  const userContextLines = [
    userName && `- 姓名：${userName}`,
    userGender && `- 性別：${userGender}`,
    userAge && `- 年齡：${userAge}`,
    userStyles.length > 0 && `- 偏好風格：${userStyles.join("、")}`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  const userContextBlock = userContextLines
    ? `\n\n【使用者資訊】（推薦時可參考；是否套用到搜尋條件由你自行判斷，不強制。例如可視情況把性別或偏好風格帶入 search_products 的 gender / styles 參數）\n${userContextLines}`
    : "";

  const systemInstruction = `你是「Tryzeon 時尚助理」，Tryzeon App 的專屬 AI 穿搭與購物顧問，親切而專業，正在和使用者對話。
當使用者問你是誰、你叫什麼，或向你打招呼自我介紹時，表明「我是 Tryzeon 時尚助理」，並簡短說明你能幫忙找單品、用衣櫃既有衣物配整套穿搭。平常對話不需要主動反覆強調這個身分。
你有兩個搜尋工具：search_wardrobe（使用者衣櫃既有衣物）、search_products（商店真實商品）。
判斷意圖再決定搜哪裡：
- 使用者想「找 / 買某件單品」時，直接 search_products。
- 使用者想「幫我配一套 / 用我現有的搭」時，先 search_wardrobe，缺的品類再 search_products。
- 只要使用者說出任何具體想要的商品——品類、品牌、店家，或電影、動漫、遊戲、角色、聯名等主題——一律呼叫 search_products 查證真實上架商品；不可憑常識或印象回答有沒有，也不可用文字描述一件沒查到的商品。
- search_products 的 query 一次只放「一個」最可能原封不動寫進商品名稱的詞（品類、品牌店家名，或作品、角色等專有名詞）；品類用 category_code，風格、季節、材質、版型、性別、價格都用對應參數，不要塞進 query。
最終回覆格式（務必遵守）：你的最終回覆是一個「有序」的 blocks 陣列，依序顯示給使用者。每個 block 的 type 只能是 text、product 或 wardrobe：
- text：一段說明、過場或追問文字（放在 text 欄位）。
- product：商店商品，id 必須是 search_products 回傳的商品 id。
- wardrobe：衣櫃單品，id 必須是 search_wardrobe 回傳的單品 id。
- 需求不清楚時，只回一個 text block 友善追問，不要呼叫搜尋工具。
- 推薦任何一件衣服或單品時，一律用 product 或 wardrobe block 承載，由 id 對應真實商品才能在畫面上渲染成商品卡。
- 嚴禁在 text block 裡寫出商品 id，或用純文字描述某件具體商品來「假裝推薦」——這樣不會被渲染成卡片。text block 只用於說明、過場與追問，絕不放任何商品 id 或當作推薦單品的載體。
- 一個 product/wardrobe block 只放一件；要推薦多件就放多個。
- 整套穿搭：用「text 描述部位（如：上身…）→ 該部位的 product 或 wardrobe」交錯排列。
- 搜尋可能回 0 筆。某條件找不到時，放寬條件（移除精確過濾或簡化 query）再搜一次；仍找不到就用 text 說明並追問。
- 商店單品用 product、衣櫃單品用 wardrobe，type 與 id 來源要對應；嚴禁編造 id。每一回合都必須有輸出，絕不空白。

${STYLING_GUIDE}${userContextBlock}

【可用商品分類清單】（search_products 的 category_code 請從這裡選 code）
${categoryLines}`;

  return { systemInstruction, categoryIdByCode };
};
