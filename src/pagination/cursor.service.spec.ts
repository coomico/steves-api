import { Test, TestingModule } from '@nestjs/testing';
import { CursorService } from './cursor.service';
import {
  Cursor,
  CursorDirection,
  OrderOptions,
  decodeFromBase64URL,
  EventOrderKeys,
  ApplicationOrderKeys,
} from '../common/utils';

describe('CursorService', () => {
  let service: CursorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CursorService],
    }).compile();

    service = module.get<CursorService>(CursorService);
  });

  describe('buildWhereClause', () => {
    it('should build a where clause with a single order key (ASC)', () => {
      const order: OrderOptions<string> = { created_at: 'ASC' };
      const cursor: Cursor = {
        id: 10,
        created_at: '2023-01-01',
        direction: 'forward',
      };

      const result = service.buildWhereClause(order, cursor);

      expect(result.clause).toBe(
        '(( created_at > :P.created_at ) OR ( created_at = :P.created_at AND id > :P.id ))',
      );
      expect(result.parameters).toEqual({
        'P.created_at': '2023-01-01',
        'P.id': 10,
      });
    });

    it('should build a where clause with a single order key (DESC)', () => {
      const order: OrderOptions<string> = { created_at: 'DESC' };
      const cursor: Cursor = {
        id: 10,
        created_at: '2023-01-01',
        direction: 'forward',
      };

      const result = service.buildWhereClause(order, cursor);

      expect(result.clause).toBe(
        '(( created_at < :P.created_at ) OR ( created_at = :P.created_at AND id > :P.id ))',
      );
      expect(result.parameters).toEqual({
        'P.created_at': '2023-01-01',
        'P.id': 10,
      });
    });

    it('should build a where clause with multiple order keys', () => {
      const order: OrderOptions<string> = {
        datetime_start: 'ASC',
        name: 'DESC',
      };
      const cursor: Cursor = {
        id: 10,
        datetime_start: '2023-01-01T00:00:00Z',
        name: 'Event Name',
        direction: 'forward',
      };

      const result = service.buildWhereClause(order, cursor);

      expect(result.clause).toBe(
        '(( datetime_start > :P.datetime_start ) OR ( datetime_start = :P.datetime_start AND name < :P.name ) OR ( datetime_start = :P.datetime_start AND name = :P.name AND id > :P.id ))',
      );
      expect(result.parameters).toEqual({
        'P.datetime_start': '2023-01-01T00:00:00Z',
        'P.name': 'Event Name',
        'P.id': 10,
      });
    });

    it('should use < for id when direction is backward', () => {
      const order: OrderOptions<string> = { created_at: 'ASC' };
      const cursor: Cursor = {
        id: 10,
        created_at: '2023-01-01',
        direction: 'backward',
      };

      const result = service.buildWhereClause(order, cursor);

      expect(result.clause).toBe(
        '(( created_at > :P.created_at ) OR ( created_at = :P.created_at AND id < :P.id ))',
      );
      expect(result.parameters).toEqual({
        'P.created_at': '2023-01-01',
        'P.id': 10,
      });
    });

    it('should handle all EventOrderKeys', () => {
      const order: OrderOptions<EventOrderKeys> = {
        created_at: 'ASC',
        updated_at: 'DESC',
        name: 'ASC',
        datetime_start: 'ASC',
        datetime_end: 'DESC',
      };
      const cursor: Cursor = {
        id: 10,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        name: 'Test Event',
        datetime_start: '2023-01-03T00:00:00Z',
        datetime_end: '2023-01-04T00:00:00Z',
        direction: 'forward',
      };

      const result = service.buildWhereClause(order, cursor);

      expect(result.clause).toContain('created_at > :P.created_at');
      expect(result.clause).toContain('updated_at < :P.updated_at');
      expect(result.clause).toContain('name > :P.name');
      expect(result.clause).toContain('datetime_start > :P.datetime_start');
      expect(result.clause).toContain('datetime_end < :P.datetime_end');
      expect(result.clause).toContain('id > :P.id');

      expect(result.parameters).toEqual({
        'P.created_at': '2023-01-01T00:00:00Z',
        'P.updated_at': '2023-01-02T00:00:00Z',
        'P.name': 'Test Event',
        'P.datetime_start': '2023-01-03T00:00:00Z',
        'P.datetime_end': '2023-01-04T00:00:00Z',
        'P.id': 10,
      });
    });

    it('should handle all ApplicationOrderKeys', () => {
      const order: OrderOptions<ApplicationOrderKeys> = {
        created_at: 'ASC',
        updated_at: 'DESC',
      };
      const cursor: Cursor = {
        id: 10,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        direction: 'forward',
      };

      const result = service.buildWhereClause(order, cursor);

      expect(result.clause).toContain('created_at > :P.created_at');
      expect(result.clause).toContain('updated_at < :P.updated_at');
      expect(result.clause).toContain('id > :P.id');

      expect(result.parameters).toEqual({
        'P.created_at': '2023-01-01T00:00:00Z',
        'P.updated_at': '2023-01-02T00:00:00Z',
        'P.id': 10,
      });
    });
  });

  describe('create', () => {
    it('should create a cursor object without encoding', () => {
      const item = {
        id: 5,
        created_at: '2023-01-01',
        updated_at: '2023-01-02',
        name: 'Test Item',
        extra_field: 'should not be included',
      };
      const orderKeys: EventOrderKeys[] = ['created_at', 'name'];
      const direction: CursorDirection = 'forward';

      const result = service.create(item, orderKeys, direction);

      expect(result).toEqual({
        id: 5,
        created_at: '2023-01-01',
        name: 'Test Item',
        direction: 'forward',
      });
    });

    it('should create and encode a cursor object when encode is true', () => {
      const item = {
        id: 5,
        created_at: '2023-01-01',
        name: 'Test Item',
      };
      const orderKeys: EventOrderKeys[] = ['created_at', 'name'];
      const direction: CursorDirection = 'backward';

      const result = service.create(item, orderKeys, direction, true) as string;
      const decodedResult = decodeFromBase64URL(result);

      expect(decodedResult).toEqual({
        id: 5,
        created_at: '2023-01-01',
        name: 'Test Item',
        direction: 'backward',
      });
    });

    it('should return a valid base64url string when encode is true', () => {
      const item = {
        id: 8,
        created_at: '2023-02-15',
        name: 'Test Event',
      };
      const orderKeys: EventOrderKeys[] = ['created_at', 'name'];
      const direction: CursorDirection = 'forward';

      const result = service.create(item, orderKeys, direction, true) as string;

      expect(typeof result).toBe('string');

      const base64urlPattern = /^[A-Za-z0-9\-_]+$/;
      expect(base64urlPattern.test(result)).toBe(true);

      expect(() => {
        const buffer = Buffer.from(result, 'base64url');
        const decodedJson = buffer.toString();
        const parsed = JSON.parse(decodedJson);

        expect(parsed.id).toBe(8);
        expect(parsed.created_at).toBe('2023-02-15');
        expect(parsed.name).toBe('Test Event');
        expect(parsed.direction).toBe('forward');
      }).not.toThrow();
    });

    it('should handle objects with complex nested properties', () => {
      const item = {
        id: 7,
        datetime_start: '2023-01-01T12:00:00Z',
        metadata: {
          category: 'test',
          priority: 1,
        },
      };
      const orderKeys: EventOrderKeys[] = ['datetime_start'];
      const direction: CursorDirection = 'forward';

      const result = service.create(item, orderKeys, direction);

      expect(result).toEqual({
        id: 7,
        datetime_start: '2023-01-01T12:00:00Z',
        direction: 'forward',
      });
    });

    it('should handle all EventOrderKeys', () => {
      const item = {
        id: 15,
        created_at: '2023-05-10T14:30:00Z',
        updated_at: '2023-05-11T09:15:00Z',
        name: 'Annual Conference',
        datetime_start: '2023-06-01T09:00:00Z',
        datetime_end: '2023-06-03T18:00:00Z',
        venue: 'Convention Center', // Extra field not in EventOrderKeys
      };

      const orderKeys: EventOrderKeys[] = [
        'created_at',
        'updated_at',
        'name',
        'datetime_start',
        'datetime_end',
      ];
      const direction: CursorDirection = 'forward';

      const result = service.create(item, orderKeys, direction, true) as string;
      const decodedResult = decodeFromBase64URL(result);

      expect(decodedResult).toEqual({
        id: 15,
        created_at: '2023-05-10T14:30:00Z',
        updated_at: '2023-05-11T09:15:00Z',
        name: 'Annual Conference',
        datetime_start: '2023-06-01T09:00:00Z',
        datetime_end: '2023-06-03T18:00:00Z',
        direction: 'forward',
      });
      expect(decodedResult.venue).toBeUndefined();
    });

    it('should handle all ApplicationOrderKeys', () => {
      const item = {
        id: 20,
        created_at: '2023-07-15T10:30:00Z',
        updated_at: '2023-07-16T16:45:00Z',
        status: 'pending', // Extra field not in ApplicationOrderKeys
        applicant_name: 'John Doe', // Extra field not in ApplicationOrderKeys
      };

      const orderKeys: ApplicationOrderKeys[] = ['created_at', 'updated_at'];
      const direction: CursorDirection = 'backward';

      const result = service.create(item, orderKeys, direction, true) as string;
      const decodedResult = decodeFromBase64URL(result);

      expect(decodedResult).toEqual({
        id: 20,
        created_at: '2023-07-15T10:30:00Z',
        updated_at: '2023-07-16T16:45:00Z',
        direction: 'backward',
      });
      expect(decodedResult.status).toBeUndefined();
      expect(decodedResult.applicant_name).toBeUndefined();
    });

    it('should handle empty orderKeys array', () => {
      const item = {
        id: 25,
        created_at: '2023-08-20T08:00:00Z',
      };

      const orderKeys: EventOrderKeys[] = [];
      const direction: CursorDirection = 'forward';

      const result = service.create(item, orderKeys, direction, true) as string;
      const decodedResult = decodeFromBase64URL(result);

      expect(decodedResult).toEqual({
        id: 25,
        direction: 'forward',
      });
      expect(decodedResult.created_at).toBeUndefined();
    });

    it("should handle orderKeys that don't exist in the item", () => {
      const item = {
        id: 30,
        created_at: '2023-09-01T12:00:00Z',
        // Missing name and datetime_start
      };

      const orderKeys: EventOrderKeys[] = [
        'created_at',
        'name',
        'datetime_start',
      ];
      const direction: CursorDirection = 'forward';

      const result = service.create(item, orderKeys, direction, true) as string;
      const decodedResult = decodeFromBase64URL(result);

      expect(decodedResult).toEqual({
        id: 30,
        created_at: '2023-09-01T12:00:00Z',
        direction: 'forward',
      });
      expect(decodedResult.name).toBeUndefined();
      expect(decodedResult.datetime_start).toBeUndefined();
    });

    it('should correctly encode and parse binary data', () => {
      const binaryData = Buffer.from([0xff, 0x00, 0xaa, 0xbb]).toString(
        'binary',
      );
      const item = {
        id: 40,
        created_at: '2023-10-10T10:10:10Z',
        binary_field: binaryData,
      };

      const orderKeys: ApplicationOrderKeys[] = ['created_at'];
      const direction: CursorDirection = 'forward';

      const result = service.create(item, orderKeys, direction, true) as string;
      const base64urlPattern = /^[A-Za-z0-9\-_]+$/;
      expect(base64urlPattern.test(result)).toBe(true);

      const decodedResult = decodeFromBase64URL(result);
      expect(decodedResult).toEqual({
        id: 40,
        created_at: '2023-10-10T10:10:10Z',
        direction: 'forward',
      });
    });
  });
});
