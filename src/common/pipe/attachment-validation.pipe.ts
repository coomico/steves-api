import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { FileValidationService } from 'src/file_validation/file_validation.service';
import {
  LOGO_BANNER_MIMETYPES,
  MAX_LOGO_BANNER_SIZE,
  MAX_NUMBER_ATTACHMENTS,
} from '../utils';

@Injectable()
export class EventAttachmentValidation implements PipeTransform {
  constructor(private fileValidationService: FileValidationService) {}

  transform(
    value: Partial<{
      [key: string]: Express.Multer.File[];
    }>,
    metadata: ArgumentMetadata,
  ) {
    Object.values(value).forEach((v) => {
      v?.forEach((file, index) => {
        if (index === MAX_NUMBER_ATTACHMENTS) {
          throw new BadRequestException(
            `Number of attachments exceeds the the maximum allowed (${MAX_NUMBER_ATTACHMENTS})!`,
          );
        }

        this.fileValidationService.validateFile(file);
      });
    });

    return value;
  }
}

@Injectable()
export class RegistrantAttachmentValidation implements PipeTransform {
  constructor(private fileValidationService: FileValidationService) {}

  transform(
    value: Express.Multer.File[] | undefined,
    metadata: ArgumentMetadata,
  ) {
    value?.forEach((file, index) => {
      if (index === MAX_NUMBER_ATTACHMENTS) {
        throw new BadRequestException(
          `Number of attachments exceeds the the maximum allowed (${MAX_NUMBER_ATTACHMENTS})!`,
        );
      }

      this.fileValidationService.validateFile(file);
    });

    return value;
  }
}

@Injectable()
export class LogoBannerValidation implements PipeTransform {
  constructor(private fileValidationService: FileValidationService) {}

  transform(
    value: Partial<{
      [key: string]: Express.Multer.File[];
    }>,
    metadata: ArgumentMetadata,
  ) {
    if (!value) return null;

    const files: Partial<{
      [key: string]: Express.Multer.File;
    }> = {};

    Object.entries(value).forEach(([k, v]) => {
      v?.forEach((file, index) => {
        if (index === 1) {
          throw new BadRequestException(
            `Number of attachments exceeds the the maximum allowed (${1})!`,
          );
        }

        this.fileValidationService.validateFile(file, {
          allowedType: LOGO_BANNER_MIMETYPES,
          maxSize: MAX_LOGO_BANNER_SIZE,
        });

        files[k] = file;
      });
    });

    return files;
  }
}
