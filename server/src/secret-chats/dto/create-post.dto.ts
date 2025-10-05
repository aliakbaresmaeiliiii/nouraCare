export class CreatePostMediaDto {
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  caption?: string;
}

export class CreatePostDto {
  content?: string;
  chatId: string;
  categoryId?: string;
  isAnonymous?: boolean = false;
  media?: CreatePostMediaDto[];
  tags?: string[];
}
