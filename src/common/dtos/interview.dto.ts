import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsISO8601, IsNumber, IsString, Min } from 'class-validator';

export class InterviewDTO {
  @ApiProperty()
  @IsISO8601()
  available_start: Date;

  @ApiProperty()
  @IsISO8601()
  available_end: Date;

  @ApiProperty()
  @IsNumber()
  @Min(1)
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
