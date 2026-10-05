function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export interface VertexServiceAccount {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  privateKeyId?: string;
}

const REQUIRED_FIELDS = ["project_id", "client_email", "private_key"] as const;

export function parseServiceAccount(raw: string): VertexServiceAccount {
  let key: Record<string, unknown>;
  try {
    key = JSON.parse(raw);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT is not valid JSON");
  }

  const missing = REQUIRED_FIELDS.filter((field) => typeof key[field] !== "string");
  if (missing.length > 0) {
    throw new Error(`GOOGLE_SERVICE_ACCOUNT is missing: ${missing.join(", ")}`);
  }

  return {
    projectId: key.project_id as string,
    clientEmail: key.client_email as string,
    privateKey: key.private_key as string,
    privateKeyId: typeof key.private_key_id === "string" ? key.private_key_id : undefined,
  };
}

let serviceAccount: VertexServiceAccount | null = null;

/**
 * The one credential, parsed once for the isolate. A service account rather than
 * an express-mode API key, which serves a narrower model catalog and reports
 * what it cannot see as a 404 naming the model — indistinguishable from a typo.
 */
export function vertexServiceAccount(): VertexServiceAccount {
  return serviceAccount ??= parseServiceAccount(requireEnv("GOOGLE_SERVICE_ACCOUNT"));
}

export const vertexLocation = (): string => Deno.env.get("VERTEX_LOCATION") ?? "global";

export const chatModel = (): string => requireEnv("CHAT_MODEL");
