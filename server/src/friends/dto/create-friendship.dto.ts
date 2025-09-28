import { IsEnum, IsInt } from 'class-validator';
import { FriendshipStatus } from '@prisma/client';

export class CreateFriendshipDto {
  @IsInt()
  followingId: number;

  @IsEnum(FriendshipStatus)
  status?: FriendshipStatus = FriendshipStatus.PENDING;
}
