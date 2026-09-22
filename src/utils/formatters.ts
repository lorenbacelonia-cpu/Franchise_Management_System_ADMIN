/**
 * Utility functions to ensure proper text capitalization and formatting across user inputs
 */

/**
 * Capitalizes the first letter of each word (Title Case)
 * Ideal for Names (First, Middle, Last), Addresses, Destinations, Routes, and Labels
 * Example: "juan dela cruz" -> "Juan Dela Cruz"
 */
export function formatTitleCase(str: string): string {
  if (!str) return '';
  return str.replace(/(?:^|\s|-|\.)[a-z\u00E0-\u00FC]/g, (match) => match.toUpperCase());
}

/**
 * Capitalizes the first letter of a sentence or context
 * Ideal for Remarks, Descriptions, Review Notes, Reasons
 * Example: "driver charged extra fare" -> "Driver charged extra fare"
 */
export function formatSentenceCase(str: string): string {
  if (!str) return '';
  return str.replace(/(^\s*|[.!?]\s+)([a-z\u00E0-\u00FC])/g, (_, prefix, char) => prefix + char.toUpperCase());
}

/**
 * Uppercases text codes like Plate Numbers, License Numbers, Engine/Chassis No, and OR Numbers
 * Example: "t-106" -> "T-106", "ped-001" -> "PED-001"
 */
export function formatCodeUpper(str: string): string {
  if (!str) return '';
  return str.toUpperCase();
}

/**
 * Masks a citizen/reporter username for privacy protection
 * Example: "andrie30311" -> "and*******11"
 * Example: "maria_santos99" -> "mar*******99"
 */
export function maskUsername(username?: string): string {
  if (!username) return 'Cit*******er';
  const trimmed = username.trim();
  if (trimmed.length <= 4) {
    return trimmed.slice(0, 1) + '*******' + trimmed.slice(-1);
  }
  const prefix = trimmed.slice(0, 3);
  const suffix = trimmed.slice(-2);
  const maskCount = Math.max(trimmed.length - 5, 7);
  return `${prefix}${'*'.repeat(maskCount)}${suffix}`;
}
