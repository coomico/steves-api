import { User } from 'src/user/user.entity';
import { Request } from 'express';

export interface RequestWithClaims extends Request {
  user: {
    id: number;
    token: string;
  };
}

export type DeepPartial<T> = T extends object
  ? {
      [U in keyof T]?: T[U];
    }
  : T;

export type UserOrUsers<O extends boolean> = O extends true ? User : User[];

export type Key = { Key: string };
export type ObjectsOnBucket = {
  Bucket: string;
  Keys: Key[];
};

export type ObjectWithProperties<T = string> = {
  [key: string]: T;
};

export type FileValidationOptions = {
  maxSize?: number;
  allowedType?: string[];
};

export type Flow = 'ASC' | 'DESC';
export type OrderOptions<T extends string | number | symbol> = {
  [key in T]?: Flow;
};

export type EventOrderKeys =
  | 'created_at'
  | 'updated_at'
  | 'name'
  | 'datetime_start'
  | 'datetime_end';

export type RegistrantOrderKeys = 'created_at' | 'updated_at';

export type CategoryOptions<
  T extends string | number | bigint | boolean | null | undefined,
> = `${T}`;

export type StatusOptions<
  T extends string | number | bigint | boolean | null | undefined,
  U extends string | number | bigint | boolean | null | undefined = undefined,
> = U extends null | undefined ? T : Exclude<`${T}`, `${U}`>;

export type Cursor = {
  id: number;
  direction: CursorDirection;
  [key: string]: any;
};

export type CursorDirection = 'forward' | 'backward';

export function isObjectEmpty(obj: Record<string, any>): boolean {
  return (
    Object.keys(obj).length === 0 ||
    obj.constructor !== Object ||
    typeof obj !== 'object'
  );
}
