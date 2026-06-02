import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePostMediaDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsIn(['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT'])
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;
}

export class CreatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePostMediaDto)
  media?: CreatePostMediaDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];
}
