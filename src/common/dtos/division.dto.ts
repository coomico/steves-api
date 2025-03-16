import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class DivisionDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  capacity: number;
}

export class UpdateDivisionDTO extends PartialType(DivisionDTO) {}

export class SelectedDivisionDTO {
  @ApiProperty()
  @IsNumber()
  division_id: number;

  @ApiProperty({
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  priority: number;
}
