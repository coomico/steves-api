import {
  BadRequestException,
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
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { Application } from './application.entity';
import { ApplicationAttachment } from 'src/attachment/attachment.entity';
import { UserService } from 'src/user/user.service';
import { EventService } from 'src/event/event.service';
import { StorageService } from 'src/storage/storage.service';
import { AttachmentService } from 'src/attachment/attachment.service';
import { SelectedDivisionService } from 'src/selected_division/selected_division.service';
import {
  ApplicationOrderKeys,
  CACHE_TTL,
  MAX_NUMBER_ATTACHMENTS,
  OrderOptions,
  R2_BUCKET,
  StatusOptions,
} from 'src/common/utils';
import { ApplicationStatus } from 'src/common/enums/application-status.enum';
import {
  NewApplicationDTO,
  UpdateApplicationDTO,
} from 'src/common/dtos/application.dto';
import { AttachmentStatus, EventStatus } from 'src/common/enums';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,

    @InjectRepository(ApplicationAttachment)
    private applicationAttachmentRepository: Repository<ApplicationAttachment>,

    private userService: UserService,
    private eventService: EventService,
    private storageService: StorageService,
    private attachmentService: AttachmentService,
    private selectedDivisionService: SelectedDivisionService,
  ) {}

  private readonly logger = new Logger(ApplicationService.name, {
    timestamp: true,
  });

  async findOne(
    where: FindOptionsWhere<Application> | FindOptionsWhere<Application>[],
    relations?: FindOptionsRelations<Application>,
    order?: FindOptionsOrder<Application>,
    cache?:
      | number
      | boolean
      | {
          id: any;
          milliseconds: number;
        },
  ) {
    const [application] = await this.applicationRepository.find({
      where,
      relations,
      order,
      cache,
    });

    if (!application) throw new NotFoundException('Application not found!');

    return application;
  }

  async findAll(
    eventId: number,
    take: number,
    skip: number,
    userId: number,
    order?: OrderOptions<ApplicationOrderKeys>,
    status?: StatusOptions<ApplicationStatus>[],
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

    let orderDump: OrderOptions<ApplicationOrderKeys> = { created_at: 'ASC' };
    if (order) orderDump = { ...order };

    const [applications, total] = await this.applicationRepository.findAndCount(
      {
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
              applications: {
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
      },
    );

    let base = `/applications?eventid=${eventId}`;
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
      applications.length > take ? `${base}&skip=${take + skip}` : null;

    skip = skip - take;
    const prev = skip > 0 ? `${base}&skip=${skip}` : null;

    return {
      applications:
        applications.length > take ? applications.slice(0, take) : applications,
      pagination: {
        first_page: base,
        next_page: next,
        prev_page: prev,
        last_page: last,
      },
    };
  }

  async create(newApplication: NewApplicationDTO, userId: number) {
    const [user, event] = await Promise.all([
      this.userService.findById(userId),
      this.eventService.findById(
        newApplication.event_id,
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

    const application = new Application();
    application.user = user;
    application.event = event;

    if (
      newApplication.selected_divisions.length > event.max_selected_division
    ) {
      throw new BadRequestException(
        'Number of selected divisions exceeds the maximum selected.',
      );
    }

    application.selected_divisions = await this.selectedDivisionService.add(
      newApplication.selected_divisions,
    );

    return this.applicationRepository.save(application);
  }

  async addAttachments(
    applicationId: number,
    userId: number,
    files?: Express.Multer.File[],
  ) {
    if (!files?.length) return;

    const application = await this.findOne(
      {
        id: applicationId,
        user: { id: userId },
      },
      {
        attachments: true,
      },
      undefined,
      true,
    );

    const count = application.attachments.length;

    if (count + files.length > MAX_NUMBER_ATTACHMENTS) {
      throw new BadRequestException(
        `Cannot add ${files.length} attachment(s). You have ${count}/${MAX_NUMBER_ATTACHMENTS} attachments for this application.`,
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
      return await this.applicationRepository.manager.transaction(
        async (manager) => {
          metadatas = await this.attachmentService.uploadAttachments(
            files,
            userId,
            AttachmentStatus.PRIVATE,
          );
          const attachments = this.attachmentService.add(
            metadatas,
            ApplicationAttachment,
          );

          manager
            .getRepository(ApplicationAttachment)
            .save(attachments.map((a) => ({ ...a, application })));

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
        this.applicationAttachmentRepository.delete({
          storage_key: In(metadatas.map((m) => m.storage_key)),
        });
      }

      this.logger.error('Failed to add application attachments!', error.stack);

      throw error;
    }
  }

  async update(
    updatedData: UpdateApplicationDTO,
    applicationId: number,
    userId: number,
  ) {
    const subQb = this.applicationRepository.manager
      .getRepository(Event)
      .createQueryBuilder('event')
      .select('event.id')
      .where('event.author_id = :userId');

    const { affected } = await this.applicationRepository
      .createQueryBuilder()
      .update()
      .set(updatedData)
      .where('id = :applicationId')
      .andWhere(`event_id IN ( ${subQb.getQuery()} )`)
      .andWhere('deleted_at IS NULL')
      .setParameters({ applicationId, userId })
      .execute();

    if (affected === 0) throw new NotFoundException('Application not found!');

    return { affected };
  }

  async remove(applicationId: number, userId: number) {
    const application = await this.findOne(
      {
        id: applicationId,
        user: { id: userId },
      },
      {
        attachments: true,
        interview_schedule: true,
        selected_divisions: true,
      },
      undefined,
    );

    if (application.status !== ApplicationStatus.WAITING) {
      return this.applicationRepository.softRemove(application);
    }

    application.attachments.forEach((attachment) =>
      this.storageService.deleteObjectFromR2(
        attachment.storage_key,
        R2_BUCKET.PRIVATE,
      ),
    );

    return this.applicationRepository.remove(application);
  }
}
