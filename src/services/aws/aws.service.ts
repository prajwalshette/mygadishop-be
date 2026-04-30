import { Request } from 'express';
import type { RequestWithUser } from '@modules/auth/auth.interface';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AWS_REGION, S3_ACCESS_KEY_ID, S3_BUCKET_NAME, S3_SECRET_KEY } from '@/config/env';
import { ulid } from 'ulid';
import { setVehiclePresignedCache } from '@/services/redis/cache/vehicle.cache';
import { logger } from '@/utils/logger';
import { DocumentType } from '@prisma/client';

function generateFileName(req: Request, file: any): string {
  const splittedFilename = file.originalname.split('.');
  const extension = splittedFilename.pop();
  const basename = splittedFilename.join('.');
  return `${basename}_${ulid()}.${extension}`;
}

export const s3 = new S3Client({
  region: AWS_REGION,
  credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_KEY },
});

type VehicleUrlData = {
  imageUrls: string[];
  /** Unused; kept optional for compatibility with presigned-cache typing. */
  docUrls?: string[];
};

// Vehicle Media Upload Function
export const uploadVehicleMedia = async (
  request: RequestWithUser,
  response: any,
  fieldName: string,
  shop_id: string,
  vehicle_id: string,
): Promise<{ fileUrl: string }> => {
  try {
    if (!request.file) {
      throw new Error('No file found in request');
    }

    const file = request.file;
    const fileName = generateFileName(request, file);
    const key = `data/${shop_id}/vehicles/${vehicle_id}/media/${fileName}`;

    const uploadParams = {
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);

    const fileUrl = `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;

    return { fileUrl };
  } catch (error) {
    throw new Error(`Failed to upload vehicle media: ${error.message}`);
  }
};

// Vehicle Document Upload Function
export const uploadVehicleDocMedia = async (
  request: RequestWithUser,
  response: any,
  fieldName: string,
  shop_id: string,
  vehicle_id: string,
  document_type: DocumentType,
): Promise<{ fileUrl: string }> => {
  try {
    if (!request.file) {
      throw new Error('No file found in request');
    }

    const file = request.file;
    const fileName = generateFileName(request, file);
    const key = `data/${shop_id}/vehicles/${vehicle_id}/documents/${document_type}/${fileName}`;

    const uploadParams = {
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);

    const fileUrl = `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;

    return { fileUrl };
  } catch (error) {
    throw new Error(`Failed to upload vehicle document: ${error.message}`);
  }
};

export const uploadVehiclePaymentMedia = async (
  request: RequestWithUser,
  response: any,
  fieldName: string,
  shop_id: string,
  vehicle_id: string,
  payment_id: string,
): Promise<{ fileUrl: string }> => {
  try {
    if (!request.file) {
      throw new Error('No file found in request');
    }

    const file = request.file;
    const fileName = generateFileName(request, file);
    const key = `data/${shop_id}/vehicles-payment/${vehicle_id}/${payment_id}/${fileName}`;

    const uploadParams = {
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);

    const fileUrl = `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;

    return { fileUrl };
  } catch (error) {
    throw new Error(`Failed to upload vehicle payment media: ${error.message}`);
  }
};

/**
 * Extract S3 key from URL
 */
const extractS3Key = (s3Url: string): string | null => {
  try {
    // Handle https://bucket.s3.region.amazonaws.com/key format
    if (s3Url.includes('.s3.') && s3Url.includes('.amazonaws.com')) {
      const url = new URL(s3Url);
      return decodeURIComponent(url.pathname.substring(1)); // Remove leading slash and decode
    }

    // Handle s3:// format
    if (s3Url.startsWith('s3://')) {
      const parts = s3Url.replace('s3://', '').split('/');
      return parts.slice(1).join('/'); // Remove bucket name, keep key
    }

    return null;
  } catch (error) {
    logger.error(`Error extracting S3 key: ${error.message}`);
    return null;
  }
};

/**
 * Generate presigned URL for a single S3 object
 */
const generateSinglePresignedUrl = async (s3Url: string, expiresIn: number = 3600): Promise<string | null> => {
  try {
    const key = extractS3Key(s3Url);
    if (!key) {
      logger.error(`Invalid S3 URL format: ${s3Url}`);
      return null;
    }

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    // Generate presigned URL with minimal parameters
    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn,
      signableHeaders: new Set(['host']),
      unhoistableHeaders: new Set(),
    });

    return presignedUrl;

    // const presignedUrl = await getSignedUrl(s3, command, { expiresIn });
    // return presignedUrl;
  } catch (error) {
    logger.error(`Error generating presigned URL for: ${s3Url} - ${error.message}`);
    return null;
  }
};

/** Public helper to presign a single stored S3 URL (e.g. vehicle document `file_url`). */
export const presignS3Url = async (s3Url: string | null | undefined, expiresIn: number = 3600): Promise<string | null> => {
  if (!s3Url) return null;
  return generateSinglePresignedUrl(s3Url, expiresIn);
};

/**
 * Generate presigned URLs for multiple S3 URLs
 */
const generateMultiplePresignedUrls = async (s3Urls: string[], expiresIn: number = 3600): Promise<string[]> => {
  if (!s3Urls || s3Urls.length === 0) return [];

  const results = await Promise.all(
    s3Urls.map(async url => {
      const presigned = await generateSinglePresignedUrl(url, expiresIn);
      if (presigned) return presigned;
      logger.error(`Failed to generate presigned URL for: ${url}`);
      return url;
    }),
  );

  return results;
};

/**
 * Get S3 object as stream (for proxying vehicle image to frontend without CORS)
 */
export const getS3ObjectStream = async (s3Url: string): Promise<{ Body: import('stream').Readable; ContentType?: string } | null> => {
  try {
    const key = extractS3Key(s3Url);
    if (!key) {
      logger.error(`Invalid S3 URL format for getStream: ${s3Url}`);
      return null;
    }
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });
    const response = await s3.send(command);
    return {
      Body: response.Body as import('stream').Readable,
      ContentType: response.ContentType ?? 'image/jpeg',
    };
  } catch (error) {
    logger.error(`Error getting S3 object stream: ${error.message}`);
    return null;
  }
};

/**
 * Generate presigned URLs for vehicle images and store in cache.
 * Typed vehicle documents are presigned separately in the vehicle service (`presignS3Url` per row).
 */
export const generateVehiclePresignedUrls = async (
  vehicleId: string,
  imageUrls: string[] = [],
  expiresIn: number = 3600,
): Promise<VehicleUrlData | null> => {
  try {
    logger.info(`Generating presigned URLs for vehicle: ${vehicleId}`);

    const presignedImageUrls = await generateMultiplePresignedUrls(imageUrls, expiresIn);

    const result: VehicleUrlData = {
      imageUrls: presignedImageUrls,
      docUrls: [],
    };

    await setVehiclePresignedCache(vehicleId, presignedImageUrls, [], expiresIn);

    logger.info(`Generated and cached ${presignedImageUrls.length} image URLs for vehicle: ${vehicleId}`);
    return result;
  } catch (error) {
    logger.error(`Error generating vehicle presigned URLs: ${error.message}`);
    return null;
  }
};
