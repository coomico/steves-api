import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Attachment,
  EventAttachment,
  RegistrantAttachment,
} from './attachment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { StorageService } from 'src/storage/storage.service';
import { ObjectWithProperties, R2_BUCKET } from 'src/common/utils';
import { AttachmentStatus } from 'src/common/enums';
import { AttachmentDTO } from 'src/common/dtos';

@Injectable()
export class AttachmentService {
  constructor(
    @InjectRepository(EventAttachment)
    private eventAttachmentRepository: Repository<EventAttachment>,

    @InjectRepository(RegistrantAttachment)
    private registrantAttachmentRepository: Repository<RegistrantAttachment>,

    private storageService: StorageService,
  ) {}

  add<N extends AttachmentDTO, T extends Attachment>(
    newAttachments: N[],
    entity: new () => T,
  ) {
    return newAttachments.map((newAttach) => {
      const attachment = new entity();
      Object.entries(newAttach).forEach(([k, v]) => {
        (attachment as ObjectWithProperties<any>)[k] = v;
      });
      return attachment;
    });
  }

  async showAll<T extends EventAttachment | RegistrantAttachment>(
    entity: 'event' | 'registrant',
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[],
    cache?:
      | number
      | boolean
      | {
          id: any;
          milliseconds: number;
        },
  ) {
    const repo =
      entity === 'event'
        ? this.eventAttachmentRepository
        : this.registrantAttachmentRepository;

    return repo.find({
      where,
      cache,
    });
  }

  async findById(
    attachmentId: number,
    entity: 'event' | 'registrant',
    userId: number,
    cache?:
      | number
      | boolean
      | {
          id: any;
          milliseconds: number;
        },
  ) {
    const repo =
      entity === 'event'
        ? this.eventAttachmentRepository
        : this.registrantAttachmentRepository;

    const relations =
      entity === 'event'
        ? {
            event: {
              author: true,
              registrants: { user: true },
            },
          }
        : {
            registrant: {
              user: true,
              event: { author: true },
            },
          };

    const [attachment] = await repo.find({
      where: { id: attachmentId },
      relations,
      cache,
    });

    if (!attachment) throw new NotFoundException('Attachment not found!');

    if (attachment.status === AttachmentStatus.PRIVATE) {
      let authorizedUserIds: number[] = [];

      if (entity === 'event') {
        const eventAttachment = attachment as EventAttachment;
        authorizedUserIds = [
          eventAttachment.event.author.id,
          ...eventAttachment.event.registrants.map((r) => r.user.id),
        ];
      } else {
        const registrantAttachment = attachment as RegistrantAttachment;
        authorizedUserIds = [
          registrantAttachment.registrant.user.id,
          registrantAttachment.registrant.event.author.id,
        ];
      }

      if (authorizedUserIds.indexOf(userId) === -1) {
        throw new ForbiddenException(
          'You do not have permission to access this private attachment!',
        );
      }
    }

    const buffer = await this.storageService.getObjectFromR2(
      attachment.storage_key,
      attachment.status === AttachmentStatus.PRIVATE
        ? R2_BUCKET.PRIVATE
        : R2_BUCKET.PUBLIC,
    );

    return { ...attachment, buffer };
  }

  uploadAttachments(
    attachments: Express.Multer.File[] | Express.Multer.File | undefined,
    userId: number,
    status: AttachmentStatus,
  ) {
    if (!attachments) return [];

    if (!Array.isArray(attachments)) attachments = [attachments];

    const bucket =
      status === AttachmentStatus.PUBLIC ? R2_BUCKET.PUBLIC : R2_BUCKET.PRIVATE;

    return Promise.all(
      attachments.map(async (attachment) => {
        const { filename, key } = this.storageService.serializeFilename(
          attachment.originalname,
          userId,
        );

        await this.storageService.uploadObjectToR2(
          key,
          attachment.mimetype,
          attachment.buffer,
          bucket,
        );

        return {
          filename,
          original_filename: attachment.originalname,
          status,
          content_type: attachment.mimetype,
          size: attachment.size,
          storage_key: key,
        };
      }),
    );
  }

  async removeAttachment(
    attachmentId: number,
    entity: 'event' | 'registrant',
    entityId: number,
    userId: number,
  ) {
    const repo =
      entity === 'event'
        ? this.eventAttachmentRepository
        : this.registrantAttachmentRepository;

    const additionalWhere =
      entity === 'event'
        ? {
            event: {
              id: entityId,
              author: { id: userId },
            },
          }
        : {
            registrant: {
              id: entityId,
              user: { id: userId },
            },
          };

    const [attachment] = await repo.find({
      where: {
        id: attachmentId,
        ...additionalWhere,
      },
    });
    if (!attachment) throw new NotFoundException('Event attachment not found!');

    await this.storageService.deleteObjectFromR2(
      attachment.storage_key,
      attachment.status === AttachmentStatus.PUBLIC
        ? R2_BUCKET.PUBLIC
        : R2_BUCKET.PRIVATE,
    );

    const { affected } = await repo.delete(attachment.id);
    return { affected };
  }
}
