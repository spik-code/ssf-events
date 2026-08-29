/**
 * Strip control characters without embedding literal control bytes in this file.
 * Anything below U+0020, plus DEL (U+007F), is dropped.
 */
function stripControl(input: string): string {
  let out = "";
  for (const ch of input) {
    const code = ch.codePointAt(0)!;
    if (code >= 32 && code !== 127) out += ch;
  }
  return out;
}

/** Trim, drop control characters, and cap length. Returns null for empty input. */
export function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const s = stripControl(value).trim().slice(0, max);
  return s.length ? s : null;
}

/** Same as `clean` but preserves newlines — for multi-line message fields. */
export function cleanMultiline(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const s = value
    .split("\n")
    .map((line) => stripControl(line).trimEnd())
    .join("\n")
    .trim()
    .slice(0, max);
  return s.length ? s : null;
}
