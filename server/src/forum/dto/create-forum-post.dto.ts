export class CreateForumPostDto {
  content: string;
  threadId: string;
  parentId?: string;
  isAnonymous?: boolean;
}
