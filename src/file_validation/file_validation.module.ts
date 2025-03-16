import { Module } from '@nestjs/common';
import { FileValidationService } from './file_validation.service';

@Module({
  exports: [FileValidationService],
  providers: [FileValidationService],
})
export class FileValidationModule {}
