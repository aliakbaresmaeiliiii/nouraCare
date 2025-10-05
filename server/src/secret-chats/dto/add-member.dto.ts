export enum MemberRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
}

export class AddMemberDto {
  userId: number;
  role?: MemberRole = MemberRole.MEMBER;
}
