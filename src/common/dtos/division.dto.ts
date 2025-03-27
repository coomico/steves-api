import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class DivisionDTO {
  @IsString()
  name: string;

  @ApiProperty({
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  capacity: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString({
    each: true,
  })
  responsibilities?: string | string[];

  @IsOptional()
  @IsString({
    each: true,
  })
  requirements?: string | string[];
}

export class UpdateDivisionDTO extends PartialType(DivisionDTO) {}

export class SelectedDivisionDTO {
  @IsNumber()
  division_id: number;

  @ApiProperty({
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  priority: number;

  @ApiProperty({
    maxLength: 1800,
  })
  @IsString()
  @MaxLength(1800)
  motivation_letter: string;
}
