import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { OrderOptions } from 'src/common/utils';

@Injectable()
export class OrderParsePipe implements PipeTransform {
  transform(value: string[] | undefined, metadata: ArgumentMetadata) {
    if (!value || value.length === 0) return {};

    try {
      return value.reduce((transformed, v) => {
        const valueSplit = v.split('.');

        if (valueSplit.length !== 2) {
          throw new BadRequestException(
            "Order queries should be like 'field.DESC'",
          );
        }

        const [key, direction] = valueSplit;
        const capitalizedDirection = direction.toUpperCase();
        if (capitalizedDirection !== 'ASC' && capitalizedDirection !== 'DESC') {
          throw new BadRequestException(
            "Order direction should be either 'ASC' or 'DESC'",
          );
        }

        transformed[key] = capitalizedDirection;

        return transformed;
      }, {} as OrderOptions<string>);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      throw new BadRequestException(
        "Order queries should be like 'created_at.DESC' and separated by comma (,)",
      );
    }
  }
}
