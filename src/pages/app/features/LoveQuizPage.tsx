import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Sparkles, ArrowRight, ArrowLeft, RotateCcw, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useT, type TranslationKey } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import {
  useQuizzes,
  useQuizResults,
  useSaveQuizResult,
} from '@/features/quiz/useQuiz';
import { QUIZ_DEFINITIONS } from '@/features/quiz/definitions';
import type { LoveQuiz } from '@/types/database';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { InlineLoader, ButtonLoader } from '@/components/ui/loader';
import { cn } from '@/lib/utils';

export function LoveQuizPage() {
  const t = useT();
  const { data: quizzes, isLoading } = useQuizzes();
  const { data: results } = useQuizResults();
  const { session } = useAuth();
  const saveMut = useSaveQuizResult();
  const [active, setActive] = useState<LoveQuiz | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('loveQuiz.title')} subtitle={t('loveQuiz.subtitle')} icon={HelpCircle} />
        <InlineLoader label={t('common.loading')} />
      </div>
    );
  }

  if (active) {
    return (
      <QuizRunner
        quiz={active}
        onExit={() => setActive(null)}
        saving={saveMut.isPending}
        onSave={async (answers, score) => {
          try {
            await saveMut.mutateAsync({ quizId: active.id, answers, score });
            toast.success(t('toast.saved'));
            setActive(null);
          } catch (err) {
            toast.error(t('errors.generic'));
            console.error(err);
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Helmet>
        <title>{t('loveQuiz.title')} — LoveHub</title>
      </Helmet>
      <PageHeader title={t('loveQuiz.title')} subtitle={t('loveQuiz.subtitle')} icon={HelpCircle} />

      {!quizzes || quizzes.length === 0 ? (
        <EmptyState icon={HelpCircle} title={t('loveQuiz.empty')} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz, idx) => {
            const def = QUIZ_DEFINITIONS[quiz.slug];
            const myResult = results?.find((r) => r.quiz_id === quiz.id && r.user_id === session?.user.id);
            const partnerResult = results?.find((r) => r.quiz_id === quiz.id && r.user_id !== session?.user.id);
            return (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.3) }}
              >
                <Card className="flex h-full flex-col">
                  <CardHeader>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <CardTitle className="mt-3">{quiz.title}</CardTitle>
                    {quiz.description && <CardDescription>{quiz.description}</CardDescription>}
                  </CardHeader>
                  <CardContent className="mt-auto space-y-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={cn('rounded-full px-2.5 py-0.5', myResult ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground')}>
                        {t('common.you')}: {myResult ? (myResult.score ?? '—') : t('loveQuiz.notTaken')}
                      </span>
                      <span className={cn('rounded-full px-2.5 py-0.5', partnerResult ? 'bg-info/15 text-info' : 'bg-muted text-muted-foreground')}>
                        {t('common.partner')}: {partnerResult ? (partnerResult.score ?? '—') : t('loveQuiz.notTaken')}
                      </span>
                    </div>
                    <Button className="w-full" onClick={() => setActive(quiz)} disabled={!def}>
                      {myResult ? <RotateCcw className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      {myResult ? t('loveQuiz.retake') : t('loveQuiz.start')}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuizRunner({
  quiz,
  onExit,
  onSave,
  saving,
}: {
  quiz: LoveQuiz;
  onExit: () => void;
  onSave: (answers: Record<string, unknown>, score: number | null) => Promise<void>;
  saving: boolean;
}) {
  const t = useT();
  const def = QUIZ_DEFINITIONS[quiz.slug];
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (!def) {
    return null;
  }

  const total = def.questions.length;
  const question = def.questions[current];
  const isLast = current === total - 1;
  const answered = Object.keys(answers).length;

  const select = (key: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: key }));
  };

  const next = () => {
    if (current < total - 1) setCurrent((c) => c + 1);
  };

  const prev = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  const finish = async () => {
    // Score: count of answered questions (trivia/checkup) or top language (love-language).
    let score: number | null = answered;
    if (quiz.slug === 'love-language') {
      const counts: Record<string, number> = {};
      Object.values(answers).forEach((k) => {
        counts[k] = (counts[k] ?? 0) + 1;
      });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      score = top ? top[1] : null;
    }
    await onSave(answers, score);
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>{quiz.title} — LoveHub</title>
      </Helmet>
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onExit}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>
        <p className="text-sm text-muted-foreground">
          {t('loveQuiz.question', { current: current + 1, total })}
        </p>
      </div>

      {/* Progress */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full gradient-bg"
          initial={{ width: 0 }}
          animate={{ width: `${((current + 1) / total) * 100}%` }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <Card>
        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold text-foreground">
                {t(question.promptKey as TranslationKey)}
              </h2>
              <div className="mt-6 space-y-2.5">
                {question.options.map((opt) => {
                  const selected = answers[question.id] === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => select(opt.key)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm font-medium transition-all',
                        selected
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/40'
                      )}
                    >
                      <span>{t(opt.labelKey as TranslationKey)}</span>
                      {selected && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={prev} disabled={current === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.previous')}
        </Button>
        {isLast ? (
          <Button onClick={finish} disabled={answered < total || saving}>
            {saving && <ButtonLoader className="mr-2" />}
            {t('loveQuiz.finish')}
          </Button>
        ) : (
          <Button onClick={next} disabled={!answers[question.id]}>
            {t('loveQuiz.next')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
