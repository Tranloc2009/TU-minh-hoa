import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  FlaskConical,
} from 'lucide-react';
import { LESSONS, LessonData } from '../data/lessons';
import { LearningProgress } from '../utils/storage';
import { AlphaRuleDiagram } from './AlphaRuleDiagram';
import { ChemText } from './ChemText';
import { PotentialsTable } from './PotentialsTable';
import { SimTabId } from './SimulationLab';

interface LessonViewProps {
  lesson: LessonData;
  progress: LearningProgress;
  onSelectLesson: (slug: string) => void;
  onToggleComplete: (slug: string) => void;
  onOpenSimulationTab: (tab: SimTabId) => void;
  onOpenLessonPractice: (lessonNumber: number) => void;
}

export const LessonView: React.FC<LessonViewProps> = ({
  lesson,
  progress,
  onSelectLesson,
  onToggleComplete,
  onOpenSimulationTab,
  onOpenLessonPractice,
}) => {
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [showOpeningAnswer, setShowOpeningAnswer] = useState(false);
  const [selfCheckAnswers, setSelfCheckAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    setShowOpeningAnswer(false);
    setSelfCheckAnswers({});
    setMobileTocOpen(false);
  }, [lesson.slug]);

  const isCompleted = progress.completedLessonSlugs.includes(lesson.slug);
  const prevLesson = LESSONS.find((l) => l.number === lesson.number - 1);
  const nextLesson = LESSONS.find((l) => l.number === lesson.number + 1);

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Mobile Collapsible TOC Button */}
      <div className="lg:hidden mb-6">
        <button
          type="button"
          aria-expanded={mobileTocOpen}
          aria-controls="mobile-lesson-toc"
          onClick={() => setMobileTocOpen((v) => !v)}
          className="w-full min-h-[44px] px-4 py-2.5 bg-paper-soft border border-rule text-ink text-sm font-medium flex items-center justify-between cursor-pointer"
        >
          <span className="inline-flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-verdigris" aria-hidden="true" />
            <span>Mục lục 6 bài học (Đang xem Bài {lesson.number})</span>
          </span>
          {mobileTocOpen ? (
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        {mobileTocOpen && (
          <nav
            id="mobile-lesson-toc"
            aria-label="Mục lục bài học"
            className="mt-2 bg-paper-soft border border-rule divide-y divide-rule"
          >
            {LESSONS.map((item) => {
              const active = item.slug === lesson.slug;
              const done = progress.completedLessonSlugs.includes(item.slug);
              return (
                <a
                  key={item.slug}
                  href={`#/bai/${item.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectLesson(item.slug);
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={`min-h-[44px] px-4 py-2.5 flex items-center justify-between gap-2 text-sm ${
                    active ? 'bg-verdigris-tint font-semibold text-ink' : 'text-ink hover:bg-paper'
                  }`}
                >
                  <span>
                    <span className="font-mono text-copper mr-2">0{item.number}</span>
                    {item.title}
                  </span>
                  {done && <Check className="w-4 h-4 text-verdigris shrink-0" aria-label="Đã hoàn thành" />}
                </a>
              );
            })}
          </nav>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Desktop Sidebar TOC */}
        <aside className="hidden lg:block lg:col-span-3 lg:sticky lg:top-24">
          <div className="text-xs font-semibold text-ink-muted mb-3">
            Chương 5 · 6 bài học
          </div>
          <nav aria-label="Mục lục 6 bài học" className="border-t border-rule divide-y divide-rule">
            {LESSONS.map((item) => {
              const active = item.slug === lesson.slug;
              const done = progress.completedLessonSlugs.includes(item.slug);
              return (
                <a
                  key={item.slug}
                  href={`#/bai/${item.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectLesson(item.slug);
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={`py-3 px-2.5 flex items-start justify-between gap-2 text-sm transition-colors ${
                    active
                      ? 'bg-paper-soft text-verdigris font-semibold'
                      : 'text-ink-muted hover:text-ink hover:bg-paper-soft/60'
                  }`}
                >
                  <span className="leading-snug">
                    <span className="font-mono text-xs text-copper mr-2">0{item.number}</span>
                    {item.shortTitle}
                  </span>
                  {done && (
                    <Check
                      className="w-4 h-4 text-verdigris shrink-0 mt-0.5"
                      aria-label="Đã hoàn thành"
                    />
                  )}
                </a>
              );
            })}
          </nav>

          <div className="mt-6 pt-5 border-t border-rule space-y-2 text-sm">
            <button
              type="button"
              onClick={() => onOpenLessonPractice(lesson.number)}
              className="text-verdigris hover:text-verdigris-dark underline underline-offset-4 cursor-pointer text-left"
            >
              Luyện tập riêng Bài {lesson.number} →
            </button>
          </div>
        </aside>

        {/* Main Lesson Article */}
        <article className="lg:col-span-9 max-w-[74ch]">
          {/* Header */}
          <header className="pb-6 border-b border-rule">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
              <span className="font-mono text-copper font-semibold">Bài 0{lesson.number}</span>
              <span aria-hidden="true">·</span>
              <span>{lesson.sourcePages}</span>
              {isCompleted && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-verdigris font-medium">Đã hoàn thành</span>
                </>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-ink font-serif mt-2 leading-tight">
              {lesson.title}
            </h1>
            <p className="text-base sm:text-lg text-ink-muted mt-3">
              {lesson.summary}
            </p>
          </header>

          {/* 1. Opening Question */}
          <section
            aria-labelledby="opening-question-heading"
            className="my-8 bg-paper-soft border border-rule p-5 sm:p-6"
          >
            <h2 id="opening-question-heading" className="text-lg font-semibold text-ink font-serif">
              Câu hỏi mở đầu
            </h2>
            <p className="text-base text-ink mt-2">
              <ChemText text={lesson.openingQuestion.prompt} />
            </p>
            <div className="mt-4">
              <button
                type="button"
                aria-expanded={showOpeningAnswer}
                onClick={() => setShowOpeningAnswer((v) => !v)}
                className="min-h-[44px] py-2 text-sm font-medium text-verdigris hover:text-verdigris-dark underline underline-offset-4 cursor-pointer"
              >
                {showOpeningAnswer ? 'Ẩn gợi ý trả lời' : 'Xem gợi ý định hướng'}
              </button>
              {showOpeningAnswer && (
                <p className="mt-3 pt-3 border-t border-rule text-base text-ink-muted leading-relaxed">
                  <ChemText text={lesson.openingQuestion.guidingAnswer} />
                </p>
              )}
            </div>
          </section>

          {/* 2. Core Knowledge Blocks */}
          <div className="space-y-9">
            {lesson.coreBlocks.map((block, idx) => (
              <section key={idx} className="space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-2xl font-semibold text-ink font-serif">
                    <ChemText text={block.heading} />
                  </h2>
                  {block.tag && (
                    <span className="text-xs font-medium text-copper">
                      {block.tag}
                    </span>
                  )}
                </div>

                {block.paragraphs.map((p, pIdx) => (
                  <p key={pIdx} className="text-base text-ink leading-relaxed">
                    <ChemText text={p} />
                  </p>
                ))}

                {block.equations && (
                  <div className="bg-paper-soft border border-rule p-4 sm:p-5 space-y-3">
                    {block.equations.map((eq, eIdx) => (
                      <div
                        key={eIdx}
                        className={eIdx > 0 ? 'pt-3 border-t border-rule/70' : ''}
                      >
                        {eq.label && (
                          <div className="text-xs font-medium text-ink-muted mb-1">
                            <ChemText text={eq.label} />
                          </div>
                        )}
                        <div className="font-mono text-sm sm:text-base font-medium text-ink overflow-x-auto whitespace-pre-wrap break-words">
                          <ChemText text={eq.formula} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {block.bullets && (
                  <ul className="space-y-2.5 pl-5 list-disc marker:text-copper text-base text-ink">
                    {block.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="leading-relaxed">
                        <ChemText text={b} />
                      </li>
                    ))}
                  </ul>
                )}

                {block.table && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-ink-muted mb-2">
                      {block.table.caption}
                    </p>
                    <div className="overflow-x-auto border border-rule">
                      <table className="w-full min-w-[540px] text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-paper-muted border-b border-rule text-ink">
                            {block.table.headers.map((h, hIdx) => (
                              <th key={hIdx} scope="col" className="py-3 px-3.5 font-semibold">
                                <ChemText text={h} />
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rule bg-paper-soft">
                          {block.table.rows.map((row, rIdx) => (
                            <tr key={rIdx}>
                              {row.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className={`py-3 px-3.5 align-top ${
                                    cIdx === 0 ? 'font-medium text-ink' : 'text-ink'
                                  }`}
                                >
                                  <ChemText text={cell} />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Embedded Interactive Exhibits for Lesson 2 (E° Table) & Lesson 3 (Alpha Diagram) */}
          {lesson.number === 2 && <PotentialsTable />}
          {lesson.number === 3 && <AlphaRuleDiagram />}

          {/* Direct Link to Simulation or Faraday Calculator */}
          {lesson.simulationLink && (
            <div className="my-8 p-5 bg-verdigris-tint/60 border border-verdigris/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <FlaskConical className="w-5 h-5 text-verdigris shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <div className="text-base font-semibold text-ink">Thực hành trực tiếp</div>
                  <p className="text-sm text-ink-muted">
                    Kiểm chứng ngay cơ chế và số liệu vừa học trong Phòng mô phỏng tương tác.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenSimulationTab(lesson.simulationLink!.tab)}
                className="min-h-[44px] px-4 py-2 bg-verdigris hover:bg-verdigris-dark text-white text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {lesson.simulationLink.label}
              </button>
            </div>
          )}

          {/* 3. Worked Examples */}
          <section aria-labelledby="worked-examples-heading" className="my-10 space-y-6">
            <h2 id="worked-examples-heading" className="text-2xl font-semibold text-ink font-serif">
              Ví dụ giải từng bước
            </h2>

            {lesson.workedExamples.map((ex, idx) => (
              <div key={idx} className="bg-paper-soft border border-rule p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-rule">
                  <h3 className="text-lg font-semibold text-ink font-serif">
                    <ChemText text={ex.title} />
                  </h3>
                  {ex.tag && (
                    <span className="text-xs font-medium text-verdigris">{ex.tag}</span>
                  )}
                </div>

                <p className="text-base text-ink font-medium leading-relaxed">
                  <ChemText text={ex.statement} />
                </p>

                <ol className="space-y-4 pt-1">
                  {ex.steps.map((st, sIdx) => (
                    <li key={sIdx} className="space-y-1.5">
                      <div className="text-sm font-semibold text-verdigris">
                        <ChemText text={st.label} />
                      </div>
                      <p className="text-base text-ink leading-relaxed whitespace-pre-line">
                        <ChemText text={st.detail} />
                      </p>
                      {st.equation && (
                        <div className="bg-paper border border-rule px-3.5 py-2.5 font-mono text-sm text-ink whitespace-pre-line overflow-x-auto">
                          <ChemText text={st.equation} />
                        </div>
                      )}
                    </li>
                  ))}
                </ol>

                <div className="pt-3 border-t border-rule text-base text-ink">
                  <strong className="text-ink">Kết luận: </strong>
                  <ChemText text={ex.conclusion} />
                </div>
              </div>
            ))}
          </section>

          {/* 4. Pitfalls ("Dễ nhầm") */}
          <section aria-labelledby="pitfalls-heading" className="my-10 space-y-4">
            <h2 id="pitfalls-heading" className="text-2xl font-semibold text-ink font-serif">
              Dễ nhầm
            </h2>
            <div className="border border-rule bg-paper-soft divide-y divide-rule">
              {lesson.pitfalls.map((item, idx) => (
                <div key={idx} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-copper mb-1">Lỗi thường gặp</div>
                    <p className="text-base text-ink">
                      <ChemText text={item.mistake} />
                    </p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-verdigris mb-1">Cách hiểu đúng</div>
                    <p className="text-base text-ink">
                      <ChemText text={item.correction} />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Three Inline Self-Checks */}
          <section aria-labelledby="self-check-heading" className="my-10 space-y-5">
            <div>
              <h2 id="self-check-heading" className="text-2xl font-semibold text-ink font-serif">
                Tự kiểm tra nhanh (3 câu)
              </h2>
              <p className="text-sm text-ink-muted mt-1">
                Chọn đáp án để đối chiếu ngay lời giải cho Bài {lesson.number}.
              </p>
            </div>

            <div className="space-y-5">
              {lesson.selfChecks.map((sc, qIdx) => {
                const chosen = selfCheckAnswers[sc.id];
                const hasAnswered = chosen !== undefined;
                const isRight = chosen === sc.correctIndex;

                return (
                  <div key={sc.id} className="bg-paper-soft border border-rule p-5 space-y-3.5">
                    <p className="text-base font-medium text-ink">
                      <span className="font-mono text-copper mr-2">Câu {qIdx + 1}.</span>
                      <ChemText text={sc.question} />
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {sc.options.map((opt, oIdx) => {
                        const isPicked = chosen === oIdx;
                        const isCorrectOpt = oIdx === sc.correctIndex;
                        let btnClass =
                          'bg-paper border-rule text-ink hover:border-verdigris';
                        if (hasAnswered) {
                          if (isPicked && isCorrectOpt) {
                            btnClass = 'bg-verdigris-tint border-verdigris text-ink font-medium';
                          } else if (isPicked && !isCorrectOpt) {
                            btnClass = 'bg-copper-tint border-copper text-ink font-medium';
                          } else if (isCorrectOpt) {
                            btnClass = 'bg-verdigris-tint/50 border-verdigris text-ink';
                          }
                        }

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() =>
                              setSelfCheckAnswers((prev) => ({ ...prev, [sc.id]: oIdx }))
                            }
                            className={`min-h-[44px] px-3.5 py-2.5 text-left text-sm sm:text-base border transition-colors cursor-pointer ${btnClass}`}
                          >
                            <ChemText text={opt} />
                          </button>
                        );
                      })}
                    </div>

                    {hasAnswered && (
                      <div className="pt-3 border-t border-rule text-sm leading-relaxed" role="status">
                        <strong className={isRight ? 'text-verdigris' : 'text-copper'}>
                          {isRight ? 'Chính xác. ' : 'Chưa đúng. '}
                        </strong>
                        <ChemText text={sc.explanation} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 6. Source Provenance + Explicit Student Completion Toggle + Next Lesson */}
          <footer className="mt-12 pt-6 border-t border-rule space-y-6">
            <div className="text-sm text-ink-muted space-y-1">
              <p>
                <strong className="text-ink">Nguồn biên soạn:</strong> {lesson.sourcePages}.
              </p>
              {lesson.sourceNote && <p>{lesson.sourceNote}</p>}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-rule">
              <button
                type="button"
                aria-pressed={isCompleted}
                onClick={() => onToggleComplete(lesson.slug)}
                className={`min-h-[46px] px-5 py-2.5 text-sm sm:text-base font-medium border inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                  isCompleted
                    ? 'bg-verdigris-tint border-verdigris text-verdigris'
                    : 'bg-paper-soft border-rule-strong text-ink hover:border-verdigris hover:text-verdigris'
                }`}
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>
                  {isCompleted ? 'Đã hoàn thành bài này (nhấn để bỏ)' : 'Đánh dấu đã hoàn thành'}
                </span>
              </button>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                {prevLesson && (
                  <a
                    href={`#/bai/${prevLesson.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectLesson(prevLesson.slug);
                    }}
                    className="min-h-[44px] py-2 text-sm sm:text-base text-ink-muted hover:text-ink inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    <span>Bài {prevLesson.number}</span>
                  </a>
                )}

                {nextLesson ? (
                  <button
                    type="button"
                    onClick={() => onSelectLesson(nextLesson.slug)}
                    className="min-h-[46px] px-5 py-2.5 bg-verdigris hover:bg-verdigris-dark text-white text-sm sm:text-base font-medium inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>Bài kế tiếp: Bài {nextLesson.number}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenLessonPractice(0)}
                    className="min-h-[46px] px-5 py-2.5 bg-verdigris hover:bg-verdigris-dark text-white text-sm sm:text-base font-medium inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>Sang khu vực Luyện tập</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
};
