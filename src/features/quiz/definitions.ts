import type { TranslationKey } from '@/lib/i18n';

export interface QuizQuestion {
  id: string;
  promptKey: TranslationKey;
  options: { key: string; labelKey: TranslationKey }[];
}

export interface QuizDefinition {
  slug: string;
  questions: QuizQuestion[];
}

export const QUIZ_DEFINITIONS: Record<string, QuizDefinition> = {
  'love-language': {
    slug: 'love-language',
    questions: [
      {
        id: 'q1',
        promptKey: 'quizDefs.loveLanguage.q1.prompt',
        options: [
          { key: 'words', labelKey: 'quizDefs.loveLanguage.q1.words' },
          { key: 'time', labelKey: 'quizDefs.loveLanguage.q1.time' },
          { key: 'gifts', labelKey: 'quizDefs.loveLanguage.q1.gifts' },
          { key: 'service', labelKey: 'quizDefs.loveLanguage.q1.service' },
        ],
      },
      {
        id: 'q2',
        promptKey: 'quizDefs.loveLanguage.q2.prompt',
        options: [
          { key: 'touch', labelKey: 'quizDefs.loveLanguage.q2.touch' },
          { key: 'words', labelKey: 'quizDefs.loveLanguage.q2.words' },
          { key: 'time', labelKey: 'quizDefs.loveLanguage.q2.time' },
          { key: 'service', labelKey: 'quizDefs.loveLanguage.q2.service' },
        ],
      },
      {
        id: 'q3',
        promptKey: 'quizDefs.loveLanguage.q3.prompt',
        options: [
          { key: 'gifts', labelKey: 'quizDefs.loveLanguage.q3.gifts' },
          { key: 'touch', labelKey: 'quizDefs.loveLanguage.q3.touch' },
          { key: 'words', labelKey: 'quizDefs.loveLanguage.q3.words' },
          { key: 'time', labelKey: 'quizDefs.loveLanguage.q3.time' },
        ],
      },
      {
        id: 'q4',
        promptKey: 'quizDefs.loveLanguage.q4.prompt',
        options: [
          { key: 'service', labelKey: 'quizDefs.loveLanguage.q4.service' },
          { key: 'gifts', labelKey: 'quizDefs.loveLanguage.q4.gifts' },
          { key: 'touch', labelKey: 'quizDefs.loveLanguage.q4.touch' },
          { key: 'words', labelKey: 'quizDefs.loveLanguage.q4.words' },
        ],
      },
    ],
  },
  'relationship-checkup': {
    slug: 'relationship-checkup',
    questions: [
      {
        id: 'q1',
        promptKey: 'quizDefs.checkup.q1.prompt',
        options: [
          { key: '5', labelKey: 'quizDefs.checkup.q1.5' },
          { key: '4', labelKey: 'quizDefs.checkup.q1.4' },
          { key: '3', labelKey: 'quizDefs.checkup.q1.3' },
          { key: '2', labelKey: 'quizDefs.checkup.q1.2' },
        ],
      },
      {
        id: 'q2',
        promptKey: 'quizDefs.checkup.q2.prompt',
        options: [
          { key: '5', labelKey: 'quizDefs.checkup.q2.5' },
          { key: '4', labelKey: 'quizDefs.checkup.q2.4' },
          { key: '3', labelKey: 'quizDefs.checkup.q2.3' },
          { key: '2', labelKey: 'quizDefs.checkup.q2.2' },
        ],
      },
      {
        id: 'q3',
        promptKey: 'quizDefs.checkup.q3.prompt',
        options: [
          { key: '5', labelKey: 'quizDefs.checkup.q3.5' },
          { key: '4', labelKey: 'quizDefs.checkup.q3.4' },
          { key: '3', labelKey: 'quizDefs.checkup.q3.3' },
          { key: '2', labelKey: 'quizDefs.checkup.q3.2' },
        ],
      },
    ],
  },
  'couples-trivia': {
    slug: 'couples-trivia',
    questions: [
      {
        id: 'q1',
        promptKey: 'quizDefs.trivia.q1.prompt',
        options: [
          { key: 'a', labelKey: 'quizDefs.trivia.q1.a' },
          { key: 'b', labelKey: 'quizDefs.trivia.q1.b' },
          { key: 'c', labelKey: 'quizDefs.trivia.q1.c' },
          { key: 'd', labelKey: 'quizDefs.trivia.q1.d' },
        ],
      },
      {
        id: 'q2',
        promptKey: 'quizDefs.trivia.q2.prompt',
        options: [
          { key: 'a', labelKey: 'quizDefs.trivia.q2.a' },
          { key: 'b', labelKey: 'quizDefs.trivia.q2.b' },
          { key: 'c', labelKey: 'quizDefs.trivia.q2.c' },
          { key: 'd', labelKey: 'quizDefs.trivia.q2.d' },
        ],
      },
      {
        id: 'q3',
        promptKey: 'quizDefs.trivia.q3.prompt',
        options: [
          { key: 'a', labelKey: 'quizDefs.trivia.q3.a' },
          { key: 'b', labelKey: 'quizDefs.trivia.q3.b' },
          { key: 'c', labelKey: 'quizDefs.trivia.q3.c' },
          { key: 'd', labelKey: 'quizDefs.trivia.q3.d' },
        ],
      },
      {
        id: 'q4',
        promptKey: 'quizDefs.trivia.q4.prompt',
        options: [
          { key: 'a', labelKey: 'quizDefs.trivia.q4.a' },
          { key: 'b', labelKey: 'quizDefs.trivia.q4.b' },
          { key: 'c', labelKey: 'quizDefs.trivia.q4.c' },
          { key: 'd', labelKey: 'quizDefs.trivia.q4.d' },
        ],
      },
    ],
  },
};
