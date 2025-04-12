import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Interview,
  InterviewBlocking,
  InterviewSchedule,
} from './interview.entity';
import {
  InterviewBlockingDTO,
  InterviewDTO,
  InterviewScheduleDTO,
  UpdateInterviewBlockingDTO,
  UpdateInterviewDTO,
} from 'src/common/dtos';
import { InjectRepository } from '@nestjs/typeorm';
import {
  And,
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { EventService } from 'src/event/event.service';
import { Event } from 'src/event/event.entity';
import { ApplicationService } from 'src/application/application.service';
import { timeToMs } from 'src/common/utils';

@Injectable()
export class InterviewService {
  constructor(
    @InjectRepository(Interview)
    private interviewRepository: Repository<Interview>,

    @InjectRepository(InterviewBlocking)
    private interviewBlockingRepository: Repository<InterviewBlocking>,

    @InjectRepository(InterviewSchedule)
    private interviewScheduleRepository: Repository<InterviewSchedule>,

    private eventService: EventService,
    private applicationService: ApplicationService,
  ) {}

  async findInterviewById(
    id: number,
    relations?: FindOptionsRelations<Interview>,
    order?: FindOptionsOrder<Interview>,
    additionalWhere?: FindOptionsWhere<Omit<Interview, 'id'>>,
    cache?:
      | number
      | boolean
      | {
          id: any;
          milliseconds: number;
        },
  ) {
    const [interview] = await this.interviewRepository.find({
      relations,
      where: {
        id,
        ...additionalWhere,
      },
      order,
      cache,
    });
    if (!interview) throw new NotFoundException('Event interview not found!');
    return interview;
  }

  // it looks so awfull ;(, need to refactor
  async findSchedulesByInterviewId(
    interviewId: number,
    userId: number,
    cache?:
      | number
      | boolean
      | {
          id: any;
          milliseconds: number;
        },
  ) {
    const schedules = await this.interviewScheduleRepository.find({
      where: [
        {
          interview: {
            id: interviewId,
            event: {
              author: { id: userId },
            },
          },
        },
        {
          interview: {
            id: interviewId,
            event: {
              applications: {
                user: { id: userId },
              },
            },
          },
        },
      ],
      relations: {
        primary_division: true,
        application: {
          user: true,
        },
      },
      cache,
    });

    const divisionMap = new Map();
    schedules.forEach((schedule) => {
      const { primary_division, ...restSchedule } = schedule;
      if (!divisionMap.has(primary_division.id))
        divisionMap.set(primary_division.id, {
          ...primary_division,
          interview_schedules: [] as InterviewSchedule[],
        });

      const { interview, application, deleted_at, ...detailSchedule } =
        restSchedule;
      const { id, status, notes, user, ...restApplication } = application;
      divisionMap.get(primary_division.id).interview_schedules.push({
        ...detailSchedule,
        application: {
          id,
          status,
          notes,
          user,
        },
      });
    });

    return Array.from(divisionMap.values());
  }

  async setupInterview(
    setupInterview: InterviewDTO,
    eventId: number,
    userId: number,
  ) {
    const event = await this.eventService.findById(
      eventId,
      undefined,
      undefined,
      {
        author: { id: userId },
      },
    );

    const interview = this.interviewRepository.create({
      ...setupInterview,
      event,
    });

    return this.interviewRepository.save(interview);
  }

  async updateInterview(
    modifiedInterview: UpdateInterviewDTO,
    interviewId: number,
    userId: number,
  ) {
    const subQb = this.interviewRepository.manager
      .getRepository(Event)
      .createQueryBuilder('event')
      .select('event.id')
      .where('event.author_id = :userId');

    const { affected } = await this.interviewRepository
      .createQueryBuilder()
      .update()
      .set(modifiedInterview)
      .where('id = :interviewId')
      .andWhere(`event_id IN ( ${subQb.getQuery()} )`)
      .andWhere('deleted_at IS NULL')
      .setParameters({ interviewId, userId })
      .execute();

    if (affected === 0) throw new NotFoundException('Interview not found!');

    return { affected };
  }

  async addBlocking(
    newBlockings: InterviewBlockingDTO[],
    interviewId: number,
    userId: number,
  ) {
    const interview = await this.findInterviewById(
      interviewId,
      undefined,
      undefined,
      {
        event: {
          author: { id: userId },
        },
      },
    );

    return this.interviewBlockingRepository.save(
      newBlockings.map((blocking) =>
        this.interviewBlockingRepository.create({
          ...blocking,
          interview,
        }),
      ),
    );
  }

  async updateBlocking(
    modifiedBlocking: UpdateInterviewBlockingDTO,
    interviewId: number,
    blockingId: number,
    userId: number,
  ) {
    const subQb2 = this.interviewRepository.manager
      .getRepository(Event)
      .createQueryBuilder('event')
      .select('event.id')
      .where('event.author_id = :userId');

    const subQb = this.interviewRepository
      .createQueryBuilder()
      .select('id')
      .where(`event_id IN (${subQb2.getQuery()})`);

    const { affected } = await this.interviewBlockingRepository
      .createQueryBuilder()
      .update()
      .set(modifiedBlocking)
      .where('id = :blockingId')
      .andWhere('interview_id = :interviewId')
      .andWhere(`interview_id IN ( ${subQb.getQuery()} )`)
      .andWhere('deleted_at IS NULL')
      .setParameters({ blockingId, interviewId, userId })
      .execute();

    if (affected === 0)
      throw new NotFoundException('Interview blocking not found!');

    return { affected };
  }

  async deleteBlocking(
    interviewId: number,
    blockingId: number,
    userId: number,
  ) {
    const [blocking] = await this.interviewBlockingRepository.find({
      where: {
        id: blockingId,
        interview: {
          id: interviewId,
          event: {
            author: { id: userId },
          },
        },
      },
    });

    if (!blocking) throw new NotFoundException('Interview blocking not found!');

    const { affected } = await this.interviewBlockingRepository.delete(
      blocking.id,
    );

    return { affected };
  }

  // change this for use in websocket as a subscriber
  // it looks so awfull ;(, need to refactor #2
  async bookingSchedule(
    schedule: InterviewScheduleDTO,
    interviewId: number,
    applicationId: number,
    userId: number,
  ) {
    const startTime = new Date(schedule.selected_time);

    const [application, interview] = await Promise.all([
      this.applicationService.findOne(
        {
          id: applicationId,
          user: { id: userId },
        },
        {
          selected_divisions: {
            division: true,
          },
        },
        {
          selected_divisions: {
            priority: 'ASC',
          },
        },
        true,
      ),
      this.findInterviewById(
        interviewId,
        undefined,
        undefined,
        {
          date_start: LessThanOrEqual(startTime),
          date_end: MoreThan(startTime),
        },
        true,
      ),
    ]);

    const endTime = new Date(
      startTime.getTime() + interview.duration_minutes * 60 * 1000,
    );

    const selectedDate = new Date();
    selectedDate.setUTCDate(startTime.getUTCDate());
    selectedDate.setUTCMonth(startTime.getUTCMonth());
    selectedDate.setUTCFullYear(startTime.getUTCFullYear());
    selectedDate.setUTCHours(0, 0, 0, 0);

    const dailytimeStart = new Date(selectedDate);
    const dailytimeEnd = new Date(selectedDate);
    dailytimeStart.setUTCMilliseconds(timeToMs(interview.dailytime_start));
    dailytimeEnd.setUTCMilliseconds(timeToMs(interview.dailytime_end));

    if (dailytimeStart > startTime || dailytimeEnd < endTime) {
      throw new NotFoundException(
        "The selected time is outside of the interview's daily active time!",
      );
    }

    const beforeStartTime = new Date(
      startTime.getTime() - interview.duration_minutes * 60 * 1000,
    );

    const [existBlocking] = await this.interviewBlockingRepository.find({
      where: [
        {
          // scenario 1:  blocking < start time < blocking
          interview: { id: interviewId },
          range_start: LessThanOrEqual(startTime),
          range_end: MoreThanOrEqual(startTime),
        },
        {
          // scenario 2:  blocking < end time < blocking
          interview: { id: interviewId },
          range_start: LessThanOrEqual(endTime),
          range_end: MoreThanOrEqual(endTime),
        },
        {
          // scenario 3:  start time < blocking < end time
          interview: { id: interviewId },
          range_start: MoreThanOrEqual(startTime),
          range_end: LessThanOrEqual(endTime),
        },
      ],
    });

    if (!!existBlocking)
      throw new ConflictException(
        'The selected time is within the blocking range!',
      );

    const primaryDivision = application.selected_divisions[0].division;
    if (!primaryDivision)
      throw new BadRequestException(
        'No primary division selection found for this application',
      );

    const [existSchedule] = await this.interviewScheduleRepository.find({
      where: {
        interview: {
          id: interview.id,
        },
        primary_division: {
          id: primaryDivision.id,
        },
        selected_time: And(MoreThan(beforeStartTime), LessThan(endTime)),
      },
    });
    if (existSchedule)
      throw new ConflictException(
        'The selected time has already been scheduled for an interview!',
      );

    return this.interviewScheduleRepository.save(
      this.interviewScheduleRepository.create({
        ...schedule,
        application,
        interview,
        primary_division: primaryDivision,
      }),
    );
  }

  async cancelSchedule(
    interviewId: number,
    scheduleId: number,
    userId: number,
  ) {
    const [schedule] = await this.interviewScheduleRepository.find({
      where: {
        id: scheduleId,
        interview: { id: interviewId },
        application: {
          user: { id: userId },
        },
      },
    });

    if (!schedule) throw new NotFoundException('Interview schedule not found!');

    const { affected } = await this.interviewScheduleRepository.delete(
      schedule.id,
    );

    return { affected };
  }
}
