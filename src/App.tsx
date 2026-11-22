import React, { useEffect, useState } from 'react';
import { LESSONS, getLessonBySlug } from './data/lessons';
import { HomeView } from './components/HomeView';
import { LessonView } from './components/LessonView';
import { PracticeMode, PracticeView } from './components/PracticeView';
import { SimTabId, SimulationLab } from './components/SimulationLab';
import {
  FlashcardStatus,
  LearningProgress,
  QuizResultSummary,
  loadProgress,
  recordWrongQuestion,
  saveProgress,
  toggleLessonCompletion,
} from './utils/storage';

type RouteState =
  | { view: 'home' }
  | { view: 'lesson'; slug: string }
  | { view: 'simulation'; tab: SimTabId }
  | { view: 'practice'; mode: PracticeMode; lessonFilter: number };

const VALID_SIM_TABS = new Set<SimTabId>([
  'pin-zn-cu',
  'dien-phan-cuso4',
  'nacl-nong-chay',
  'dien-phan-nacl',
  'faraday',
]);

const VALID_PRACTICE_MODES = new Set<PracticeMode>([
  'theo-bai',
  'de-nhanh',
  'the-ghi-nho',
]);

function parseRouteFromLocation(): RouteState {
  const rawHash = window.location.hash.replace(/^#/, '');
  const candidate = rawHash || window.location.pathname;
  const [pathPart, queryPart = ''] = candidate.split('?');
  const normalizedPath = pathPart.replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(queryPart);

  if (normalizedPath.startsWith('/bai/')) {
    const slug = normalizedPath.slice('/bai/'.length);
    if (getLessonBySlug(slug)) {
      return { view: 'lesson', slug };
    }
    return { view: 'lesson', slug: LESSONS[0].slug };
  }

  if (normalizedPath === '/mo-phong') {
    const tabParam = params.get('tab') as SimTabId | null;
    const tab: SimTabId = tabParam && VALID_SIM_TABS.has(tabParam) ? tabParam : 'pin-zn-cu';
    return { view: 'simulation', tab };
  }

  if (normalizedPath === '/luyen-tap') {
    const modeParam = params.get('mode') as PracticeMode | null;
    const mode: PracticeMode =
      modeParam && VALID_PRACTICE_MODES.has(modeParam) ? modeParam : 'theo-bai';
    const baiParam = Number(params.get('bai') || '0');
    const lessonFilter = baiParam >= 1 && baiParam <= 6 ? baiParam : 0;
    return { view: 'practice', mode, lessonFilter };
  }

  return { view: 'home' };
}

function routeToHash(route: RouteState): string {
  if (route.view === 'home') return '#/';
  if (route.view === 'lesson') return `#/bai/${route.slug}`;
  if (route.view === 'simulation') {
    return route.tab === 'pin-zn-cu' ? '#/mo-phong' : `#/mo-phong?tab=${route.tab}`;
  }
  const params = new URLSearchParams();
  if (route.mode !== 'theo-bai') params.set('mode', route.mode);
  if (route.lessonFilter >= 1 && route.lessonFilter <= 6) {
    params.set('bai', String(route.lessonFilter));
  }
  const qs = params.toString();
  return qs ? `#/luyen-tap?${qs}` : '#/luyen-tap';
}

export default function App() {
  const [route, setRoute] = useState<RouteState>(() => parseRouteFromLocation());
  const [progress, setProgress] = useState<LearningProgress>(() => loadProgress());

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseRouteFromLocation());
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Persist current lesson slug whenever student visits a lesson
  useEffect(() => {
    if (route.view === 'lesson') {
      setProgress((prev) => {
        if (prev.currentLessonSlug === route.slug) return prev;
        const next = { ...prev, currentLessonSlug: route.slug };
        saveProgress(next);
        return next;
      });
    }
  }, [route]);

  const navigate = (next: RouteState) => {
    const targetHash = routeToHash(next);
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    } else {
      setRoute(next);
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleToggleLessonComplete = (slug: string) => {
    setProgress((prev) => {
      const next = toggleLessonCompletion(prev, slug);
      saveProgress(next);
      return next;
    });
  };

  const handleRecordQuestionOutcome = (questionId: string, isCorrect: boolean) => {
    setProgress((prev) => {
      const next = recordWrongQuestion(prev, questionId, isCorrect);
      saveProgress(next);
      return next;
    });
  };

  const handleSaveQuizResult = (result: QuizResultSummary) => {
    setProgress((prev) => {
      const mergedWrong = Array.from(
        new Set([...prev.wrongQuestionIds, ...result.wrongQuestionIds])
      );
      const next: LearningProgress = {
        ...prev,
        lastQuizResult: result,
        wrongQuestionIds: mergedWrong,
      };
      saveProgress(next);
      return next;
    });
  };

  const handleUpdateFlashcard = (cardId: string, status: FlashcardStatus) => {
    setProgress((prev) => {
      const next: LearningProgress = {
        ...prev,
        flashcardStatus: {
          ...prev.flashcardStatus,
          [cardId]: status,
        },
      };
      saveProgress(next);
      return next;
    });
  };

  const activeLesson =
    route.view === 'lesson'
      ? getLessonBySlug(route.slug) ?? LESSONS[0]
      : getLessonBySlug(progress.currentLessonSlug ?? '') ?? LESSONS[0];

  const isLearnActive = route.view === 'lesson';
  const isSimActive = route.view === 'simulation';
  const isPracticeActive = route.view === 'practice';

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      {/* Clean Textbook Top Navigation Bar (1 row on md+, compact 2-row on narrow mobile) */}
      <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur-sm border-b border-rule">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-0 md:h-16 flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-6">
          <a
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              navigate({ view: 'home' });
            }}
            className="font-serif text-lg sm:text-xl font-semibold text-ink hover:text-verdigris transition-colors whitespace-nowrap shrink-0 py-1 md:py-2"
          >
            Pin điện &amp; Điện phân
          </a>

          <nav
            aria-label="Điều hướng chính"
            className="flex items-center justify-between md:justify-end gap-4 sm:gap-7"
          >
            <a
              href={`#/bai/${activeLesson.slug}`}
              onClick={(e) => {
                e.preventDefault();
                navigate({ view: 'lesson', slug: activeLesson.slug });
              }}
              aria-current={isLearnActive ? 'page' : undefined}
              className={`min-h-[44px] inline-flex items-center text-sm sm:text-base whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                isLearnActive
                  ? 'border-verdigris text-verdigris font-semibold'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              Học
            </a>

            <a
              href="#/mo-phong"
              onClick={(e) => {
                e.preventDefault();
                navigate({ view: 'simulation', tab: 'pin-zn-cu' });
              }}
              aria-current={isSimActive ? 'page' : undefined}
              className={`min-h-[44px] inline-flex items-center text-sm sm:text-base whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                isSimActive
                  ? 'border-verdigris text-verdigris font-semibold'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              Phòng mô phỏng
            </a>

            <a
              href="#/luyen-tap"
              onClick={(e) => {
                e.preventDefault();
                navigate({ view: 'practice', mode: 'theo-bai', lessonFilter: 0 });
              }}
              aria-current={isPracticeActive ? 'page' : undefined}
              className={`min-h-[44px] inline-flex items-center text-sm sm:text-base whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                isPracticeActive
                  ? 'border-verdigris text-verdigris font-semibold'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              Luyện tập
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {route.view === 'home' && (
          <HomeView
            progress={progress}
            onOpenLesson={(slug) => navigate({ view: 'lesson', slug })}
            onOpenSimulation={() => navigate({ view: 'simulation', tab: 'pin-zn-cu' })}
            onOpenPractice={() =>
              navigate({ view: 'practice', mode: 'theo-bai', lessonFilter: 0 })
            }
          />
        )}

        {route.view === 'lesson' && (
          <LessonView
            lesson={activeLesson}
            progress={progress}
            onSelectLesson={(slug) => navigate({ view: 'lesson', slug })}
            onToggleComplete={handleToggleLessonComplete}
            onOpenSimulationTab={(tab) => navigate({ view: 'simulation', tab })}
            onOpenLessonPractice={(lessonNumber) =>
              navigate({ view: 'practice', mode: 'theo-bai', lessonFilter: lessonNumber })
            }
          />
        )}

        {route.view === 'simulation' && (
          <SimulationLab
            initialTab={route.tab}
            onTabChange={(tab) => navigate({ view: 'simulation', tab })}
            onOpenLesson={(slug) => navigate({ view: 'lesson', slug })}
          />
        )}

        {route.view === 'practice' && (
          <PracticeView
            key={`${route.mode}-${route.lessonFilter}`}
            initialMode={route.mode}
            initialLessonFilter={route.lessonFilter}
            progress={progress}
            onModeChange={(mode) =>
              navigate({ view: 'practice', mode, lessonFilter: route.lessonFilter })
            }
            onOpenLesson={(slug) => navigate({ view: 'lesson', slug })}
            onRecordQuestionOutcome={handleRecordQuestionOutcome}
            onSaveQuizResult={handleSaveQuizResult}
            onUpdateFlashcard={handleUpdateFlashcard}
          />
        )}
      </main>

      {/* Quiet Textbook / Lab Footer */}
      <footer
        className={
          isSimActive
            ? 'border-t border-[#1F2F35] bg-[#0B1215] text-[#9BB0B5]'
            : 'mt-16 border-t border-rule bg-paper-soft/60 text-ink-muted'
        }
      >
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div>
            Pin điện &amp; Điện phân · Hóa học 12 · Chương 5
          </div>
          <div>
            Nguồn đề cương đầy đủ: trang 1, 2, 3, 4, 6, 7, 9 (trang 5 và 8 chưa đầy đủ).
          </div>
        </div>
      </footer>
    </div>
  );
}
