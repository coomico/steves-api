import { Module } from '@nestjs/common';
import { SocialAccountService } from './social_account.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventSocialAccount, UserSocialAccount } from './social_account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserSocialAccount, EventSocialAccount])],
  providers: [SocialAccountService],
  exports: [SocialAccountService],
})
export class SocialAccountModule {}
