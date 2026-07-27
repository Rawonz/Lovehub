import { Helmet } from 'react-helmet-async';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, Heart, Paperclip, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useT, type TranslationKey } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import {
  useChatMessages,
  useSendMessage,
  useMarkChatRead,
  uploadChatAttachment,
} from '@/features/chat/useChat';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { InlineLoader, ButtonLoader } from '@/components/ui/loader';
import { formatRelative } from '@/lib/dates';
import { useDateLocale } from '@/lib/use-date-locale';
import { useSignedUrls } from '@/lib/use-signed-urls';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types/database';

export function ChatPage() {
  const t = useT();
  const dateLocale = useDateLocale();
  const { session, partner } = useAuth();
  const { data: messages, isLoading } = useChatMessages();
  const sendMut = useSendMessage();
  const markRead = useMarkChatRead();
  const [input, setInput] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { resolved: resolvedMessages } = useSignedUrls<ChatMessage>(messages, 'attachment_url', 'chat-attachments');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark partner's unread messages as read.
  useEffect(() => {
    if (!session?.user || !messages) return;
    const unread = messages.filter(
      (m) => m.sender_id !== session.user.id && !m.read_at
    );
    if (unread.length > 0) {
      void markRead.mutateAsync(unread.map((m) => m.id));
    }
  }, [messages, session?.user, markRead]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const clearPendingFile = () => {
    setPendingFile(null);
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingPreview(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content && !pendingFile) return;
    setInput('');
    try {
      let attachmentUrl: string | null = null;
      if (pendingFile && session?.user.id) {
        attachmentUrl = await uploadChatAttachment(pendingFile, session.user.id);
      }
      await sendMut.mutateAsync({ content, attachmentUrl });
      clearPendingFile();
    } catch (err) {
      setInput(content);
      if (err instanceof Error && err.message.startsWith('memories.')) {
        toast.error(t(err.message as TranslationKey));
      }
      console.error(err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col space-y-4">
      <Helmet>
        <title>{t('chat.title')} — LoveHub</title>
      </Helmet>

      <PageHeader
        title={t('chat.title')}
        subtitle={t('chat.subtitle')}
        icon={MessageCircle}
      />

      <Card className="flex flex-1 flex-col overflow-hidden">
        {/* Partner bar */}
        {partner && (
          <div className="flex items-center gap-3 border-b border-border p-3">
            <ProfileAvatar path={partner.avatar_url} name={partner.display_name ?? partner.email} className="h-9 w-9" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {partner.display_name ?? partner.email}
              </p>
              <p className="flex items-center gap-1 text-xs text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                {t('chat.online')}
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin">
          {isLoading ? (
            <InlineLoader label={t('common.loading')} />
          ) : !messages || messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Heart className="h-7 w-7" />
              </div>
              <p className="text-sm text-muted-foreground">{t('chat.empty')}</p>
            </div>
          ) : (
            (resolvedMessages ?? []).map((msg, idx) => {
              const mine = msg.sender_id === session?.user.id;
              const prevSame = idx > 0 && (resolvedMessages ?? [])[idx - 1].sender_id === msg.sender_id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[78%] rounded-2xl px-3.5 py-2 text-sm sm:max-w-[65%]',
                      mine
                        ? 'rounded-br-md gradient-bg text-white'
                        : 'rounded-bl-md bg-muted text-foreground'
                    )}
                  >
                    {msg.__signedUrl && (
                      <a href={msg.__signedUrl} target="_blank" rel="noopener noreferrer" className="mb-2 block">
                        <img
                          src={msg.__signedUrl}
                          alt={msg.content || 'attachment'}
                          className="max-h-60 rounded-lg object-cover"
                        />
                      </a>
                    )}
                    {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                    {!prevSame && (
                      <p className={cn('mt-1 text-[10px]', mine ? 'text-white/70' : 'text-muted-foreground')}>
                        {formatRelative(msg.created_at, dateLocale)}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="border-t border-border p-3">
          {pendingPreview && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted/50 p-2">
              <img src={pendingPreview} alt="pending" className="h-12 w-12 rounded object-cover" />
              <span className="flex-1 truncate text-xs text-muted-foreground">{pendingFile?.name}</span>
              <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={clearPendingFile} aria-label={t('common.cancel')}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={sendMut.isPending}
              aria-label={t('chat.attach')}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat.placeholder')}
              maxLength={4000}
              disabled={sendMut.isPending}
            />
            <Button type="submit" size="icon" disabled={(!input.trim() && !pendingFile) || sendMut.isPending} aria-label={t('chat.send')}>
              {sendMut.isPending ? <ButtonLoader /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
