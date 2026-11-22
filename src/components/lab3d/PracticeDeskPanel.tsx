import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Crosshair,
  FileText,
  FlaskConical,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react';
import {
  DeskQuestionItem,
  LAB_OBJECTS,
  MicroZoneId,
  PRACTICE_DECKS,
  PracticeDeck,
} from '../../utils/labWorldState';
import { LabExperimentId, LabObjectId } from '../../utils/lab3dState';
import { checkNumericAnswer } from '../../utils/chemistry';
import { QuizResultSummary } from '../../utils/storage';
import { ChemText } from '../ChemText';

export interface PracticeSessionState {
  activeDeckId: string | null;
  questionIndex: number;
  answers: Record<string, string>;
  submitted: boolean;
  startedAtMs: number;
  elapsedSeconds: number;
}

export interface PracticeDeskPanelProps {
  session: PracticeSessionState;
  lastQuizResult: QuizResultSummary | null;
  onUpdateSession: (updater: (prev: PracticeSessionState) => PracticeSessionState) => void;
  onTriggerPageFlip: () => void;
  onObservePhenomenon: (target: {
    station: LabExperimentId;
    microZone?: MicroZoneId;
    cuso4Variant?: 'cuso4-inert' | 'cuso4-copper';
    naclVariant?: 'nacl-molten' | 'nacl-brine';
  }) => void;
  onStartVisual3DPick: (question: Extract<DeskQuestionItem, { kind: 'visual-3d' }>) => void;
  onRecordOutcome: (questionId: string, isCorrect: boolean) => void;
  onSaveQuizResult: (result: QuizResultSummary) => void;
  onBackToRoom: () => void;
}

export function evaluateDeskQuestion(
  q: DeskQuestionItem,
  rawAnswer: string | undefined
): boolean {
  if (!rawAnswer || !rawAnswer.trim()) return false;
  if (q.kind === 'visual-3d') {
    return rawAnswer === q.correctObjectId;
  }
  if (q.type === 'mcq') {
    return Number(rawAnswer) === q.correctIndex;
  }
  if (q.type === 'tf') {
    const expectedBool = q.correctIndex === 0;
    return (rawAnswer === 'true') === expectedBool;
  }
  if (q.type === 'numeric' && q.numericAnswer !== undefined) {
    return checkNumericAnswer(rawAnswer, q.numericAnswer, q.tolerance ?? 0.03).isCorrect;
  }
  return false;
}

export const PracticeDeskPanel: React.FC<PracticeDeskPanelProps> = ({
  session,
  lastQuizResult,
  onUpdateSession,
  onTriggerPageFlip,
  onObservePhenomenon,
  onStartVisual3DPick,
  onRecordOutcome,
  onSaveQuizResult,
  onBackToRoom,
}) => {
  const [flippingCss, setFlippingCss] = useState(false);

  const activeDeck: PracticeDeck | null =
    PRACTICE_DECKS.find((d) => d.id === session.activeDeckId) ?? null;

  const triggerSheetTurn = (nextIdx: number) => {
    onTriggerPageFlip();
    setFlippingCss(true);
    window.setTimeout(() => setFlippingCss(false), 260);
    onUpdateSession((prev) => ({
      ...prev,
      questionIndex: nextIdx,
    }));
  };

  const handleSelectDeck = (deck: PracticeDeck) => {
    onTriggerPageFlip();
    onUpdateSession(() => ({
      activeDeckId: deck.id,
      questionIndex: 0,
      answers: {},
      submitted: false,
      startedAtMs: Date.now(),
      elapsedSeconds: 0,
    }));
  };

  const handleAnswer = (qId: string, value: string) => {
    if (session.submitted) return;
    onUpdateSession((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [qId]: value,
      },
    }));
  };

  const handleSubmitDeck = () => {
    if (!activeDeck) return;
    const elapsed = Math.max(1, Math.round((Date.now() - session.startedAtMs) / 1000));
    let score = 0;
    const wrongIds: string[] = [];

    for (const q of activeDeck.questions) {
      const ok = evaluateDeskQuestion(q, session.answers[q.id]);
      if (ok) {
        score += 1;
      } else {
        wrongIds.push(q.id);
      }
      onRecordOutcome(q.id, ok);
    }

    onSaveQuizResult({
      score,
      total: activeDeck.questions.length,
      completedAt: new Date().toISOString(),
      wrongQuestionIds: wrongIds,
    });

    onTriggerPageFlip();
    onUpdateSession((prev) => ({
      ...prev,
      submitted: true,
      elapsedSeconds: elapsed,
    }));
  };

  const handleRetryDeck = () => {
    if (!activeDeck) return;
    onTriggerPageFlip();
    onUpdateSession((prev) => ({
      ...prev,
      questionIndex: 0,
      answers: {},
      submitted: false,
      startedAtMs: Date.now(),
      elapsedSeconds: 0,
    }));
  };

  const handleBackToDecks = () => {
    onTriggerPageFlip();
    onUpdateSession((prev) => ({
      ...prev,
      activeDeckId: null,
      submitted: false,
    }));
  };

  // === VIEW 1: DECK SELECTION ON THE PAPER STACK ===
  if (!activeDeck) {
    return (
      <div
        role="region"
        aria-label="Chồng bài tập và kiểm tra Hóa học 12"
        data-testid="practice-desk-panel"
        className="absolute inset-2 sm:inset-4 z-30 flex flex-col rounded-xl border-2 border-[#C77B4C]/80 bg-[#FAF6EC] text-[#172429] shadow-2xl overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3 border-b border-[#DED6C3] bg-[#F2EBDC]">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#9C572C]" />
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#9C572C] font-semibold">
                Bàn luyện tập 3D · Chương 5
              </div>
              <h2 className="font-serif text-base sm:text-lg font-bold text-[#172429]">
                BÀI TẬP &amp; KIỂM TRA
              </h2>
            </div>
          </div>

          <button
            type="button"
            data-testid="practice-back-room-btn"
            onClick={onBackToRoom}
            className="min-h-[40px] px-3.5 rounded-lg border border-[#C6BBA5] bg-white text-xs sm:text-sm font-semibold text-[#172429] hover:border-[#1D6E64] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Compass className="w-4 h-4 text-[#1D6E64]" />
            Về phòng
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {lastQuizResult && (
            <div className="rounded-lg border border-[#B8D7D1] bg-[#EDF6F4] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
              <span className="font-semibold text-[#15564E]">
                Kết quả gần nhất: {lastQuizResult.score}/{lastQuizResult.total} câu đúng
              </span>
              <span className="font-mono text-[#3E585D]">
                Lưu tự động trên trình duyệt
              </span>
            </div>
          )}

          <p className="text-sm text-[#3F4E53]">
            Chọn một tập đề trên bàn để lật từng tờ giấy câu hỏi. Bạn có thể bấm{' '}
            <strong>“Quan sát hiện tượng”</strong> để soi mô hình 3D bất cứ lúc nào mà không mất đáp án đang chọn.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {PRACTICE_DECKS.map((deck) => (
              <button
                key={deck.id}
                type="button"
                data-testid={`practice-deck-${deck.id}`}
                onClick={() => handleSelectDeck(deck)}
                className="text-left rounded-lg border-2 border-[#DDD4C0] bg-white hover:border-[#1D6E64] hover:shadow-md p-4 transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#1D6E64]">
                    {deck.category}
                  </span>
                  <span className="text-xs font-mono font-semibold text-[#9C572C]">
                    {deck.questions.length} câu
                  </span>
                </div>
                <div className="font-serif text-base font-bold text-[#172429]">
                  <ChemText text={deck.title} />
                </div>
                <p className="text-xs sm:text-sm text-[#4A5B61] leading-relaxed">
                  <ChemText text={deck.subtitle} />
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // === VIEW 2: GRADING SUMMARY ("KẾT QUẢ LUYỆN TẬP") ===
  if (session.submitted) {
    const total = activeDeck.questions.length;
    const correctCount = activeDeck.questions.filter((q) =>
      evaluateDeskQuestion(q, session.answers[q.id])
    ).length;
    const wrongCount = total - correctCount;
    const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return (
      <div
        role="region"
        aria-label="Kết quả luyện tập"
        data-testid="practice-results-panel"
        className="absolute inset-2 sm:inset-4 z-30 flex flex-col rounded-xl border-2 border-[#1D6E64] bg-[#FAF6EC] text-[#172429] shadow-2xl overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3 border-b border-[#DED6C3] bg-[#F2EBDC]">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-[#9C572C]" />
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#1D6E64] font-semibold">
                {activeDeck.title}
              </div>
              <h2 className="font-serif text-base sm:text-lg font-bold text-[#172429]">
                KẾT QUẢ LUYỆN TẬP
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRetryDeck}
              className="min-h-[40px] px-3 rounded-lg bg-[#1D6E64] text-white text-xs sm:text-sm font-semibold hover:bg-[#15574F] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Làm lại
            </button>
            <button
              type="button"
              onClick={handleBackToDecks}
              className="min-h-[40px] px-3 rounded-lg border border-[#C6BBA5] bg-white text-xs sm:text-sm font-semibold text-[#172429] hover:border-[#1D6E64] cursor-pointer"
            >
              Bộ đề khác
            </button>
            <button
              type="button"
              onClick={onBackToRoom}
              className="min-h-[40px] px-3 rounded-lg border border-[#C6BBA5] bg-white text-xs sm:text-sm font-semibold text-[#172429] hover:border-[#1D6E64] cursor-pointer"
            >
              Về phòng
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Score Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-[#DDD4C0] bg-white p-3">
              <div className="text-xs text-[#55666C]">Điểm số</div>
              <div className="text-2xl font-mono font-bold text-[#1D6E64]">
                {correctCount}/{total} ({percent}%)
              </div>
            </div>
            <div className="rounded-lg border border-[#B8D7D1] bg-[#EDF6F4] p-3">
              <div className="text-xs text-[#1D6E64]">Số câu đúng</div>
              <div className="text-2xl font-mono font-bold text-[#15564E]">{correctCount}</div>
            </div>
            <div className="rounded-lg border border-[#E5C1BA] bg-[#FDF3F1] p-3">
              <div className="text-xs text-[#9C3A2C]">Số câu sai</div>
              <div className="text-2xl font-mono font-bold text-[#9C3A2C]">{wrongCount}</div>
            </div>
            <div className="rounded-lg border border-[#DDD4C0] bg-white p-3">
              <div className="text-xs text-[#55666C] inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Thời gian
              </div>
              <div className="text-2xl font-mono font-bold text-[#172429]">
                {session.elapsedSeconds} s
              </div>
            </div>
          </div>

          {/* Per-Question Review with Explanations */}
          <div className="space-y-3">
            <h3 className="font-serif text-base font-bold text-[#172429]">
              Xem lại từng câu &amp; lời giải chi tiết
            </h3>
            {activeDeck.questions.map((q, idx) => {
              const userVal = session.answers[q.id];
              const isOk = evaluateDeskQuestion(q, userVal);
              let correctDisplay = '';
              if (q.kind === 'visual-3d') {
                correctDisplay = LAB_OBJECTS[q.correctObjectId]?.name ?? q.correctObjectId;
              } else if (q.type === 'mcq' && q.options && q.correctIndex !== undefined) {
                correctDisplay = q.options[q.correctIndex];
              } else if (q.type === 'tf') {
                correctDisplay = q.correctIndex === 0 ? 'Đúng' : 'Sai';
              } else if (q.type === 'numeric') {
                correctDisplay = `${q.numericAnswer} ${q.unit ?? ''}`.trim();
              }

              return (
                <div
                  key={q.id}
                  className={`rounded-lg border p-3.5 space-y-1.5 ${
                    isOk ? 'border-[#A7D3CB] bg-[#F1FAF8]' : 'border-[#E6BFB8] bg-[#FFF7F5]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-sm text-[#172429]">
                      <span className="font-mono text-xs mr-1.5">Câu {idx + 1}.</span>
                      <ChemText text={q.prompt} />
                    </div>
                    {isOk ? (
                      <CheckCircle2 className="w-5 h-5 text-[#1D6E64] shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-[#B43D2C] shrink-0" />
                    )}
                  </div>
                  <div className="text-xs font-mono text-[#264642]">
                    Đáp án đúng: <ChemText text={correctDisplay} />
                  </div>
                  <p className="text-xs sm:text-sm text-[#394A4F] leading-relaxed">
                    <ChemText text={q.explanation} />
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // === VIEW 3: ACTIVE PAGINATED EXAM SHEET ===
  const qIndex = Math.max(0, Math.min(activeDeck.questions.length - 1, session.questionIndex));
  const question = activeDeck.questions[qIndex];
  const answeredCount = activeDeck.questions.filter(
    (q) => session.answers[q.id] !== undefined && session.answers[q.id].trim() !== ''
  ).length;
  const currentAnswer = session.answers[question.id] ?? '';

  const observeStation: LabExperimentId =
    question.kind === 'visual-3d' ? question.station : question.observeStation;
  const observeMicro: MicroZoneId | undefined =
    question.kind === 'visual-3d' ? undefined : question.observeMicroZone;

  return (
    <div
      role="region"
      aria-label={`Phiếu bài tập ${activeDeck.title}`}
      data-testid="practice-sheet-panel"
      className="absolute inset-2 sm:inset-4 z-30 flex flex-col rounded-xl border-2 border-[#C77B4C]/80 bg-[#FAF6EC] text-[#172429] shadow-2xl overflow-hidden"
    >
      {/* Paper Sheet Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-2.5 border-b border-[#DED6C3] bg-[#F2EBDC]">
        <div className="min-w-0">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#9C572C] font-semibold">
            {activeDeck.title} · Câu {qIndex + 1}/{activeDeck.questions.length}
          </div>
          <div className="text-xs text-[#4A5B61]">
            Đã trả lời: <strong>{answeredCount}/{activeDeck.questions.length}</strong> câu
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleBackToDecks}
            className="min-h-[38px] px-3 rounded border border-[#C6BBA5] bg-white text-xs font-semibold text-[#172429] hover:border-[#1D6E64] cursor-pointer"
          >
            Đổi bộ đề
          </button>
          <button
            type="button"
            onClick={onBackToRoom}
            className="min-h-[38px] px-3 rounded border border-[#C6BBA5] bg-white text-xs font-semibold text-[#172429] hover:border-[#1D6E64] inline-flex items-center gap-1 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-[#1D6E64]" />
            Về phòng
          </button>
        </div>
      </div>

      {/* Question Number Strip */}
      <div className="px-4 sm:px-6 py-2 border-b border-[#E5DEC9] bg-[#F7F2E6] flex items-center gap-1.5 overflow-x-auto">
        {activeDeck.questions.map((q, idx) => {
          const isCur = idx === qIndex;
          const isFilled = Boolean(session.answers[q.id]?.trim());
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => triggerSheetTurn(idx)}
              aria-label={`Chuyển đến câu ${idx + 1}`}
              className={`min-w-[34px] h-[34px] rounded font-mono text-xs font-semibold border transition-colors cursor-pointer shrink-0 ${
                isCur
                  ? 'border-[#1D6E64] bg-[#1D6E64] text-white'
                  : isFilled
                    ? 'border-[#8CBFB6] bg-[#E2F2EE] text-[#15564E]'
                    : 'border-[#D4CCB9] bg-white text-[#4A5B61] hover:border-[#9C572C]'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Main Cream Paper Sheet Content (Subtle CSS page-turn transition) */}
      <div
        className={`flex-1 overflow-y-auto px-4 sm:px-8 py-5 transition-all duration-200 ${
          flippingCss ? 'opacity-60 translate-x-2' : 'opacity-100 translate-x-0'
        }`}
      >
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Prompt */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#9C572C]">
              <span>CÂU {qIndex + 1}</span>
              <span>·</span>
              <span>
                {question.kind === 'visual-3d'
                  ? 'Chọn trực tiếp trên mô hình 3D'
                  : question.type === 'mcq'
                    ? 'Trắc nghiệm 4 lựa chọn'
                    : question.type === 'tf'
                      ? 'Đúng / Sai'
                      : 'Điền số định lượng'}
              </span>
            </div>
            <h3 className="font-serif text-base sm:text-xl font-bold text-[#172429] leading-snug">
              <ChemText text={question.prompt} />
            </h3>
          </div>

          {/* Answer Input Area */}
          {question.kind === 'standard' && question.type === 'mcq' && question.options && (
            <div className="space-y-2.5">
              {question.options.map((opt, oIdx) => {
                const selected = currentAnswer === String(oIdx);
                const letter = ['A', 'B', 'C', 'D'][oIdx] ?? String(oIdx + 1);
                return (
                  <button
                    key={oIdx}
                    type="button"
                    data-testid={`practice-opt-${oIdx}`}
                    onClick={() => handleAnswer(question.id, String(oIdx))}
                    className={`w-full min-h-[48px] text-left rounded-lg border-2 px-4 py-3 text-sm sm:text-base transition-colors cursor-pointer flex items-start gap-3 ${
                      selected
                        ? 'border-[#1D6E64] bg-[#E5F4F1] text-[#112420] font-semibold'
                        : 'border-[#DDD4C0] bg-white text-[#233238] hover:border-[#9C572C]'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        selected ? 'bg-[#1D6E64] text-white' : 'bg-[#EFE8D8] text-[#47585E]'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="pt-0.5 leading-relaxed">
                      <ChemText text={opt} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {question.kind === 'standard' && question.type === 'tf' && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: 'true', label: 'Đúng' },
                { val: 'false', label: 'Sai' },
              ].map((item) => {
                const selected = currentAnswer === item.val;
                return (
                  <button
                    key={item.val}
                    type="button"
                    data-testid={`practice-tf-${item.val}`}
                    onClick={() => handleAnswer(question.id, item.val)}
                    className={`min-h-[54px] rounded-lg border-2 font-semibold text-base transition-colors cursor-pointer ${
                      selected
                        ? 'border-[#1D6E64] bg-[#E5F4F1] text-[#112420]'
                        : 'border-[#DDD4C0] bg-white text-[#233238] hover:border-[#9C572C]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}

          {question.kind === 'standard' && question.type === 'numeric' && (
            <div className="space-y-2">
              <label
                htmlFor={`num-input-${question.id}`}
                className="block text-sm font-semibold text-[#2E3F45]"
              >
                Nhập kết quả tính toán ({question.unit ?? 'giá trị số'}):
              </label>
              <div className="flex items-center gap-2.5 max-w-sm">
                <input
                  id={`num-input-${question.id}`}
                  data-testid="practice-numeric-input"
                  type="text"
                  inputMode="decimal"
                  value={currentAnswer}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  placeholder="Ví dụ: 1,103 hoặc 0,64"
                  className="flex-1 min-h-[48px] rounded-lg border-2 border-[#C8BDA6] bg-white px-3.5 text-base font-mono text-[#172429] focus:outline-none focus:border-[#1D6E64]"
                />
                {question.unit && (
                  <span className="font-mono text-sm font-semibold text-[#4A5B61]">
                    {question.unit}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#596A70]">
                Hỗ trợ cả dấu phẩy (0,64) hoặc dấu chấm (0.64). Kết quả được chấm sau khi bấm Nộp bài.
              </p>
            </div>
          )}

          {question.kind === 'visual-3d' && (
            <div className="space-y-3.5">
              <div className="rounded-lg border-2 border-dashed border-[#1D6E64]/60 bg-[#EDF6F4] p-4 space-y-3">
                <p className="text-sm text-[#1B3A37]">
                  Bạn có thể bấm nút bên dưới để bay tới bàn thí nghiệm và <strong>chạm trực tiếp vào điện cực/dụng cụ 3D</strong>, hoặc chọn bằng bàn phím từ các phương án dụng cụ.
                </p>
                <button
                  type="button"
                  data-testid="practice-pick-3d-btn"
                  onClick={() => onStartVisual3DPick(question)}
                  className="min-h-[46px] px-4 rounded-lg bg-[#1D6E64] text-white font-semibold text-sm hover:bg-[#15564E] inline-flex items-center gap-2 cursor-pointer"
                >
                  <Crosshair className="w-4 h-4" />
                  Chọn trực tiếp trên mô hình 3D
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {question.candidateObjects.map((objId: LabObjectId) => {
                  const obj = LAB_OBJECTS[objId];
                  const selected = currentAnswer === objId;
                  return (
                    <button
                      key={objId}
                      type="button"
                      onClick={() => handleAnswer(question.id, objId)}
                      className={`min-h-[48px] text-left rounded-lg border-2 px-3.5 py-2.5 text-sm transition-colors cursor-pointer ${
                        selected
                          ? 'border-[#1D6E64] bg-[#E5F4F1] text-[#112420] font-semibold'
                          : 'border-[#DDD4C0] bg-white text-[#233238] hover:border-[#9C572C]'
                      }`}
                    >
                      <ChemText text={obj.name} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contextual Jump to 3D Observation Without Losing Answers */}
          <div className="pt-2 border-t border-[#E5DEC9] flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              data-testid="practice-observe-phenomenon-btn"
              onClick={() =>
                onObservePhenomenon({
                  station: observeStation,
                  microZone: observeMicro,
                  cuso4Variant:
                    question.kind === 'visual-3d' ? question.cuso4Variant : undefined,
                  naclVariant:
                    question.kind === 'visual-3d' ? question.naclVariant : undefined,
                })
              }
              className="min-h-[42px] px-3.5 rounded-lg border border-[#1D6E64] bg-white text-[#1D6E64] font-semibold text-xs sm:text-sm hover:bg-[#EDF6F4] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FlaskConical className="w-4 h-4" />
              Quan sát hiện tượng 3D
            </button>

            <span className="text-xs text-[#64757B]">
              Đáp án đang chọn luôn được giữ nguyên khi xem mô hình.
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Sheet Navigation + Submit */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-2.5 border-t border-[#DED6C3] bg-[#F2EBDC]">
        <button
          type="button"
          disabled={qIndex === 0}
          onClick={() => triggerSheetTurn(qIndex - 1)}
          className="min-h-[44px] px-3.5 rounded-lg border border-[#C6BBA5] bg-white text-xs sm:text-sm font-semibold text-[#172429] hover:border-[#1D6E64] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Trang trước
        </button>

        <div className="flex items-center gap-2">
          {qIndex < activeDeck.questions.length - 1 && (
            <button
              type="button"
              data-testid="practice-next-page-btn"
              onClick={() => triggerSheetTurn(qIndex + 1)}
              className="min-h-[44px] px-3.5 rounded-lg border border-[#1D6E64] bg-white text-xs sm:text-sm font-semibold text-[#1D6E64] hover:bg-[#EDF6F4] inline-flex items-center gap-1 cursor-pointer"
            >
              Lật trang sau
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            data-testid="practice-submit-btn"
            onClick={handleSubmitDeck}
            className="min-h-[44px] px-4 rounded-lg bg-[#1D6E64] text-white text-xs sm:text-sm font-semibold hover:bg-[#15564E] cursor-pointer"
          >
            Nộp bài ({answeredCount}/{activeDeck.questions.length})
          </button>
        </div>
      </div>
    </div>
  );
};
