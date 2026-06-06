const RESTRICTED_PROTOCOLS = new Set([
  "about:",
  "chrome:",
  "chrome-extension:",
  "edge:",
  "moz-extension:",
  "opera:",
  "view-source:"
]);

export function isRestrictedUrl(url: string | undefined): boolean {
  if (!url) {
    return true;
  }

  try {
    const parsed = new URL(url);
    return RESTRICTED_PROTOCOLS.has(parsed.protocol);
  } catch {
    return true;
  }
}

export function toDisplayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname || parsed.protocol.replace(":", "");
  } catch {
    return url;
  }
}
