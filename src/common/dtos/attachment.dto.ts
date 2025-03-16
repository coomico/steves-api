import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { AttachmentStatus } from 'src/common/enums';

export class AttachmentDTO {
  @ApiProperty()
  @IsString()
  filename: string;

  @ApiProperty()
  @IsString()
  original_filename: string;

  @ApiProperty({
    enum: AttachmentStatus,
  })
  @IsEnum(AttachmentStatus)
  status: AttachmentStatus;

  @ApiProperty()
  @IsString()
  content_type: string;

  @ApiProperty()
  @IsNumber()
  size: number;

  @ApiProperty()
  @IsString()
  storage_key: string;
}
