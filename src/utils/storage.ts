export interface QuizResultSummary {
  score: number;
  total: number;
  completedAt: string;
  wrongQuestionIds: string[];
}

export type FlashcardStatus = 'known' | 'review';

export interface LearningProgress {
  currentLessonSlug: string | null;
  completedLessonSlugs: string[];
  wrongQuestionIds: string[];
  lastQuizResult: QuizResultSummary | null;
  flashcardStatus: Record<string, FlashcardStatus>;
}

const STORAGE_KEY = 'pin_dien_dien_phan_progress_v1';

export const DEFAULT_PROGRESS: LearningProgress = {
  currentLessonSlug: null,
  completedLessonSlugs: [],
  wrongQuestionIds: [],
  lastQuizResult: null,
  flashcardStatus: {},
};

export function loadProgress(): LearningProgress {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ...DEFAULT_PROGRESS };
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<LearningProgress>;
    return {
      currentLessonSlug:
        typeof parsed.currentLessonSlug === 'string' ? parsed.currentLessonSlug : null,
      completedLessonSlugs: Array.isArray(parsed.completedLessonSlugs)
        ? parsed.completedLessonSlugs.filter((x): x is string => typeof x === 'string')
        : [],
      wrongQuestionIds: Array.isArray(parsed.wrongQuestionIds)
        ? parsed.wrongQuestionIds.filter((x): x is string => typeof x === 'string')
        : [],
      lastQuizResult:
        parsed.lastQuizResult &&
        typeof parsed.lastQuizResult.score === 'number' &&
        typeof parsed.lastQuizResult.total === 'number'
          ? parsed.lastQuizResult
          : null,
      flashcardStatus:
        parsed.flashcardStatus && typeof parsed.flashcardStatus === 'object'
          ? parsed.flashcardStatus
          : {},
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(progress: LearningProgress): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore quota or storage restriction errors silently
  }
}

export function toggleLessonCompletion(
  progress: LearningProgress,
  lessonSlug: string
): LearningProgress {
  const exists = progress.completedLessonSlugs.includes(lessonSlug);
  const completedLessonSlugs = exists
    ? progress.completedLessonSlugs.filter((id) => id !== lessonSlug)
    : [...progress.completedLessonSlugs, lessonSlug];
  return { ...progress, completedLessonSlugs };
}

export function recordWrongQuestion(
  progress: LearningProgress,
  questionId: string,
  isCorrect: boolean
): LearningProgress {
  const set = new Set(progress.wrongQuestionIds);
  if (isCorrect) {
    set.delete(questionId);
  } else {
    set.add(questionId);
  }
  return { ...progress, wrongQuestionIds: Array.from(set) };
}
