import {
  IsString,
  IsEmail,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsString()
  surname: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsString()
  address?: string;
}
