import { isTime, IsTime } from './is_time.decorator';
import { validate } from 'class-validator';

class TestTimeModel {
  @IsTime()
  time: string;

  constructor(time: string) {
    this.time = time;
  }
}

describe('isTime Function', () => {
  describe('Valid times', () => {
    it('should return true for valid time format HH:MM:SSZ', () => {
      expect(isTime('12:30:00Z')).toBe(true);
    });

    it('should return true for valid time format HH:MM:SS+HH:MM', () => {
      expect(isTime('12:30:00+01:00')).toBe(true);
      expect(isTime('12:30:00-01:00')).toBe(true);
    });

    it('should validate times with fractional seconds', () => {
      expect(isTime('12:30:00.5Z')).toBe(true);
      expect(isTime('12:30:00.123Z')).toBe(true);
      expect(isTime('12:30:00.999999Z')).toBe(true);
    });

    it('should validate times with UTC offset and fractional seconds', () => {
      expect(isTime('12:30:00.5+01:00')).toBe(true);
      expect(isTime('12:30:00.123-07:00')).toBe(true);
    });

    it('should validate 24-hour format times', () => {
      expect(isTime('00:00:00Z')).toBe(true); // Midnight
      expect(isTime('23:59:59Z')).toBe(true); // Last minute of day
    });

    it('should validate leap seconds', () => {
      expect(isTime('23:59:60Z')).toBe(true); // Leap second
    });

    it('should accept lowercase "z" timezone designator', () => {
      expect(isTime('12:30:00z')).toBe(true);
    });
  });

  describe('Invalid times', () => {
    it('should return false for non-string inputs', () => {
      expect(isTime(null as any)).toBe(false);
      expect(isTime(undefined as any)).toBe(false);
      expect(isTime(123 as any)).toBe(false);
      expect(isTime({} as any)).toBe(false);
      expect(isTime([] as any)).toBe(false);
    });

    it('should return false for incorrectly formatted times', () => {
      expect(isTime('12-30-00Z')).toBe(false); // Wrong separator
      expect(isTime('12:30Z')).toBe(false); // Missing seconds
      expect(isTime('12:30:00')).toBe(false); // Missing timezone
    });

    it('should return false for invalid hour values', () => {
      expect(isTime('24:00:00Z')).toBe(false); // Hour 24
      expect(isTime('30:00:00Z')).toBe(false); // Hour 30
    });

    it('should return false for invalid minute values', () => {
      expect(isTime('12:60:00Z')).toBe(false); // Minute 60
      expect(isTime('12:99:00Z')).toBe(false); // Minute 99
    });

    it('should return false for invalid second values', () => {
      expect(isTime('12:30:61Z')).toBe(false); // Second 61 (beyond leap second)
      expect(isTime('12:30:99Z')).toBe(false); // Second 99
    });

    it('should return false for invalid timezone formats', () => {
      expect(isTime('12:30:00UTC')).toBe(false); // Invalid timezone format
      expect(isTime('12:30:00+01')).toBe(false); // Incomplete offset
      expect(isTime('12:30:00+1:00')).toBe(false); // Non-padded offset hour
      expect(isTime('12:30:00+01:1')).toBe(false); // Non-padded offset minute
    });

    it('should return false for invalid offset values', () => {
      expect(isTime('12:30:00+24:00')).toBe(false); // Hour offset 24
      expect(isTime('12:30:00+01:60')).toBe(false); // Minute offset 60
    });

    it('should return false for times with extra characters', () => {
      expect(isTime('12:30:00Z ')).toBe(false); // Extra space
      expect(isTime(' 12:30:00Z')).toBe(false); // Leading space
      expect(isTime('12:30:00ZEXTRA')).toBe(false); // Extra characters
    });
  });
});

describe('IsTime Decorator', () => {
  it('should not validate when time is invalid', async () => {
    const model = new TestTimeModel('invalid-time');
    const errors = await validate(model);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should not validate when time has incorrect format', async () => {
    const model = new TestTimeModel('12:30:00'); // Missing timezone
    const errors = await validate(model);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate when time is valid with Z timezone', async () => {
    const model = new TestTimeModel('12:30:00Z');
    const errors = await validate(model);
    expect(errors.length).toBe(0);
  });

  it('should validate when time is valid with numeric offset', async () => {
    const model = new TestTimeModel('12:30:00+01:00');
    const errors = await validate(model);
    expect(errors.length).toBe(0);
  });

  it('should validate when time has fractional seconds', async () => {
    const model = new TestTimeModel('12:30:00.123Z');
    const errors = await validate(model);
    expect(errors.length).toBe(0);
  });

  it('should provide correct error message', async () => {
    const model = new TestTimeModel('invalid-time');
    const errors = await validate(model);

    expect(errors[0].constraints?.customValidation).toContain(
      'must be a valid representation of time in the format RFC 3339',
    );
  });

  it('should handle custom validation options', async () => {
    class CustomMessageModel {
      @IsTime({ message: 'Custom error message for $property' })
      time: string;

      constructor(time: string) {
        this.time = time;
      }
    }

    const model = new CustomMessageModel('invalid-time');
    const errors = await validate(model);

    expect(errors[0].constraints?.customValidation).toBe(
      'Custom error message for time',
    );
  });
});
