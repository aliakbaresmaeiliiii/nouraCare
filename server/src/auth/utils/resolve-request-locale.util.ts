import { normalizeEmailLocale } from '../../helper/email-translations';

/** Parse the first language tag from an Accept-Language header value. */
function pickLanguageFromAcceptHeader(value?: string): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const first = value.split(',')[0]?.trim();
  if (!first) {
    return undefined;
  }

  return first.split(';')[0]?.trim();
}

/** Resolve UI language from Accept-Language (preferred) or legacy X-App-Language. */
export function resolveRequestLocale(
  acceptLanguage?: string | string[],
  legacyAppLanguage?: string | string[],
): string | undefined {
  const acceptHeader = Array.isArray(acceptLanguage)
    ? acceptLanguage[0]
    : acceptLanguage;
  const legacyHeader = Array.isArray(legacyAppLanguage)
    ? legacyAppLanguage[0]
    : legacyAppLanguage;

  const candidate =
    pickLanguageFromAcceptHeader(acceptHeader) || legacyHeader?.trim();

  if (!candidate) {
    return undefined;
  }

  return normalizeEmailLocale(candidate);
}
