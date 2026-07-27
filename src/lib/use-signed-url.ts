import { useEffect, useState } from 'react';
import { createSignedUrl } from '@/lib/storage';

/**
 * Resolves a signed URL for a single storage path (avatar, attachment, etc.).
 * Returns null while loading or if the path is empty/already a URL.
 */
export function useSignedUrl(
  path: string | null | undefined,
  bucket: 'avatars' | 'memories' | 'chat-attachments'
): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!path) {
      setUrl(null);
      return;
    }
    if (path.startsWith('http')) {
      setUrl(path);
      return;
    }
    setUrl(null);
    createSignedUrl(bucket, path).then((signed) => {
      if (active) setUrl(signed);
    });
    return () => {
      active = false;
    };
  }, [path, bucket]);

  return url;
}
