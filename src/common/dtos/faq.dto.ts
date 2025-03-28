import { PartialType } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FaqDTO {
  @IsString()
  question: string;

  @IsString()
  answer: string;
}

export class UpdateFaqDTO extends PartialType(FaqDTO) {}
