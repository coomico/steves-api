import { Module } from '@nestjs/common';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialAccountModule } from 'src/social_account/social_account.module';
import { UserSocialAccount } from 'src/social_account/social_account.entity';

@Module({
  imports: [
    SocialAccountModule,
    TypeOrmModule.forFeature([User, UserSocialAccount]),
  ],
  exports: [UserService],
  providers: [User, UserService],
  controllers: [UserController],
})
export class UserModule {}
