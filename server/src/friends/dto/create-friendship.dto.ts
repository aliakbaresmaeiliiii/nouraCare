import { IsEnum, IsInt } from 'class-validator';

export enum FriendshipStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  BLOCKED = 'BLOCKED'
}

export class CreateFriendshipDto {
  @IsInt()
  followingId: number;

  @IsEnum(FriendshipStatus)
  status?: FriendshipStatus = FriendshipStatus.PENDING;
}
