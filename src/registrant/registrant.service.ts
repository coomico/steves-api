import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Registrant } from './registrant.entity';
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { EventService } from 'src/event/event.service';
import { UserService } from 'src/user/user.service';
import { AttachmentService } from 'src/attachment/attachment.service';
import { SelectedDivisionService } from 'src/selected_division/selected_division.service';
import { NewRegistrantDTO, UpdateRegistrantDTO } from 'src/common/dtos';
import {
  AttachmentStatus,
  EventStatus,
  RegistrantStatus,
} from 'src/common/enums';
import { RegistrantAttachment } from 'src/attachment/attachment.entity';
import { StorageService } from 'src/storage/storage.service';
import {
  CACHE_TTL,
  MAX_NUMBER_ATTACHMENTS,
  OrderOptions,
  R2_BUCKET,
  RegistrantOrderKeys,
  StatusOptions,
} from 'src/common/utils';

@Injectable()
export class RegistrantService {
  constructor(
    @InjectRepository(Registrant)
    private registrantRepository: Repository<Registrant>,

    @InjectRepository(RegistrantAttachment)
    private registrantAttachmentRepository: Repository<RegistrantAttachment>,

    private userService: UserService,
    private eventService: EventService,
    private storageService: StorageService,
    private attachmentService: AttachmentService,
    private selectedDivisionService: SelectedDivisionService,
  ) {}

  private readonly logger = new Logger(RegistrantService.name, {
    timestamp: true,
  });

  async findOne(
    where: FindOptionsWhere<Registrant> | FindOptionsWhere<Registrant>[],
    relations?: FindOptionsRelations<Registrant>,
    order?: FindOptionsOrder<Registrant>,
    cache?:
      | number
      | boolean
      | {
          id: any;
          milliseconds: number;
        },
  ) {
    const [registrant] = await this.registrantRepository.find({
      where,
      relations,
      order,
      cache,
    });

    if (!registrant) throw new NotFoundException('Registrant not found!');

    return registrant;
  }

  async findAll(
    eventId: number,
    take: number,
    skip: number,
    userId: number,
    order?: OrderOptions<RegistrantOrderKeys>,
    status?: StatusOptions<RegistrantStatus>[],
    cache?:
      | number
      | boolean
      | {
          id: any;
          milliseconds: number;
        },
  ) {
    let statusQuery;
    if (status?.length) statusQuery = In(status);

    let orderDump: OrderOptions<RegistrantOrderKeys> = { created_at: 'ASC' };
    if (order) orderDump = { ...order };

    const [registrants, total] = await this.registrantRepository.findAndCount({
      where: [
        {
          event: {
            id: eventId,
            author: { id: userId },
          },
          status: statusQuery,
        },
        {
          event: {
            id: eventId,
            registrants: {
              user: { id: userId },
            },
          },
          status: statusQuery,
        },
      ],
      relations: {
        event: false,
        user: true,
      },
      order: {
        ...orderDump,
        id: 'ASC',
      },
      skip,
      take: take + 1,
      cache,
    });

    let base = `/registrants?eventid=${eventId}`;
    if (order) {
      base +=
        '&order=' +
        Object.entries(order)
          .map(([key, value]) => `${key}.${value}`)
          .join(',');
    }

    base = status?.length ? `${base}&status=${status.join(',')}` : base;
    base += `&take=${take}`;

    const last = total - take > 0 ? `${base}&skip=${total - take}` : null;

    const next =
      registrants.length > take ? `${base}&skip=${take + skip}` : null;

    skip = skip - take;
    const prev = skip > 0 ? `${base}&skip=${skip}` : null;

    return {
      registrants:
        registrants.length > take ? registrants.slice(0, take) : registrants,
      pagination: {
        first_page: base,
        next_page: next,
        prev_page: prev,
        last_page: last,
      },
    };
  }

  async create(newRegistrant: NewRegistrantDTO, userId: number) {
    const [user, event] = await Promise.all([
      this.userService.findById(userId),
      this.eventService.findById(
        newRegistrant.event_id,
        undefined,
        undefined,
        {
          author: Not(userId),
          status: EventStatus.PUBLISHED,
          datetime_start: LessThanOrEqual(new Date()),
          datetime_end: MoreThanOrEqual(new Date()),
        },
        CACHE_TTL,
      ),
    ]);

    const registrant = new Registrant();
    registrant.user = user;
    registrant.event = event;

    if (newRegistrant.selected_divisions.length > event.max_selected_division) {
      throw new BadRequestException(
        'Number of selected divisions exceeds the maximum selected.',
      );
    }

    registrant.selected_divisions = await this.selectedDivisionService.add(
      newRegistrant.selected_divisions,
    );

    return this.registrantRepository.save(registrant);
  }

  async addAttachments(
    registrantId: number,
    userId: number,
    files?: Express.Multer.File[],
  ) {
    if (!files?.length) return;

    const registrant = await this.findOne(
      {
        id: registrantId,
        user: { id: userId },
      },
      {
        attachments: true,
      },
      undefined,
      true,
    );

    const count = registrant.attachments.length;

    if (count + files.length > MAX_NUMBER_ATTACHMENTS) {
      throw new BadRequestException(
        `Cannot add ${files.length} attachment(s). You have ${count}/${MAX_NUMBER_ATTACHMENTS} attachments for this registrant.`,
      );
    }

    let metadatas: {
      filename: string;
      original_filename: string;
      status: AttachmentStatus;
      content_type: string;
      size: number;
      storage_key: string;
    }[] = [];

    try {
      return await this.registrantRepository.manager.transaction(
        async (manager) => {
          metadatas = await this.attachmentService.uploadAttachments(
            files,
            userId,
            AttachmentStatus.PRIVATE,
          );
          const attachments = this.attachmentService.add(
            metadatas,
            RegistrantAttachment,
          );

          manager
            .getRepository(RegistrantAttachment)
            .save(attachments.map((a) => ({ ...a, registrant })));

          return attachments;
        },
      );
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
        this.registrantAttachmentRepository.delete({
          storage_key: In(metadatas.map((m) => m.storage_key)),
        });
      }

      this.logger.error('Failed to add registrant attachments!', error.stack);

      throw error;
    }
  }

  async update(
    updatedData: UpdateRegistrantDTO,
    registrantId: number,
    userId: number,
  ) {
    const registrant = await this.findOne(
      {
        id: registrantId,
        user: { id: userId },
      },
      undefined,
      undefined,
      true,
    );

    const { affected } = await this.registrantRepository.update(
      { id: registrant.id },
      updatedData,
    );

    return { affected };
  }

  async remove(registrantId: number, userId: number) {
    const registrant = await this.findOne(
      {
        id: registrantId,
        user: { id: userId },
      },
      {
        attachments: true,
        interview_schedule: true,
        selected_divisions: true,
      },
      undefined,
    );

    if (registrant.status !== RegistrantStatus.WAITING) {
      return this.registrantRepository.softRemove(registrant);
    }

    registrant.attachments.forEach((attachment) =>
      this.storageService.deleteObjectFromR2(
        attachment.storage_key,
        R2_BUCKET.PRIVATE,
      ),
    );
    return this.registrantRepository.remove(registrant);
  }
}
