export class CreateCommentDto {
  content: string;
  postId: string;
  parentId?: string;
  isAnonymous?: boolean = false;
}
