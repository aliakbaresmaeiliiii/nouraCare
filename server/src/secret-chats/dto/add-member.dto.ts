import { IsInt, IsEnum, IsOptional } from 'class-validator';

export enum MemberRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
}

export class AddMemberDto {
  @IsInt()
  userId: number;

  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole = MemberRole.MEMBER;
}
