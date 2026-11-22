import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { LESSONS, getLessonBySlug } from '../data/lessons';
import { LearningProgress } from '../utils/storage';
import { HeroCellDiagram } from './HeroCellDiagram';

interface HomeViewProps {
  progress: LearningProgress;
  onOpenLesson: (slug: string) => void;
  onOpenSimulation: () => void;
  onOpenPractice: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  progress,
  onOpenLesson,
  onOpenSimulation,
  onOpenPractice,
}) => {
  const savedLesson = progress.currentLessonSlug
    ? getLessonBySlug(progress.currentLessonSlug)
    : undefined;

  const primaryLessonSlug = savedLesson ? savedLesson.slug : LESSONS[0].slug;
  const primaryCtaLabel = savedLesson ? 'Tiếp tục bài đang học' : 'Bắt đầu học';

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Asymmetric Two-Column Hero */}
      <section className="py-10 sm:py-14 lg:py-16 border-b border-rule">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-5">
            <p className="text-sm font-medium text-ink-muted tracking-wide">
              Hóa học 12 · Chương 5
            </p>
            <h1 className="text-4xl sm:text-5xl font-semibold text-ink font-serif leading-[1.15]">
              Pin điện &amp; Điện phân
            </h1>
            <p className="text-base sm:text-lg text-ink-muted leading-relaxed">
              Hiểu rõ đường đi của electron và ion, phân biệt dấu điện cực giữa pin với bình điện phân, dự đoán sản phẩm và giải bài toán Faraday theo từng bước.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
              <button
                type="button"
                onClick={() => onOpenLesson(primaryLessonSlug)}
                className="min-h-[48px] px-6 py-3 bg-verdigris hover:bg-verdigris-dark text-white text-base font-medium inline-flex items-center gap-2.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>{primaryCtaLabel}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onOpenSimulation}
                className="min-h-[44px] py-2 text-base font-medium text-verdigris hover:text-verdigris-dark underline underline-offset-4 decoration-verdigris/40 hover:decoration-verdigris transition-colors cursor-pointer whitespace-nowrap"
              >
                Mở phòng mô phỏng
              </button>
            </div>

            {savedLesson && (
              <p className="text-sm text-ink-muted">
                Đang lưu: Bài {savedLesson.number} — {savedLesson.title}
              </p>
            )}
          </div>

          <div className="lg:col-span-7">
            <HeroCellDiagram />
          </div>
        </div>
      </section>

      {/* Numbered 6-Lesson Curriculum Index */}
      <section aria-labelledby="chapter-toc-heading" className="py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-6 border-b border-rule">
          <div>
            <h2 id="chapter-toc-heading" className="text-2xl sm:text-3xl font-semibold text-ink font-serif">
              Nội dung 6 bài học
            </h2>
            <p className="text-base text-ink-muted mt-1">
              Biên soạn theo thứ tự đề cương Chương 5, mỗi bài kèm ví dụ giải từng bước và câu tự kiểm tra.
            </p>
          </div>
          {progress.completedLessonSlugs.length > 0 && (
            <p className="text-sm font-mono text-verdigris tabular-nums">
              Đã hoàn thành {progress.completedLessonSlugs.length}/6 bài
            </p>
          )}
        </div>

        <ol className="divide-y divide-rule">
          {LESSONS.map((lesson) => {
            const isCompleted = progress.completedLessonSlugs.includes(lesson.slug);
            const isCurrent = progress.currentLessonSlug === lesson.slug;

            return (
              <li key={lesson.slug}>
                <a
                  href={`#/bai/${lesson.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenLesson(lesson.slug);
                  }}
                  className="group py-5 sm:py-6 flex items-start sm:items-center justify-between gap-4 hover:bg-paper-soft/70 transition-colors -mx-3 px-3"
                >
                  <div className="flex items-baseline gap-4 sm:gap-6 min-w-0">
                    <span className="font-mono text-lg sm:text-xl font-semibold text-copper tabular-nums shrink-0">
                      0{lesson.number}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-ink font-serif group-hover:text-verdigris transition-colors">
                        {lesson.title}
                      </h3>
                      <p className="text-base text-ink-muted mt-1">
                        {lesson.summary}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                        <span>{lesson.sourcePages}</span>
                        {isCurrent && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-copper font-medium">Đang học</span>
                          </>
                        )}
                        {isCompleted && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-verdigris font-medium inline-flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              Đã hoàn thành
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight
                    className="w-5 h-5 text-ink-muted group-hover:text-verdigris group-hover:translate-x-0.5 transition-all shrink-0 mt-1 sm:mt-0"
                    aria-hidden="true"
                  />
                </a>
              </li>
            );
          })}
        </ol>

        {/* Quiet secondary practice & source note */}
        <div className="mt-10 pt-8 border-t border-rule grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-7 text-sm text-ink-muted leading-relaxed">
            <h3 className="text-base font-semibold text-ink font-serif mb-1.5">
              Ghi chú nguồn biên soạn
            </h3>
            <p>
              Nội dung được biên soạn theo thứ tự các trang đề cương đầy đủ gồm trang 1, 2, 3, 4, 6 (trùng lặp trong tập ảnh gốc), 7 và 9; đã lược bỏ tên cá nhân và dựng lại toàn bộ công thức, bảng biểu, sơ đồ. Trang 5 và trang 8 chỉ xuất hiện một phần ở mép ảnh nên các mục bổ trợ cho phần khuyết và bài tập mở rộng đều được gắn nhãn rõ “Kiến thức bổ sung” hoặc “Ví dụ tự luyện”.
            </p>
          </div>

          <div className="md:col-span-5 md:text-right space-y-2">
            <p className="text-sm text-ink-muted">
              {progress.lastQuizResult
                ? `Kết quả đề nhanh gần nhất: ${progress.lastQuizResult.score}/${progress.lastQuizResult.total} câu đúng.`
                : 'Sẵn sàng kiểm tra kiến thức với 36 câu hỏi và 16 thẻ ghi nhớ?'}
            </p>
            <button
              type="button"
              onClick={onOpenPractice}
              className="min-h-[44px] py-2 text-base font-medium text-verdigris hover:text-verdigris-dark underline underline-offset-4 decoration-verdigris/40 hover:decoration-verdigris cursor-pointer"
            >
              Chuyển sang khu vực Luyện tập →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
