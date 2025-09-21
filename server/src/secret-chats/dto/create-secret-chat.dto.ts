import { IsString, IsOptional, IsBoolean, IsArray, IsInt } from 'class-validator';

export class CreateSecretChatDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isGroup?: boolean = false;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  memberIds?: number[];
}
