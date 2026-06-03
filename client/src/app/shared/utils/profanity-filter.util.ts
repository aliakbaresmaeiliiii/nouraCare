import { PROFANITY_TERMS } from '../content/profanity-terms.content';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

function toAsciiDigit(char: string): string {
  const fa = PERSIAN_DIGITS.indexOf(char);
  if (fa >= 0) {
    return String(fa);
  }
  const ar = ARABIC_DIGITS.indexOf(char);
  if (ar >= 0) {
    return String(ar);
  }
  return char;
}

/** Normalize text so common obfuscation (spacing, leetspeak, Arabic/Persian variants) still matches. */
export function normalizeForProfanityCheck(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .split('')
    .map((char) => toAsciiDigit(char))
    .join('')
    .replace(/[\u200c\u200d\u0640\u061c]/g, '')
    .replace(/[يى]/g, 'ی')
    .replace(/[كک]/g, 'ک')
    .replace(/[ةۀ]/g, 'ه')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[$5]/g, 's')
    .replace(/[7+]/g, 't')
    .replace(/(.)\1{2,}/g, '$1$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPattern(term: string): RegExp {
  const normalized = normalizeForProfanityCheck(term).replace(/\s+/g, '');
  if (!normalized) {
    return /(?!)/;
  }

  const spaced = normalized.split('').map(escapeRegex).join('\\s*');

  if (/^[a-z0-9]+$/i.test(normalized)) {
    return new RegExp(`(?:^|[^a-z0-9])${spaced}(?:[^a-z0-9]|$)`, 'i');
  }

  return new RegExp(spaced, 'i');
}

const PROFANITY_PATTERNS = PROFANITY_TERMS.map(buildPattern);

export function containsProfanity(text: string | null | undefined): boolean {
  if (!text?.trim()) {
    return false;
  }

  const normalized = normalizeForProfanityCheck(text);
  const compact = normalized.replace(/\s+/g, '');

  return PROFANITY_PATTERNS.some(
    (pattern) => pattern.test(normalized) || pattern.test(compact),
  );
}

export function containsProfanityInFields(
  ...texts: Array<string | null | undefined>
): boolean {
  return texts.some((text) => containsProfanity(text));
}
