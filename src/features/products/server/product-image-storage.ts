import 'server-only';

import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { SupportedProductImage } from '../lib/product-image-validation';

const storageKeySegmentPattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const contentTypeByExtension: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export class InvalidProductImageStorageKeyError extends Error {}
export class StoredProductImageNotFoundError extends Error {}

type S3StorageConfig = {
  bucket: string;
  publicBaseUrl: string;
  endpoint?: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle: boolean;
};

let cachedClient: S3Client | null = null;
let cachedClientKey = '';

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function getS3Config(): S3StorageConfig | null {
  const bucket = readEnv('S3_BUCKET');
  if (!bucket) {
    return null;
  }

  const publicBaseUrl = readEnv('S3_PUBLIC_BASE_URL')?.replace(/\/+$/, '');
  if (!publicBaseUrl) {
    throw new Error(
      'S3_PUBLIC_BASE_URL is required when S3_BUCKET is configured for product image storage.',
    );
  }

  const accessKeyId = readEnv('S3_ACCESS_KEY_ID');
  const secretAccessKey = readEnv('S3_SECRET_ACCESS_KEY');
  if ((accessKeyId && !secretAccessKey) || (!accessKeyId && secretAccessKey)) {
    throw new Error('S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be configured together.');
  }

  return {
    bucket,
    publicBaseUrl,
    endpoint: readEnv('S3_ENDPOINT'),
    region: readEnv('S3_REGION') ?? 'auto',
    accessKeyId,
    secretAccessKey,
    forcePathStyle: readEnv('S3_FORCE_PATH_STYLE') === 'true',
  };
}

function getS3Client(config: S3StorageConfig): S3Client {
  const key = JSON.stringify({
    endpoint: config.endpoint,
    region: config.region,
    accessKeyId: config.accessKeyId,
    forcePathStyle: config.forcePathStyle,
  });
  if (!cachedClient || cachedClientKey !== key) {
    cachedClient = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle,
      credentials:
        config.accessKeyId && config.secretAccessKey
          ? { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey }
          : undefined,
    });
    cachedClientKey = key;
  }
  return cachedClient;
}

function normalizeStorageKey(storageKey: string): string {
  const segments = storageKey.split('/').filter(Boolean);
  if (
    segments.length !== 3 ||
    segments[0] !== 'products' ||
    !segments.every((segment) => storageKeySegmentPattern.test(segment))
  ) {
    throw new InvalidProductImageStorageKeyError('Invalid product image storage key.');
  }
  return segments.join('/');
}

export function getProductImageUploadRoot(): string {
  const configured = readEnv('PRODUCT_IMAGE_UPLOAD_DIR');
  // The upload directory only exists at runtime, so it must not be resolved by
  // Turbopack's static file tracing (which would otherwise trace the whole
  // project into the server bundle).
  return path.resolve(/*turbopackIgnore: true*/ configured || path.join(process.cwd(), 'uploads'));
}

function resolveStoredImagePath(storageKey: string): string {
  const key = normalizeStorageKey(storageKey);
  const segments = key.split('/');
  const root = getProductImageUploadRoot();
  const filePath = path.resolve(root, ...segments);
  if (!filePath.startsWith(`${root}${path.sep}`)) {
    throw new InvalidProductImageStorageKeyError('Invalid product image storage key.');
  }
  return filePath;
}

function isNotFoundError(error: unknown): boolean {
  const value = error as { code?: string; name?: string; $metadata?: { httpStatusCode?: number } };
  return (
    value?.code === 'ENOENT' ||
    value?.name === 'NoSuchKey' ||
    value?.name === 'NotFound' ||
    value?.$metadata?.httpStatusCode === 404
  );
}

async function uploadLocal(
  storageKey: string,
  image: Uint8Array,
): Promise<{ storageKey: string; url: string }> {
  const filePath = resolveStoredImagePath(storageKey);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, image, { flag: 'wx' });
  return { storageKey, url: `/uploads/${storageKey}` };
}

async function uploadS3(
  config: S3StorageConfig,
  storageKey: string,
  image: Uint8Array,
  type: SupportedProductImage,
): Promise<{ storageKey: string; url: string }> {
  const client = getS3Client(config);
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: storageKey,
      Body: image,
      ContentType: type.contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  return { storageKey, url: `${config.publicBaseUrl}/${storageKey}` };
}

export async function uploadProductImage(
  productId: string,
  image: Uint8Array,
  type: SupportedProductImage,
): Promise<{ storageKey: string; url: string }> {
  const storageKey = normalizeStorageKey(`products/${productId}/${randomUUID()}.${type.extension}`);
  const config = getS3Config();
  if (config) {
    return uploadS3(config, storageKey, image, type);
  }
  return uploadLocal(storageKey, image);
}

export async function deleteStoredProductImage(storageKey: string): Promise<void> {
  const key = normalizeStorageKey(storageKey);
  const config = getS3Config();
  if (config) {
    try {
      await getS3Client(config).send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
    } catch (error) {
      if (isNotFoundError(error)) {
        return;
      }
      throw error;
    }
    return;
  }

  const filePath = resolveStoredImagePath(key);
  try {
    await unlink(filePath);
  } catch (error) {
    if (isNotFoundError(error)) {
      return;
    }
    throw error;
  }
}

export async function readStoredProductImage(
  storageKey: string,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const key = normalizeStorageKey(storageKey);
  const extension = key.split('.').pop()?.toLowerCase() ?? '';
  const contentType = contentTypeByExtension[extension];
  if (!contentType) {
    throw new StoredProductImageNotFoundError('Unsupported product image type.');
  }

  const config = getS3Config();
  if (config) {
    try {
      const response = await getS3Client(config).send(
        new GetObjectCommand({ Bucket: config.bucket, Key: key }),
      );
      if (!response.Body) {
        throw new StoredProductImageNotFoundError('Product image not found.');
      }
      const bytes = new Uint8Array(await response.Body.transformToByteArray());
      return { bytes, contentType: response.ContentType ?? contentType };
    } catch (error) {
      if (isNotFoundError(error)) {
        throw new StoredProductImageNotFoundError('Product image not found.');
      }
      throw error;
    }
  }

  const filePath = resolveStoredImagePath(key);
  try {
    return { bytes: new Uint8Array(await readFile(filePath)), contentType };
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new StoredProductImageNotFoundError('Product image not found.');
    }
    throw error;
  }
}
