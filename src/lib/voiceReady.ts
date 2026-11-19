import { api } from "./api";
import type { ServiceHealth } from "./types";

export const VOICE_READY_TIMEOUT_MS = 3500;
export const VOICE_READY_POLL_MS = 2500;

export function waitForVoiceRetry(
  ms = VOICE_READY_POLL_MS,
  signal?: AbortSignal,
): Promise<boolean> {
  if (signal?.aborted) return Promise.resolve(false);
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(true), ms);
    const onAbort = () => {
      clearTimeout(timer);
      resolve(false);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function checkVoiceReady(
  timeoutMs = VOICE_READY_TIMEOUT_MS,
  signal?: AbortSignal,
): Promise<boolean> {
  if (signal?.aborted) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);
  try {
    const health = await api<ServiceHealth>("/health", {
      signal: controller.signal,
    });
    return health.ai === "ok";
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
