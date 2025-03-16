import { EventCategory, EventStatus } from 'src/common/enums';
import { IsEnum, IsISO8601, IsNumber, IsString } from 'class-validator';
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class EventDTO {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({
    enum: EventCategory,
  })
  @IsEnum(EventCategory)
  category: EventCategory;

  @ApiProperty({
    enum: EventStatus,
  })
  @IsEnum(EventStatus)
  status: EventStatus;

  @ApiProperty()
  @IsISO8601()
  datetime_start: Date;

  @ApiProperty()
  @IsISO8601()
  datetime_end: Date;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  max_selected_division: number;
}

export class CreateEventDTO extends OmitType(EventDTO, ['status'] as const) {}

export class UpdateEventDTO extends PartialType(EventDTO) {}
