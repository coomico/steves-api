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
  Brackets,
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  Repository,
} from 'typeorm';
import { EventService } from 'src/event/event.service';
import { RegistrantService } from 'src/registrant/registrant.service';

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
    private registrantService: RegistrantService,
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
              registrants: {
                user: { id: userId },
              },
            },
          },
        },
      ],
      relations: {
        primary_division: true,
        registrant: {
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

      const { interview, registrant, deleted_at, ...detailSchedule } =
        restSchedule;
      const { id, status, notes, user, ...restRegistrant } = registrant;
      divisionMap.get(primary_division.id).interview_schedules.push({
        ...detailSchedule,
        registrant: {
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
    const { affected } = await this.interviewRepository.update(
      {
        id: interviewId,
        event: {
          author: { id: userId },
        },
      },
      modifiedInterview,
    );
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
    const { affected } = await this.interviewBlockingRepository.update(
      {
        id: blockingId,
        interview: {
          id: interviewId,
          event: {
            author: { id: userId },
          },
        },
      },
      modifiedBlocking,
    );
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
    registrantId: number,
    userId: number,
  ) {
    const selectedTime = new Date(schedule.selected_time);

    const [registrant, interview] = await Promise.all([
      this.registrantService.findOne(
        {
          id: registrantId,
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
      ),
      this.findInterviewById(interviewId, undefined, undefined, {
        available_start: LessThanOrEqual(selectedTime),
        available_end: MoreThan(selectedTime),
      }),
    ]);

    const selectedTimePlusDuration = new Date(
      selectedTime.getTime() + interview.duration_minutes * 60 * 1000,
    );

    const [existBlocking] = await this.interviewBlockingRepository
      .createQueryBuilder('interview_blocking')
      .where('interview_blocking.interview_id = :interviewId', { interviewId })
      .andWhere(
        new Brackets((qb) =>
          qb
            .where(
              new Brackets((qb) =>
                qb
                  .where('interview_blocking.range_start >= :start', {
                    start: selectedTime,
                  })
                  .andWhere('interview_blocking.range_end <= :end', {
                    end: selectedTimePlusDuration,
                  }),
              ),
            )
            // is it overlap with selected time?
            .orWhere(
              new Brackets((qb) =>
                qb
                  .where('interview_blocking.range_start <= :start1', {
                    start1: selectedTime,
                  })
                  .andWhere('interview_blocking.range_end >= :start2', {
                    start2: selectedTime,
                  }),
              ),
            )
            // is it overlap with selected time + interview duration?
            .orWhere(
              new Brackets((qb) =>
                qb
                  .where('interview_blocking.range_start <= :end1', {
                    end1: selectedTimePlusDuration,
                  })
                  .andWhere('interview_blocking.range_end >= :end2', {
                    end2: selectedTimePlusDuration,
                  }),
              ),
            ),
        ),
      )
      .getMany();
    if (!!existBlocking)
      throw new ConflictException(
        'The selected time is within the blocking range!',
      );

    const primaryDivision = registrant.selected_divisions[0].division;
    if (!primaryDivision)
      throw new BadRequestException(
        'No primary division selection found for this registrant',
      );

    const [existSchedule] = await this.interviewScheduleRepository.find({
      where: {
        interview: {
          id: interview.id,
        },
        primary_division: {
          id: primaryDivision.id,
        },
        selected_time: And(
          MoreThan(
            new Date(
              selectedTime.getTime() - interview.duration_minutes * 60 * 1000,
            ),
          ),
          LessThan(
            new Date(
              selectedTime.getTime() + interview.duration_minutes * 60 * 1000,
            ),
          ),
        ),
      },
    });
    if (existSchedule)
      throw new ConflictException(
        'The selected time has already been scheduled for an interview!',
      );

    return this.interviewScheduleRepository.save(
      this.interviewScheduleRepository.create({
        ...schedule,
        registrant,
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
        registrant: {
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
