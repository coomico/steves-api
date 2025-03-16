import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class CategoryParsePipe implements PipeTransform {
  constructor(private readonly enums: any) {}

  transform(value: string[] | undefined, metadata: ArgumentMetadata) {
    if (!value || value.length === 0) return [];

    value.forEach((v: keyof typeof this.enums) => {
      if (
        Object.values(this.enums).indexOf(v.toString().toLowerCase()) === -1
      ) {
        throw new BadRequestException(
          "Category queries doesn't match or not separated by comma (,)",
        );
      }
    });

    return value;
  }
}
