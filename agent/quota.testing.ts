import type { DailyUsage } from "./quota.ts";
import type { DbClient } from "./supabase.ts";

export const SAMPLE_USAGE: DailyUsage = {
  user_id: "u1",
  usage_date: "2026-07-26",
  tryon_count: 0,
  chat_count: 0,
  video_count: 0,
};

export interface RpcCall {
  fn: string;
  args: Record<string, unknown>;
}

export function fakeQuotaAdmin(allowed = true): {
  client: DbClient;
  calls: RpcCall[];
} {
  const calls: RpcCall[] = [];
  const client = {
    rpc(fn: string, args: Record<string, unknown>) {
      calls.push({ fn, args });
      if (fn === "increment_feature_usage") {
        return Promise.resolve({
          data: { allowed, usage: SAMPLE_USAGE },
          error: null,
        });
      }
      return Promise.resolve({ data: true, error: null });
    },
  } as unknown as DbClient;
  return { client, calls };
}
