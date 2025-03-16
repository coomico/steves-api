import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
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
import { RequestWithClaims } from 'src/common/utils';

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
    @Req() req: RequestWithClaims,
    @Query('eventid') eventId: number,
    @Body() data: InterviewDTO,
  ) {
    return this.interviewService.setupInterview(data, eventId, req.user.id);
  }

  @Put(':id')
  @UseGuards(AccessAuthGuard)
  updateInterview(
    @Req() req: RequestWithClaims,
    @Param('id') interviewId: number,
    @Body() data: UpdateInterviewDTO,
  ) {
    return this.interviewService.updateInterview(
      data,
      interviewId,
      req.user.id,
    );
  }

  @ApiBody({
    type: InterviewBlockingDTO,
    isArray: true,
  })
  @Post(':id/blockings')
  @UseGuards(AccessAuthGuard)
  createBlockings(
    @Req() req: RequestWithClaims,
    @Param('id') interviewId: number,
    @Body() data: InterviewBlockingDTO | InterviewBlockingDTO[],
  ) {
    return this.interviewService.addBlocking(data, interviewId, req.user.id);
  }

  @Put('iid:/blockings/:bid')
  @UseGuards(AccessAuthGuard)
  updateBlocking(
    @Req() req: RequestWithClaims,
    @Param('iid') interviewId: number,
    @Param('bid') blockingId: number,
    @Body() data: UpdateInterviewBlockingDTO,
  ) {
    return this.interviewService.updateBlocking(
      data,
      interviewId,
      blockingId,
      req.user.id,
    );
  }

  @Delete(':iid/blockings/:bid')
  @UseGuards(AccessAuthGuard)
  deleteBlocking(
    @Req() req: RequestWithClaims,
    @Param('iid') interviewId: number,
    @Param('bid') blockingId: number,
  ) {
    return this.interviewService.deleteBlocking(
      interviewId,
      blockingId,
      req.user.id,
    );
  }

  @Get(':id/schedules')
  @UseGuards(AccessAuthGuard)
  @SerializeOptions({ groups: ['schedule'] })
  fetchSchedules(
    @Req() req: RequestWithClaims,
    @Param('id') interviewId: number,
  ) {
    return this.interviewService.findSchedulesByInterviewId(
      interviewId,
      req.user.id,
    );
  }

  @Post(':id/schedules')
  @UseGuards(AccessAuthGuard)
  bookingSchedule(
    @Req() req: RequestWithClaims,
    @Param('id') interviewId: number,
    @Query('registrantid') registrantId: number,
    @Body() data: InterviewScheduleDTO,
  ) {
    return this.interviewService.bookingSchedule(
      data,
      interviewId,
      registrantId,
      req.user.id,
    );
  }

  @Delete(':iid/schedules/:sid')
  @UseGuards(AccessAuthGuard)
  cancelSchedule(
    @Req() req: RequestWithClaims,
    @Param('iid') interviewId: number,
    @Param('sid') scheduleId: number,
  ) {
    return this.interviewService.cancelSchedule(
      interviewId,
      scheduleId,
      req.user.id,
    );
  }
}
