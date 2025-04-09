import { isDate, IsDate } from './is_date.decorator';
import { validate } from 'class-validator';

class TestDateModel {
  @IsDate()
  date: string;

  constructor(date: string) {
    this.date = date;
  }
}

describe('isDate Function', () => {
  describe('Valid dates', () => {
    it('should return true for valid date format YYYY-MM-DD', () => {
      expect(isDate('2023-01-01')).toBe(true);
    });

    it('should validate dates with single-digit days and months when zero-padded', () => {
      expect(isDate('2023-01-09')).toBe(true);
      expect(isDate('2023-09-01')).toBe(true);
    });

    it('should validate leap year dates', () => {
      expect(isDate('2020-02-29')).toBe(true);
    });

    it('should validate edge case dates', () => {
      expect(isDate('2023-12-31')).toBe(true); // Last day of year
      expect(isDate('2023-01-31')).toBe(true); // Last day of January
      expect(isDate('2023-02-28')).toBe(true); // Last day of February (non-leap)
    });
  });

  describe('Invalid dates', () => {
    it('should return false for non-string inputs', () => {
      expect(isDate(null as any)).toBe(false);
      expect(isDate(undefined as any)).toBe(false);
      expect(isDate(123 as any)).toBe(false);
      expect(isDate({} as any)).toBe(false);
      expect(isDate([] as any)).toBe(false);
    });

    it('should return false for incorrectly formatted dates', () => {
      expect(isDate('01-01-2023')).toBe(false); // DD-MM-YYYY format
      expect(isDate('2023/01/01')).toBe(false); // With slashes
      expect(isDate('2023.01.01')).toBe(false); // With dots
      expect(isDate('20230101')).toBe(false); // Without separators
    });

    it('should return false for invalid month values', () => {
      expect(isDate('2023-00-01')).toBe(false); // Month 0
      expect(isDate('2023-13-01')).toBe(false); // Month 13
    });

    it('should return false for invalid day values', () => {
      expect(isDate('2023-01-00')).toBe(false); // Day 0
      expect(isDate('2023-01-32')).toBe(false); // Day 32
    });

    it('should return false for non-existent dates', () => {
      expect(isDate('2023-02-29')).toBe(false); // February 29th in non-leap year
      expect(isDate('2023-02-30')).toBe(false); // February 30th
      expect(isDate('2023-02-31')).toBe(false); // February 31st
      expect(isDate('2023-04-31')).toBe(false); // April 31st
      expect(isDate('2023-06-31')).toBe(false); // June 31st
      expect(isDate('2023-09-31')).toBe(false); // September 31st
      expect(isDate('2023-11-31')).toBe(false); // November 31st
    });

    it('should return false for dates with non-padded values', () => {
      expect(isDate('2023-1-01')).toBe(false); // Month not padded
      expect(isDate('2023-01-1')).toBe(false); // Day not padded
    });

    it('should return false for incomplete dates', () => {
      expect(isDate('2023-01')).toBe(false);
      expect(isDate('2023')).toBe(false);
    });

    it('should return false for dates with extra characters', () => {
      expect(isDate('2023-01-01X')).toBe(false);
      expect(isDate(' 2023-01-01')).toBe(false);
      expect(isDate('2023-01-01 ')).toBe(false);
    });
  });

  describe('Date validation logic', () => {
    it('should handle month index conversion correctly (1-12 to 0-11)', () => {
      expect(isDate('2023-01-15')).toBe(true); // January
      expect(isDate('2023-12-15')).toBe(true); // December
    });

    it('should validate days according to specific month', () => {
      expect(isDate('2023-04-30')).toBe(true); // April has 30 days
      expect(isDate('2023-05-31')).toBe(true); // May has 31 days
      expect(isDate('2023-06-30')).toBe(true); // June has 30 days
    });
  });
});

describe('IsDate Decorator', () => {
  it('should not validate when date is invalid', async () => {
    const model = new TestDateModel('invalid-date');
    const errors = await validate(model);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should not validate when date has incorrect format', async () => {
    const model = new TestDateModel('01/01/2023');
    const errors = await validate(model);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should not validate when date does not exist', async () => {
    const model = new TestDateModel('2023-02-30');
    const errors = await validate(model);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate when date is valid', async () => {
    const model = new TestDateModel('2023-01-15');
    const errors = await validate(model);
    expect(errors.length).toBe(0);
  });

  it('should validate leap year date correctly', async () => {
    const leapYearModel = new TestDateModel('2020-02-29');
    const nonLeapYearModel = new TestDateModel('2023-02-29');

    const leapYearErrors = await validate(leapYearModel);
    const nonLeapYearErrors = await validate(nonLeapYearModel);

    expect(leapYearErrors.length).toBe(0);
    expect(nonLeapYearErrors.length).toBeGreaterThan(0);
  });

  it('should provide correct error message', async () => {
    const model = new TestDateModel('invalid-date');
    const errors = await validate(model);

    expect(errors[0].constraints?.customValidation).toContain(
      'must be a valid representation of date',
    );
  });

  it('should handle custom validation options', async () => {
    class CustomMessageModel {
      @IsDate({ message: 'Custom error message for $property' })
      date: string;

      constructor(date: string) {
        this.date = date;
      }
    }

    const model = new CustomMessageModel('invalid-date');
    const errors = await validate(model);

    expect(errors[0].constraints?.customValidation).toBe(
      'Custom error message for date',
    );
  });
});
