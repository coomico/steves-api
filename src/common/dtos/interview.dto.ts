import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsISO8601, IsNumber, IsString, Min } from 'class-validator';
import { IsDate } from '../decorator/is_date.decorator';
import { IsTime } from '../decorator/is_time.decorator';

export class InterviewDTO {
  @IsDate()
  date_start: Date;

  @IsDate()
  date_end: Date;

  @IsTime()
  dailytime_start: string;

  @IsTime()
  dailytime_end: string;

  @ApiProperty({
    minimum: 5,
  })
  @IsNumber()
  @Min(5)
  duration_minutes: number;
}

export class InterviewBlockingDTO {
  @ApiProperty()
  @IsISO8601()
  range_start: Date;

  @ApiProperty()
  @IsISO8601()
  range_end: Date;

  @ApiProperty()
  @IsString()
  reason: string;
}

export class InterviewScheduleDTO {
  @ApiProperty()
  @IsISO8601()
  selected_time: Date;
}

export class UpdateInterviewDTO extends PartialType(InterviewDTO) {}

export class UpdateInterviewBlockingDTO extends PartialType(
  InterviewBlockingDTO,
) {}
