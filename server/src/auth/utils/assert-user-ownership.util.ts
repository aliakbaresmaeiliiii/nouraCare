import { ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';

export function userIdFromRequest(req: Request): number {
  const user = req.user as { id?: number } | undefined;
  if (!user?.id) {
    throw new ForbiddenException('Authentication required');
  }
  return user.id;
}

/** Ensures the authenticated user matches the `:id` / `:userId` route param. */
export function assertUserOwnership(
  req: Request,
  paramUserId: string | number,
): number {
  const authUserId = userIdFromRequest(req);
  const requestedId =
    typeof paramUserId === 'string' ? parseInt(paramUserId, 10) : paramUserId;

  if (!Number.isInteger(requestedId) || requestedId < 1) {
    throw new ForbiddenException('Invalid user id');
  }
  if (authUserId !== requestedId) {
    throw new ForbiddenException('You can only access your own data');
  }
  return requestedId;
}
