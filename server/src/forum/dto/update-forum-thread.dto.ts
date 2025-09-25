import { PartialType } from '@nestjs/mapped-types';
import { CreateForumThreadDto } from './create-forum-thread.dto';

export class UpdateForumThreadDto extends PartialType(CreateForumThreadDto) {}
