import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EventSocialAccount, UserSocialAccount } from './social_account.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateSocialAccountDTO } from 'src/common/dtos/social_account.dto';
import { Event } from 'src/event/event.entity';

@Injectable()
export class SocialAccountService {
  constructor(
    @InjectRepository(UserSocialAccount)
    private userSocialAccountRepository: Repository<UserSocialAccount>,

    @InjectRepository(EventSocialAccount)
    private eventSocialAccountRepository: Repository<EventSocialAccount>,
  ) {}

  async update<T extends 'user' | 'event'>(
    modifiedSocialAccount: UpdateSocialAccountDTO,
    socialAccountId: number,
    entity: T,
    entityId: number,
    userId: T extends 'event' ? number : undefined,
  ) {
    let qb;
    if (entity === 'user') {
      qb = this.userSocialAccountRepository
        .createQueryBuilder()
        .update()
        .set(modifiedSocialAccount)
        .where('id = :socialAccountId', { socialAccountId })
        .andWhere('user_id = :entityId', { entityId });
    } else {
      const subQb = this.eventSocialAccountRepository.manager
        .getRepository(Event)
        .createQueryBuilder('event')
        .select('event.id')
        .where('event.author_id = :userId');

      qb = this.eventSocialAccountRepository
        .createQueryBuilder()
        .update()
        .set(modifiedSocialAccount)
        .where('id = :socialAccountId')
        .andWhere('event_id = :entityId')
        .andWhere(`event_id IN ( ${subQb.getQuery()} )`)
        .andWhere('deleted_at IS NULL')
        .setParameters({ socialAccountId, entityId, userId });
    }

    const { affected } = await qb.execute();
    if (affected === 0)
      throw new NotFoundException(`Social account not found!`);

    return { affected };
  }

  async delete<T extends 'user' | 'event'>(
    socialAccountId: number,
    entity: T,
    entityId: number,
    userId: T extends 'event' ? number : undefined,
  ) {
    let qb;
    if (entity === 'user') {
      qb = this.userSocialAccountRepository
        .createQueryBuilder()
        .delete()
        .where('id = :socialAccountId', { socialAccountId })
        .andWhere('user_id = :entityId', { entityId });
    } else {
      const subQb = this.eventSocialAccountRepository.manager
        .getRepository(Event)
        .createQueryBuilder('event')
        .select('event.id')
        .where('event.author_id = :userId');

      qb = this.eventSocialAccountRepository
        .createQueryBuilder()
        .delete()
        .where('id = :socialAccountId')
        .andWhere('event_id = :entityId')
        .andWhere(`event_id IN ( ${subQb.getQuery()} )`)
        .andWhere('deleted_at IS NULL')
        .setParameters({ socialAccountId, entityId, userId });
    }

    const { affected } = await qb.execute();
    if (affected === 0)
      throw new NotFoundException(`Social account not found!`);

    return { affected };
  }
}
