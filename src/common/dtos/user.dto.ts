import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsEmail, IsString, IsUrl } from 'class-validator';

export class UserDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  nim: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsUrl()
  picture_path: string;
}

export class UpdateUserDTO extends PartialType(
  OmitType(UserDTO, ['email', 'nim', 'picture_path'] as const),
) {}

export class UserInfo {
  id: number;
  token: string;
}
