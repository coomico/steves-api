import { IsEnum, IsUrl } from 'class-validator';
import { SocialAccountType } from '../enums/social-account.enum';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class SocialAccountDTO {
  @ApiProperty({
    enum: SocialAccountType,
  })
  @IsEnum(SocialAccountType)
  type: SocialAccountType;

  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  url: string;
}

export class UpdateSocialAccountDTO extends PartialType(SocialAccountDTO) {}
