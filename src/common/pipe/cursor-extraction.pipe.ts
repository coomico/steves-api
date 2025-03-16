import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';
import { Cursor, decodeFromBase64URL } from 'src/common/utils';

export class CursorExtractionPipe implements PipeTransform {
  transform(value: string | undefined, metadata: ArgumentMetadata) {
    if (!value) return;

    const cursor = decodeFromBase64URL(value);

    if (
      !cursor ||
      cursor.id === null ||
      cursor.id === undefined ||
      cursor.direction === null ||
      cursor.direction === undefined ||
      (cursor.direction !== 'backward' && cursor.direction !== 'forward')
    )
      throw new BadRequestException('Invalid cursor format!');

    if (typeof cursor.id === 'string') {
      cursor.id = Number(cursor.id);
    }

    return cursor as Cursor;
  }
}
