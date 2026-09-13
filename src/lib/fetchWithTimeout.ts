/**
 * fetch() wrapper with timeout, retry, and retryable-status handling.
 * Defaults: 15s timeout, 1 retry on network errors / 5xx responses.
 */

export interface FetchWithTimeoutOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  retryOn?: number[];
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const {
    timeoutMs = 15000,
    retries = 1,
    retryDelayMs = 500,
    retryOn = [408, 409, 429, 500, 502, 503, 504],
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    if (!response.ok && retries > 0 && retryOn.includes(response.status)) {
      await sleep(retryDelayMs);
      return fetchWithTimeout(url, {
        ...options,
        retries: retries - 1,
      });
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    const isNetworkError = error instanceof Error &&
      (error.name === 'TypeError' || error.name === 'AbortError' || error.message?.includes('fetch'));

    if (isNetworkError && retries > 0) {
      await sleep(retryDelayMs);
      return fetchWithTimeout(url, {
        ...options,
        retries: retries - 1,
      });
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
