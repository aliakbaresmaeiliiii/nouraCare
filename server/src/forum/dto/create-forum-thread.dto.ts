export class CreateForumThreadDto {
  title: string;
  content: string;
  forumId: string;
  isPinned?: boolean;
  isLocked?: boolean;
  tags?: string[];
}
