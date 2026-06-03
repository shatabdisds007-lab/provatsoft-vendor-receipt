import { supabaseAdmin } from '@/lib/supabaseAdminClient';

export type StorageBucketName = 'receipts' | 'logos' | 'signatures' | 'stamps' | 'watermarks';

export type StorageUploadResult = {
  bucket: StorageBucketName;
  path: string;
  publicUrl: string;
};

export type SignedUrlResult = {
  signedUrl: string;
  expiresIn: number;
};

const BUCKETS: Record<StorageBucketName, string> = {
  receipts: 'receipts',
  logos: 'logos',
  signatures: 'signatures',
  stamps: 'stamps',
  watermarks: 'watermarks',
};

const DEFAULT_SIGNED_URL_EXPIRY_SECONDS = 60;

function buildUserStoragePath(bucket: StorageBucketName, userId: string, fileName: string) {
  return `${bucket}/${userId}/${fileName}`;
}

async function uploadFile(
  bucket: StorageBucketName,
  filePath: string,
  file: Buffer | ArrayBuffer | Uint8Array,
): Promise<StorageUploadResult> {
  const { error } = await supabaseAdmin.storage.from(bucket).upload(filePath, file, {
    upsert: true,
  });

  if (error) {
    throw new Error(`Storage upload failed for ${bucket}/${filePath}: ${error.message}`);
  }

  const { data: urlData, error: publicUrlError } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
  if (publicUrlError || !urlData?.publicUrl) {
    throw new Error(`Failed to generate public URL for ${bucket}/${filePath}: ${publicUrlError?.message ?? 'unknown'}`);
  }

  return {
    bucket,
    path: filePath,
    publicUrl: urlData.publicUrl,
  };
}

export async function uploadFileToPath(
  bucket: StorageBucketName,
  filePath: string,
  file: Buffer | ArrayBuffer | Uint8Array,
) {
  return uploadFile(bucket, filePath, file);
}

async function createSignedUrl(
  bucket: StorageBucketName,
  filePath: string,
  expiresIn = DEFAULT_SIGNED_URL_EXPIRY_SECONDS,
): Promise<SignedUrlResult> {
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(filePath, expiresIn);
  if (error || !data?.signedUrl) {
    throw new Error(`Signed URL creation failed for ${bucket}/${filePath}: ${error?.message ?? 'unknown'}`);
  }

  return {
    signedUrl: data.signedUrl,
    expiresIn,
  };
}

export async function uploadLogo(userId: string, fileName: string, file: Buffer | ArrayBuffer | Uint8Array) {
  const filePath = buildUserStoragePath('logos', userId, fileName);
  return uploadFile('logos', filePath, file);
}

export async function uploadSignature(userId: string, fileName: string, file: Buffer | ArrayBuffer | Uint8Array) {
  const filePath = buildUserStoragePath('signatures', userId, fileName);
  return uploadFile('signatures', filePath, file);
}

export async function uploadStamp(userId: string, fileName: string, file: Buffer | ArrayBuffer | Uint8Array) {
  const filePath = buildUserStoragePath('stamps', userId, fileName);
  return uploadFile('stamps', filePath, file);
}

export async function uploadWatermark(userId: string, fileName: string, file: Buffer | ArrayBuffer | Uint8Array) {
  const filePath = buildUserStoragePath('watermarks', userId, fileName);
  return uploadFile('watermarks', filePath, file);
}

export async function uploadReceiptPdf(
  userId: string,
  fileName: string,
  file: Buffer | ArrayBuffer | Uint8Array,
) {
  const filePath = buildUserStoragePath('receipts', userId, fileName);
  return uploadFileToPath('receipts', filePath, file);
}

export async function getSignedFileUrl(
  bucket: StorageBucketName,
  filePath: string,
  expiresIn = DEFAULT_SIGNED_URL_EXPIRY_SECONDS,
) {
  return createSignedUrl(bucket, filePath, expiresIn);
}

export async function getPublicFileUrl(bucket: StorageBucketName, filePath: string) {
  const { data, error } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
  if (error || !data?.publicUrl) {
    throw new Error(`Failed to generate public URL for ${bucket}/${filePath}: ${error?.message ?? 'unknown'}`);
  }

  return data.publicUrl;
}

export function getBucketPolicyNotes() {
  return {
    statement:
      'Use per-user storage paths and Supabase Row Level Security policies to allow users to access only their own files; use service role or admin claims for full access.',
  };
}
