import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Eye,
  FlaskConical,
  List,
  Microscope,
  Sparkles,
} from 'lucide-react';
import {
  BOARD_MODULES,
  BoardEquationLink,
  BoardModule,
  MicroZoneId,
} from '../../utils/labWorldState';
import { LabExperimentId, LabObjectId } from '../../utils/lab3dState';
import { ChemText } from '../ChemText';

export interface SmartBoardPanelProps {
  activeModuleIndex: number;
  completedLessonSlugs: string[];
  onSelectModule: (index: number) => void;
  onToggleLessonComplete: (slug: string) => void;
  onObserveModel: (target: {
    station: LabExperimentId;
    objectId?: LabObjectId;
    cuso4Variant?: 'cuso4-inert' | 'cuso4-copper';
    naclVariant?: 'nacl-molten' | 'nacl-brine';
  }) => void;
  onObserveMicro: (target: {
    station: LabExperimentId;
    microZone: MicroZoneId;
    cuso4Variant?: 'cuso4-inert' | 'cuso4-copper';
    naclVariant?: 'nacl-molten' | 'nacl-brine';
  }) => void;
  onBackToRoom: () => void;
}

export const SmartBoardPanel: React.FC<SmartBoardPanelProps> = ({
  activeModuleIndex,
  completedLessonSlugs,
  onSelectModule,
  onToggleLessonComplete,
  onObserveModel,
  onObserveMicro,
  onBackToRoom,
}) => {
  const safeIndex = Math.max(0, Math.min(BOARD_MODULES.length - 1, activeModuleIndex));
  const mod: BoardModule = BOARD_MODULES[safeIndex];

  const [selectedEqId, setSelectedEqId] = useState<string | null>(mod.equations[0]?.id ?? null);
  const [showModuleDrawer, setShowModuleDrawer] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showPitfalls, setShowPitfalls] = useState(false);

  const activeEq: BoardEquationLink | null =
    mod.equations.find((e) => e.id === selectedEqId) ?? mod.equations[0] ?? null;

  const isCompleted = completedLessonSlugs.includes(mod.lessonSlug);

  const goModule = (nextIdx: number) => {
    const clamped = Math.max(0, Math.min(BOARD_MODULES.length - 1, nextIdx));
    onSelectModule(clamped);
    setSelectedEqId(BOARD_MODULES[clamped].equations[0]?.id ?? null);
    setShowExamples(false);
    setShowPitfalls(false);
    setShowModuleDrawer(false);
  };

  return (
    <div
      role="region"
      aria-label="Bảng giảng dạy thông minh Hóa học 12"
      data-testid="smart-board-panel"
      className="absolute inset-2 sm:inset-4 z-30 flex flex-col rounded-xl border-2 border-[#78D4C4]/75 bg-[#0F1E22]/96 text-[#EDF4F1] shadow-2xl overflow-hidden"
    >
      {/* Top Board Bezel Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-2.5 border-b border-[#253D43] bg-[#0B1619]">
        <div className="flex items-center gap-2.5 min-w-0">
          <BookOpen className="w-5 h-5 text-[#78D4C4] shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#78D4C4]">
              Bảng học 3D · Bài {mod.order}/{BOARD_MODULES.length}
            </div>
            <h2
              className="font-serif text-sm sm:text-base font-semibold truncate"
              style={{ color: '#EDF4F1' }}
            >
              <ChemText text={mod.title} />
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowModuleDrawer((v) => !v)}
            aria-expanded={showModuleDrawer}
            className="lg:hidden min-h-[40px] px-2.5 rounded border border-[#324D54] bg-[#14252A] text-xs font-medium text-[#EDF4F1] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <List className="w-4 h-4 text-[#78D4C4]" />
            Mục lục
          </button>

          <button
            type="button"
            onClick={() => onToggleLessonComplete(mod.lessonSlug)}
            aria-pressed={isCompleted}
            className={`min-h-[40px] px-3 rounded border text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              isCompleted
                ? 'border-[#78D4C4] bg-[#183838] text-[#78D4C4]'
                : 'border-[#324D54] bg-[#14252A] text-[#C8D8D7] hover:border-[#78D4C4]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">{isCompleted ? 'Đã nắm vững' : 'Đánh dấu đã học'}</span>
          </button>

          <button
            type="button"
            data-testid="board-back-room-btn"
            onClick={onBackToRoom}
            className="min-h-[40px] px-3 rounded border border-[#324D54] bg-[#14252A] text-xs sm:text-sm font-medium text-[#EDF4F1] hover:border-[#78D4C4] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Compass className="w-4 h-4 text-[#78D4C4]" />
            Về phòng
          </button>
        </div>
      </div>

      {/* Main Split Area: Left Module Index (Desktop) + Active Lesson Surface */}
      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        {/* Desktop Sidebar / Mobile Drawer */}
        <aside
          aria-label="Danh sách 10 chủ đề bài giảng"
          className={`${
            showModuleDrawer
              ? 'absolute inset-y-0 left-0 z-20 w-72 shadow-2xl'
              : 'hidden lg:flex'
          } lg:w-64 xl:w-72 shrink-0 flex-col border-r border-[#24393F] bg-[#0D1A1E] overflow-y-auto p-2.5 space-y-1`}
        >
          <div className="px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-[#8CA4A6]">
            Chương 5 · 10 Mô-đun
          </div>
          {BOARD_MODULES.map((item, idx) => {
            const active = idx === safeIndex;
            const done = completedLessonSlugs.includes(item.lessonSlug);
            return (
              <button
                key={item.id}
                type="button"
                data-testid={`board-module-${item.order}`}
                onClick={() => goModule(idx)}
                className={`w-full min-h-[44px] text-left px-3 py-2 rounded-lg border text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                  active
                    ? 'border-[#78D4C4] bg-[#163237] text-[#EDF4F1] font-semibold'
                    : 'border-transparent bg-transparent text-[#B8CAC9] hover:bg-[#13252A] hover:text-[#EDF4F1]'
                }`}
              >
                <span className="truncate">
                  <ChemText text={item.shortTitle} />
                </span>
                {done && <CheckCircle2 className="w-3.5 h-3.5 text-[#78D4C4] shrink-0" />}
              </button>
            );
          })}
        </aside>

        {/* Scrollable Board Lesson Body */}
        <div className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
          {/* Summary Banner */}
          <div className="rounded-lg border border-[#29434A] bg-[#13252A] p-3.5 space-y-2">
            <p className="text-sm text-[#D7E6E4] leading-relaxed">
              <ChemText text={mod.summary} />
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                data-testid="board-observe-model-btn"
                onClick={() =>
                  onObserveModel({
                    station: mod.observeTarget.station,
                    objectId: mod.observeTarget.objectId,
                    cuso4Variant: mod.observeTarget.cuso4Variant,
                    naclVariant: mod.observeTarget.naclVariant,
                  })
                }
                className="min-h-[44px] px-4 rounded-lg bg-[#78D4C4] text-[#10191C] font-semibold text-xs sm:text-sm hover:bg-[#93E3D5] transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <FlaskConical className="w-4 h-4" />
                Quan sát trên mô hình
              </button>

              <button
                type="button"
                data-testid="board-observe-micro-btn"
                onClick={() =>
                  onObserveMicro({
                    station: mod.observeTarget.station,
                    microZone: mod.observeTarget.microZone,
                    cuso4Variant: mod.observeTarget.cuso4Variant,
                    naclVariant: mod.observeTarget.naclVariant,
                  })
                }
                className="min-h-[44px] px-4 rounded-lg border border-[#C77B4C] bg-[#261B15] text-[#F5D3BE] font-semibold text-xs sm:text-sm hover:bg-[#33231B] transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <Microscope className="w-4 h-4 text-[#E3A678]" />
                Quan sát vi mô
              </button>
            </div>
          </div>

          {/* Interactive Step-by-Step Equations */}
          {mod.equations.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#78D4C4]">
                <Sparkles className="w-3.5 h-3.5" />
                Phương trình tương tác · Chạm từng bước để xem giải thích &amp; mô hình
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {mod.equations.map((eq) => {
                  const selected = activeEq?.id === eq.id;
                  return (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => setSelectedEqId(eq.id)}
                      className={`text-left rounded-lg border p-3 transition-colors cursor-pointer space-y-1 ${
                        selected
                          ? 'border-[#78D4C4] bg-[#163137]'
                          : 'border-[#273E44] bg-[#112024] hover:border-[#4F7880]'
                      }`}
                    >
                      <div className="text-[11px] font-mono text-[#E3A678]">{eq.label}</div>
                      <div className="text-sm sm:text-base font-mono font-semibold text-[#EDF4F1] break-words">
                        <ChemText text={eq.formula} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {activeEq && (
                <div className="rounded-lg border border-[#78D4C4]/50 bg-[#0D1A1E] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-sm text-[#D7E6E4] leading-relaxed">
                    <ChemText text={activeEq.explanation} />
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onObserveModel({
                          station: activeEq.station,
                          objectId: activeEq.highlightObject,
                          cuso4Variant: mod.observeTarget.cuso4Variant,
                          naclVariant: mod.observeTarget.naclVariant,
                        })
                      }
                      className="min-h-[40px] px-3 rounded border border-[#78D4C4]/70 bg-[#152D32] text-xs font-semibold text-[#78D4C4] hover:bg-[#1E3F45] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Soi điện cực
                    </button>
                    {activeEq.microZone && (
                      <button
                        type="button"
                        onClick={() =>
                          onObserveMicro({
                            station: activeEq.station,
                            microZone: activeEq.microZone!,
                            cuso4Variant: mod.observeTarget.cuso4Variant,
                            naclVariant: mod.observeTarget.naclVariant,
                          })
                        }
                        className="min-h-[40px] px-3 rounded border border-[#C77B4C]/70 bg-[#251B15] text-xs font-semibold text-[#F5D3BE] hover:bg-[#33241C] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Microscope className="w-3.5 h-3.5" />
                        Vi mô
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Real Core Syllabus Content Blocks */}
          <div className="space-y-4">
            {mod.blocks.map((block, bIdx) => (
              <section
                key={bIdx}
                className="rounded-lg border border-[#23383E] bg-[#112024]/90 p-4 space-y-2.5"
              >
                <h3
                  className="font-serif text-base font-semibold"
                  style={{ color: '#78D4C4' }}
                >
                  <ChemText text={block.heading} />
                </h3>

                {block.paragraphs?.map((p, pIdx) => (
                  <p key={pIdx} className="text-sm text-[#D1E0DF] leading-relaxed">
                    <ChemText text={p} />
                  </p>
                ))}

                {block.equations && block.equations.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {block.equations.map((eq, fIdx) => (
                      <div
                        key={fIdx}
                        className="rounded bg-[#0A1417] border border-[#263F46] px-3 py-2 font-mono text-xs sm:text-sm text-[#EDF4F1] overflow-x-auto"
                      >
                        {eq.label && (
                          <div className="font-sans text-[11px] text-[#78D4C4] mb-0.5">
                            <ChemText text={eq.label} />
                          </div>
                        )}
                        <ChemText text={eq.formula} />
                      </div>
                    ))}
                  </div>
                )}

                {block.bullets && block.bullets.length > 0 && (
                  <ul className="space-y-1.5 text-sm text-[#C8D8D7] list-disc pl-5">
                    {block.bullets.map((b, i) => (
                      <li key={i} className="leading-relaxed">
                        <ChemText text={b} />
                      </li>
                    ))}
                  </ul>
                )}

                {block.table && (
                  <div className="overflow-x-auto pt-1">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-[#2D484F] text-[#78D4C4]">
                          {block.table.headers.map((h, hi) => (
                            <th key={hi} className="py-2 pr-3 font-semibold whitespace-nowrap">
                              <ChemText text={h} />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E3137] text-[#D7E6E4]">
                        {block.table.rows.map((row, ri) => (
                          <tr key={ri}>
                            {row.map((cell, ci) => (
                              <td key={ci} className="py-2 pr-3 align-top">
                                <ChemText text={cell} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {block.tag && (
                  <div className="rounded border-l-4 border-[#C77B4C] bg-[#1E1A17] px-3 py-1.5 text-xs text-[#F3D7C2]">
                    <span className="font-semibold text-[#E3A678]">{block.tag}</span>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Expandable Worked Examples & Pitfalls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mod.workedExamples.length > 0 && (
              <div className="rounded-lg border border-[#263E44] bg-[#101E22] p-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowExamples((v) => !v)}
                  aria-expanded={showExamples}
                  className="w-full min-h-[40px] flex items-center justify-between text-left text-sm font-semibold text-[#78D4C4] cursor-pointer"
                >
                  <span>Ví dụ có lời giải ({mod.workedExamples.length})</span>
                  <span className="text-xs font-mono">{showExamples ? 'Thu gọn' : 'Mở xem'}</span>
                </button>
                {showExamples && (
                  <div className="space-y-3 pt-2 border-t border-[#1E3338] text-xs sm:text-sm">
                    {mod.workedExamples.map((ex, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="font-semibold text-[#EDF4F1]">
                          <ChemText text={ex.title} />
                        </div>
                        <p className="text-[#C8D8D7]">
                          <ChemText text={ex.statement} />
                        </p>
                        <ol className="list-decimal pl-5 space-y-1.5 text-[#B7CCCA]">
                          {ex.steps.map((s, si) => (
                            <li key={si}>
                              <strong className="text-[#EDF4F1]">
                                <ChemText text={s.label} />:
                              </strong>{' '}
                              <ChemText text={s.detail} />
                              {s.equation && (
                                <div className="mt-0.5 font-mono text-[#78D4C4]">
                                  <ChemText text={s.equation} />
                                </div>
                              )}
                            </li>
                          ))}
                        </ol>
                        <div className="rounded bg-[#0A1417] px-2.5 py-1.5 text-[#78D4C4] font-medium">
                          Kết luận: <ChemText text={ex.conclusion} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mod.pitfalls.length > 0 && (
              <div className="rounded-lg border border-[#433025] bg-[#1C1815] p-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowPitfalls((v) => !v)}
                  aria-expanded={showPitfalls}
                  className="w-full min-h-[40px] flex items-center justify-between text-left text-sm font-semibold text-[#E3A678] cursor-pointer"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Lỗi sai hay gặp ({mod.pitfalls.length})
                  </span>
                  <span className="text-xs font-mono">{showPitfalls ? 'Thu gọn' : 'Mở xem'}</span>
                </button>
                {showPitfalls && (
                  <div className="space-y-2.5 pt-2 border-t border-[#36261E] text-xs sm:text-sm">
                    {mod.pitfalls.map((pf, i) => (
                      <div key={i} className="space-y-0.5">
                        <div className="text-[#F09B8E]">
                          ✕ <ChemText text={pf.mistake} />
                        </div>
                        <div className="text-[#9BE3D5]">
                          ✓ <ChemText text={pf.correction} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-[11px] font-mono text-[#7E9699] pb-1">
            Nguồn: {mod.sourcePages}
          </div>
        </div>
      </div>

      {/* Bottom Board Navigation Footer */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5 border-t border-[#253D43] bg-[#0B1619]">
        <button
          type="button"
          disabled={safeIndex === 0}
          onClick={() => goModule(safeIndex - 1)}
          className="min-h-[44px] px-3 sm:px-4 rounded border border-[#324D54] bg-[#14252A] text-xs sm:text-sm font-medium text-[#EDF4F1] hover:border-[#78D4C4] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Bài trước
        </button>

        <span className="text-xs font-mono text-[#9CB3B5]">
          {safeIndex + 1} / {BOARD_MODULES.length}
        </span>

        <button
          type="button"
          disabled={safeIndex === BOARD_MODULES.length - 1}
          onClick={() => goModule(safeIndex + 1)}
          className="min-h-[44px] px-3 sm:px-4 rounded bg-[#78D4C4] text-[#10191C] text-xs sm:text-sm font-semibold hover:bg-[#93E3D5] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 cursor-pointer"
        >
          Bài sau
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
