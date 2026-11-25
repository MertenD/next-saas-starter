/** Browser and operating system names (proper nouns, not translated) read from a user agent string. */
export type DeviceInfo = { browser: string; os: string }

/** Checked in order: Edge and Opera also contain "Chrome", Chrome also contains "Safari". */
const BROWSERS: [RegExp, string][] = [
  [/Edg\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/Firefox\//, "Firefox"],
  [/Chrome\/|CriOS\//, "Chrome"],
  [/Safari\//, "Safari"],
]

/** Checked in order: iPhone and Android user agents also mention macOS or Linux. */
const SYSTEMS: [RegExp, string][] = [
  [/iPhone|iPad|iPod/, "iOS"],
  [/Android/, "Android"],
  [/Windows/, "Windows"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/Linux|X11/, "Linux"],
]

/**
 * A short, readable device description for the sessions list ("Chrome" on
 * "Windows"), or `null` when the user agent is missing or unknown. Deliberately
 * simple pattern matching, not a full user agent parser.
 */
export function describeUserAgent(userAgent: string | null): DeviceInfo | null {
  if (!userAgent) return null

  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1]
  const os = SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1]
  if (!browser || !os) return null

  return { browser, os }
}
