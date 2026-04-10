import { UnauthorizedException } from '@nestjs/common';

/**
 * JWT `sub` is often a string (RFC 7519). Prisma user id is Int — coerce safely.
 */
export function userIdFromJwtSub(sub: unknown): number {
  if (sub === null || sub === undefined || sub === '') {
    throw new UnauthorizedException('Invalid token subject');
  }
  const id =
    typeof sub === 'string' ? parseInt(sub, 10) : Number(sub);
  if (!Number.isInteger(id) || id < 1) {
    throw new UnauthorizedException('Invalid token subject');
  }
  return id;
}
