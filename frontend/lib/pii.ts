/**
 * Client-side PII detection — mirrors the backend guardrail patterns.
 * Returns true if the message likely contains personal information.
 */
const PII_PATTERNS: RegExp[] = [
  // 9-digit ID (BSN / Surinamese ID)
  /\b\d{9}\b/,
  // Credit-card numbers (13-19 digits, optional separators)
  /\b(?:\d[ -]?){13,19}\b/,
  // Phone numbers: +597 / international / local
  /(?:\+\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/,
  // E-mail addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
];

export function containsPII(text: string): boolean {
  return PII_PATTERNS.some((p) => p.test(text));
}
