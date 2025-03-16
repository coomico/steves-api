import { Injectable } from '@nestjs/common';
import {
  Cursor,
  findTableNameFromDecorator,
  OrderOptions,
} from 'src/common/utils';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { CursorService } from './cursor.service';

@Injectable()
export class PaginationService {
  constructor(private cursorService: CursorService) {}

  async forward<T extends ObjectLiteral>(
    Qb: SelectQueryBuilder<T>,
    take: number,
    order: OrderOptions<string>,
    cursor?: Cursor,
  ) {
    const qb = Qb;

    if (cursor) {
      const where = this.cursorService.buildWhereClause(order, cursor);
      qb.andWhere(where.clause).setParameters(where.parameters);
    }

    const result = await qb
      .orderBy({
        ...order,
        id: 'ASC',
      })
      .take(take + 1)
      .getMany();

    const hasNext = result.length > take;
    const events = hasNext ? result.slice(0, take) : result;
    const orderKeys = Object.keys(order);

    const nextCursor = hasNext
      ? this.cursorService.create(
          events[events.length - 1],
          orderKeys,
          'forward',
          true,
        )
      : null;

    const prevCursor =
      cursor && events.length > 0
        ? this.cursorService.create(events[0], orderKeys, 'backward', true)
        : null;

    return {
      events,
      pagination: {
        next_cursor: nextCursor,
        prev_cursor: prevCursor,
        take: take,
      },
    };
  }

  async backward<T extends ObjectLiteral>(
    entity: new () => T,
    Qb: SelectQueryBuilder<T>,
    take: number,
    order: OrderOptions<string>,
    cursor: Cursor,
  ) {
    const switchOrderFlow: OrderOptions<string> = {};
    for (const key in order) {
      switchOrderFlow[key] = order[key] === 'ASC' ? 'DESC' : 'ASC';
    }

    const where = this.cursorService.buildWhereClause(switchOrderFlow, cursor);

    const subQb = Qb.andWhere(where.clause)
      .setParameters(where.parameters)
      .orderBy({
        ...switchOrderFlow,
        id: 'DESC',
      })
      .take(take + 1);

    const entityName = findTableNameFromDecorator(entity)
      ?.toLowerCase()
      .replace(' ', '_');
    const cursorQb = Qb.addCommonTableExpression(`${subQb.getQuery()}`, 'prev')
      .where(`${entityName}.id IN (SELECT "${entityName}_id" FROM "prev")`)
      .setParameters(subQb.getParameters());

    const result = await cursorQb
      .orderBy({
        ...order,
        id: 'ASC',
      })
      .take(take + 1)
      .getMany();

    const hasPrev = result.length > take;
    const events = hasPrev ? result.slice(1, take + 1) : result;
    const orderKeys = Object.keys(order);

    const nextCursor =
      events.length > 0
        ? this.cursorService.create(
            events[events.length - 1],
            orderKeys,
            'forward',
            true,
          )
        : null;

    const prevCursor = hasPrev
      ? this.cursorService.create(events[0], orderKeys, 'backward', true)
      : null;

    return {
      events,
      pagination: {
        next_cursor: nextCursor,
        prev_cursor: prevCursor,
        take: take,
      },
    };
  }
}
