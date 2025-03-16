import { Module } from '@nestjs/common';
import { PaginationService } from './pagination.service';
import { CursorService } from './cursor.service';

@Module({
  exports: [PaginationService],
  providers: [CursorService, PaginationService],
})
export class PaginationModule {}
