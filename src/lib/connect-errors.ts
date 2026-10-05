import { ApiError } from "@/lib/api";

/**
 * What to tell someone whose connect failed. A refusal from our backend carries
 * its own reason — Shopify refusing a key, say, with what to enter instead — and
 * is shown as is; anything else gets a plain retry line. Failures used to go to
 * the console only, so a refused connection looked like nothing had happened.
 */
export function connectFailureMessage(appName: string, error: unknown): string {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.message) {
    return `${appName} wasn't connected. ${error.message}`;
  }
  return `Couldn't connect ${appName}. Please try again.`;
}
