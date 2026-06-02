import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export enum MemberRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
}

export class AddMemberDto {
  @IsInt()
  @Min(1)
  userId: number;

  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole = MemberRole.MEMBER;
}
