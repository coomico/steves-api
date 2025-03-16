import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  ping(): object {
    return { ping: 'pong' };
  }
}
