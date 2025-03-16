import { Module } from '@nestjs/common';
import { SelectedDivisionService } from './selected_division.service';
import { DivisionModule } from 'src/division/division.module';

@Module({
  imports: [DivisionModule],
  exports: [SelectedDivisionService],
  providers: [SelectedDivisionService],
})
export class SelectedDivisionModule {}
