import { Test, TestingModule } from '@nestjs/testing';
import { FileValidationService } from './file_validation.service';
import {
  BadRequestException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { MAX_FILE_SIZE } from '../common/utils';

function createMockFile(
  partial: Partial<Express.Multer.File>,
): Express.Multer.File {
  const defaultFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1000,
    destination: '',
    filename: '',
    path: '',
    buffer: Buffer.from([]),
    stream: {} as any,
  };

  return { ...defaultFile, ...partial };
}

describe('FileValidationService', () => {
  let service: FileValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileValidationService],
    }).compile();

    service = module.get<FileValidationService>(FileValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateMimetype', () => {
    it('should throw BadRequestException when mimetype is missing', () => {
      const file = createMockFile({ mimetype: undefined });

      expect(() => service.validateMimetype(file)).toThrow(BadRequestException);
      expect(() => service.validateMimetype(file)).toThrow(
        'Invalid file or missing type!',
      );
    });

    it('should throw UnsupportedMediaTypeException when mimetype is not allowed', () => {
      const file = createMockFile({ mimetype: 'application/invalid-type' });

      expect(() => service.validateMimetype(file)).toThrow(
        UnsupportedMediaTypeException,
      );
      expect(() => service.validateMimetype(file)).toThrow(
        'File type not allowed!',
      );
    });

    it('should validate successfully when mimetype is in allowed list', () => {
      const file = createMockFile({ mimetype: 'image/jpeg' });

      expect(() => service.validateMimetype(file)).not.toThrow();
    });

    it('should validate successfully with custom allowed types', () => {
      const file = createMockFile({ mimetype: 'custom/type' });
      const allowedTypes = ['custom/type'];

      expect(() => service.validateMimetype(file, allowedTypes)).not.toThrow();
    });
  });

  describe('validateExtention', () => {
    it('should throw BadRequestException when originalname or mimetype is missing', () => {
      const fileMissingOriginalname = createMockFile({
        originalname: undefined,
      });
      const fileMissingMimetype = createMockFile({ mimetype: undefined });

      expect(() => service.validateExtention(fileMissingOriginalname)).toThrow(
        BadRequestException,
      );
      expect(() => service.validateExtention(fileMissingMimetype)).toThrow(
        BadRequestException,
      );
      expect(() => service.validateExtention(fileMissingOriginalname)).toThrow(
        'Invalid file or missing properties!',
      );
    });

    it('should throw UnsupportedMediaTypeException when extension does not match mimetype', () => {
      const file = createMockFile({
        originalname: 'test.png',
        mimetype: 'image/jpeg',
      });

      expect(() => service.validateExtention(file)).toThrow(
        UnsupportedMediaTypeException,
      );
      expect(() => service.validateExtention(file)).toThrow(
        'File extension not allowed or does not match to its mimetype!',
      );
    });

    it('should validate successfully when extension matches mimetype', () => {
      const file = createMockFile({
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      });

      expect(() => service.validateExtention(file)).not.toThrow();
    });

    it('should validate successfully for uppercase extension', () => {
      const file = createMockFile({
        originalname: 'test.JPG',
        mimetype: 'image/jpeg',
      });

      expect(() => service.validateExtention(file)).not.toThrow();
    });
  });

  describe('validateSize', () => {
    it('should throw BadRequestException when size is missing', () => {
      const file = createMockFile({ size: undefined });

      expect(() => service.validateSize(file)).toThrow(BadRequestException);
      expect(() => service.validateSize(file)).toThrow(
        'Invalid file or missing properties!',
      );
    });

    it('should throw BadRequestException when file size exceeds maximum allowed size', () => {
      const file = createMockFile({ size: MAX_FILE_SIZE + 1 });

      expect(() => service.validateSize(file)).toThrow(BadRequestException);
      expect(() => service.validateSize(file)).toThrow(
        `File size exceeds the maximum allowed size of ${MAX_FILE_SIZE / 1_000_000} MB!`,
      );
    });

    it('should validate successfully when file size is within limits', () => {
      const file = createMockFile({ size: MAX_FILE_SIZE - 1 });

      expect(() => service.validateSize(file)).not.toThrow();
    });

    it('should validate successfully with custom max size', () => {
      const customMaxSize = 1_000_000; // 1 MB
      const file = createMockFile({ size: 900_000 });

      expect(() => service.validateSize(file, customMaxSize)).not.toThrow();
    });

    it('should throw BadRequestException when file size exceeds custom maximum allowed size', () => {
      const customMaxSize = 1_000_000; // 1 MB
      const file = createMockFile({ size: 1_500_000 });

      expect(() => service.validateSize(file, customMaxSize)).toThrow(
        BadRequestException,
      );
      expect(() => service.validateSize(file, customMaxSize)).toThrow(
        `File size exceeds the maximum allowed size of ${customMaxSize / 1_000_000} MB!`,
      );
    });
  });

  describe('sanitizeFilename', () => {
    it('should replace slashes with underscore', () => {
      expect(service.sanitizeFilename('path/to/file.jpg')).toBe(
        'path_to_file.jpg',
      );
      expect(service.sanitizeFilename('path\\to\\file.jpg')).toBe(
        'path_to_file.jpg',
      );
    });

    it('should replace multiple dots with underscore', () => {
      expect(service.sanitizeFilename('file..jpg')).toBe('file_.jpg');
      expect(service.sanitizeFilename('file...jpg')).toBe('file_.jpg');
    });

    it('should replace non-alphanumeric characters except dots, underscores, and hyphens', () => {
      expect(service.sanitizeFilename('file@#$%^&*().jpg')).toBe(
        'file_________.jpg',
      );
    });

    it('should trim whitespace', () => {
      expect(service.sanitizeFilename('  file.jpg  ')).toBe('file.jpg');
    });

    it('should handle complex cases correctly', () => {
      expect(
        service.sanitizeFilename('  path/to\\my..file@#$%^&*().jpg  '),
      ).toBe('path_to_my_file_________.jpg');
    });

    it('should properly sanitize filenames with multiple dots', () => {
      expect(service.sanitizeFilename('..file...for..event..jpg')).toBe(
        'file_for_event_.jpg',
      );
    });

    it('should maintain file extension while sanitizing dots in the name part', () => {
      expect(service.sanitizeFilename('file.name.with.dots.jpg')).toBe(
        'file.name.with.dots.jpg',
      );
      expect(
        service.sanitizeFilename('...multiple.dots...everywhere...txt'),
      ).toBe('multiple.dots_everywhere_.txt');
    });

    it('should handle filenames with dots and no extension', () => {
      expect(service.sanitizeFilename('file.with.dots')).toBe('file.with.dots');
      expect(service.sanitizeFilename('..just.dots..')).toBe('just.dots_.');
    });
  });

  describe('validateFile', () => {
    let mockValidateMimetype: jest.SpyInstance;
    let mockValidateExtention: jest.SpyInstance;
    let mockValidateSize: jest.SpyInstance;
    let mockSanitizeFilename: jest.SpyInstance;

    beforeEach(() => {
      mockValidateMimetype = jest
        .spyOn(service, 'validateMimetype')
        .mockImplementation();
      mockValidateExtention = jest
        .spyOn(service, 'validateExtention')
        .mockImplementation();
      mockValidateSize = jest
        .spyOn(service, 'validateSize')
        .mockImplementation();
      mockSanitizeFilename = jest
        .spyOn(service, 'sanitizeFilename')
        .mockReturnValue('sanitized-filename.jpg');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call all validation methods', () => {
      const file = createMockFile({
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1000,
      });

      service.validateFile(file);

      expect(mockValidateMimetype).toHaveBeenCalledWith(file, undefined);
      expect(mockValidateExtention).toHaveBeenCalledWith(file);
      expect(mockValidateSize).toHaveBeenCalledWith(file, undefined);
      expect(mockSanitizeFilename).toHaveBeenCalledWith('test.jpg');
      expect(file.originalname).toBe('sanitized-filename.jpg');
    });

    it('should pass options to validation methods', () => {
      const file = createMockFile({
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1000,
      });

      const options = {
        maxSize: 2_000_000,
        allowedType: ['image/jpeg'],
      };

      service.validateFile(file, options);

      expect(mockValidateMimetype).toHaveBeenCalledWith(
        file,
        options.allowedType,
      );
      expect(mockValidateExtention).toHaveBeenCalledWith(file);
      expect(mockValidateSize).toHaveBeenCalledWith(file, options.maxSize);
    });
  });

  describe('Integration tests', () => {
    it('should validate a valid image file', () => {
      const file = createMockFile({
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1_000_000,
      });

      expect(() => service.validateFile(file)).not.toThrow();
    });

    it('should validate a valid PDF file', () => {
      const file = createMockFile({
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 5_000_000,
      });

      expect(() => service.validateFile(file)).not.toThrow();
    });

    it('should reject a file with invalid extension for its mimetype', () => {
      const file = createMockFile({
        originalname: 'document.jpg',
        mimetype: 'application/pdf',
        size: 5_000_000,
      });

      expect(() => service.validateFile(file)).toThrow(
        UnsupportedMediaTypeException,
      );
    });

    it('should reject an oversized file', () => {
      const file = createMockFile({
        originalname: 'large-document.pdf',
        mimetype: 'application/pdf',
        size: MAX_FILE_SIZE + 1_000_000,
      });

      expect(() => service.validateFile(file)).toThrow(BadRequestException);
    });

    it('should reject a file with unsupported mimetype', () => {
      const file = createMockFile({
        originalname: 'unknown.xyz',
        mimetype: 'application/unknown',
        size: 1_000_000,
      });

      expect(() => service.validateFile(file)).toThrow(
        UnsupportedMediaTypeException,
      );
    });

    it('should sanitize filename during validation', () => {
      const file = createMockFile({
        originalname: 'my unsafe/file..name.jpg',
        mimetype: 'image/jpeg',
        size: 1_000_000,
      });

      service.validateFile(file);
      expect(file.originalname).toBe('my_unsafe_file_name.jpg');
    });

    it('should correctly sanitize complex filenames with multiple dots', () => {
      const file = createMockFile({
        originalname: '..file...for..event..jpg',
        mimetype: 'image/jpeg',
        size: 1_000_000,
      });

      service.validateFile(file);
      expect(file.originalname).toBe('file_for_event_.jpg');
    });
  });
});
