import { ApplicationStatus } from '../enums/application-status.enum';
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

export class NewApplicationDTO {
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

class UpdateApplication {
  @ApiProperty({
    enum: ApplicationStatus,
  })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ApiProperty()
  @IsString()
  notes: string;
}

export class UpdateApplicationDTO extends PartialType(UpdateApplication) {}
