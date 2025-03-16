import {
  BucketAlreadyExists,
  BucketAlreadyOwnedByYou,
  CopyObjectCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  InvalidObjectState,
  NoSuchKey,
  PutBucketLifecycleConfigurationCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import {
  Key,
  ObjectsOnBucket,
  ObjectWithProperties,
  R2_BUCKET,
  R2_PRESIGNED_URL_EXPIRED,
} from 'src/common/utils';
import * as crypto from 'crypto';
import { v7 as uuidv7 } from 'uuid';
import * as path from 'path';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService extends S3Client implements OnModuleInit {
  constructor() {
    super({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  private readonly logger = new Logger(StorageService.name, {
    timestamp: true,
  });

  onModuleInit() {
    Object.keys(R2_BUCKET).forEach(async (key) => {
      try {
        await this.createBucket((R2_BUCKET as ObjectWithProperties)[key]);
        await this.configureLifecycleObject(
          (R2_BUCKET as ObjectWithProperties)[key],
        );
      } catch (error) {
        if (
          error instanceof BucketAlreadyExists ||
          error instanceof BucketAlreadyOwnedByYou
        )
          return this.logger.error(
            `Bucket: '${(R2_BUCKET as ObjectWithProperties)[key]}' already exist!`,
          );
        throw error;
      }
    });
  }

  private async createBucket(bucket: string) {
    const createBucketResponse = await this.send(
      new CreateBucketCommand({
        Bucket: bucket,
      }),
    );
    this.logger.warn(
      `Bucket with location '${createBucketResponse.Location}' created successfully.`,
    );
  }

  private async configureLifecycleObject(bucket: string) {
    await this.send(
      new PutBucketLifecycleConfigurationCommand({
        Bucket: bucket,
        LifecycleConfiguration: {
          Rules: [
            {
              ID: 'Delete Old Objects',
              Status: 'Enabled',
              Expiration: {
                Days: bucket === R2_BUCKET.PRIVATE ? 30 * 6 : 30 * 12,
              },
            },
          ],
        },
      }),
    );

    this.logger.warn(
      `Bucket: '${bucket}' configured successfully for its object lifecycle.`,
    );
  }

  private hashString(input: string) {
    return crypto
      .createHmac('sha256', process.env.CRYPTO_KEY as string)
      .update(input)
      .digest('hex');
  }

  serializeFilename(filename: string, userId: number) {
    const uuid = uuidv7().replace(/-/g, '');
    const filenameHash = this.hashString(filename).substring(0, 12);
    const useridHash = this.hashString(userId.toString()).substring(0, 8);
    const extension = path.extname(filename);

    const serializedName = [uuid, filenameHash, useridHash].join('-');

    const now = new Date();
    const folderPath = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`;

    return {
      filename: `${serializedName}${extension}`,
      key: `${folderPath}/${serializedName}${extension}`,
    };
  }

  async uploadObjectToR2(
    key: string,
    contentType: string,
    buffer: Buffer,
    bucket: string,
  ) {
    try {
      const uploadCommand = new PutObjectCommand({
        Bucket: bucket,
        ContentType: contentType,
        Key: key,
        Body: buffer,
      });

      const res = await this.send(uploadCommand);
      this.logger.debug(
        `Object with key: '${key}' created successfully. ETag: '${res.ETag}'`,
      );
    } catch (error) {
      throw error;
    }

    return;
  }

  async getObjectFromR2(key: string, bucket: string) {
    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    try {
      const { Body } = await this.send(getCommand);

      // pass the buffer
      return Body?.transformToByteArray() ?? Buffer.alloc(0);
    } catch (error) {
      switch (error.constructor) {
        case NoSuchKey:
          throw new NotFoundException(
            `Object with key '${key}' does not exist!`,
          );
        case InvalidObjectState:
          throw new ConflictException(
            `Object with key '${key}' is archived and inaccessible until restored.`,
          );
        default:
          throw error;
      }
    }
  }

  // delete soon, cause this func take one operation which same as GetObjectFromR2()
  async getPresignedUrl(key: string, bucket: string) {
    return await getSignedUrl(
      this,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
      {
        expiresIn: R2_PRESIGNED_URL_EXPIRED,
      },
    );
  }

  async moveObjectBucketR2(
    oldKey: string,
    sourceBucket: string,
    destBucket: string = sourceBucket,
    newKey: string = oldKey,
  ) {
    const copyCommand = new CopyObjectCommand({
      Bucket: destBucket,
      CopySource: `/${sourceBucket}/${oldKey}`,
      Key: newKey,
    });

    try {
      await this.send(copyCommand);
      this.logger.debug(
        `Object from '/${sourceBucket}/${oldKey}' copied to bucket: '${destBucket}' successfully.`,
      );

      await this.deleteObjectFromR2(oldKey, sourceBucket);
    } catch (error) {
      throw error;
    }
  }

  async deleteObjectFromR2(key: string, bucket: string) {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    try {
      const res = await this.send(deleteCommand);
      if (res.DeleteMarker)
        this.logger.debug(
          `Object with key: '${key}' and version-id: '${res.VersionId}' delete successfully.`,
        );
    } catch (error) {
      throw error;
    }
  }

  bulkDeleteObjectsFromR2(
    objects: {
      key: string;
      bucket: string;
    }[],
  ) {
    const objectBucketMap = new Map();
    objects.forEach((obj) => {
      if (!objectBucketMap.has(obj.bucket))
        objectBucketMap.set(obj.bucket, {
          Bucket: obj.bucket,
          Keys: [] as Key[],
        });

      objectBucketMap.get(obj.bucket).Keys.push({ Key: obj.key });
    });

    const objectCollection: ObjectsOnBucket[] = Array.from(
      objectBucketMap.values(),
    );

    let totalObjectsDeleted = 0;
    objectCollection.forEach(async (collection) => {
      const bulkDeleteCommand = new DeleteObjectsCommand({
        Bucket: collection.Bucket,
        Delete: {
          Objects: collection.Keys,
          Quiet: false,
        },
      });

      const res = await this.send(bulkDeleteCommand);
      if (res.Errors) {
        res.Errors.forEach((err) => this.logger.error(err.Message));
      }

      totalObjectsDeleted += res.Deleted ? res.Deleted.length : 0;
    });

    this.logger.debug(
      `${totalObjectsDeleted} Objects were deleted successfully.`,
    );

    return;
  }
}
