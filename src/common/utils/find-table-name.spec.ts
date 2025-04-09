import { findTableNameFromDecorator } from './find-table-name';
import { getMetadataArgsStorage } from 'typeorm';
import { Entity } from 'typeorm';

jest.mock('typeorm', () => {
  const originalModule = jest.requireActual('typeorm');
  return {
    ...originalModule,
    getMetadataArgsStorage: jest.fn(),
  };
});

describe('findTableNameFromDecorator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the table name when the table class is found', () => {
    @Entity('users')
    class User {}

    const mockTable = {
      target: User,
      name: 'users',
    };

    (getMetadataArgsStorage as jest.Mock).mockReturnValue({
      tables: [mockTable],
    });

    const tableName = findTableNameFromDecorator(User);

    expect(getMetadataArgsStorage).toHaveBeenCalled();
    expect(tableName).toBe('User');
  });

  it('should return undefined when the table class is not found', () => {
    class UnregisteredEntity {}

    (getMetadataArgsStorage as jest.Mock).mockReturnValue({
      tables: [],
    });

    const tableName = findTableNameFromDecorator(UnregisteredEntity);

    expect(getMetadataArgsStorage).toHaveBeenCalled();
    expect(tableName).toBeUndefined();
  });

  it('should handle various types of entity classes', () => {
    @Entity('users')
    class User {}

    @Entity('products')
    class Product {}

    const mockTables = [
      {
        target: User,
        name: 'users',
      },
      {
        target: Product,
        name: 'products',
      },
    ];

    (getMetadataArgsStorage as jest.Mock).mockReturnValue({
      tables: mockTables,
    });

    const userTableName = findTableNameFromDecorator(User);
    const productTableName = findTableNameFromDecorator(Product);

    expect(userTableName).toBe('User');
    expect(productTableName).toBe('Product');
  });
});
