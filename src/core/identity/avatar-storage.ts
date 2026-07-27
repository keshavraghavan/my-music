import { createHash, createHmac } from 'node:crypto';

export interface AvatarStorageConfig {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  publicBaseUrl?: string;
}

export interface PresignedAvatarUpload {
  uploadUrl: string;
  assetUrl: string;
  headers: { 'Content-Type': string };
  expiresAt: string;
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function hmac(key: Buffer | string, value: string) {
  return createHmac('sha256', key).update(value).digest();
}

function encodePath(path: string) {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export function avatarStorageConfig(): AvatarStorageConfig | null {
  const bucket = process.env.AVATAR_BUCKET;
  const region = process.env.AVATAR_REGION;
  const accessKeyId = process.env.AVATAR_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AVATAR_SECRET_ACCESS_KEY;
  if (!bucket || !region || !accessKeyId || !secretAccessKey) return null;
  return {
    bucket,
    region,
    accessKeyId,
    secretAccessKey,
    ...(process.env.AVATAR_ENDPOINT ? { endpoint: process.env.AVATAR_ENDPOINT } : {}),
    ...(process.env.AVATAR_PUBLIC_BASE_URL
      ? { publicBaseUrl: process.env.AVATAR_PUBLIC_BASE_URL }
      : {}),
  };
}

export function presignAvatarPut({
  config,
  key,
  contentType,
  now = new Date(),
  expiresInSeconds = 300,
}: {
  config: AvatarStorageConfig;
  key: string;
  contentType: string;
  now?: Date;
  expiresInSeconds?: number;
}): PresignedAvatarUpload {
  const endpoint = new URL(
    config.endpoint ?? `https://${config.bucket}.s3.${config.region}.amazonaws.com`,
  );
  const canonicalPath = `${endpoint.pathname.replace(/\/$/, '')}/${encodePath(key)}`;
  const dateTime = now.toISOString().replaceAll(/[:-]|\.\d{3}/g, '');
  const date = dateTime.slice(0, 8);
  const scope = `${date}/${config.region}/s3/aws4_request`;
  const query = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${config.accessKeyId}/${scope}`,
    'X-Amz-Date': dateTime,
    'X-Amz-Expires': String(expiresInSeconds),
    'X-Amz-SignedHeaders': 'content-type;host',
  });
  query.sort();
  const canonicalHeaders = `content-type:${contentType}\nhost:${endpoint.host}\n`;
  const canonicalRequest = [
    'PUT',
    canonicalPath,
    query.toString(),
    canonicalHeaders,
    'content-type;host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');
  const stringToSign = ['AWS4-HMAC-SHA256', dateTime, scope, sha256(canonicalRequest)].join('\n');
  const dateKey = hmac(`AWS4${config.secretAccessKey}`, date);
  const regionKey = hmac(dateKey, config.region);
  const serviceKey = hmac(regionKey, 's3');
  const signingKey = hmac(serviceKey, 'aws4_request');
  query.set('X-Amz-Signature', createHmac('sha256', signingKey).update(stringToSign).digest('hex'));
  const uploadUrl = new URL(endpoint);
  uploadUrl.pathname = canonicalPath;
  uploadUrl.search = query.toString();
  const publicBase = (config.publicBaseUrl ?? endpoint.origin).replace(/\/$/, '');
  return {
    uploadUrl: uploadUrl.toString(),
    assetUrl: `${publicBase}/${encodePath(key)}`,
    headers: { 'Content-Type': contentType },
    expiresAt: new Date(now.getTime() + expiresInSeconds * 1000).toISOString(),
  };
}

export function isOwnedAvatarUrl(value: string, userId: string, config: AvatarStorageConfig) {
  try {
    const expectedBase = new URL(
      config.publicBaseUrl ??
        config.endpoint ??
        `https://${config.bucket}.s3.${config.region}.amazonaws.com`,
    );
    const candidate = new URL(value);
    return (
      candidate.origin === expectedBase.origin &&
      candidate.pathname.startsWith(
        `${expectedBase.pathname.replace(/\/$/, '')}/avatars/${encodeURIComponent(userId)}/`,
      )
    );
  } catch {
    return false;
  }
}
