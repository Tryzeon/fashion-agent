import type { Tables } from "./database.types.ts";
import { asJsonObject, type DbClient } from "./supabase.ts";

export type FeatureName = "chat" | "tryon" | "tryon_video";

export type DailyUsage = Tables<"user_daily_usage">;

export class QuotaExceededError extends Error {
  constructor(public readonly usage: DailyUsage | null) {
    super("quota exceeded");
  }
}

/**
 * The usage counter one unit of work is charged against. `charge` runs before
 * any work; `refund` compensates when that work then fails, and is a no-op if
 * the charge never landed.
 */
export interface UsageCounter {
  charge(): Promise<{ allowed: boolean; usage: DailyUsage | null }>;
  refund(): Promise<void>;
}

export function supabaseUsageCounter(
  adminClient: DbClient,
  userId: string,
  featureName: FeatureName,
): UsageCounter {
  let charged = false;
  const args = { p_user_id: userId, p_feature_name: featureName };

  return {
    async charge() {
      const { data, error } = await adminClient.rpc(
        "increment_feature_usage",
        args,
      );
      if (error) {
        throw new Error(`Failed to increment quota: ${error.message}`);
      }
      const result = asJsonObject<{ allowed: boolean; usage: DailyUsage | null }>(data);
      charged = Boolean(result?.allowed);
      return { allowed: charged, usage: result?.usage ?? null };
    },

    async refund() {
      if (!charged) return;
      // Cleared before the call, not after: a refund that throws must not leave
      // the port willing to issue a second one.
      charged = false;
      const { error } = await adminClient.rpc("decrement_feature_usage", args);
      if (error) {
        console.error("Quota rollback failed:", { userId, featureName, error });
      }
    },
  };
}
