import { RegistrantStatus } from 'src/common/enums';
import { SelectedDivisionDTO } from './division.dto';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class NewRegistrantDTO {
  @ApiProperty()
  @IsNumber()
  event_id: number;

  @ApiProperty({
    type: [SelectedDivisionDTO],
  })
  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(() => SelectedDivisionDTO)
  selected_divisions: SelectedDivisionDTO[];
}

class UpdateRegistrant {
  @ApiProperty({
    enum: RegistrantStatus,
  })
  @IsEnum(RegistrantStatus)
  status: RegistrantStatus;

  @ApiProperty()
  @IsString()
  notes: string;
}

export class UpdateRegistrantDTO extends PartialType(UpdateRegistrant) {}
