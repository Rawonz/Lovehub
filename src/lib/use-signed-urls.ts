import { useEffect, useState } from 'react';
import { createSignedUrl } from '@/lib/storage';

/**
 * Resolves signed URLs for storage paths in a list of items.
 * Re-resolves when the paths change. Each item keeps its original shape
 * with an added `__signedUrl` field for display.
 */
export function useSignedUrls<T>(
  items: T[] | undefined,
  pathField: keyof T,
  bucket: 'avatars' | 'memories' | 'chat-attachments'
): { resolved: (T & { __signedUrl: string | null })[] | undefined; loading: boolean } {
  const [resolved, setResolved] = useState<(T & { __signedUrl: string | null })[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!items) {
      setResolved(undefined);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const out = await Promise.all(
        items.map(async (item) => {
          const path = item[pathField];
          const signed = typeof path === 'string' ? await createSignedUrl(bucket, path) : null;
          return { ...item, __signedUrl: signed } as T & { __signedUrl: string | null };
        })
      );
      if (active) {
        setResolved(out);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [items, pathField, bucket]);

  return { resolved, loading };
}
