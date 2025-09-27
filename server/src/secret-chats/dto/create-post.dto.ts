import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePostMediaDto {
  @IsString()
  url: string;

  @IsString()
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';

  @IsOptional()
  @IsString()
  caption?: string;
}

export class CreatePostDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsString()
  chatId: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean = false;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePostMediaDto)
  media?: CreatePostMediaDto[];
}
