import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "./database.types.ts";

export type DbClient = SupabaseClient<Database>;

/**
 * Narrows what a `jsonb`-returning RPC hands back. Those generate as `Json`:
 * the object is built by the SQL, so its shape is knowledge the schema cannot
 * hold and the caller has to supply.
 */
export const asJsonObject = <T>(value: Json | null | undefined): T | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as T
    : null;
