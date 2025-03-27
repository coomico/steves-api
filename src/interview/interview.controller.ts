import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseArrayPipe,
  Post,
  Put,
  Query,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { InterviewService } from './interview.service';
import {
  InterviewBlockingDTO,
  InterviewDTO,
  InterviewScheduleDTO,
  UpdateInterviewBlockingDTO,
  UpdateInterviewDTO,
} from 'src/common/dtos';
import { ApiBody } from '@nestjs/swagger';
import { AccessAuthGuard } from 'src/auth/guard/access.guard';
import { User } from 'src/common/decorator/user.decorator';

@Controller('interviews')
@UseInterceptors(ClassSerializerInterceptor)
export class InterviewController {
  constructor(private interviewService: InterviewService) {}

  @Get(':id')
  @UseGuards(AccessAuthGuard)
  @SerializeOptions({ groups: ['interview'] })
  fetchById(@Param('id') id: number) {
    return this.interviewService.findInterviewById(
      id,
      {
        interview_blockings: true,
        interview_schedules: true,
      },
      {
        interview_blockings: {
          range_start: 'asc',
        },
        interview_schedules: {
          selected_time: 'asc',
        },
      },
      undefined,
      true,
    );
  }

  @Post()
  @UseGuards(AccessAuthGuard)
  setupInterview(
    @User('id') userId: number,
    @Query('eventid') eventId: number,
    @Body() data: InterviewDTO,
  ) {
    return this.interviewService.setupInterview(data, eventId, userId);
  }

  @Put(':id')
  @UseGuards(AccessAuthGuard)
  updateInterview(
    @User('id') userId: number,
    @Param('id') interviewId: number,
    @Body() data: UpdateInterviewDTO,
  ) {
    return this.interviewService.updateInterview(data, interviewId, userId);
  }

  @ApiBody({
    type: InterviewBlockingDTO,
    isArray: true,
  })
  @Post(':id/blockings')
  @UseGuards(AccessAuthGuard)
  createBlockings(
    @User('id') userId: number,
    @Param('id') interviewId: number,
    @Body(new ParseArrayPipe({ items: InterviewBlockingDTO }))
    data: InterviewBlockingDTO[],
  ) {
    return this.interviewService.addBlocking(data, interviewId, userId);
  }

  @Put('iid:/blockings/:bid')
  @UseGuards(AccessAuthGuard)
  updateBlocking(
    @User('id') userId: number,
    @Param('iid') interviewId: number,
    @Param('bid') blockingId: number,
    @Body() data: UpdateInterviewBlockingDTO,
  ) {
    return this.interviewService.updateBlocking(
      data,
      interviewId,
      blockingId,
      userId,
    );
  }

  @Delete(':iid/blockings/:bid')
  @UseGuards(AccessAuthGuard)
  deleteBlocking(
    @User('id') userId: number,
    @Param('iid') interviewId: number,
    @Param('bid') blockingId: number,
  ) {
    return this.interviewService.deleteBlocking(
      interviewId,
      blockingId,
      userId,
    );
  }

  @Get(':id/schedules')
  @UseGuards(AccessAuthGuard)
  @SerializeOptions({ groups: ['schedule'] })
  fetchSchedules(@User('id') userId: number, @Param('id') interviewId: number) {
    return this.interviewService.findSchedulesByInterviewId(
      interviewId,
      userId,
    );
  }

  @Post(':id/schedules')
  @UseGuards(AccessAuthGuard)
  bookingSchedule(
    @User('id') userId: number,
    @Param('id') interviewId: number,
    @Query('registrantid') registrantId: number,
    @Body() data: InterviewScheduleDTO,
  ) {
    return this.interviewService.bookingSchedule(
      data,
      interviewId,
      registrantId,
      userId,
    );
  }

  @Delete(':iid/schedules/:sid')
  @UseGuards(AccessAuthGuard)
  cancelSchedule(
    @User('id') userId: number,
    @Param('iid') interviewId: number,
    @Param('sid') scheduleId: number,
  ) {
    return this.interviewService.cancelSchedule(
      interviewId,
      scheduleId,
      userId,
    );
  }
}
