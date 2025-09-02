import { IsInt, IsString, IsOptional } from 'class-validator';

export class CreateAddressDto {
  @IsInt()
  cityId: number;

  @IsOptional()
  @IsInt()
  districtId?: number;

  @IsString()
  addressLine: string;
}
