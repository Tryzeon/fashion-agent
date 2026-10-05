export function nonEmptyStr(value: unknown): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * The string elements of a `text[]` column.
 *
 * Postgres allows NULL elements in an array whose element type carries no
 * constraint, and `supabase gen types` cannot express that — it emits
 * `string[]`, so a row written through PostgREST can hold a null the generated
 * type says is impossible. Reads of these columns go through here rather than
 * trusting the declaration: the alternative is a `.trim()` on null taking down
 * the whole request instead of dropping one element.
 */
export function textArrayValues(value: readonly unknown[] | null | undefined): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
