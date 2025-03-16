import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, IsUrl, Min } from 'class-validator';
import { LinkStatus } from '../enums';

export class LinkDTO {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsUrl()
  url: string;

  @ApiProperty({
    enum: LinkStatus,
  })
  @IsEnum(LinkStatus)
  status: LinkStatus;

  @ApiProperty({
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  position: number;
}

export class UpdateLinkDTO extends PartialType(LinkDTO) {}
