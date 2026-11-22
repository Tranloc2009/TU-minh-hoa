import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, RotateCcw } from 'lucide-react';
import { LESSONS } from '../data/lessons';
import { FLASHCARDS, PRACTICE_QUESTIONS, PracticeQuestion } from '../data/practice';
import { buildBalancedQuiz, checkNumericAnswer } from '../utils/chemistry';
import { formatViNumber } from '../utils/faraday';
import { FlashcardStatus, LearningProgress, QuizResultSummary } from '../utils/storage';
import { ChemText } from './ChemText';

export type PracticeMode = 'theo-bai' | 'de-nhanh' | 'the-ghi-nho';

interface PracticeViewProps {
  initialMode: PracticeMode;
  initialLessonFilter: number; // 0 = all
  progress: LearningProgress;
  onModeChange: (mode: PracticeMode) => void;
  onOpenLesson: (slug: string) => void;
  onRecordQuestionOutcome: (questionId: string, isCorrect: boolean) => void;
  onSaveQuizResult: (result: QuizResultSummary) => void;
  onUpdateFlashcard: (cardId: string, status: FlashcardStatus) => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  initialMode,
  initialLessonFilter,
  progress,
  onModeChange,
  onOpenLesson,
  onRecordQuestionOutcome,
  onSaveQuizResult,
  onUpdateFlashcard,
}) => {
  const [mode, setMode] = useState<PracticeMode>(initialMode);

  // --- Mode 1: Theo bài ---
  const [lessonFilter, setLessonFilter] = useState<number>(initialLessonFilter);
  const [practiceInputs, setPracticeInputs] = useState<Record<string, string>>({});
  const [practiceSubmitted, setPracticeSubmitted] = useState<
    Record<string, { isCorrect: boolean; invalidNumeric?: boolean }>
  >({});

  // --- Mode 2: Đề kiểm tra nhanh (12 câu) ---
  const [quizQuestions, setQuizQuestions] = useState<PracticeQuestion[]>(() =>
    buildBalancedQuiz(PRACTICE_QUESTIONS)
  );
  const [quizCurrentIndex, setQuizCurrentIndex] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [isRetryWrongMode, setIsRetryWrongMode] = useState<boolean>(false);

  // --- Mode 3: Thẻ ghi nhớ ---
  const [cardFilter, setCardFilter] = useState<'all' | 'review'>('all');
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const handleSwitchMode = (next: PracticeMode) => {
    setMode(next);
    onModeChange(next);
  };

  // Filtered questions for "Theo bài"
  const filteredPracticeQuestions = useMemo(() => {
    if (lessonFilter === -1) {
      // Only saved wrong questions
      return PRACTICE_QUESTIONS.filter((q) => progress.wrongQuestionIds.includes(q.id));
    }
    if (lessonFilter === 0) return PRACTICE_QUESTIONS;
    return PRACTICE_QUESTIONS.filter((q) => q.lessonNumber === lessonFilter);
  }, [lessonFilter, progress.wrongQuestionIds]);

  const gradeQuestion = (q: PracticeQuestion, rawVal: string | undefined): { valid: boolean; isCorrect: boolean } => {
    if (q.type === 'numeric') {
      const check = checkNumericAnswer(rawVal ?? '', q.numericAnswer ?? 0, q.tolerance ?? 0.01);
      return { valid: check.valid, isCorrect: check.isCorrect };
    }
    if (rawVal === undefined || rawVal === '') {
      return { valid: false, isCorrect: false };
    }
    return { valid: true, isCorrect: Number(rawVal) === q.correctIndex };
  };

  const handleCheckPracticeQuestion = (q: PracticeQuestion) => {
    const val = practiceInputs[q.id];
    const graded = gradeQuestion(q, val);
    if (!graded.valid) {
      setPracticeSubmitted((prev) => ({
        ...prev,
        [q.id]: { isCorrect: false, invalidNumeric: q.type === 'numeric' },
      }));
      return;
    }
    setPracticeSubmitted((prev) => ({
      ...prev,
      [q.id]: { isCorrect: graded.isCorrect, invalidNumeric: false },
    }));
    onRecordQuestionOutcome(q.id, graded.isCorrect);
  };

  // --- Quick Quiz handlers ---
  const handleSubmitQuiz = () => {
    let score = 0;
    const wrongIds: string[] = [];

    quizQuestions.forEach((q) => {
      const graded = gradeQuestion(q, quizAnswers[q.id]);
      if (graded.isCorrect) {
        score += 1;
        onRecordQuestionOutcome(q.id, true);
      } else {
        wrongIds.push(q.id);
        onRecordQuestionOutcome(q.id, false);
      }
    });

    setQuizSubmitted(true);
    onSaveQuizResult({
      score,
      total: quizQuestions.length,
      completedAt: new Date().toISOString(),
      wrongQuestionIds: wrongIds,
    });
  };

  const handleStartNewQuiz = () => {
    setQuizQuestions(buildBalancedQuiz(PRACTICE_QUESTIONS));
    setQuizAnswers({});
    setQuizCurrentIndex(0);
    setQuizSubmitted(false);
    setIsRetryWrongMode(false);
  };

  const handleRetryWrongQuizQuestions = () => {
    const wrongList = quizQuestions.filter((q) => !gradeQuestion(q, quizAnswers[q.id]).isCorrect);
    if (wrongList.length === 0) return;
    setQuizQuestions(wrongList);
    setQuizAnswers({});
    setQuizCurrentIndex(0);
    setQuizSubmitted(false);
    setIsRetryWrongMode(true);
  };

  // --- Flashcards derived list ---
  const visibleCards = useMemo(() => {
    if (cardFilter === 'review') {
      return FLASHCARDS.filter((c) => progress.flashcardStatus[c.id] === 'review');
    }
    return FLASHCARDS;
  }, [cardFilter, progress.flashcardStatus]);

  const safeCardIndex =
    visibleCards.length > 0 ? Math.min(cardIndex, visibleCards.length - 1) : 0;
  const activeCard = visibleCards[safeCardIndex] ?? null;

  const knownCount = FLASHCARDS.filter((c) => progress.flashcardStatus[c.id] === 'known').length;
  const reviewCount = FLASHCARDS.filter((c) => progress.flashcardStatus[c.id] === 'review').length;

  const currentQuizQuestion = quizQuestions[quizCurrentIndex];
  const answeredQuizCount = quizQuestions.filter((q) => {
    const val = quizAnswers[q.id];
    return val !== undefined && val.trim() !== '';
  }).length;

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <header className="mb-6">
        <p className="text-sm text-ink-muted">Hóa học 12 · Chương 5</p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-ink font-serif mt-1">
          Luyện tập &amp; Ôn thi nhanh
        </h1>
        <p className="text-base text-ink-muted mt-2 max-w-3xl">
          Luyện theo từng bài học (36 câu hỏi trắc nghiệm, đúng/sai và tính số), làm đề kiểm tra nhanh 12 câu hoặc ôn nhanh bằng 16 thẻ ghi nhớ.
        </p>
      </header>

      {/* Mode Selector Tabs */}
      <div
        className="flex flex-wrap gap-2 border-b border-rule pb-4 mb-8"
        role="tablist"
        aria-label="Chế độ luyện tập"
      >
        {(
          [
            { id: 'theo-bai', label: 'Theo bài (36 câu)' },
            { id: 'de-nhanh', label: 'Đề kiểm tra nhanh (12 câu)' },
            { id: 'the-ghi-nho', label: 'Thẻ ghi nhớ (16 thẻ)' },
          ] as { id: PracticeMode; label: string }[]
        ).map((tab) => {
          const active = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleSwitchMode(tab.id)}
              className={`min-h-[44px] px-4 py-2 text-sm sm:text-base font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-verdigris text-white border-verdigris'
                  : 'bg-paper-soft text-ink border-rule hover:border-verdigris hover:text-verdigris'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ==================== MODE 1: THEO BÀI ==================== */}
      {mode === 'theo-bai' && (
        <section aria-label="Luyện tập theo bài" className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={lessonFilter === 0}
              onClick={() => setLessonFilter(0)}
              className={`min-h-[44px] px-3.5 py-2 text-sm font-medium border cursor-pointer whitespace-nowrap ${
                lessonFilter === 0
                  ? 'bg-verdigris-tint border-verdigris text-ink'
                  : 'bg-paper-soft border-rule text-ink-muted hover:text-ink'
              }`}
            >
              Tất cả 6 bài ({PRACTICE_QUESTIONS.length})
            </button>

            {LESSONS.map((l) => (
              <button
                key={l.number}
                type="button"
                aria-pressed={lessonFilter === l.number}
                onClick={() => setLessonFilter(l.number)}
                className={`min-h-[44px] px-3.5 py-2 text-sm font-medium border cursor-pointer whitespace-nowrap ${
                  lessonFilter === l.number
                    ? 'bg-verdigris-tint border-verdigris text-ink'
                    : 'bg-paper-soft border-rule text-ink-muted hover:text-ink'
                }`}
              >
                Bài {l.number}
              </button>
            ))}

            {progress.wrongQuestionIds.length > 0 && (
              <button
                type="button"
                aria-pressed={lessonFilter === -1}
                onClick={() => setLessonFilter(-1)}
                className={`min-h-[44px] px-3.5 py-2 text-sm font-medium border cursor-pointer whitespace-nowrap ${
                  lessonFilter === -1
                    ? 'bg-copper-tint border-copper text-copper'
                    : 'bg-paper-soft border-rule text-copper hover:border-copper'
                }`}
              >
                Câu đã làm sai ({progress.wrongQuestionIds.length})
              </button>
            )}
          </div>

          {filteredPracticeQuestions.length === 0 ? (
            <div className="bg-paper-soft border border-rule p-6 text-base text-ink-muted">
              Hiện chưa có câu sai nào cần ôn lại trong mục này.
            </div>
          ) : (
            <div className="space-y-5">
              {filteredPracticeQuestions.map((q, index) => {
                const inputVal = practiceInputs[q.id] ?? '';
                const result = practiceSubmitted[q.id];

                return (
                  <article
                    key={q.id}
                    className="bg-paper-soft border border-rule p-5 sm:p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
                      <span>
                        <strong className="text-copper font-mono mr-2">#{index + 1}</strong>
                        {q.lessonTitle}
                        <span aria-hidden="true"> · </span>
                        {q.type === 'mcq'
                          ? 'Trắc nghiệm'
                          : q.type === 'tf'
                          ? 'Đúng / Sai'
                          : 'Tính số'}
                      </span>
                      {q.sourceLabel && <span>{q.sourceLabel}</span>}
                    </div>

                    <p className="text-base font-medium text-ink leading-relaxed">
                      <ChemText text={q.prompt} />
                    </p>

                    {q.type === 'numeric' ? (
                      <div className="space-y-2 max-w-md">
                        <div className="flex items-stretch gap-2">
                          <label htmlFor={`prac-num-${q.id}`} className="sr-only">
                            Nhập đáp án số ({q.unit})
                          </label>
                          <input
                            id={`prac-num-${q.id}`}
                            type="text"
                            inputMode="decimal"
                            value={inputVal}
                            onChange={(e) => {
                              setPracticeInputs((prev) => ({ ...prev, [q.id]: e.target.value }));
                              if (practiceSubmitted[q.id]) {
                                setPracticeSubmitted((prev) => {
                                  const copy = { ...prev };
                                  delete copy[q.id];
                                  return copy;
                                });
                              }
                            }}
                            placeholder="Nhập số (dùng dấu , hoặc .)"
                            className="flex-1 min-h-[44px] px-3 py-2 bg-paper border border-rule font-mono text-base text-ink focus:border-verdigris focus:outline-none"
                          />
                          {q.unit && (
                            <span className="min-h-[44px] px-3 flex items-center bg-paper-muted border border-rule font-mono text-sm text-ink">
                              {q.unit}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCheckPracticeQuestion(q)}
                            className="min-h-[44px] px-4 py-2 bg-verdigris hover:bg-verdigris-dark text-white text-sm font-medium cursor-pointer whitespace-nowrap"
                          >
                            Kiểm tra
                          </button>
                        </div>
                        {q.roundingNote && (
                          <p className="text-xs text-ink-muted">{q.roundingNote}</p>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options?.map((opt, optIdx) => {
                          const isSelected = inputVal === String(optIdx);
                          const isCorrectOpt = optIdx === q.correctIndex;
                          let cls = 'bg-paper border-rule text-ink hover:border-verdigris';
                          if (result) {
                            if (isSelected && isCorrectOpt) {
                              cls = 'bg-verdigris-tint border-verdigris text-ink font-medium';
                            } else if (isSelected && !isCorrectOpt) {
                              cls = 'bg-copper-tint border-copper text-ink font-medium';
                            } else if (isCorrectOpt) {
                              cls = 'bg-verdigris-tint/50 border-verdigris text-ink';
                            }
                          } else if (isSelected) {
                            cls = 'bg-verdigris-tint/60 border-verdigris text-ink';
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => {
                                const valStr = String(optIdx);
                                setPracticeInputs((prev) => ({ ...prev, [q.id]: valStr }));
                                const isCorrect = optIdx === q.correctIndex;
                                setPracticeSubmitted((prev) => ({
                                  ...prev,
                                  [q.id]: { isCorrect },
                                }));
                                onRecordQuestionOutcome(q.id, isCorrect);
                              }}
                              className={`min-h-[44px] px-3.5 py-2.5 text-left text-sm sm:text-base border transition-colors cursor-pointer ${cls}`}
                            >
                              <ChemText text={opt} />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Feedback Area */}
                    {result && (
                      <div
                        className="pt-3.5 border-t border-rule text-sm space-y-2 leading-relaxed"
                        role="status"
                      >
                        {result.invalidNumeric ? (
                          <p className="text-copper font-medium">
                            Giá trị vừa nhập chưa đúng định dạng số. Hãy nhập số bằng dấu chấm (.) hoặc dấu phẩy (,), ví dụ: 0,635.
                          </p>
                        ) : result.isCorrect ? (
                          <p className="text-ink">
                            <strong className="text-verdigris">Chính xác. </strong>
                            <ChemText text={q.explanation} />
                          </p>
                        ) : (
                          <>
                            <p className="text-ink">
                              <strong className="text-copper">Chưa chính xác. </strong>
                              <ChemText text={q.wrongHint} />
                            </p>
                            <p className="text-ink-muted">
                              <strong className="text-ink">Lời giải: </strong>
                              <ChemText text={q.explanation} />
                              {q.type === 'numeric' && q.numericAnswer !== undefined && (
                                <span className="font-mono text-ink font-semibold ml-1">
                                  (Đáp án: {formatViNumber(q.numericAnswer, { maxDecimals: 5 })} {q.unit})
                                </span>
                              )}
                            </p>
                            <div>
                              <a
                                href={`#/bai/${q.lessonSlug}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  onOpenLesson(q.lessonSlug);
                                }}
                                className="text-verdigris hover:text-verdigris-dark underline underline-offset-4 font-medium"
                              >
                                Xem lại {q.lessonTitle} →
                              </a>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ==================== MODE 2: ĐỀ KIỂM TRA NHANH (12 CÂU) ==================== */}
      {mode === 'de-nhanh' && (
        <section aria-label="Đề kiểm tra nhanh" className="space-y-6">
          {!quizSubmitted && currentQuizQuestion ? (
            <div className="bg-paper-soft border border-rule p-5 sm:p-6 space-y-6">
              {/* Top status & navigator */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-rule">
                <div>
                  <h2 className="text-xl font-semibold text-ink font-serif">
                    {isRetryWrongMode
                      ? `Làm lại các câu sai (${quizQuestions.length} câu)`
                      : 'Đề kiểm tra nhanh 12 câu (đủ 6 bài)'}
                  </h2>
                  <p className="text-sm text-ink-muted mt-0.5">
                    Đã trả lời {answeredQuizCount}/{quizQuestions.length} câu · Có thể quay lại sửa đáp án trước khi nộp bài.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="min-h-[44px] px-5 py-2 bg-verdigris hover:bg-verdigris-dark text-white text-sm font-medium cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  Nộp bài ({answeredQuizCount}/{quizQuestions.length})
                </button>
              </div>

              {/* Question Number Jump Strip */}
              <div className="flex flex-wrap gap-2" aria-label="Chuyển nhanh giữa các câu hỏi">
                {quizQuestions.map((q, idx) => {
                  const isCurrent = idx === quizCurrentIndex;
                  const isAnswered = Boolean(quizAnswers[q.id]?.trim());
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setQuizCurrentIndex(idx)}
                      aria-current={isCurrent ? 'step' : undefined}
                      aria-label={`Câu ${idx + 1}${isAnswered ? ', đã trả lời' : ', chưa trả lời'}`}
                      className={`min-w-[44px] min-h-[44px] font-mono text-sm font-medium border cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-verdigris text-white border-verdigris'
                          : isAnswered
                          ? 'bg-verdigris-tint border-verdigris/60 text-ink'
                          : 'bg-paper border-rule text-ink-muted hover:text-ink'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Active Question Card */}
              <div className="pt-2 space-y-4">
                <div className="text-xs text-ink-muted">
                  Câu {quizCurrentIndex + 1} / {quizQuestions.length} · {currentQuizQuestion.lessonTitle}
                </div>
                <p className="text-lg font-medium text-ink leading-relaxed">
                  <ChemText text={currentQuizQuestion.prompt} />
                </p>

                {currentQuizQuestion.type === 'numeric' ? (
                  <div className="max-w-sm space-y-2">
                    <div className="flex items-stretch gap-2">
                      <label htmlFor="quiz-numeric-input" className="sr-only">
                        Nhập kết quả câu {quizCurrentIndex + 1}
                      </label>
                      <input
                        id="quiz-numeric-input"
                        type="text"
                        inputMode="decimal"
                        value={quizAnswers[currentQuizQuestion.id] ?? ''}
                        onChange={(e) =>
                          setQuizAnswers((prev) => ({
                            ...prev,
                            [currentQuizQuestion.id]: e.target.value,
                          }))
                        }
                        placeholder="Nhập số (chấp nhận . hoặc ,)"
                        className="flex-1 min-h-[44px] px-3 py-2 bg-paper border border-rule font-mono text-base text-ink focus:border-verdigris focus:outline-none"
                      />
                      {currentQuizQuestion.unit && (
                        <span className="min-h-[44px] px-3 flex items-center bg-paper-muted border border-rule font-mono text-sm text-ink">
                          {currentQuizQuestion.unit}
                        </span>
                      )}
                    </div>
                    {currentQuizQuestion.roundingNote && (
                      <p className="text-xs text-ink-muted">{currentQuizQuestion.roundingNote}</p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentQuizQuestion.options?.map((opt, optIdx) => {
                      const selected = quizAnswers[currentQuizQuestion.id] === String(optIdx);
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          aria-pressed={selected}
                          onClick={() =>
                            setQuizAnswers((prev) => ({
                              ...prev,
                              [currentQuizQuestion.id]: String(optIdx),
                            }))
                          }
                          className={`min-h-[48px] px-4 py-3 text-left text-base border transition-colors cursor-pointer ${
                            selected
                              ? 'bg-verdigris-tint border-verdigris text-ink font-medium'
                              : 'bg-paper border-rule text-ink hover:border-verdigris'
                          }`}
                        >
                          <ChemText text={opt} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Prev / Next Footer */}
              <div className="pt-4 border-t border-rule flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={quizCurrentIndex === 0}
                  onClick={() => setQuizCurrentIndex((i) => Math.max(0, i - 1))}
                  className="min-h-[44px] px-4 py-2 bg-paper border border-rule text-sm font-medium text-ink disabled:opacity-40 inline-flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Câu trước</span>
                </button>

                {quizCurrentIndex < quizQuestions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setQuizCurrentIndex((i) => Math.min(quizQuestions.length - 1, i + 1))
                    }
                    className="min-h-[44px] px-4 py-2 bg-paper border border-rule-strong hover:border-verdigris text-sm font-medium text-ink inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Câu kế tiếp</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitQuiz}
                    className="min-h-[44px] px-5 py-2 bg-verdigris hover:bg-verdigris-dark text-white text-sm font-medium cursor-pointer"
                  >
                    Nộp bài
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Quiz Submitted Review Screen */
            (() => {
              const gradedItems = quizQuestions.map((q) => ({
                q,
                raw: quizAnswers[q.id] ?? '',
                ...gradeQuestion(q, quizAnswers[q.id]),
              }));
              const score = gradedItems.filter((g) => g.isCorrect).length;
              const wrongCount = gradedItems.length - score;

              return (
                <div className="space-y-6">
                  <div className="bg-paper-soft border border-rule p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-ink-muted">Kết quả bài làm</p>
                      <h2 className="text-3xl font-semibold text-ink font-serif mt-1 tabular-nums">
                        {score} / {gradedItems.length} câu đúng
                      </h2>
                      <p className="text-sm text-ink-muted mt-1">
                        {wrongCount === 0
                          ? 'Bạn đã trả lời đúng tất cả các câu trong lượt này.'
                          : `Có ${wrongCount} câu cần xem lại lời giải và kiến thức liên quan bên dưới.`}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {wrongCount > 0 && (
                        <button
                          type="button"
                          onClick={handleRetryWrongQuizQuestions}
                          className="min-h-[44px] px-5 py-2.5 bg-verdigris hover:bg-verdigris-dark text-white text-sm font-medium cursor-pointer whitespace-nowrap"
                        >
                          Làm lại câu sai ({wrongCount})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleStartNewQuiz}
                        className="min-h-[44px] px-4 py-2.5 bg-paper border border-rule-strong hover:border-ink text-ink text-sm font-medium inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                      >
                        <RotateCcw className="w-4 h-4" aria-hidden="true" />
                        <span>Tạo đề 12 câu mới</span>
                      </button>
                    </div>
                  </div>

                  {/* Detailed Solution Review */}
                  <div className="space-y-4">
                    {gradedItems.map(({ q, raw, isCorrect }, idx) => (
                      <div
                        key={q.id}
                        className="bg-paper-soft border border-rule p-5 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-ink-muted">
                            Câu {idx + 1} · {q.lessonTitle}
                          </span>
                          <span
                            className={`font-semibold ${
                              isCorrect ? 'text-verdigris' : 'text-copper'
                            }`}
                          >
                            {isCorrect ? 'Đúng' : 'Sai / Chưa làm'}
                          </span>
                        </div>

                        <p className="text-base font-medium text-ink">
                          <ChemText text={q.prompt} />
                        </p>

                        <div className="text-sm text-ink-muted space-y-1">
                          <div>
                            Câu trả lời của bạn:{' '}
                            <strong className="text-ink">
                              {raw === ''
                                ? '(Bỏ trống)'
                                : q.type === 'numeric'
                                ? `${raw} ${q.unit ?? ''}`
                                : <ChemText text={q.options?.[Number(raw)] ?? ''} />}
                            </strong>
                          </div>
                          <div>
                            Đáp án đúng:{' '}
                            <strong className="text-verdigris">
                              {q.type === 'numeric' && q.numericAnswer !== undefined
                                ? `${formatViNumber(q.numericAnswer, { maxDecimals: 5 })} ${q.unit ?? ''}`
                                : <ChemText text={q.options?.[q.correctIndex ?? 0] ?? ''} />}
                            </strong>
                          </div>
                        </div>

                        <p className="text-sm text-ink pt-2 border-t border-rule leading-relaxed">
                          <strong className="text-ink">Lời giải: </strong>
                          <ChemText text={q.explanation} />
                        </p>

                        {!isCorrect && (
                          <div className="text-sm">
                            <a
                              href={`#/bai/${q.lessonSlug}`}
                              onClick={(e) => {
                                e.preventDefault();
                                onOpenLesson(q.lessonSlug);
                              }}
                              className="text-verdigris hover:text-verdigris-dark underline underline-offset-4 font-medium"
                            >
                              Ôn lại {q.lessonTitle} →
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()
          )}
        </section>
      )}

      {/* ==================== MODE 3: THẺ GHI NHỚ ==================== */}
      {mode === 'the-ghi-nho' && (
        <section aria-label="Thẻ ghi nhớ" className="max-w-2xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-pressed={cardFilter === 'all'}
                onClick={() => {
                  setCardFilter('all');
                  setCardIndex(0);
                  setIsFlipped(false);
                }}
                className={`min-h-[44px] px-3.5 py-2 text-sm font-medium border cursor-pointer ${
                  cardFilter === 'all'
                    ? 'bg-verdigris-tint border-verdigris text-ink'
                    : 'bg-paper-soft border-rule text-ink-muted hover:text-ink'
                }`}
              >
                Tất cả ({FLASHCARDS.length})
              </button>
              <button
                type="button"
                aria-pressed={cardFilter === 'review'}
                onClick={() => {
                  setCardFilter('review');
                  setCardIndex(0);
                  setIsFlipped(false);
                }}
                className={`min-h-[44px] px-3.5 py-2 text-sm font-medium border cursor-pointer ${
                  cardFilter === 'review'
                    ? 'bg-copper-tint border-copper text-copper'
                    : 'bg-paper-soft border-rule text-ink-muted hover:text-ink'
                }`}
              >
                Cần ôn lại ({reviewCount})
              </button>
            </div>

            <div className="text-sm text-ink-muted font-mono tabular-nums">
              Đã nhớ: {knownCount}/{FLASHCARDS.length}
            </div>
          </div>

          {!activeCard ? (
            <div className="bg-paper-soft border border-rule p-8 text-center space-y-3">
              <p className="text-base text-ink">
                Không có thẻ nào trong danh sách “Cần ôn lại”.
              </p>
              <button
                type="button"
                onClick={() => setCardFilter('all')}
                className="min-h-[44px] px-4 py-2 text-sm font-medium text-verdigris underline underline-offset-4 cursor-pointer"
              >
                Xem toàn bộ {FLASHCARDS.length} thẻ ghi nhớ
              </button>
            </div>
          ) : (
            <div className="bg-paper-soft border border-rule p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between text-xs text-ink-muted pb-3 border-b border-rule">
                <span>
                  {activeCard.category} · Thẻ {safeCardIndex + 1}/{visibleCards.length}
                </span>
                <span>
                  {progress.flashcardStatus[activeCard.id] === 'known'
                    ? 'Trạng thái: Đã nhớ'
                    : progress.flashcardStatus[activeCard.id] === 'review'
                    ? 'Trạng thái: Cần ôn lại'
                    : 'Chưa đánh dấu'}
                </span>
              </div>

              <div className="min-h-[190px] flex flex-col justify-center space-y-4">
                {!isFlipped ? (
                  <>
                    <div className="text-xs font-semibold text-copper">Câu hỏi (Mặt trước)</div>
                    <p className="text-xl sm:text-2xl font-serif font-medium text-ink leading-snug">
                      <ChemText text={activeCard.front} />
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-xs font-semibold text-verdigris">Đáp án (Mặt sau)</div>
                    <p className="text-base sm:text-lg text-ink whitespace-pre-line leading-relaxed">
                      <ChemText text={activeCard.back} />
                    </p>
                    <p className="text-sm text-ink-muted pt-3 border-t border-rule">
                      <strong className="text-ink">Mẹo nhớ: </strong>
                      <ChemText text={activeCard.tip} />
                    </p>
                  </>
                )}
              </div>

              {/* Flashcard Action Controls */}
              <div className="pt-4 border-t border-rule flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsFlipped((f) => !f)}
                  className="min-h-[44px] px-5 py-2.5 bg-verdigris hover:bg-verdigris-dark text-white text-sm font-medium cursor-pointer whitespace-nowrap"
                >
                  {isFlipped ? 'Xem lại mặt trước' : 'Lật thẻ'}
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateFlashcard(activeCard.id, 'review');
                      setIsFlipped(false);
                      setCardIndex((i) => (i + 1) % visibleCards.length);
                    }}
                    className="min-h-[44px] px-4 py-2 bg-paper border border-copper text-copper hover:bg-copper-tint text-sm font-medium cursor-pointer whitespace-nowrap"
                  >
                    Ôn lại
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateFlashcard(activeCard.id, 'known');
                      setIsFlipped(false);
                      setCardIndex((i) => (i + 1) % visibleCards.length);
                    }}
                    className="min-h-[44px] px-4 py-2 bg-paper border border-verdigris text-verdigris hover:bg-verdigris-tint text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>Đã nhớ</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFlipped(false);
                      setCardIndex((i) => (i - 1 + visibleCards.length) % visibleCards.length);
                    }}
                    className="min-h-[44px] py-2 text-ink-muted hover:text-ink cursor-pointer whitespace-nowrap"
                  >
                    ← Thẻ trước
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFlipped(false);
                      setCardIndex((i) => (i + 1) % visibleCards.length);
                    }}
                    className="min-h-[44px] py-2 text-ink-muted hover:text-ink cursor-pointer whitespace-nowrap"
                  >
                    Thẻ kế tiếp →
                  </button>
                </div>
                <div className="text-center text-sm">
                  <a
                    href={`#/bai/${activeCard.lessonSlug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenLesson(activeCard.lessonSlug);
                    }}
                    className="inline-flex items-center min-h-[44px] text-verdigris hover:text-verdigris-dark underline underline-offset-4"
                  >
                    Xem bài học liên quan
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
