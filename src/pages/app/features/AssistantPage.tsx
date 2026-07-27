import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  CalendarHeart,
  Gift,
  Heart,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { useT, type TranslationKey } from '@/lib/i18n';
import {
  useConversations,
  useConversationMessages,
  useCreateConversation,
  useDeleteConversation,
  useSendMessage,
} from '@/features/assistant/useAssistant';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InlineLoader, ButtonLoader } from '@/components/ui/loader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { formatRelative } from '@/lib/dates';
import { useDateLocale } from '@/lib/use-date-locale';

const SUGGESTIONS: { icon: typeof Gift; key: TranslationKey; prompt: string }[] = [
  { icon: CalendarHeart, key: 'assistant.suggestions.dateIdea', prompt: 'Suggest a romantic date idea for this weekend.' },
  { icon: Gift, key: 'assistant.suggestions.giftIdea', prompt: 'Suggest a thoughtful gift for my partner.' },
  { icon: Heart, key: 'assistant.suggestions.sweetMessage', prompt: 'Write a sweet message I can send to my partner.' },
  { icon: Clock, key: 'assistant.suggestions.anniversaryIdea', prompt: 'Help me plan something special for our anniversary.' },
];

export function AssistantPage() {
  const t = useT();
  const dateLocale = useDateLocale();
  const { data: conversations } = useConversations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingMessage = useRef<string | null>(null);

  const createMut = useCreateConversation();
  const deleteMut = useDeleteConversation();
  const { data: messages, isLoading } = useConversationMessages(activeId);
  const sendMut = useSendMessage(activeId);

  // Auto-select the most recent conversation.
  useEffect(() => {
    if (!activeId && conversations && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMut.isPending]);

  const startNewConversation = async () => {
    try {
      const conv = await createMut.mutateAsync(undefined);
      setActiveId(conv.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (content?: string) => {
    const text = (content ?? input).trim();
    if (!text) return;
    setInput('');
    if (!activeId) {
      // Create a conversation first; the effect below will flush the queued message.
      pendingMessage.current = text;
      await startNewConversation();
      return;
    }
    const history = (messages ?? []).map((m) => ({ role: m.role, content: m.content }));
    try {
      await sendMut.mutateAsync({ content: text, history });
    } catch (err) {
      setInput(text);
      console.error(err);
    }
  };

  // Flush a queued first message once a new conversation becomes active.
  useEffect(() => {
    if (activeId && pendingMessage.current) {
      const text = pendingMessage.current;
      pendingMessage.current = null;
      void sendMut.mutateAsync({ content: text, history: [] });
    }
  }, [activeId, sendMut]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget);
      if (activeId === deleteTarget) setActiveId(null);
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col space-y-4">
      <Helmet>
        <title>{t('assistant.title')} — LoveHub</title>
      </Helmet>

      <PageHeader
        title={t('assistant.title')}
        subtitle={t('assistant.subtitle')}
        icon={Sparkles}
        action={
          <Button onClick={startNewConversation} disabled={createMut.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            {t('assistant.newConversation')}
          </Button>
        }
      />

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[280px_1fr]">
        {/* Conversation list */}
        <Card className="hidden flex-col overflow-hidden lg:flex">
          <CardContent className="flex-1 space-y-1 overflow-y-auto p-2 scrollbar-thin">
            {!conversations || conversations.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                {t('assistant.empty')}
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  className={cn(
                    'group flex w-full items-start gap-2 rounded-lg p-2.5 text-left transition-colors',
                    activeId === conv.id ? 'bg-primary/10' : 'hover:bg-muted'
                  )}
                >
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{conv.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {formatRelative(conv.updated_at, dateLocale)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(conv.id);
                    }}
                    className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={t('assistant.deleteChat')}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Chat panel */}
        <Card className="flex flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin sm:p-6">
            {!activeId ? (
              <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-bg text-white shadow-md">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{t('assistant.title')}</h2>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t('assistant.empty')}</p>
                </div>
                <div className="grid w-full max-w-md gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => handleSend(s.prompt)}
                      className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-left text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-muted/40"
                    >
                      <s.icon className="h-4 w-4 shrink-0 text-primary" />
                      {t(s.key)}
                    </button>
                  ))}
                </div>
              </div>
            ) : isLoading ? (
              <InlineLoader label={t('common.loading')} />
            ) : (
              <>
                {messages?.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-bg text-white">
                        <Sparkles className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm sm:max-w-[70%]',
                        msg.role === 'user'
                          ? 'rounded-br-md gradient-bg text-white'
                          : 'rounded-bl-md bg-muted text-foreground'
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
                {sendMut.isPending && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-bg text-white">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                      <ButtonLoader />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {activeId && (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSend();
                }}
                className="flex items-center gap-2 border-t border-border p-3"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('assistant.placeholder')}
                  disabled={sendMut.isPending}
                />
                <Button type="submit" size="icon" disabled={!input.trim() || sendMut.isPending} aria-label={t('assistant.send')}>
                  {sendMut.isPending ? <ButtonLoader /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
              <p className="px-3 pb-2 text-center text-[11px] text-muted-foreground">
                {t('assistant.disclaimer')}
              </p>
            </>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('assistant.deleteChat')}
        confirmLabel={t('common.delete')}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
