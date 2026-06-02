import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, createPublicKey } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type VerifiedSocialProfile = {
  email: string;
  fullName?: string;
  subject: string;
};

type GoogleTokenInfo = {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  exp?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  sub?: string;
};

type AppleJwk = {
  kty: string;
  kid: string;
  use?: string;
  alg?: string;
  n?: string;
  e?: string;
};

@Injectable()
export class SocialTokenService {
  private appleJwksCache: { keys: AppleJwk[]; fetchedAt: number } | null = null;

  async verifyGoogleToken(params: {
    idToken?: string;
    accessToken?: string;
  }): Promise<VerifiedSocialProfile> {
    if (params.idToken?.trim()) {
      return this.verifyGoogleIdToken(params.idToken.trim());
    }
    if (params.accessToken?.trim()) {
      return this.verifyGoogleAccessToken(params.accessToken.trim());
    }
    throw new BadRequestException(
      'Google idToken or accessToken is required for social login',
    );
  }

  async verifyAppleToken(params: {
    idToken?: string;
    email?: string;
    fullName?: string;
  }): Promise<VerifiedSocialProfile> {
    const idToken = params.idToken?.trim();
    if (!idToken) {
      throw new BadRequestException(
        'Apple identity token is required for Apple sign-in',
      );
    }

    const payload = await this.verifyAppleIdToken(idToken);
    const email = (payload.email ?? params.email)?.trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException(
        'Apple did not provide an email for this account',
      );
    }

    return {
      email,
      fullName: params.fullName?.trim() || undefined,
      subject: payload.sub,
    };
  }

  private async verifyGoogleIdToken(idToken: string): Promise<VerifiedSocialProfile> {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );
    if (!res.ok) {
      throw new UnauthorizedException('Invalid Google identity token');
    }

    const data = (await res.json()) as GoogleTokenInfo;
    this.assertGoogleAudience(data.aud);

    if (data.email_verified === false || data.email_verified === 'false') {
      throw new UnauthorizedException('Google email is not verified');
    }

    const email = data.email?.trim().toLowerCase();
    if (!email || !data.sub) {
      throw new UnauthorizedException('Google token missing email or subject');
    }

    return {
      email,
      fullName: this.buildFullName(data.name, data.given_name, data.family_name),
      subject: data.sub,
    };
  }

  private async verifyGoogleAccessToken(
    accessToken: string,
  ): Promise<VerifiedSocialProfile> {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new UnauthorizedException('Invalid Google access token');
    }

    const data = (await res.json()) as {
      email?: string;
      email_verified?: boolean;
      sub?: string;
      name?: string;
      given_name?: string;
      family_name?: string;
    };

    const email = data.email?.trim().toLowerCase();
    if (!email || !data.sub) {
      throw new UnauthorizedException('Google profile missing email or subject');
    }
    if (data.email_verified === false) {
      throw new UnauthorizedException('Google email is not verified');
    }

    return {
      email,
      fullName: this.buildFullName(data.name, data.given_name, data.family_name),
      subject: data.sub,
    };
  }

  private assertGoogleAudience(aud: string | undefined): void {
    const allowed = env.GOOGLE_CLIENT_IDS;
    if (allowed.length === 0) {
      return;
    }
    if (!aud || !allowed.includes(aud)) {
      throw new UnauthorizedException('Google token audience mismatch');
    }
  }

  private buildFullName(
    name?: string,
    givenName?: string,
    familyName?: string,
  ): string | undefined {
    const fromParts = [givenName, familyName]
      .filter((p): p is string => !!p?.trim())
      .join(' ')
      .trim();
    return fromParts || name?.trim() || undefined;
  }

  private async verifyAppleIdToken(idToken: string): Promise<{
    sub: string;
    email?: string;
  }> {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid Apple identity token');
    }

    const decoded = jwt.decode(idToken, { complete: true });
    if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
      throw new UnauthorizedException('Invalid Apple identity token');
    }

    const jwk = await this.getAppleJwk(decoded.header.kid);
    const publicKey = createPublicKey({ key: jwk, format: 'jwk' });
    const algorithms: jwt.Algorithm[] =
      decoded.header.alg === 'ES256' ? ['ES256'] : ['RS256'];

    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(idToken, publicKey, {
        algorithms,
        issuer: 'https://appleid.apple.com',
      }) as jwt.JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid Apple identity token');
    }

    const appleClientIds = env.APPLE_CLIENT_IDS;
    if (
      appleClientIds.length > 0 &&
      (!payload.aud ||
        (typeof payload.aud === 'string'
          ? !appleClientIds.includes(payload.aud)
          : !appleClientIds.some((id) =>
              Array.isArray(payload.aud)
                ? payload.aud.includes(id)
                : false,
            )))
    ) {
      throw new UnauthorizedException('Apple token audience mismatch');
    }

    if (!payload.sub) {
      throw new UnauthorizedException('Apple token missing subject');
    }

    return {
      sub: String(payload.sub),
      email: typeof payload.email === 'string' ? payload.email : undefined,
    };
  }

  private async getAppleJwk(kid?: string): Promise<AppleJwk> {
    const now = Date.now();
    if (
      !this.appleJwksCache ||
      now - this.appleJwksCache.fetchedAt > 60 * 60 * 1000
    ) {
      const res = await fetch('https://appleid.apple.com/auth/keys');
      if (!res.ok) {
        throw new UnauthorizedException('Unable to load Apple public keys');
      }
      const body = (await res.json()) as { keys: AppleJwk[] };
      this.appleJwksCache = { keys: body.keys ?? [], fetchedAt: now };
    }

    const key = this.appleJwksCache.keys.find((k) => k.kid === kid);
    if (!key) {
      throw new UnauthorizedException('Apple signing key not found');
    }
    return key;
  }
}

/** Parse refresh token format `{userId}.{uuid}` */
export function parseRefreshToken(refreshToken: string): {
  userId: number;
  tokenSecret: string;
} | null {
  const dotIndex = refreshToken.indexOf('.');
  if (dotIndex <= 0) {
    return null;
  }
  const userId = parseInt(refreshToken.slice(0, dotIndex), 10);
  const tokenSecret = refreshToken.slice(dotIndex + 1);
  if (!Number.isInteger(userId) || userId < 1 || !tokenSecret) {
    return null;
  }
  return { userId, tokenSecret };
}

/** Build opaque refresh token: `{userId}.{uuid}` */
export function buildRefreshToken(userId: number, secret: string): string {
  return `${userId}.${secret}`;
}

/** SHA-256 lookup key for refresh token DB index (optional fast path). */
export function refreshTokenLookupHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
