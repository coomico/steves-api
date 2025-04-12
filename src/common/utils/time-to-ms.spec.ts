import { timeToMs } from './time-to-ms';

describe('timeToMs function', () => {
  it('should return 0 if input is not a string', () => {
    expect(timeToMs(null as any)).toBe(0);
    expect(timeToMs(undefined as any)).toBe(0);
    expect(timeToMs(123 as any)).toBe(0);
  });

  it('should return 0 if input is an empty string', () => {
    expect(timeToMs('')).toBe(0);
  });

  it('should correctly convert simple time formats HH:MM:SS', () => {
    expect(timeToMs('00:00:00')).toBe(0);
    expect(timeToMs('01:00:00')).toBe(3600000); // 1 hour in ms
    expect(timeToMs('00:01:00')).toBe(60000); // 1 minute in ms
    expect(timeToMs('00:00:01')).toBe(1000); // 1 second in ms
    expect(timeToMs('01:30:45')).toBe(5445000); // 1h 30m 45s in ms
    expect(timeToMs('23:59:59')).toBe(86399000); // 23h 59m 59s in ms
  });

  it('should correctly handle millisecond part', () => {
    expect(timeToMs('00:00:00.0')).toBe(0);
    expect(timeToMs('00:00:00.1')).toBe(100);
    expect(timeToMs('00:00:00.12')).toBe(120);
    expect(timeToMs('00:00:00.123')).toBe(123);
    expect(timeToMs('00:00:00.1234')).toBe(123); // should truncate to 3 digits
    expect(timeToMs('01:02:03.456')).toBe(3723456); // 1h 2m 3s 456ms
  });

  it('should handle invalid millisecond part gracefully', () => {
    expect(timeToMs('00:00:00.abc')).toBe(0); // NaN becomes 0
  });

  it('should correctly convert time with positive timezone offset', () => {
    expect(timeToMs('01:00:00+01:00')).toBe(0); // 1AM with +1 offset is 0 UTC
    expect(timeToMs('12:00:00+03:00')).toBe(9 * 3600000); // 12PM with +3 offset is 9AM UTC
    expect(timeToMs('23:30:00+05:30')).toBe(18 * 3600000); // 11:30PM with +5:30 offset is 6PM UTC
  });

  it('should correctly convert time with negative timezone offset', () => {
    expect(timeToMs('01:00:00-01:00')).toBe(2 * 3600000); // 1AM with -1 offset is 2AM UTC
    expect(timeToMs('12:00:00-03:00')).toBe(15 * 3600000); // 12PM with -3 offset is 3PM UTC
    expect(timeToMs('18:30:00-05:30')).toBe(0); // 6:30PM with -5:30 offset is 12AM UTC
  });

  it('should handle timezone offset without minutes', () => {
    expect(timeToMs('12:00:00+03')).toBe(9 * 3600000); // Same as +03:00
    expect(timeToMs('12:00:00-03')).toBe(15 * 3600000); // Same as -03:00
  });

  it('should handle Z timezone indicator', () => {
    expect(timeToMs('12:00:00Z')).toBe(12 * 3600000); // Z means UTC
    expect(timeToMs('12:00:00z')).toBe(12 * 3600000); // lowercase z should also work
  });

  it('should handle time wrapping around midnight', () => {
    expect(timeToMs('01:00:00+02:00')).toBe(23 * 3600000); // 1AM +2 is 11PM previous day UTC
    expect(timeToMs('23:00:00-03:00')).toBe(2 * 3600000); // 26h becomes 2h
  });

  it('should handle time formats used in the application', () => {
    const time = '09:00:00+07:00'; // Common Indonesia timezone
    expect(timeToMs(time)).toBe(2 * 3600000); // 9AM Jakarta is 2AM UTC
  });

  it('should handle edge cases', () => {
    expect(timeToMs('00:00:00+00:00')).toBe(0); // Midnight UTC
    expect(timeToMs('24:00:00')).toBe(0); // 24:00 should be treated as 00:00 next day
    expect(timeToMs('12:00:00+12:00')).toBe(0); // Noon at UTC+12 is midnight UTC
    expect(timeToMs('12:00:00-12:00')).toBe(0); // Noon at UTC-12 is midnight UTC too
  });
});
