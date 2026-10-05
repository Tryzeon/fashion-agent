/**
 * Built on first use and kept for the isolate, deliberately not at import:
 * `chat/run.ts` names its Vertex runner as the default, so anything touching
 * the chat core pulls this module in — including callers that always inject
 * their own runner, and tests that never reach the network. Building at import
 * would make Vertex credentials a requirement for all of them.
 */
import { createVertex } from "@ai-sdk/google-vertex/edge";
import { compactingFetch } from "./compact-body.ts";
import { vertexLocation, vertexServiceAccount } from "./config.ts";

let provider: ReturnType<typeof createVertex> | null = null;

/**
 * The provider itself. The edge variant signs the service-account JWT via Web
 * Crypto, so project and location must be named — unlike express mode, where
 * the key implied both. Its `fetch` resolves the global per request rather
 * than capturing it here, which is what lets a test observe the call.
 */
function vertexProvider() {
  if (provider) return provider;

  const { projectId, ...googleCredentials } = vertexServiceAccount();
  return provider = createVertex({
    project: projectId,
    location: vertexLocation(),
    googleCredentials,
    fetch: compactingFetch,
  });
}

function announce(modelId: string) {
  console.info(`vertex: model=${modelId} region=${vertexLocation()}`);
}

export function vertexModel(modelId: string) {
  announce(modelId);
  return vertexProvider()(modelId);
}
