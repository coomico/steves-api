import { regexNIM, getNIM } from './nim';

describe('regexNIM', () => {
  it('should match strings with 9 or more digits', () => {
    const validNIMs = [
      '123456789',
      '0123456789',
      '9876543210',
      '123456789012345',
    ];

    for (const nim of validNIMs) {
      expect(nim.match(regexNIM)?.[0]).toBe(nim);
    }
  });

  it('should not match strings with less than 9 digits', () => {
    const invalidNIMs = ['12345678', '123', '0', ''];

    for (const nim of invalidNIMs) {
      expect(nim.match(regexNIM)).toBeNull();
    }
  });

  it('should extract the NIM from a mixed string', () => {
    const text = 'My student ID is 123456789 and my name is John';
    const matches = text.match(regexNIM);
    expect(matches).toEqual(['123456789']);
  });

  it('should extract multiple NIMs from a mixed string', () => {
    const text = 'Student IDs: 123456789 and 987654321';
    const matches = text.match(regexNIM);
    expect(matches).toEqual(['123456789', '987654321']);
  });
});

describe('getNIM', () => {
  it('should extract NIM from email addresses with underscore format', () => {
    const emailAddresses = [
      'john_123456789@university.ac.id',
      'student_987654321@university.ac.id',
      'name_0123456789@university.ac.id',
      'user.name_123456789@subdomain.university.ac.id',
    ];

    expect(getNIM(emailAddresses[0])).toBe('123456789');
    expect(getNIM(emailAddresses[1])).toBe('987654321');
    expect(getNIM(emailAddresses[2])).toBe('0123456789');
    expect(getNIM(emailAddresses[3])).toBe('123456789');
  });

  it('should return the NIM when a single valid NIM is present', () => {
    const validInputs = [
      '123456789',
      'NIM: 123456789',
      'My NIM is 123456789.',
      'ID-123456789-2023',
    ];

    for (const input of validInputs) {
      expect(getNIM(input)).toBe('123456789');
    }
  });

  it('should return undefined when no valid NIM is present', () => {
    const invalidInputs = [
      '',
      'No NIM here',
      '12345678', // Less than 9 digits
      'ABC123DEF',
      'user@example.com',
      'invalid_12345@university.ac.id', // Less than 9 digits in email
    ];

    for (const input of invalidInputs) {
      expect(getNIM(input)).toBeUndefined();
    }
  });

  it('should return undefined when multiple NIMs are present', () => {
    const multipleNIMs = 'NIMs: 123456789 and 987654321';
    expect(getNIM(multipleNIMs)).toBeUndefined();
  });

  it('should handle emails with multiple numbers', () => {
    expect(getNIM('user123_123456789@university.ac.id')).toBe('123456789');
    expect(getNIM('batch2022_987654321@university.ac.id')).toBe('987654321');
  });

  it('should handle edge cases with emails', () => {
    expect(getNIM('')).toBeUndefined();
    expect(getNIM('user12345@university.ac.id')).toBeUndefined();
    expect(getNIM('123456789_user@university.ac.id')).toBe('123456789');
    expect(getNIM('firstname.lastname_123456789@university.ac.id')).toBe(
      '123456789',
    );
  });
});
