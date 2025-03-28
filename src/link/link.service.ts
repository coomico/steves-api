import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Link } from './link.entity';
import { Repository } from 'typeorm';
import { EventService } from 'src/event/event.service';
import { LinkDTO, UpdateLinkDTO } from 'src/common/dtos';
import { LinkStatus } from 'src/common/enums';
import { Event } from 'src/event/event.entity';

@Injectable()
export class LinkService {
  constructor(
    @InjectRepository(Link)
    private linkRepository: Repository<Link>,

    private eventService: EventService,
  ) {}

  async findAll(
    eventId: number,
    cache?:
      | number
      | boolean
      | {
          id: any;
          milliseconds: number;
        },
  ) {
    return await this.linkRepository.find({
      where: {
        event: { id: eventId },
      },
      cache,
    });
  }

  async findById(
    linkId: number,
    userId: number,
    cache?:
      | number
      | boolean
      | {
          id: any;
          milliseconds: number;
        },
  ) {
    const [link] = await this.linkRepository.find({
      where: { id: linkId },
      relations: {
        event: {
          author: true,
          registrants: {
            user: true,
          },
        },
      },
      cache,
    });

    if (!link) throw new NotFoundException('Event link not found!');

    if (link.status === LinkStatus.PRIVATE) {
      const authorizedUserIds = [
        link.event.author.id,
        ...link.event.registrants.map((r) => r.user.id),
      ];

      if (authorizedUserIds.indexOf(userId) === -1) {
        throw new ForbiddenException(
          'You do not have permission to access this private link!',
        );
      }
    }

    return link;
  }

  async create(newLinks: LinkDTO[], eventId: number, userId: number) {
    const event = await this.eventService.findById(
      eventId,
      undefined,
      undefined,
      {
        author: { id: userId },
      },
    );

    return this.linkRepository.save(
      newLinks.map((link) =>
        this.linkRepository.create({
          ...link,
          event,
        }),
      ),
    );
  }

  async update(
    modifiedLink: UpdateLinkDTO,
    linkId: number,
    userId: number
  ) {
    const subQb = this.linkRepository.manager.getRepository(Event)
      .createQueryBuilder('event')
      .select('event.id')
      .where('event.author_id = :userId');

    const { affected } = await this.linkRepository
      .createQueryBuilder()
      .update()
      .set(modifiedLink)
      .where('id = :linkId')
      .andWhere(`event_id IN ( ${subQb.getQuery()} )`)
      .andWhere('deleted_at IS NULL')
      .setParameters({ linkId, userId })
      .execute();

    if (affected === 0) throw new NotFoundException('Event link not found!');
    return { affected };
  }

  async remove(linkId: number, userId: number) {
    const [link] = await this.linkRepository.find({
      where: {
        id: linkId,
        event: {
          author: { id: userId },
        },
      },
    });

    if (!link) throw new NotFoundException('Event link not found!');

    const { affected } = await this.linkRepository.delete(link.id);

    return { affected };
  }
}
