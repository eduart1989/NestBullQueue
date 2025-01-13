import {
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  barcode: string;
}

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  status:
    | 'created'
    | 'in_progress'
    | 'delivered'
    | 'invoiced';

  @IsArray()
  @ArrayMinSize(1, {
    message: 'At least one product is required',
  })
  @ValidateNested({ each: true })
  @Type(() => ProductDto)
  products: ProductDto[];
}
