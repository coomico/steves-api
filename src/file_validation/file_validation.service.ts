import {
  BadRequestException,
  Injectable,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { extname } from 'path';
import {
  APPLICATION_MIMETYPES,
  AUDIO_MIMETYPES,
  FileValidationOptions,
  FONT_MIMETYPES,
  IMAGE_MIMETYPES,
  MAX_FILE_SIZE,
  MIMETYPE_TO_EXTENSIONS,
  TEXT_MIMETYPES,
  VIDEO_MIMETYPES,
} from 'src/common/utils';

@Injectable()
export class FileValidationService {
  validateMimetype(file: Express.Multer.File, allowedTypes?: string[]) {
    if (!file.mimetype) {
      throw new BadRequestException('Invalid file or missing type!');
    }

    const allowed = allowedTypes || [
      ...IMAGE_MIMETYPES,
      ...AUDIO_MIMETYPES,
      ...VIDEO_MIMETYPES,
      ...TEXT_MIMETYPES,
      ...APPLICATION_MIMETYPES,
      ...FONT_MIMETYPES,
    ];

    if (allowed.indexOf(file.mimetype) === -1) {
      throw new UnsupportedMediaTypeException('File type not allowed!');
    }
  }

  validateExtention(file: Express.Multer.File) {
    if (!file.originalname || !file.mimetype) {
      throw new BadRequestException('Invalid file or missing properties!');
    }

    const ext = extname(file.originalname).toLowerCase().slice(1);

    const expectedExtensions =
      MIMETYPE_TO_EXTENSIONS[
        file.mimetype as keyof typeof MIMETYPE_TO_EXTENSIONS
      ];
    if (expectedExtensions.indexOf(ext) === -1) {
      throw new UnsupportedMediaTypeException(
        'File extension not allowed or does not match to its mimetype!',
      );
    }
  }

  validateSize(file: Express.Multer.File, maxSize: number = MAX_FILE_SIZE) {
    if (!file.size) {
      throw new BadRequestException('Invalid file or missing properties!');
    }

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds the maximum allowed size of ${maxSize / 1_000_000} MB!`,
      );
    }
  }

  sanitizeFilename(filename: string) {
    return filename
      .replace(/[\/\\]/g, '_')
      .replace(/\.{2,}/g, '_')
      .replace(/[^a-zA-Z0-9\._\-]/g, '_')
      .trim();
  }

  validateFile(file: Express.Multer.File, options?: FileValidationOptions) {
    this.validateMimetype(file, options?.allowedType);
    this.validateExtention(file);
    this.validateSize(file, options?.maxSize);

    file.originalname = this.sanitizeFilename(file.originalname);
  }
}
