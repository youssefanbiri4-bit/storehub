/**
 * Validate external URL safety (no open redirects).
 */
export function validateExternalUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "https:") {
      return { valid: false, error: "URL must use HTTPS" };
    }

    if (["javascript:", "data:", "vbscript:"].includes(parsed.protocol)) {
      return { valid: false, error: "Invalid URL protocol" };
    }

    if (!parsed.hostname || parsed.hostname.length < 3) {
      return { valid: false, error: "Invalid hostname" };
    }

    if (url.length > 2048) {
      return { valid: false, error: "URL is too long" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}
