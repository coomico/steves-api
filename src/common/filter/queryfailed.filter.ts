import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class QueryFailedFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const response = host.getArgByIndex<Response>(1);

    let message: string = 'Internal server error';
    let error: string | undefined;
    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;

    // https://www.postgresql.org/docs/current/errcodes-appendix.html
    switch (exception.code) {
      case '23505':
        message = 'Data already exists or potential duplication!';
        error = 'Conflict';
        status = HttpStatus.CONFLICT;
        break;
      default:
        console.error(exception);
        break;
    }

    response.status(status).json({
      message,
      error,
      statusCode: status,
    });
  }
}
