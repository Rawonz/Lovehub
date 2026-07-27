import { useCallback, useRef, useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { compressImage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { useT } from '@/lib/i18n';
import { ButtonLoader } from './loader';
import toast from 'react-hot-toast';

interface ImageUploaderProps {
  bucket: 'avatars' | 'memories' | 'chat-attachments';
  userId: string;
  onUploaded: (path: string, previewUrl: string) => void;
  onClear?: () => void;
  currentPreview?: string | null;
  label?: string;
  hint?: string;
  aspect?: 'square' | 'wide' | 'auto';
  className?: string;
}

const aspectClass: Record<NonNullable<ImageUploaderProps['aspect']>, string> = {
  square: 'aspect-square',
  wide: 'aspect-video',
  auto: '',
};

export function ImageUploader({
  bucket,
  userId,
  onUploaded,
  onClear,
  currentPreview,
  label,
  hint,
  aspect = 'wide',
  className,
}: ImageUploaderProps) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentPreview ?? null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setUploading(true);
      const toastId = toast.loading(t('common.loading'));
      try {
        const compressed = await compressImage(file);
        const ext = compressed.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from(bucket)
          .upload(path, compressed, {
            cacheControl: '3600',
            upsert: false,
            contentType: compressed.type || 'image/jpeg',
          });
        if (error) throw error;
        const objectUrl = URL.createObjectURL(compressed);
        setPreview(objectUrl);
        onUploaded(path, objectUrl);
        toast.success(t('toast.saved'), { id: toastId });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t('errors.generic');
        toast.error(message, { id: toastId });
      } finally {
        setUploading(false);
      }
    },
    [bucket, onUploaded, t, userId]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  return (
    <div className={cn('w-full', className)}>
      {label && <p className="mb-2 text-sm font-medium text-foreground">{label}</p>}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'relative flex items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors',
          aspectClass[aspect],
          dragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/40',
          aspect === 'auto' && 'min-h-[160px] py-8'
        )}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 transition-opacity hover:opacity-100" />
            <div className="absolute right-2 top-2 flex gap-2">
              {onClear && (
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 rounded-full bg-white/90 text-foreground hover:bg-white"
                  onClick={() => {
                    setPreview(null);
                    onClear();
                  }}
                  aria-label={t('common.delete')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 px-6 py-10 text-center"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <ButtonLoader />
                <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
              </>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {aspect === 'square' ? <ImageIcon className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {t('memories.dragDrop')}
                </span>
              </>
            )}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onInputChange}
        />
      </div>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
