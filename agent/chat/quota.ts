import { supabaseUsageCounter } from "../quota.ts";
import type { ChatQuotaFactory } from "./types.ts";
import type { DbClient } from "../supabase.ts";

export const supabaseChatQuota = (admin: DbClient): ChatQuotaFactory =>
(userId) => supabaseUsageCounter(admin, userId, "chat");
