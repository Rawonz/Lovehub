import imageCompression from 'browser-image-compression';
import { supabase } from './supabase';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const TARGET_COMPRESSED_SIZE = 1.2 * 1024 * 1024; // ~1.2MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

function assertAcceptable(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError('memories.tooLarge');
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new UploadError('memories.unsupported');
  }
}

export async function compressImage(file: File): Promise<File> {
  assertAcceptable(file);
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: TARGET_COMPRESSED_SIZE / (1024 * 1024),
      maxWidthOrHeight: 2000,
      useWebWorker: true,
      initialQuality: 0.82,
    });
    return compressed;
  } catch {
    return file;
  }
}

export async function createSignedUrl(
  bucket: 'avatars' | 'memories' | 'chat-attachments',
  path: string
): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}
