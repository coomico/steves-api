import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { UserDegree, UserDepartment } from '../enums';

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
  picture: string;
}

export class UpdateUserDTO extends PartialType(
  OmitType(UserDTO, ['email', 'nim', 'picture'] as const),
) {
  @ApiProperty({
    enum: UserDegree,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(UserDegree)
  degree?: UserDegree;

  @ApiProperty({
    enum: UserDepartment,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(UserDepartment)
  department?: UserDepartment;

  @ApiProperty({
    minimum: 1964,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1964)
  entry_year?: number;

  @ApiProperty({
    maxLength: 300,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  bio?: string;

  @IsOptional()
  @IsUrl()
  web_url?: string;

  @IsOptional()
  @IsUrl()
  linkedin_url?: string;

  @IsOptional()
  @IsUrl()
  github_url?: string;

  @IsOptional()
  @IsUrl()
  instagram_url?: string;
}

export class UserInfo {
  id: number;
  token: string;
}
