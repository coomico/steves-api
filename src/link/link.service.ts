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

  async create(newLinks: LinkDTO | LinkDTO[], eventId: number, userId: number) {
    const event = await this.eventService.findById(
      eventId,
      undefined,
      undefined,
      {
        author: { id: userId },
      },
    );

    if (Array.isArray(newLinks))
      return this.linkRepository.save(
        newLinks.map((link) =>
          this.linkRepository.create({
            ...link,
            event,
          }),
        ),
      );

    return this.linkRepository.save(
      this.linkRepository.create({
        ...newLinks,
        event,
      }),
    );
  }

  async update(modifiedLink: UpdateLinkDTO, linkId: number, userId: number) {
    const { affected } = await this.linkRepository.update(
      {
        id: linkId,
        event: {
          author: { id: userId },
        },
      },
      modifiedLink,
    );
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
