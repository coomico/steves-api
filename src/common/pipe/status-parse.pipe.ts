import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class StatusParsePipe implements PipeTransform {
  constructor(
    private readonly enums: Record<string, string>,
    private readonly omit: any[] = [],
  ) {}

  transform(value: string[], metadata: ArgumentMetadata) {
    if (!value || value.length === 0) return [];

    value.forEach((v: keyof typeof this.enums) => {
      if (
        Object.values(this.enums).indexOf(v.toLowerCase()) === -1 ||
        this.omit.indexOf(v.toLowerCase()) !== -1
      ) {
        throw new BadRequestException(
          "Status queries doesn't match or not separated by comma (,)!",
        );
      }
    });

    return value;
  }
}
