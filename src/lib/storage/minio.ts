import { Client as MinioClient } from 'minio';

const BUCKET = process.env.STORAGE_BUCKET ?? 'learnenglish';
const PUBLIC_PREFIX = process.env.STORAGE_PUBLIC_URL ?? '';

let cached: MinioClient | null = null;
let bucketReady = false;

function getClient(): MinioClient {
  if (cached) return cached;
  const endpoint = process.env.STORAGE_ENDPOINT;
  if (!endpoint) throw new Error('STORAGE_ENDPOINT not configured');
  const url = new URL(
    endpoint.startsWith('http') ? endpoint : `http://${endpoint}`,
  );
  cached = new MinioClient({
    endPoint: url.hostname,
    port: url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80,
    useSSL: url.protocol === 'https:',
    accessKey: process.env.STORAGE_ACCESS_KEY ?? '',
    secretKey: process.env.STORAGE_SECRET_KEY ?? '',
  });
  return cached;
}

async function ensureBucket(client: MinioClient): Promise<void> {
  if (bucketReady) return;
  const exists = await client.bucketExists(BUCKET).catch(() => false);
  if (!exists) {
    await client.makeBucket(BUCKET).catch(() => undefined);
  }
  bucketReady = true;
}

export interface StoredObject {
  key: string;
  url: string;
}

/**
 * Uploads bytes under `objectKey` if not already present (idempotent by key).
 * Returns a presigned GET URL valid for 1h (or a public URL if
 * STORAGE_PUBLIC_URL is set).
 */
export async function putIfAbsent(
  objectKey: string,
  data: Buffer,
  contentType: string,
): Promise<StoredObject> {
  const client = getClient();
  await ensureBucket(client);

  const existing = await client
    .statObject(BUCKET, objectKey)
    .then(() => true)
    .catch(() => false);

  if (!existing) {
    await client.putObject(BUCKET, objectKey, data, data.length, {
      'Content-Type': contentType,
    });
  }

  if (PUBLIC_PREFIX) {
    return {
      key: objectKey,
      url: `${PUBLIC_PREFIX.replace(/\/$/, '')}/${BUCKET}/${objectKey}`,
    };
  }
  const url = await client.presignedGetObject(BUCKET, objectKey, 60 * 60);
  return { key: objectKey, url };
}

export function ttsObjectKey(cacheKey: string): string {
  return `tts/${cacheKey}.mp3`;
}
