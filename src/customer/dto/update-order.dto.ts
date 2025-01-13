import {
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  price?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  barcode?: string;
}

export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  status?:
    | 'created'
    | 'in_progress'
    | 'delivered'
    | 'invoiced';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductDto)
  products?: ProductDto[];
}
