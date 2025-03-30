import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm';
import { Event } from './event.entity';
import { UserService } from 'src/user/user.service';
import { CreateEventDTO, UpdateEventDTO } from 'src/common/dtos';
import {
  AttachmentStatus,
  EventAttachmentType,
  EventCategory,
  EventStatus,
} from 'src/common/enums';
import { StorageService } from 'src/storage/storage.service';
import {
  CategoryOptions,
  Cursor,
  EventOrderKeys,
  isObjectEmpty,
  MAX_NUMBER_ATTACHMENTS,
  OrderOptions,
  R2_BUCKET,
  StatusOptions,
} from 'src/common/utils';
import { EventAttachment } from 'src/attachment/attachment.entity';
import { AttachmentService } from 'src/attachment/attachment.service';
import { PaginationService } from 'src/pagination/pagination.service';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,

    @InjectRepository(EventAttachment)
    private eventAttachmentRepository: Repository<EventAttachment>,

    private userService: UserService,
    private storageService: StorageService,
    private attachmentService: AttachmentService,
    private paginationService: PaginationService,
  ) {}

  private readonly logger = new Logger(EventService.name, {
    timestamp: true,
  });

  async findAll(
    take: number,
    userId?: number,
    title?: string,
    order?: OrderOptions<EventOrderKeys>,
    category?: CategoryOptions<EventCategory>[],
    status?: StatusOptions<EventStatus, EventStatus.DRAFT>[],
    cursor?: Cursor,
    cache?:
      | number
      | boolean
      | {
          id: any;
          milliseconds: number;
        },
  ) {
    const qb = this.eventRepository
      .createQueryBuilder('event')
      .loadRelationCountAndMap(
        'event.total_applications',
        'event.applications',
        'application',
      )
      .loadRelationCountAndMap(
        'event.total_divisions',
        'event.divisions',
        'division',
      );

    if (cache !== undefined) qb.cache(cache);

    if (userId) {
      qb.where('author_id = :author', { author: userId });
    } else {
      qb.where('status != :draft', { draft: EventStatus.DRAFT });
    }

    if (title) qb.andWhere('title ILIKE :title', { title: `%${title}%` });

    if (category?.length)
      qb.andWhere('category IN (:...category)', { category });

    if (status?.length) qb.andWhere('status IN (:...status)', { status });

    const orderDump: OrderOptions<EventOrderKeys> =
      order && !isObjectEmpty(order) ? order : { datetime_start: 'ASC' };

    if (cursor && cursor.direction === 'backward') {
      return await this.paginationService.backward(
        Event,
        qb,
        take,
        orderDump,
        cursor,
      );
    } else {
      return await this.paginationService.forward(qb, take, orderDump, cursor);
    }
  }

  async findById(
    id: number,
    relations?: FindOptionsRelations<Event>,
    order?: FindOptionsOrder<Event>,
    additionalWhere?: FindOptionsWhere<Omit<Event, 'id'>>,
    cache?:
      | number
      | boolean
      | {
          id: any;
          milliseconds: number;
        },
  ) {
    const [event] = await this.eventRepository.find({
      relations,
      where: {
        id,
        ...additionalWhere,
      },
      order,
      cache,
    });
    if (!event) throw new NotFoundException('Event not found!');
    return event;
  }

  async create(
    newEvent: CreateEventDTO,
    userId: number,
    files?: {
      logo?: Express.Multer.File;
      banner?: Express.Multer.File;
    },
  ) {
    const author = await this.userService.findById(userId);

    if (!files || (!files.logo && !files.banner)) {
      return await this.eventRepository.save({
        ...newEvent,
        author,
      });
    }

    const [[logoMetadatas], [bannerMetadatas]] = await Promise.all([
      this.attachmentService.uploadAttachments(
        files.logo,
        userId,
        AttachmentStatus.PUBLIC,
      ),
      this.attachmentService.uploadAttachments(
        files.banner,
        userId,
        AttachmentStatus.PUBLIC,
      ),
    ]);

    const attachments: EventAttachment[] = [];

    if (logoMetadatas)
      attachments.push(
        ...this.attachmentService.add(
          [
            {
              ...logoMetadatas,
              type: EventAttachmentType.LOGO,
            },
          ],
          EventAttachment,
        ),
      );

    if (bannerMetadatas)
      attachments.push(
        ...this.attachmentService.add(
          [
            {
              ...bannerMetadatas,
              type: EventAttachmentType.BANNER,
            },
          ],
          EventAttachment,
        ),
      );

    const logo = logoMetadatas
      ? `${process.env.R2_DEV_PUBLIC_BUCKET}/${logoMetadatas.storage_key}`
      : undefined;
    const banner = bannerMetadatas
      ? `${process.env.R2_DEV_PUBLIC_BUCKET}/${bannerMetadatas.storage_key}`
      : undefined;

    const event = await this.eventRepository.save({
      ...newEvent,
      logo,
      banner,
      author,
      attachments,
    });

    return event;
  }

  private async updateBannerLogo(
    file: Express.Multer.File,
    type: EventAttachmentType,
    userId: number,
    event: Event,
    eventRepository: Repository<Event>,
    attachmentRepository: Repository<EventAttachment>,
    objectDump: {
      key: string;
      bucket: string;
    }[],
    oldDump: {
      type: EventAttachmentType;
      old: string;
    }[],
    public_url?: string,
  ) {
    const [metadatas] = await this.attachmentService.uploadAttachments(
      file,
      userId,
      AttachmentStatus.PUBLIC,
    );
    objectDump.push({
      key: metadatas.storage_key,
      bucket: R2_BUCKET.PUBLIC,
    });

    if (type === EventAttachmentType.BANNER) {
      event.banner = `${process.env.R2_DEV_PUBLIC_BUCKET}/${metadatas.storage_key}`;
    } else if (type === EventAttachmentType.LOGO) {
      event.logo = `${process.env.R2_DEV_PUBLIC_BUCKET}/${metadatas.storage_key}`;
    }

    event = await eventRepository.save(event);

    attachmentRepository.save({
      ...metadatas,
      type,
      event,
    });

    if (public_url) {
      oldDump.push({
        type,
        old: public_url,
      });
    }
  }

  async update(
    modifiedEvent: UpdateEventDTO,
    eventId: number,
    userId: number,
    files?: {
      logo?: Express.Multer.File;
      banner?: Express.Multer.File;
    },
  ) {
    let event = await this.findById(eventId);

    if (modifiedEvent.status === EventStatus.PUBLISHED && !event.interview) {
      throw new ConflictException('Event interview has not been set yet!');
    }

    const uploadedObject: {
      key: string;
      bucket: string;
    }[] = [];

    const oldBannerLogo: {
      type: EventAttachmentType;
      old: string;
    }[] = [];

    try {
      return await this.eventRepository.manager.transaction(async (manager) => {
        const eventRepository = manager.getRepository(Event);
        const eventAttachmentRepository =
          manager.getRepository(EventAttachment);

        event = await eventRepository.save({
          ...event,
          ...modifiedEvent,
        });

        if (!files || (!files.logo && !files.banner)) {
          return event;
        }

        const updatedAttachments = [];

        if (files.logo) {
          updatedAttachments.push(
            this.updateBannerLogo(
              files.logo,
              EventAttachmentType.LOGO,
              userId,
              event,
              eventRepository,
              eventAttachmentRepository,
              uploadedObject,
              oldBannerLogo,
              event.logo,
            ),
          );
        }

        if (files.banner) {
          updatedAttachments.push(
            this.updateBannerLogo(
              files.banner,
              EventAttachmentType.BANNER,
              userId,
              event,
              eventRepository,
              eventAttachmentRepository,
              uploadedObject,
              oldBannerLogo,
              event.banner,
            ),
          );
        }

        await Promise.all(updatedAttachments);

        return event;
      });
    } catch (error) {
      // rollback (delete) the object stored
      if (uploadedObject.length > 0) {
        this.storageService.bulkDeleteObjectsFromR2(uploadedObject);
      }

      // switch back the banner or logo
      if (oldBannerLogo.length > 0) {
        oldBannerLogo.forEach(async (m) => {
          const updateBack =
            m.type === EventAttachmentType.BANNER
              ? { banner: m.old }
              : { logo: m.old };

          this.eventRepository.update(event.id, updateBack);
        });
      }

      this.logger.error('Failed to update event!', error.stack);

      throw error;
    }
  }

  async addAttachments(
    eventId: number,
    files: {
      public_attachments?: Express.Multer.File[];
      private_attachments?: Express.Multer.File[];
    },
    userId: number,
  ) {
    if (!files.private_attachments && !files.public_attachments) return;

    const count = await this.eventAttachmentRepository
      .createQueryBuilder()
      .where('event_id = :eventId', { eventId })
      .andWhere('type NOT IN (:...types)', {
        types: [EventAttachmentType.BANNER, EventAttachmentType.LOGO],
      })
      .getCount();

    if (count >= MAX_NUMBER_ATTACHMENTS) {
      throw new BadRequestException(
        `You already have ${count}/${MAX_NUMBER_ATTACHMENTS} attachemnts for this event.`,
      );
    }

    let added = 0;
    Object.values(files).map((f) => {
      added += f.length;

      if (added + count > MAX_NUMBER_ATTACHMENTS) {
        throw new BadRequestException(
          `Cannot add ${added} attachment(s). You have ${count}/${MAX_NUMBER_ATTACHMENTS} attachments for this event.`,
        );
      }
    });

    let metadatas: {
      filename: string;
      original_filename: string;
      status: AttachmentStatus;
      content_type: string;
      size: number;
      storage_key: string;
    }[] = [];

    try {
      return await this.eventRepository.manager.transaction(async (manager) => {
        const [privateMetadatas, publicMetadatas] = await Promise.all([
          this.attachmentService.uploadAttachments(
            files.public_attachments,
            userId,
            AttachmentStatus.PUBLIC,
          ),
          this.attachmentService.uploadAttachments(
            files.private_attachments,
            userId,
            AttachmentStatus.PRIVATE,
          ),
        ]);

        metadatas = [...privateMetadatas, ...publicMetadatas];

        const event = await this.findById(eventId, undefined, undefined, {
          author: { id: userId },
        });

        const attachments = this.attachmentService.add(
          metadatas.map((m) => ({ ...m, type: EventAttachmentType.OTHER })),
          EventAttachment,
        );

        manager
          .getRepository(EventAttachment)
          .save(attachments.map((a) => ({ ...a, event })));

        return attachments;
      });
    } catch (error) {
      if (metadatas.length > 0) {
        const objects = metadatas.map((m) => ({
          key: m.storage_key,
          bucket:
            m.status === AttachmentStatus.PUBLIC
              ? R2_BUCKET.PUBLIC
              : R2_BUCKET.PRIVATE,
        }));

        this.storageService.bulkDeleteObjectsFromR2(objects);
        this.eventAttachmentRepository.delete({
          storage_key: In(metadatas.map((m) => m.storage_key)),
        });
      }

      this.logger.error('Failed to add event attachments!', error.stack);

      throw error;
    }
  }

  async remove(eventId: number, userId: number) {
    const event = await this.findById(
      eventId,
      {
        interview: {
          interview_schedules: true,
          interview_blockings: true,
        },
        divisions: {
          selected_divisions: true,
        },
        applications: {
          attachments: true,
        },
        links: true,
        attachments: true,
      },
      undefined,
      {
        author: {
          id: userId,
        },
      },
    );

    const public_attachments = event.attachments.filter(
      (attachment) => attachment.status === AttachmentStatus.PUBLIC,
    );
    public_attachments.forEach((attachment) =>
      this.storageService.moveObjectBucketR2(
        attachment.storage_key,
        R2_BUCKET.PUBLIC,
        R2_BUCKET.PRIVATE,
      ),
    );

    return this.eventRepository.softRemove(event);
  }
}
