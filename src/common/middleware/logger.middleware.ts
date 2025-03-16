import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP', {
    timestamp: true,
  });

  use(req: Request, res: Response, next: NextFunction) {
    res.on('finish', () => {
      this.logger.debug(
        `Res: ${req.ip} (${res.statusCode}) ${req.method} ${req.url}`,
      );
    });

    next();
  }
}
