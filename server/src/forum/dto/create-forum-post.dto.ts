export class CreateForumPostDto {
  content: string;
  threadId?: string;
  categoryId?: string;
  title?: string;
  tags?: string[];
  parentId?: string;
  isAnonymous?: boolean;
}
