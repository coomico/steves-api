import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Division } from './division.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, FindOptionsWhere, Repository } from 'typeorm';
import { DivisionDTO, UpdateDivisionDTO } from 'src/common/dtos';
import { EventService } from 'src/event/event.service';
import { EventStatus } from 'src/common/enums';

@Injectable()
export class DivisionService {
  constructor(
    @InjectRepository(Division)
    private divisionRepository: Repository<Division>,

    private eventService: EventService,
  ) {}

  async findBy(
    where: FindOptionsWhere<Division> | FindOptionsWhere<Division>[],
    relations?: FindOptionsRelations<Division>,
    cache?:
      | number
      | boolean
      | {
          id: any;
          milliseconds: number;
        },
  ) {
    return await this.divisionRepository.find({
      where,
      relations,
      cache,
    });
  }

  async create(newDivisions: DivisionDTO[], eventId: number, userId: number) {
    const event = await this.eventService.findById(
      eventId,
      undefined,
      undefined,
      {
        author: { id: userId },
      },
    );

    return this.divisionRepository.save(
      newDivisions.map((newDiv) =>
        this.divisionRepository.create({
          ...newDiv,
          event,
        }),
      ),
    );
  }

  async update(
    modifiedDivision: UpdateDivisionDTO,
    divisionId: number,
    userId: number,
  ) {
    const { affected } = await this.divisionRepository.update(
      {
        id: divisionId,
        event: {
          author: { id: userId },
        },
      },
      modifiedDivision,
    );
    if (affected === 0) throw new NotFoundException('Division not found!');

    return { affected };
  }

  async remove(divisionId: number, userId: number) {
    const [division] = await this.divisionRepository.find({
      where: {
        id: divisionId,
        event: {
          author: { id: userId },
        },
      },
      relations: {
        event: true,
      },
    });

    if (!division) throw new NotFoundException('Division not found!');

    if (division.event.status === EventStatus.PUBLISHED) {
      throw new BadRequestException(
        'Can not remove division after event got published!',
      );
    }

    const { affected } = await this.divisionRepository.delete(division.id);

    return { affected };
  }
}
