import { Injectable } from '@nestjs/common';
import {
  Cursor,
  CursorDirection,
  encodeToBase64URL,
  ObjectWithProperties,
  OrderOptions,
} from 'src/common/utils';

@Injectable()
export class CursorService {
  buildWhereClause<T extends string | number | symbol>(
    order: OrderOptions<T>,
    cursor: Cursor,
  ) {
    const orderEntries = Object.entries(order);
    const parameters: Record<string, any> = {};

    let clause = '(';

    orderEntries.forEach(([key, value], index) => {
      const paramKey = `P.${key}`;
      const comparator = value === 'ASC' ? '>' : '<';
      parameters[paramKey] = cursor[key];

      if (index > 0) {
        clause += ' OR ';
      }

      clause += '( ';
      for (let i = 0; i < index; i++) {
        const prevKey = orderEntries[i][0];
        const prevParamKey = `P.${prevKey}`;
        clause += `${prevKey} = :${prevParamKey} AND `;
      }
      clause += `${key} ${comparator} :${paramKey}`;
      clause += ` )`;
    });

    const idComparator = cursor.direction === 'forward' ? '>' : '<';
    const idParamKey = `P.id`;
    parameters[idParamKey] = cursor.id;

    clause += ' OR ';

    clause += '( ';
    orderEntries.forEach(([key]) => {
      const paramKey = `P.${key}`;
      clause += `${key} = :${paramKey} AND `;
    });
    clause += `id ${idComparator} :${idParamKey}`;
    clause += ' )';

    clause += ')';

    return { clause, parameters };
  }

  create<T extends ObjectWithProperties<any>>(
    item: T,
    orderKeys: string[],
    direction: CursorDirection,
    encode: boolean = false,
  ) {
    const properties: ObjectWithProperties<any> = {};
    orderKeys.forEach((key) => {
      properties[key] = item[key];
    });

    const cursor = {
      ...properties,
      id: item.id,
      direction,
    };

    return encode ? encodeToBase64URL(cursor) : cursor;
  }
}
