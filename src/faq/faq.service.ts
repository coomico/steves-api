import { Injectable, NotFoundException } from '@nestjs/common';
import { Faq } from './faq.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FaqDTO, UpdateFaqDTO } from 'src/common/dtos';
import { EventService } from 'src/event/event.service';
import { Event } from 'src/event/event.entity';

@Injectable()
export class FaqService {
  constructor(
    @InjectRepository(Faq)
    private faqRepository: Repository<Faq>,

    private eventService: EventService,
  ) {}

  async findAll(
    eventId: number,
    cache?:
      | number
      | boolean
      | {
          id: any;
          milliseconds: number;
        },
  ) {
    return await this.faqRepository.find({
      where: {
        event: { id: eventId },
      },
      cache,
    });
  }

  async create(newFaqs: FaqDTO[], eventId: number, userId: number) {
    const event = await this.eventService.findById(
      eventId,
      undefined,
      undefined,
      {
        author: { id: userId },
      },
    );

    return this.faqRepository.save(
      newFaqs.map((faq) =>
        this.faqRepository.create({
          ...faq,
          event,
        }),
      ),
    );
  }

  async update(modifiedFaq: UpdateFaqDTO, faqId: number, userId: number) {
    const subQb = this.faqRepository.manager
      .getRepository(Event)
      .createQueryBuilder('event')
      .select('event.id')
      .where('event.author_id = :userId');

    const { affected } = await this.faqRepository
      .createQueryBuilder()
      .update()
      .set(modifiedFaq)
      .where('id = :faqId')
      .andWhere(`event_id IN ( ${subQb.getQuery()} )`)
      .andWhere('deleted_at IS NULL')
      .setParameters({ faqId, userId })
      .execute();

    if (affected === 0) throw new NotFoundException('Event FAQ not found!');
    return { affected };
  }

  async remove(faqId: number, userId: number) {
    const [faq] = await this.faqRepository.find({
      where: {
        id: faqId,
        event: {
          author: { id: userId },
        },
      },
    });

    if (!faq) throw new NotFoundException('Event FAQ not found!');

    const { affected } = await this.faqRepository.delete(faq.id);

    return { affected };
  }
}
