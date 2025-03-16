import { getMetadataArgsStorage, ObjectLiteral } from 'typeorm';

// reference: https://github.com/typeorm/typeorm/issues/5934#issuecomment-1267763340
export function findTableNameFromDecorator(tableClass: ObjectLiteral) {
  const table = getMetadataArgsStorage().tables.find(
    (t) => t.target === tableClass,
  );
  return table?.target.toString().split(' ')[1];
}
