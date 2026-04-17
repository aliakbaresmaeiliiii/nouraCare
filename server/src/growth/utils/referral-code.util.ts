import { randomInt } from 'crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** 8-char codes from an unambiguous uppercase alphabet. */
export function generateReferralCodeSegment(): string {
  let out = '';
  for (let i = 0; i < 8; i += 1) {
    out += ALPHABET[randomInt(ALPHABET.length)]!;
  }
  return out;
}

export function normalizeInviteCode(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const s = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (s.length < 4 || s.length > 16) return null;
  return s;
}
