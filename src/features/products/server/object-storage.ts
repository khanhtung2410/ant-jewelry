import 'server-only';

import { createHash, createHmac, randomUUID } from 'node:crypto';
import type { SupportedProductImage } from '../lib/product-image-validation';

type ObjectStorageConfig = {
  endpoint: URL;
  publicUrl: URL;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export class ObjectStorageConfigurationError extends Error {}

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new ObjectStorageConfigurationError(`${name} is required for product image storage.`);
  }
  return value;
}

function getObjectStorageConfig(): ObjectStorageConfig {
  const region = requiredEnvironmentValue('S3_REGION');
  const endpointValue = process.env.S3_ENDPOINT?.trim() || `https://s3.${region}.amazonaws.com`;
  let endpoint: URL;
  let publicUrl: URL;
  try {
    endpoint = new URL(endpointValue);
    publicUrl = new URL(requiredEnvironmentValue('S3_PUBLIC_URL'));
  } catch {
    throw new ObjectStorageConfigurationError('S3_ENDPOINT and S3_PUBLIC_URL must be valid URLs.');
  }
  const isLocalHost = (hostname: string) =>
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';

  if (
    endpoint.pathname !== '/' ||
    endpoint.search ||
    endpoint.hash ||
    endpoint.username ||
    endpoint.password ||
    publicUrl.search ||
    publicUrl.hash ||
    publicUrl.username ||
    publicUrl.password ||
    !['http:', 'https:'].includes(endpoint.protocol) ||
    !['http:', 'https:'].includes(publicUrl.protocol) ||
    (process.env.NODE_ENV === 'production' &&
      (endpoint.protocol !== 'https:' || publicUrl.protocol !== 'https:')) ||
    (endpoint.protocol === 'http:' && !isLocalHost(endpoint.hostname)) ||
    (publicUrl.protocol === 'http:' && !isLocalHost(publicUrl.hostname))
  ) {
    throw new ObjectStorageConfigurationError(
      'S3_ENDPOINT must be an origin URL and S3_PUBLIC_URL must be a public base URL.',
    );
  }

  return {
    endpoint,
    publicUrl,
    region,
    bucket: requiredEnvironmentValue('S3_BUCKET'),
    accessKeyId: requiredEnvironmentValue('S3_ACCESS_KEY_ID'),
    secretAccessKey: requiredEnvironmentValue('S3_SECRET_ACCESS_KEY'),
  };
}

function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

function hmac(key: string | Uint8Array, value: string): Buffer {
  return createHmac('sha256', key).update(value).digest();
}

function encodePathSegment(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function objectPath(bucket: string, key: string): string {
  return `/${[bucket, ...key.split('/')].map(encodePathSegment).join('/')}`;
}

function authorizationHeaders(
  config: ObjectStorageConfig,
  method: 'PUT' | 'DELETE',
  key: string,
  payloadHash: string,
  timestamp: Date,
): Record<string, string> {
  const amzDate = timestamp.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = amzDate.slice(0, 8);
  const canonicalUri = objectPath(config.bucket, key);
  const canonicalHeaders =
    `host:${config.endpoint.host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [
    method,
    canonicalUri,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');
  const scope = `${date}/${config.region}/s3/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonicalRequest)].join('\n');
  const dateKey = hmac(`AWS4${config.secretAccessKey}`, date);
  const regionKey = hmac(dateKey, config.region);
  const serviceKey = hmac(regionKey, 's3');
  const signingKey = hmac(serviceKey, 'aws4_request');
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  return {
    Authorization:
      `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
}

function getObjectUrl(config: ObjectStorageConfig, key: string): string {
  const base = config.publicUrl.toString().endsWith('/')
    ? config.publicUrl.toString()
    : `${config.publicUrl.toString()}/`;
  return new URL(key.split('/').map(encodePathSegment).join('/'), base).toString();
}

async function sendObjectRequest(
  config: ObjectStorageConfig,
  method: 'PUT' | 'DELETE',
  key: string,
  body?: Uint8Array,
  contentType?: SupportedProductImage['contentType'],
): Promise<void> {
  const payloadHash = sha256(body ?? new Uint8Array());
  const headers: Record<string, string> = {
    ...authorizationHeaders(config, method, key, payloadHash, new Date()),
    ...(contentType ? { 'Content-Type': contentType } : {}),
  };
  const url = new URL(objectPath(config.bucket, key), config.endpoint);
  const response = await fetch(url, {
    method,
    headers,
    ...(body ? { body: new Uint8Array(body) } : {}),
  });

  if (method === 'DELETE' && response.status === 404) {
    return;
  }
  if (!response.ok) {
    throw new Error(`Object storage ${method} failed with status ${response.status}.`);
  }
}

export async function uploadProductImage(
  productId: string,
  image: Uint8Array,
  type: SupportedProductImage,
): Promise<{ storageKey: string; url: string }> {
  const config = getObjectStorageConfig();
  const storageKey = `products/${productId}/${randomUUID()}.${type.extension}`;
  await sendObjectRequest(config, 'PUT', storageKey, image, type.contentType);
  return { storageKey, url: getObjectUrl(config, storageKey) };
}

export async function deleteStoredProductImage(storageKey: string): Promise<void> {
  const config = getObjectStorageConfig();
  await sendObjectRequest(config, 'DELETE', storageKey);
}
