import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Pause,
  Play,
  RotateCcw,
  StepForward,
  X,
} from 'lucide-react';
import {
  ANODE_COPPER_INITIAL_G,
  ElectrolysisParams,
  ElectrolysisRawInput,
  ElectrolysisValidationErrors,
  ElectrolysisVariant,
  buildFaradayDerivation,
  computeElectrolysisAtTime,
  getDefaultParams,
  getDefaultRawInput,
  getDepletionTimeSeconds,
  getElectrolysisMilestones,
  validateElectrolysisParams,
} from '../utils/electrochemEngine';
import { TimeUnit, formatViNumber } from '../utils/faraday';
import { ChemText } from './ChemText';
import { ElectrochemChart } from './ElectrochemChart';
import {
  HotspotInfo,
  LabCuSO4Svg,
  LabNaClSvg,
  LabZnCuSvg,
} from './LabApparatusSvg';

export type SimTabId =
  | 'pin-zn-cu'
  | 'dien-phan-cuso4'
  | 'nacl-nong-chay'
  | 'dien-phan-nacl'
  | 'faraday';

type ExperimentId = 'pin-zn-cu' | 'dien-phan-cuso4' | 'dien-phan-nacl';

interface PredictionPrompt {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const PREDICTIONS: Record<ExperimentId, PredictionPrompt> = {
  'pin-zn-cu': {
    question: 'Trước khi chạy, hãy dự đoán: Electron chạy từ Zn sang Cu hay từ Cu sang Zn?',
    options: [
      'Electron chạy qua dây ngoài từ Zn sang Cu; anion NO₃⁻ sang cốc Zn.',
      'Electron chạy qua dây ngoài từ Cu sang Zn; cation K⁺ sang cốc Zn.',
      'Electron đi qua cầu muối KNO₃ từ Zn sang Cu.',
    ],
    correctIndex: 0,
    explanation:
      'Zn có tính khử mạnh hơn (E° = −0,763 V < +0,340 V) nên bị oxi hóa ở anode (−), nhường electron chạy qua dây dẫn ngoài sang cathode (+) Cu. Cầu muối chỉ dẫn ion: NO₃⁻ sang cốc Zn và K⁺ sang cốc Cu.',
  },
  'dien-phan-cuso4': {
    question:
      'Dự đoán: Khi điện phân dung dịch CuSO₄ với điện cực trơ kéo dài quá mốc hết Cu²⁺, ở cathode (−) sẽ có thêm hiện tượng gì?',
    options: [
      'Đồng tiếp tục bám dày mãi không ngừng.',
      'Xuất hiện bọt khí H₂ thoát ra ở cathode (−), còn khối lượng Cu giữ nguyên.',
      'Khí O₂ chuyển sang thoát ra ở cathode (−).',
    ],
    correctIndex: 1,
    explanation:
      'Khi Cu²⁺ hết (nₑ = 2n(Cu²⁺ ban đầu)), khối lượng Cu đạt cực đại và không tăng nữa. Lúc này ở cathode (−) xảy ra quá trình khử H⁺ (tạo khí H₂↑), còn anode (+) vẫn oxi hóa H₂O tạo O₂↑.',
  },
  'dien-phan-nacl': {
    question:
      'Dự đoán: Khi chuyển từ NaCl nóng chảy sang dung dịch NaCl bão hòa (có màng ngăn), sản phẩm ở cathode (−) thay đổi thế nào?',
    options: [
      'Cả hai trường hợp đều thu được kim loại Na ở cathode (−).',
      'Nóng chảy thu được Na; trong dung dịch thu được khí H₂ và OH⁻ (NaOH).',
      'Nóng chảy thu được Cl₂; trong dung dịch thu được O₂ ở cathode (−).',
    ],
    correctIndex: 1,
    explanation:
      'Trong NaCl nóng chảy không có nước nên Na⁺ bị khử thành Na. Trong dung dịch nước, H₂O dễ bị khử hơn Na⁺ nên cathode (−) sinh khí H₂ và OH⁻ (NaOH), còn anode (+) vẫn sinh Cl₂.',
  },
};

const PIN_STAGES = [
  {
    progress: 0,
    title: 'Ban đầu · Chuẩn bị hai bán pin Zn²⁺/Zn và Cu²⁺/Cu (1 M, 25 °C)',
    summary: 'Thanh Zn nhúng trong ZnSO₄ 1 M, thanh Cu nhúng trong CuSO₄ 1 M, nối qua cầu muối KNO₃.',
  },
  {
    progress: 0.34,
    title: 'Giai đoạn 1 · Oxi hóa ở Anode (−) Zn và dòng electron mạch ngoài',
    summary: 'Zn nhường 2e⁻ tạo Zn²⁺ tan vào dung dịch; thanh Zn mòn dần, electron chạy theo dây ngoài sang thanh Cu.',
  },
  {
    progress: 0.68,
    title: 'Giai đoạn 2 · Khử Cu²⁺ ở Cathode (+) Cu và trung hòa qua cầu muối',
    summary: 'Cu²⁺ nhận 2e⁻ bám đồng đỏ lên thanh Cu; NO₃⁻ sang ngăn Zn, K⁺ sang ngăn Cu giữ trung hòa điện tích.',
  },
  {
    progress: 1,
    title: 'Hoàn tất quan sát · Pin duy trì E°pin = 1,103 V khi mạch kín',
    summary: 'Thanh Zn giảm khối lượng, thanh Cu tăng khối lượng, màu xanh CuSO₄ nhạt dần, nồng độ Zn²⁺ tăng.',
  },
];

function mapTabToState(tab: SimTabId): {
  experiment: ExperimentId;
  cuso4Variant: 'cuso4-inert' | 'cuso4-copper';
  naclVariant: 'nacl-molten' | 'nacl-brine';
  expandParams: boolean;
} {
  if (tab === 'faraday') {
    return {
      experiment: 'dien-phan-cuso4',
      cuso4Variant: 'cuso4-inert',
      naclVariant: 'nacl-molten',
      expandParams: true,
    };
  }
  if (tab === 'dien-phan-cuso4') {
    return {
      experiment: 'dien-phan-cuso4',
      cuso4Variant: 'cuso4-inert',
      naclVariant: 'nacl-molten',
      expandParams: false,
    };
  }
  if (tab === 'nacl-nong-chay' || tab === 'dien-phan-nacl') {
    return {
      experiment: 'dien-phan-nacl',
      cuso4Variant: 'cuso4-inert',
      naclVariant: 'nacl-molten',
      expandParams: false,
    };
  }
  return {
    experiment: 'pin-zn-cu',
    cuso4Variant: 'cuso4-inert',
    naclVariant: 'nacl-molten',
    expandParams: false,
  };
}

interface SimulationLabProps {
  initialTab: SimTabId;
  onTabChange: (tab: SimTabId) => void;
  onOpenLesson?: (slug: string) => void;
}

export const SimulationLab: React.FC<SimulationLabProps> = ({
  initialTab,
  onTabChange,
  onOpenLesson,
}) => {
  const initialMapped = mapTabToState(initialTab);

  const [experiment, setExperiment] = useState<ExperimentId>(initialMapped.experiment);
  const [cuso4Variant, setCuso4Variant] = useState<'cuso4-inert' | 'cuso4-copper'>(
    initialMapped.cuso4Variant
  );
  const [naclVariant, setNaclVariant] = useState<'nacl-molten' | 'nacl-brine'>(
    initialMapped.naclVariant
  );

  // Playback & timeline state
  const [isRunning, setIsRunning] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [pinCircuitClosed, setPinCircuitClosed] = useState<boolean>(true);
  const [pinProgress, setPinProgress] = useState<number>(0); // 0..1
  const [showConventionalCurrent, setShowConventionalCurrent] = useState<boolean>(false);
  const [showPolarityCompare, setShowPolarityCompare] = useState<boolean>(false);

  // Electrolysis quantitative state (single source of truth)
  const activeElectrolysisVariant: ElectrolysisVariant =
    experiment === 'dien-phan-cuso4' ? cuso4Variant : naclVariant;

  const [paramsByVariant, setParamsByVariant] = useState<
    Record<ElectrolysisVariant, ElectrolysisParams>
  >(() => ({
    'cuso4-inert': getDefaultParams('cuso4-inert'),
    'cuso4-copper': getDefaultParams('cuso4-copper'),
    'nacl-molten': getDefaultParams('nacl-molten'),
    'nacl-brine': getDefaultParams('nacl-brine'),
  }));

  const [rawInputsByVariant, setRawInputsByVariant] = useState<
    Record<ElectrolysisVariant, ElectrolysisRawInput>
  >(() => ({
    'cuso4-inert': getDefaultRawInput('cuso4-inert'),
    'cuso4-copper': getDefaultRawInput('cuso4-copper'),
    'nacl-molten': getDefaultRawInput('nacl-molten'),
    'nacl-brine': getDefaultRawInput('nacl-brine'),
  }));

  const [inputErrors, setInputErrors] = useState<ElectrolysisValidationErrors>({});
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState<number>(0);

  // Predictions (answerable or skippable per experiment)
  const [predictions, setPredictions] = useState<
    Record<ExperimentId, { status: 'pending' | 'answered' | 'skipped'; chosenIndex: number | null }>
  >({
    'pin-zn-cu': { status: 'pending', chosenIndex: null },
    'dien-phan-cuso4': { status: 'pending', chosenIndex: null },
    'dien-phan-nacl': { status: 'pending', chosenIndex: null },
  });

  // UI panels & hotspots
  const [activeHotspot, setActiveHotspot] = useState<HotspotInfo | null>(null);
  const [showParamsPanel, setShowParamsPanel] = useState<boolean>(initialMapped.expandParams);
  const [showDerivation, setShowDerivation] = useState<boolean>(false);
  const [showNaClReason, setShowNaClReason] = useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Sync incoming route tab changes
  useEffect(() => {
    const mapped = mapTabToState(initialTab);
    setIsRunning(false);
    setActiveHotspot(null);
    setInputErrors({});
    setExperiment(mapped.experiment);
    if (initialTab === 'faraday') {
      setCuso4Variant('cuso4-inert');
      setShowParamsPanel(true);
    } else if (initialTab === 'nacl-nong-chay') {
      setNaclVariant('nacl-molten');
    }
    setPinProgress(0);
    setCurrentTimeSeconds(0);
  }, [initialTab]);

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Dismiss active hotspot on Escape
  useEffect(() => {
    if (!activeHotspot) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveHotspot(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeHotspot]);

  const activeParams = paramsByVariant[activeElectrolysisVariant];
  const activeRawInput = rawInputsByVariant[activeElectrolysisVariant];

  const snapshot = useMemo(
    () => computeElectrolysisAtTime(activeParams, currentTimeSeconds),
    [activeParams, currentTimeSeconds]
  );

  const milestones = useMemo(() => getElectrolysisMilestones(activeParams), [activeParams]);
  const depletionTime = useMemo(() => getDepletionTimeSeconds(activeParams), [activeParams]);
  const derivationSteps = useMemo(
    () => buildFaradayDerivation(activeParams, snapshot),
    [activeParams, snapshot]
  );

  // Single strictly-cleaned requestAnimationFrame playback loop
  const lastFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRunning) {
      lastFrameRef.current = null;
      return;
    }

    if (experiment === 'pin-zn-cu' && !pinCircuitClosed) {
      setIsRunning(false);
      lastFrameRef.current = null;
      return;
    }

    let rafId = 0;
    const BASE_DURATION_SECONDS = 10; // 1x screen duration across full timeline

    const tick = (now: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = now;
        rafId = window.requestAnimationFrame(tick);
        return;
      }

      // Clamp dt to prevent huge jumps on background tab or rapid toggles
      const dtSeconds = Math.min(now - lastFrameRef.current, 80) / 1000;
      lastFrameRef.current = now;

      if (experiment === 'pin-zn-cu') {
        setPinProgress((prev) => {
          const next = prev + (dtSeconds * playbackSpeed) / BASE_DURATION_SECONDS;
          if (next >= 1) {
            setIsRunning(false);
            return 1;
          }
          return next;
        });
      } else {
        const total = activeParams.totalTimeSeconds;
        if (total <= 0) {
          setIsRunning(false);
          return;
        }
        const simRate = (total / BASE_DURATION_SECONDS) * playbackSpeed;
        setCurrentTimeSeconds((prev) => {
          const next = prev + dtSeconds * simRate;
          if (next >= total) {
            setIsRunning(false);
            return total;
          }
          return next;
        });
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
      lastFrameRef.current = null;
    };
  }, [isRunning, experiment, pinCircuitClosed, playbackSpeed, activeParams.totalTimeSeconds]);

  // Handlers
  const handleSelectExperiment = (nextExp: ExperimentId) => {
    setIsRunning(false);
    setActiveHotspot(null);
    setInputErrors({});
    setExperiment(nextExp);
    setPinProgress(0);
    setCurrentTimeSeconds(0);
    if (nextExp !== 'dien-phan-cuso4') {
      setShowPolarityCompare(false);
    }
    onTabChange(nextExp);
  };

  const handleSelectCuSO4Variant = (nextVar: 'cuso4-inert' | 'cuso4-copper') => {
    setIsRunning(false);
    setActiveHotspot(null);
    setInputErrors({});
    setCuso4Variant(nextVar);
    setCurrentTimeSeconds(0);
  };

  const handleSelectNaClVariant = (nextVar: 'nacl-molten' | 'nacl-brine') => {
    setIsRunning(false);
    setActiveHotspot(null);
    setInputErrors({});
    setNaclVariant(nextVar);
    setCurrentTimeSeconds(0);
  };

  const handleCompareWithElectrolysis = () => {
    setIsRunning(false);
    setActiveHotspot(null);
    setExperiment('dien-phan-cuso4');
    setCuso4Variant('cuso4-inert');
    setCurrentTimeSeconds(0);
    setShowPolarityCompare(true);
    onTabChange('dien-phan-cuso4');
  };

  const handleTogglePinCircuit = () => {
    setPinCircuitClosed((prev) => {
      const next = !prev;
      if (!next) {
        setIsRunning(false);
      }
      return next;
    });
  };

  const isAtEnd =
    experiment === 'pin-zn-cu'
      ? pinProgress >= 0.999
      : activeParams.totalTimeSeconds > 0
        ? currentTimeSeconds >= activeParams.totalTimeSeconds - 1e-6
        : true;

  const hasStarted =
    experiment === 'pin-zn-cu' ? pinProgress > 0.001 : currentTimeSeconds > 1e-6;

  const handlePrimaryPlayToggle = () => {
    if (experiment === 'pin-zn-cu' && !pinCircuitClosed) {
      // Automatically close switch if user explicitly starts Pin Zn-Cu
      setPinCircuitClosed(true);
    }
    if (isRunning) {
      setIsRunning(false);
      return;
    }
    if (isAtEnd) {
      if (experiment === 'pin-zn-cu') {
        setPinProgress(0);
      } else {
        setCurrentTimeSeconds(0);
      }
    }
    setIsRunning(true);
  };

  const handleStepForward = () => {
    setIsRunning(false);
    if (experiment === 'pin-zn-cu') {
      if (!pinCircuitClosed) {
        setPinCircuitClosed(true);
      }
      const nextStage = PIN_STAGES.find((s) => s.progress > pinProgress + 0.02);
      setPinProgress(nextStage ? nextStage.progress : 1);
      return;
    }

    const nextMilestone = milestones.find((m) => m.timeSeconds > currentTimeSeconds + 0.5);
    if (nextMilestone) {
      setCurrentTimeSeconds(nextMilestone.timeSeconds);
    } else {
      setCurrentTimeSeconds(activeParams.totalTimeSeconds);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setActiveHotspot(null);
    if (experiment === 'pin-zn-cu') {
      setPinProgress(0);
    } else {
      setCurrentTimeSeconds(0);
    }
  };

  const handleRawInputChange = (field: keyof ElectrolysisRawInput, value: string) => {
    setRawInputsByVariant((prev) => ({
      ...prev,
      [activeElectrolysisVariant]: {
        ...prev[activeElectrolysisVariant],
        [field]: value,
      },
    }));
  };

  const handleApplyParams = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRunning) return;
    const { errors, params } = validateElectrolysisParams(
      activeElectrolysisVariant,
      activeRawInput
    );
    setInputErrors(errors);
    if (!params) return;

    setParamsByVariant((prev) => ({
      ...prev,
      [activeElectrolysisVariant]: params,
    }));
    setCurrentTimeSeconds(0);
    setIsRunning(false);
  };

  const handleRestoreDefaultParams = () => {
    setIsRunning(false);
    const defRaw = getDefaultRawInput(activeElectrolysisVariant);
    const defParams = getDefaultParams(activeElectrolysisVariant);
    setRawInputsByVariant((prev) => ({ ...prev, [activeElectrolysisVariant]: defRaw }));
    setParamsByVariant((prev) => ({ ...prev, [activeElectrolysisVariant]: defParams }));
    setInputErrors({});
    setCurrentTimeSeconds(0);
  };

  // Derived display state for Pin Zn-Cu
  const currentPinStageIndex = useMemo(() => {
    if (!pinCircuitClosed) return 0;
    if (pinProgress >= 0.99) return 3;
    if (pinProgress >= 0.6) return 2;
    if (pinProgress > 0.02) return 1;
    return 0;
  }, [pinCircuitClosed, pinProgress]);

  const currentPrediction = predictions[experiment];
  const predictionPrompt = PREDICTIONS[experiment];

  const primaryButtonLabel = isRunning
    ? 'Tạm dừng'
    : hasStarted && !isAtEnd
      ? 'Tiếp tục'
      : 'Bắt đầu';

  const depletionPercent =
    experiment === 'dien-phan-cuso4' &&
    cuso4Variant === 'cuso4-inert' &&
    depletionTime !== null &&
    activeParams.totalTimeSeconds > 0 &&
    depletionTime <= activeParams.totalTimeSeconds
      ? (depletionTime / activeParams.totalTimeSeconds) * 100
      : null;

  const lessonForExperiment =
    experiment === 'pin-zn-cu'
      ? { slug: '4-pin-galvani', label: 'Đọc lại Bài 4: Pin Galvani' }
      : experiment === 'dien-phan-cuso4'
        ? { slug: '6-dinh-luat-faraday', label: 'Đọc lại Bài 6: Định luật Faraday' }
        : { slug: '5-dien-phan', label: 'Đọc lại Bài 5: Điện phân' };

  return (
    <section
      aria-label="Phòng mô phỏng điện hóa tương tác"
      className="bg-[#10191C] text-[#F5F2EA] min-h-[calc(100vh-4rem)] border-t border-[#1F2E33]"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Lab Header + Compact 3-Experiment Selector */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#223238] pb-5">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#78D4C4]">
              Phòng thí nghiệm điện hóa · Hóa học 12 · Chương 5
            </p>
            <h1
              className="mt-1 font-serif text-2xl sm:text-3xl font-semibold"
              style={{ color: '#F5F2EA' }}
            >
              Phòng mô phỏng
            </h1>
            <p className="mt-1 text-base text-[#B7C4C7]">
              Quan sát trực tiếp chiều electron, chiều ion, bán phản ứng ở từng cực và định lượng Faraday.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Chọn thí nghiệm điện hóa"
            className="flex flex-wrap lg:flex-nowrap shrink-0 gap-2"
          >
            {(
              [
                { id: 'pin-zn-cu', label: '1. Pin Galvani Zn–Cu' },
                { id: 'dien-phan-cuso4', label: '2. Điện phân CuSO₄' },
                { id: 'dien-phan-nacl', label: '3. Điện phân NaCl' },
              ] as { id: ExperimentId; label: string }[]
            ).map((item) => {
              const active = experiment === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleSelectExperiment(item.id)}
                  className={`min-h-[44px] px-4 py-2 rounded text-sm sm:text-base font-medium transition-colors cursor-pointer border focus-visible:outline-2 focus-visible:outline-[#78D4C4] ${
                    active
                      ? 'bg-[#78D4C4] text-[#10191C] border-[#78D4C4] font-semibold'
                      : 'bg-[#152227] text-[#F5F2EA] border-[#293D44] hover:border-[#78D4C4]/70'
                  }`}
                >
                  <ChemText text={item.label} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Folded Variant Selector + Optional Polarity Comparison Strip */}
        {experiment === 'dien-phan-cuso4' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="group"
              aria-label="Chọn loại điện cực cho bình điện phân CuSO₄"
              className="inline-flex flex-wrap items-center gap-2 bg-[#0C1316] p-1.5 rounded border border-[#243439]"
            >
              <span className="px-2 text-xs uppercase tracking-wider text-[#9BB0B5]">
                Biến thể:
              </span>
              <button
                type="button"
                aria-pressed={cuso4Variant === 'cuso4-inert'}
                onClick={() => handleSelectCuSO4Variant('cuso4-inert')}
                className={`min-h-[44px] px-3.5 text-sm font-medium rounded transition-colors cursor-pointer ${
                  cuso4Variant === 'cuso4-inert'
                    ? 'bg-[#C77B4C] text-[#10191C] font-semibold'
                    : 'text-[#DCE4E6] hover:bg-[#19282D]'
                }`}
              >
                Điện cực trơ (2 giai đoạn)
              </button>
              <button
                type="button"
                aria-pressed={cuso4Variant === 'cuso4-copper'}
                onClick={() => handleSelectCuSO4Variant('cuso4-copper')}
                className={`min-h-[44px] px-3.5 text-sm font-medium rounded transition-colors cursor-pointer ${
                  cuso4Variant === 'cuso4-copper'
                    ? 'bg-[#C77B4C] text-[#10191C] font-semibold'
                    : 'text-[#DCE4E6] hover:bg-[#19282D]'
                }`}
              >
                Anode đồng (anode tan)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowPolarityCompare((v) => !v)}
              aria-expanded={showPolarityCompare}
              className="min-h-[44px] inline-flex items-center gap-2 px-3.5 rounded border border-[#2D434B] bg-[#142024] text-sm text-[#78D4C4] hover:border-[#78D4C4] transition-colors cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4 shrink-0" />
              So sánh dấu cực với Pin Galvani
            </button>
          </div>
        )}

        {experiment === 'dien-phan-nacl' && (
          <div
            role="group"
            aria-label="Chọn trạng thái điện phân NaCl"
            className="inline-flex flex-wrap items-center gap-2 bg-[#0C1316] p-1.5 rounded border border-[#243439]"
          >
            <span className="px-2 text-xs uppercase tracking-wider text-[#9BB0B5]">
              Biến thể:
            </span>
            <button
              type="button"
              aria-pressed={naclVariant === 'nacl-molten'}
              onClick={() => handleSelectNaClVariant('nacl-molten')}
              className={`min-h-[44px] px-3.5 text-sm font-medium rounded transition-colors cursor-pointer ${
                naclVariant === 'nacl-molten'
                  ? 'bg-[#C77B4C] text-[#10191C] font-semibold'
                  : 'text-[#DCE4E6] hover:bg-[#19282D]'
              }`}
            >
              NaCl nóng chảy
            </button>
            <button
              type="button"
              aria-pressed={naclVariant === 'nacl-brine'}
              onClick={() => handleSelectNaClVariant('nacl-brine')}
              className={`min-h-[44px] px-3.5 text-sm font-medium rounded transition-colors cursor-pointer ${
                naclVariant === 'nacl-brine'
                  ? 'bg-[#C77B4C] text-[#10191C] font-semibold'
                  : 'text-[#DCE4E6] hover:bg-[#19282D]'
              }`}
            >
              Dung dịch NaCl bão hòa (có màng ngăn)
            </button>
          </div>
        )}

        {/* Polarity Comparison Banner */}
        {showPolarityCompare && (
          <div
            role="region"
            aria-label="So sánh dấu điện cực giữa Pin Galvani và Bình điện phân"
            className="rounded border border-[#78D4C4]/60 bg-[#13252A] p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  className="font-serif text-base font-semibold"
                  style={{ color: '#78D4C4' }}
                >
                  So sánh dấu điện cực: Pin Galvani ↔ Bình điện phân
                </h2>
                <p className="text-sm sm:text-base text-[#F5F2EA] mt-1">
                  Quy tắc bất biến cho cả hai hệ:{' '}
                  <strong className="text-[#78D4C4]">Anode luôn xảy ra quá trình oxi hóa</strong>,{' '}
                  <strong className="text-[#E39D6B]">Cathode luôn xảy ra quá trình khử</strong>. Chỉ có dấu điện cực đổi chiều!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPolarityCompare(false)}
                aria-label="Đóng bảng so sánh dấu điện cực"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded border border-[#2C454D] text-[#DCE4E6] hover:border-[#78D4C4] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm pt-1">
              <div className="rounded border border-[#2A4148] bg-[#0D181C] p-3">
                <div className="font-semibold text-[#F5F2EA]">Pin Galvani (tự phát dòng điện)</div>
                <div className="mt-1 text-[#DCE4E6]">
                  Anode mang dấu <strong className="text-[#78D4C4]">(−)</strong> (nhường e⁻) · Cathode mang dấu{' '}
                  <strong className="text-[#E39D6B]">(+)</strong> (nhận e⁻).
                </div>
              </div>
              <div className="rounded border border-[#C77B4C]/70 bg-[#1F1713] p-3">
                <div className="font-semibold text-[#F5F2EA]">Bình điện phân (dùng nguồn DC ngoài)</div>
                <div className="mt-1 text-[#DCE4E6]">
                  Anode nối cực dương nên mang dấu <strong className="text-[#E39D6B]">(+)</strong> · Cathode nối cực âm nên mang dấu{' '}
                  <strong className="text-[#78D4C4]">(−)</strong>.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main 2/3 Apparatus + 1/3 Reactions & Live Phenomenon Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 2/3: Prediction Prompt + Apparatus + Controls */}
          <div className="lg:col-span-8 space-y-4">
            {/* Pre-experiment Prediction Question right above diagram */}
            {currentPrediction.status === 'pending' && (
              <div
                role="region"
                aria-label="Câu hỏi dự đoán trước khi chạy thí nghiệm"
                className="rounded border border-[#2F4850] bg-[#142227] p-4 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="w-5 h-5 text-[#78D4C4] shrink-0 mt-0.5" />
                    <p className="text-base font-medium text-[#F5F2EA]">
                      <ChemText text={predictionPrompt.question} />
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPredictions((prev) => ({
                        ...prev,
                        [experiment]: { status: 'skipped', chosenIndex: null },
                      }))
                    }
                    className="min-h-[44px] px-3 text-sm text-[#B7C4C7] hover:text-[#F5F2EA] underline underline-offset-4 cursor-pointer"
                  >
                    Bỏ qua dự đoán
                  </button>
                </div>
                <div className="grid gap-2">
                  {predictionPrompt.options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setPredictions((prev) => ({
                          ...prev,
                          [experiment]: { status: 'answered', chosenIndex: idx },
                        }))
                      }
                      className="min-h-[44px] text-left px-3.5 py-2.5 rounded border border-[#2A3F46] bg-[#0E171A] hover:border-[#78D4C4] text-sm sm:text-base text-[#F5F2EA] transition-colors cursor-pointer"
                    >
                      <ChemText text={opt} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Apparatus Container */}
            <div className="rounded border border-[#243439] bg-[#0C1316] p-3 sm:p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#9BB0B5]">
                <span>
                  Bấm (hoặc nhấn Tab + Enter) vào điện cực, nguồn điện, cầu muối hoặc màng ngăn để xem chú thích.
                </span>
                {reducedMotion && (
                  <span className="text-[#78D4C4] font-medium">
                    Chế độ giảm chuyển động đang bật (mũi tên tĩnh &amp; số liệu)
                  </span>
                )}
              </div>

              {experiment === 'pin-zn-cu' && (
                <LabZnCuSvg
                  circuitClosed={pinCircuitClosed}
                  progress={pinProgress}
                  isRunning={isRunning}
                  playbackSpeed={playbackSpeed}
                  showConventionalCurrent={showConventionalCurrent}
                  reducedMotion={reducedMotion}
                  activeHotspotId={activeHotspot?.id ?? null}
                  onSelectHotspot={setActiveHotspot}
                  onToggleCircuit={handleTogglePinCircuit}
                />
              )}

              {experiment === 'dien-phan-cuso4' && (
                <LabCuSO4Svg
                  snapshot={snapshot}
                  isRunning={isRunning}
                  currentA={activeParams.currentA}
                  playbackSpeed={playbackSpeed}
                  reducedMotion={reducedMotion}
                  activeHotspotId={activeHotspot?.id ?? null}
                  onSelectHotspot={setActiveHotspot}
                />
              )}

              {experiment === 'dien-phan-nacl' && (
                <LabNaClSvg
                  snapshot={snapshot}
                  isRunning={isRunning}
                  currentA={activeParams.currentA}
                  playbackSpeed={playbackSpeed}
                  reducedMotion={reducedMotion}
                  activeHotspotId={activeHotspot?.id ?? null}
                  onSelectHotspot={setActiveHotspot}
                />
              )}

              {/* Non-color-only Path Legend directly below SVG (keeps 375px viewports uncluttered) */}
              <div className="pt-2 border-t border-[#1C2A2F] flex flex-wrap gap-x-5 gap-y-2 text-xs sm:text-sm text-[#DCE4E6]">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0B2429] border border-[#78D4C4] text-[9px] font-mono font-bold text-[#E9FFFA]"
                    aria-hidden="true"
                  >
                    e⁻
                  </span>
                  Điểm sáng xanh ngọc: Electron <strong>tách khỏi Anode</strong> &amp; <strong>chuyển động</strong> trên dây ngoài
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#2B1F11] border border-[#F2C864] text-[9px] font-mono font-bold text-[#FFF1C7]"
                    aria-hidden="true"
                  >
                    e⁻
                  </span>
                  Điểm sáng vàng đồng: Electron <strong>bám / kết hợp</strong> tại Cathode
                </span>
                {experiment === 'pin-zn-cu' ? (
                  <>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block w-6 border-t-2 border-dotted border-[#E39D6B]"
                        aria-hidden="true"
                      />
                      Cầu muối: <ChemText text="NO₃⁻ → cốc Zn" /> · <ChemText text="K⁺ → cốc Cu" />
                    </span>
                    {showConventionalCurrent && (
                      <span className="inline-flex items-center gap-2 text-[#F2C864]">
                        <span
                          className="inline-block w-6 border-t-2 border-dashed border-[#F2C864]"
                          aria-hidden="true"
                        />
                        Nét đứt vàng: Dòng quy ước I (Cu → Zn)
                      </span>
                    )}
                  </>
                ) : (
                  <span className="inline-flex items-center gap-2 text-[#78D4C4]">
                    <span
                      className="inline-block w-6 border-t-2 border-dashed border-[#78D4C4]"
                      aria-hidden="true"
                    />
                    Đường dẫn dây ngoài: tốc độ &amp; mật độ <ChemText text="e⁻" /> biến thiên theo{' '}
                    <strong className="font-mono">
                      I = {formatViNumber(activeParams.currentA, { maxDecimals: 2 })} A
                    </strong>
                  </span>
                )}
              </div>

              {/* Interactive Hotspot Explanation Card (outside SVG for clean 375px readability) */}
              {activeHotspot && (
                <div
                  role="dialog"
                  aria-label={activeHotspot.title}
                  className="rounded border border-[#78D4C4] bg-[#13252A] p-3.5 text-sm sm:text-base flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-[#F5F2EA]">
                      <ChemText text={activeHotspot.title} />
                    </div>
                    <div className="text-xs font-mono text-[#78D4C4]">
                      <ChemText text={activeHotspot.role} />
                    </div>
                    <p className="text-[#DCE4E6] leading-relaxed">
                      <ChemText text={activeHotspot.detail} />
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveHotspot(null)}
                    className="min-h-[44px] px-3 rounded border border-[#2C454D] text-sm text-[#F5F2EA] hover:border-[#78D4C4] shrink-0 cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              )}
            </div>

            {/* Playback & Timeline Controls Bar directly below apparatus */}
            <div className="rounded border border-[#243439] bg-[#142126] p-4 space-y-4">
              {/* Primary & Secondary Action Buttons + Playback Speed */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrimaryPlayToggle}
                    className="min-h-[44px] inline-flex items-center gap-2 px-5 rounded bg-[#78D4C4] text-[#10191C] font-semibold text-sm sm:text-base hover:bg-[#91E0D2] transition-colors cursor-pointer"
                  >
                    {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {primaryButtonLabel}
                  </button>

                  <button
                    type="button"
                    onClick={handleStepForward}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 rounded border border-[#314850] bg-[#0F1A1E] text-[#F5F2EA] text-sm font-medium hover:border-[#78D4C4] transition-colors cursor-pointer"
                  >
                    <StepForward className="w-4 h-4" />
                    Từng bước
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 rounded border border-[#314850] bg-[#0F1A1E] text-[#F5F2EA] text-sm font-medium hover:border-[#C77B4C] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Đặt lại
                  </button>
                </div>

                {/* Screen Playback Speed (distinct from real electrolysis time!) */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#B7C4C7]">Tốc độ phát trên màn hình:</span>
                  <div
                    role="group"
                    aria-label="Tốc độ phát trên màn hình"
                    className="inline-flex rounded border border-[#293D44] bg-[#0C1316] p-0.5"
                  >
                    {[0.5, 1, 2, 4].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        aria-pressed={playbackSpeed === spd}
                        onClick={() => setPlaybackSpeed(spd)}
                        className={`min-h-[38px] min-w-[38px] px-2 text-xs font-mono rounded transition-colors cursor-pointer ${
                          playbackSpeed === spd
                            ? 'bg-[#29434A] text-[#78D4C4] font-semibold'
                            : 'text-[#B7C4C7] hover:text-[#F5F2EA]'
                        }`}
                      >
                        {formatViNumber(spd, { maxDecimals: 1 })}×
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Experiment-Specific Interactive Controls */}
              {experiment === 'pin-zn-cu' ? (
                <div className="pt-2 border-t border-[#22343A] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleTogglePinCircuit}
                      aria-pressed={pinCircuitClosed}
                      className={`min-h-[44px] px-3.5 rounded border text-sm font-medium transition-colors cursor-pointer ${
                        pinCircuitClosed
                          ? 'border-[#78D4C4] bg-[#13292E] text-[#78D4C4]'
                          : 'border-[#C77B4C] bg-[#281B14] text-[#F5D3BE]'
                      }`}
                    >
                      {pinCircuitClosed ? 'Khóa K: Đang đóng (bấm để mở)' : 'Khóa K: Đang mở (bấm để đóng)'}
                    </button>

                    <label className="min-h-[44px] inline-flex items-center gap-2 text-sm text-[#DCE4E6] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showConventionalCurrent}
                        onChange={(e) => setShowConventionalCurrent(e.target.checked)}
                        className="w-4 h-4 accent-[#F2C864]"
                      />
                      Hiện chiều dòng quy ước (I: Cu → Zn)
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleCompareWithElectrolysis}
                    className="min-h-[44px] inline-flex items-center gap-2 px-3.5 rounded border border-[#C77B4C] bg-[#221813] text-sm font-medium text-[#F5D3BE] hover:bg-[#2F2019] transition-colors cursor-pointer"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    So sánh với bình điện phân
                  </button>
                </div>
              ) : (
                /* Electrolysis Problem-Time Scrubber with Depletion Marker */
                <div className="pt-2 border-t border-[#22343A] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <label
                      htmlFor="electrolysis-time-scrubber"
                      className="font-medium text-[#F5F2EA]"
                    >
                      Thời gian điện phân trong bài toán (t)
                    </label>
                    <span className="font-mono tabular-nums text-[#78D4C4] font-semibold">
                      {formatViNumber(snapshot.timeSeconds, { maxDecimals: 1 })} s /{' '}
                      {formatViNumber(activeParams.totalTimeSeconds, { maxDecimals: 1 })} s
                    </span>
                  </div>

                  <div className="relative pt-1 pb-2">
                    <input
                      id="electrolysis-time-scrubber"
                      type="range"
                      min={0}
                      max={Math.max(activeParams.totalTimeSeconds, 1)}
                      step={activeParams.totalTimeSeconds > 200 ? 1 : 0.1}
                      value={snapshot.timeSeconds}
                      disabled={activeParams.totalTimeSeconds <= 0}
                      onChange={(e) => {
                        setIsRunning(false);
                        setCurrentTimeSeconds(Number(e.target.value));
                      }}
                      className="w-full accent-[#78D4C4] h-2 cursor-pointer"
                    />
                    {depletionPercent !== null && (
                      <div
                        className="pointer-events-none absolute top-0 bottom-0 flex flex-col items-center"
                        style={{ left: `${depletionPercent}%`, transform: 'translateX(-50%)' }}
                      >
                        <div className="w-0.5 h-5 bg-[#C77B4C]" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#B7C4C7]">
                    <span>0 s</span>
                    {depletionPercent !== null && depletionTime !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsRunning(false);
                          setCurrentTimeSeconds(depletionTime);
                        }}
                        className="text-[#F5D3BE] hover:underline font-medium cursor-pointer"
                      >
                        Mốc hết Cu²⁺: {formatViNumber(depletionTime, { maxDecimals: 1 })} s (bấm để nhảy tới)
                      </button>
                    )}
                    <span>{formatViNumber(activeParams.totalTimeSeconds, { maxDecimals: 1 })} s</span>
                  </div>

                  {experiment === 'dien-phan-cuso4' &&
                    cuso4Variant === 'cuso4-inert' &&
                    snapshot.reachedDepletion && (
                      <div className="rounded border border-[#C77B4C] bg-[#261B15] px-3 py-2 text-sm text-[#F5D3BE]">
                        <strong>Cu²⁺ đã hết theo mô hình</strong> (mốc{' '}
                        <span className="font-mono">
                          nₑ = 2n(Cu²⁺) = {formatViNumber(2 * activeParams.initialCu2Mol, { minDecimals: 3, maxDecimals: 4 })} mol
                        </span>
                        ).{' '}
                        {snapshot.stage === 2
                          ? 'Bình đang ở giai đoạn 2: cathode chuyển sang sinh khí H₂.'
                          : 'Kéo quá mốc này để quan sát giai đoạn 2 sinh khí H₂ ở cathode.'}
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT 1/3: Current Stage, Two Half-Reactions, Overall Equation & Forming Products */}
          <div className="lg:col-span-4 space-y-4">
            {/* Stage & Polarity Summary Card */}
            <div className="rounded border border-[#243439] bg-[#142126] p-4 space-y-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-[#78D4C4]">
                  Trạng thái &amp; Giai đoạn hiện tại
                </div>
                <h2
                  className="mt-1 font-serif text-lg font-semibold leading-snug"
                  style={{ color: '#F5F2EA' }}
                >
                  {experiment === 'pin-zn-cu'
                    ? pinCircuitClosed
                      ? PIN_STAGES[currentPinStageIndex].title
                      : 'Mạch đang mở · Không có dòng electron'
                    : snapshot.stageLabel}
                </h2>
              </div>

              {/* Open-Circuit Explicit Two-Line Notice for Pin Zn-Cu */}
              {experiment === 'pin-zn-cu' && !pinCircuitClosed && (
                <div className="rounded border border-[#C77B4C] bg-[#251A14] p-3 text-sm space-y-1">
                  <div className="font-semibold text-[#F5F2EA]">E°pin theo đề cương: 1,103 V</div>
                  <div className="font-semibold text-[#E39D6B]">Mạch đang mở</div>
                  <p className="text-[#DCE4E6] text-xs pt-0.5">
                    Khi mở khóa K, dòng electron ở dây ngoài và dòng ion qua cầu muối đều ngừng chuyển động.
                  </p>
                </div>
              )}

              {/* Two Half-Reactions */}
              <div className="space-y-3">
                {experiment === 'pin-zn-cu' ? (
                  <>
                    <div className="rounded border border-[#2A3F46] bg-[#0D1619] p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[#78D4C4]">
                        Anode (−) · Thanh Zn · Quá trình oxi hóa
                      </div>
                      <div className="mt-1 text-base font-medium text-[#F5F2EA]">
                        <ChemText text="Zn → Zn²⁺ + 2e⁻" />
                      </div>
                      <p className="mt-1 text-sm text-[#B7C4C7]">
                        Thanh Zn mòn dần, <ChemText text="[Zn²⁺]" /> tăng lên.
                      </p>
                    </div>

                    <div className="rounded border border-[#2A3F46] bg-[#0D1619] p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[#E39D6B]">
                        Cathode (+) · Thanh Cu · Quá trình khử
                      </div>
                      <div className="mt-1 text-base font-medium text-[#F5F2EA]">
                        <ChemText text="Cu²⁺ + 2e⁻ → Cu" />
                      </div>
                      <p className="mt-1 text-sm text-[#B7C4C7]">
                        Đồng đỏ bám thêm lên thanh Cu, <ChemText text="[Cu²⁺]" /> giảm, màu xanh nhạt dần.
                      </p>
                    </div>

                    <div className="rounded border border-[#23373D] bg-[#0B1316] p-3">
                      <div className="text-xs uppercase tracking-wide text-[#9BB0B5]">
                        Phương trình tổng &amp; Sức điện động chuẩn
                      </div>
                      <div className="mt-1 text-base font-medium text-[#F5F2EA]">
                        <ChemText text="Zn + Cu²⁺ → Zn²⁺ + Cu" />
                      </div>
                      <div className="mt-1 font-mono text-sm text-[#78D4C4]">
                        E°pin = 0,340 − (−0,763) = 1,103 V
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded border border-[#2A3F46] bg-[#0D1619] p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[#78D4C4]">
                        Cathode (−) · Nối cực âm DC · Quá trình khử
                      </div>
                      <div className="mt-1 text-base font-medium text-[#F5F2EA]">
                        <ChemText text={snapshot.cathodeEquation} />
                      </div>
                    </div>

                    <div className="rounded border border-[#2A3F46] bg-[#0D1619] p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[#E39D6B]">
                        Anode (+) · Nối cực dương DC · Quá trình oxi hóa
                      </div>
                      <div className="mt-1 text-base font-medium text-[#F5F2EA]">
                        <ChemText text={snapshot.anodeEquation} />
                      </div>
                    </div>

                    <div className="rounded border border-[#23373D] bg-[#0B1316] p-3">
                      <div className="text-xs uppercase tracking-wide text-[#9BB0B5]">
                        Phương trình tổng
                      </div>
                      <div className="mt-1 text-sm sm:text-base text-[#F5F2EA]">
                        <ChemText text={snapshot.overallEquation} />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Live Forming Products */}
              <div className="pt-2 border-t border-[#22343A] space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-[#9BB0B5]">
                  Sản phẩm &amp; Số liệu đang tạo ra
                </div>

                {experiment === 'pin-zn-cu' && (
                  <ul className="space-y-1.5 text-sm text-[#DCE4E6]">
                    <li>
                      • Sức điện động chuẩn: <strong className="font-mono text-[#78D4C4]">1,103 V</strong>{' '}
                      ({pinCircuitClosed ? 'mạch kín' : 'mạch mở'})
                    </li>
                    <li>
                      • Electron mạch ngoài: <ChemText text="Zn → Cu" />
                    </li>
                    <li>
                      • Ion trong cầu muối: <ChemText text="NO₃⁻ → cốc Zn" />, <ChemText text="K⁺ → cốc Cu" />
                    </li>
                  </ul>
                )}

                {experiment === 'dien-phan-cuso4' && cuso4Variant === 'cuso4-inert' && (
                  <dl className="grid grid-cols-2 gap-2 text-sm font-mono tabular-nums">
                    <div className="rounded bg-[#0C1316] p-2.5 border border-[#1E2E33]">
                      <dt className="font-sans text-xs text-[#9BB0B5]">Cu bám cathode</dt>
                      <dd className="text-[#E39D6B] font-semibold mt-0.5">
                        {formatViNumber(snapshot.cuPlatedG, { minDecimals: 3, maxDecimals: 3 })} g
                      </dd>
                    </div>
                    <div className="rounded bg-[#0C1316] p-2.5 border border-[#1E2E33]">
                      <dt className="font-sans text-xs text-[#9BB0B5]">
                        <ChemText text="Cu²⁺ còn lại" />
                      </dt>
                      <dd className="text-[#F5F2EA] font-semibold mt-0.5">
                        {formatViNumber(snapshot.cu2RemainingMol, { minDecimals: 4, maxDecimals: 4 })} mol
                      </dd>
                    </div>
                    <div className="rounded bg-[#0C1316] p-2.5 border border-[#1E2E33]">
                      <dt className="font-sans text-xs text-[#9BB0B5]">
                        <ChemText text="Khí O₂ (anode +)" />
                      </dt>
                      <dd className="text-[#78D4C4] font-semibold mt-0.5">
                        {formatViNumber(snapshot.o2Mol, { minDecimals: 4, maxDecimals: 4 })} mol
                      </dd>
                    </div>
                    <div className="rounded bg-[#0C1316] p-2.5 border border-[#1E2E33]">
                      <dt className="font-sans text-xs text-[#9BB0B5]">
                        <ChemText text="Khí H₂ (cathode −)" />
                      </dt>
                      <dd className="text-[#F5F2EA] font-semibold mt-0.5">
                        {formatViNumber(snapshot.h2Mol, { minDecimals: 4, maxDecimals: 4 })} mol
                      </dd>
                    </div>
                  </dl>
                )}

                {experiment === 'dien-phan-cuso4' && cuso4Variant === 'cuso4-copper' && (
                  <dl className="grid grid-cols-2 gap-2 text-sm font-mono tabular-nums">
                    <div className="rounded bg-[#0C1316] p-2.5 border border-[#1E2E33]">
                      <dt className="font-sans text-xs text-[#9BB0B5]">Cu tan ở anode (+)</dt>
                      <dd className="text-[#78D4C4] font-semibold mt-0.5">
                        {formatViNumber(snapshot.cuLostAtAnodeG, { minDecimals: 3, maxDecimals: 3 })} g
                      </dd>
                    </div>
                    <div className="rounded bg-[#0C1316] p-2.5 border border-[#1E2E33]">
                      <dt className="font-sans text-xs text-[#9BB0B5]">Cu bám cathode (−)</dt>
                      <dd className="text-[#E39D6B] font-semibold mt-0.5">
                        {formatViNumber(snapshot.cuPlatedG, { minDecimals: 3, maxDecimals: 3 })} g
                      </dd>
                    </div>
                    <div className="col-span-2 rounded bg-[#0C1316] p-2.5 border border-[#1E2E33] font-sans text-xs text-[#B7C4C7]">
                      Thanh Cu anode còn lại:{' '}
                      <strong className="font-mono text-[#F5F2EA]">
                        {formatViNumber(snapshot.anodeCuRemainingG, { minDecimals: 3, maxDecimals: 3 })} g
                      </strong>{' '}
                      / {formatViNumber(ANODE_COPPER_INITIAL_G, { minDecimals: 1, maxDecimals: 1 })} g · Khí thoát ra: 0 mol.
                    </div>
                  </dl>
                )}

                {experiment === 'dien-phan-nacl' && naclVariant === 'nacl-molten' && (
                  <dl className="grid grid-cols-2 gap-2 text-sm font-mono tabular-nums">
                    <div className="rounded bg-[#0C1316] p-2.5 border border-[#1E2E33]">
                      <dt className="font-sans text-xs text-[#9BB0B5]">Na lỏng (cathode −)</dt>
                      <dd className="text-[#E39D6B] font-semibold mt-0.5">
                        {formatViNumber(snapshot.naProducedG, { minDecimals: 3, maxDecimals: 3 })} g
                      </dd>
                    </div>
                    <div className="rounded bg-[#0C1316] p-2.5 border border-[#1E2E33]">
                      <dt className="font-sans text-xs text-[#9BB0B5]">
                        <ChemText text="Khí Cl₂ (anode +)" />
                      </dt>
                      <dd className="text-[#C8DF78] font-semibold mt-0.5">
                        {formatViNumber(snapshot.cl2Mol, { minDecimals: 4, maxDecimals: 4 })} mol
                      </dd>
                    </div>
                  </dl>
                )}

                {experiment === 'dien-phan-nacl' && naclVariant === 'nacl-brine' && (
                  <dl className="grid grid-cols-2 gap-2 text-sm font-mono tabular-nums">
                    <div className="rounded bg-[#0C1316] p-2.5 border border-[#1E2E33]">
                      <dt className="font-sans text-xs text-[#9BB0B5]">
                        <ChemText text="Khí H₂ (cathode −)" />
                      </dt>
                      <dd className="text-[#78D4C4] font-semibold mt-0.5">
                        {formatViNumber(snapshot.h2Mol, { minDecimals: 4, maxDecimals: 4 })} mol
                      </dd>
                    </div>
                    <div className="rounded bg-[#0C1316] p-2.5 border border-[#1E2E33]">
                      <dt className="font-sans text-xs text-[#9BB0B5]">
                        <ChemText text="Khí Cl₂ (anode +)" />
                      </dt>
                      <dd className="text-[#C8DF78] font-semibold mt-0.5">
                        {formatViNumber(snapshot.cl2Mol, { minDecimals: 4, maxDecimals: 4 })} mol
                      </dd>
                    </div>
                    <div className="col-span-2 rounded bg-[#0C1316] p-2.5 border border-[#1E2E33]">
                      <dt className="font-sans text-xs text-[#9BB0B5]">
                        <ChemText text="OH⁻ tích tụ (NaOH ở ngăn cathode)" />
                      </dt>
                      <dd className="text-[#F5F2EA] font-semibold mt-0.5">
                        {formatViNumber(snapshot.ohProducedMol, { minDecimals: 4, maxDecimals: 4 })} mol
                      </dd>
                    </div>
                  </dl>
                )}
              </div>

              {/* Reduced-motion discrete event list for accessibility */}
              {reducedMotion && experiment !== 'pin-zn-cu' && (
                <div className="pt-2 border-t border-[#22343A] space-y-1.5">
                  <div className="text-xs font-mono uppercase tracking-wider text-[#78D4C4]">
                    Các mốc sự kiện chính
                  </div>
                  <ol className="space-y-1 text-xs text-[#DCE4E6]">
                    {milestones.map((m, idx) => (
                      <li key={idx}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsRunning(false);
                            setCurrentTimeSeconds(m.timeSeconds);
                          }}
                          className="text-left hover:text-[#78D4C4] underline-offset-2 hover:underline cursor-pointer"
                        >
                          {idx + 1}. {m.label}: {m.description}
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* NaCl Conceptual Q&A Card */}
            {experiment === 'dien-phan-nacl' && (
              <div className="rounded border border-[#2C424A] bg-[#132227] p-4 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowNaClReason((v) => !v)}
                  aria-expanded={showNaClReason}
                  className="w-full min-h-[44px] flex items-center justify-between gap-2 text-left font-serif text-base font-semibold text-[#F5F2EA] cursor-pointer"
                >
                  <span>
                    Vì sao ở NaCl nóng chảy thu được Na, còn trong dung dịch lại thu được <ChemText text="H₂" />?
                  </span>
                  {showNaClReason ? (
                    <ChevronUp className="w-4 h-4 shrink-0 text-[#78D4C4]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 shrink-0 text-[#78D4C4]" />
                  )}
                </button>
                {showNaClReason && (
                  <div className="text-sm text-[#DCE4E6] space-y-2 pt-1 border-t border-[#22363D]">
                    <p>
                      • <strong>NaCl nóng chảy:</strong> Môi trường không có <ChemText text="H₂O" />, chỉ tồn tại{' '}
                      <ChemText text="Na⁺" /> và <ChemText text="Cl⁻" />. Vì vậy tại cathode (−), ion{' '}
                      <ChemText text="Na⁺" /> bắt buộc bị khử:{' '}
                      <strong className="text-[#E39D6B]">
                        <ChemText text="Na⁺ + e⁻ → Na" />
                      </strong>
                      .
                    </p>
                    <p>
                      • <strong>Dung dịch NaCl bão hòa:</strong> Có mặt phân tử nước (<ChemText text="H₂O" />). Vì{' '}
                      <ChemText text="H₂O" /> dễ bị khử hơn ion kim loại kiềm <ChemText text="Na⁺" /> rất nhiều, nên tại cathode (−) nước bị khử trước:{' '}
                      <strong className="text-[#78D4C4]">
                        <ChemText text="2H₂O + 2e⁻ → H₂↑ + 2OH⁻" />
                      </strong>
                      , để lại <ChemText text="Na⁺" /> và <ChemText text="OH⁻" /> tạo thành dung dịch NaOH.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Post-Final-Event Summary Card (Prediction Result + Phenomenon Remark + Direct Lesson Link) */}
            {isAtEnd && hasStarted && (
              <div
                role="region"
                aria-label="Tổng kết thí nghiệm"
                className="rounded border border-[#78D4C4] bg-[#12262B] p-4 space-y-3"
              >
                <div className="flex items-center gap-2 text-[#78D4C4] font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  Đã hoàn tất lượt quan sát
                </div>

                {currentPrediction.status === 'answered' && currentPrediction.chosenIndex !== null && (
                  <div className="text-sm text-[#F5F2EA]">
                    <strong>Kết quả dự đoán: </strong>
                    {currentPrediction.chosenIndex === predictionPrompt.correctIndex ? (
                      <span className="text-[#78D4C4] font-semibold">Chính xác!</span>
                    ) : (
                      <span className="text-[#E39D6B] font-semibold">
                        Chưa đúng với thực nghiệm — hãy đối chiếu lại hiện tượng.
                      </span>
                    )}
                    <p className="mt-1 text-[#DCE4E6]">
                      <ChemText text={predictionPrompt.explanation} />
                    </p>
                  </div>
                )}

                {currentPrediction.status !== 'answered' && (
                  <p className="text-sm text-[#DCE4E6]">
                    <strong className="text-[#F5F2EA]">Nhận xét hiện tượng: </strong>
                    <ChemText text={predictionPrompt.explanation} />
                  </p>
                )}

                {onOpenLesson && (
                  <button
                    type="button"
                    onClick={() => onOpenLesson(lessonForExperiment.slug)}
                    className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 px-4 rounded bg-[#C77B4C] text-[#10191C] font-semibold text-sm hover:bg-[#D98E5F] transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    {lessonForExperiment.label}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expandable "Thông số & kết quả" Section (Inputs, Faraday Derivation, Chart, Table) */}
        <div className="rounded border border-[#243439] bg-[#142126]">
          <button
            type="button"
            onClick={() => setShowParamsPanel((v) => !v)}
            aria-expanded={showParamsPanel}
            className="w-full min-h-[52px] px-4 sm:px-5 py-3 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-[#18272D] transition-colors"
          >
            <div>
              <span className="font-serif text-lg font-semibold text-[#F5F2EA]">
                Thông số &amp; kết quả
              </span>
              <span className="block sm:inline sm:ml-3 text-sm text-[#B7C4C7]">
                {experiment === 'pin-zn-cu'
                  ? 'Công thức tính E°pin chuẩn và bảng đối chiếu hiện tượng ở hai bán pin'
                  : 'Chỉnh dòng điện I, thời gian t, xem cách tính Faraday, đồ thị và bảng số liệu'}
              </span>
            </div>
            {showParamsPanel ? (
              <ChevronUp className="w-5 h-5 text-[#78D4C4] shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#78D4C4] shrink-0" />
            )}
          </button>

          {showParamsPanel && (
            <div className="border-t border-[#243439] p-4 sm:p-5 space-y-6">
              {experiment === 'pin-zn-cu' ? (
                <div className="grid md:grid-cols-2 gap-5 text-sm sm:text-base">
                  <div className="rounded border border-[#243439] bg-[#0C1316] p-4 space-y-2">
                    <h3 className="font-serif text-base font-semibold" style={{ color: '#F5F2EA' }}>
                      Tính sức điện động chuẩn <ChemText text="E°pin" />
                    </h3>
                    <p className="text-[#DCE4E6]">
                      Áp dụng công thức đề cương: <ChemText text="E°pin = E°(cathode) − E°(anode)" />
                    </p>
                    <div className="font-mono text-[#78D4C4] bg-[#111E22] p-3 rounded border border-[#1E3339]">
                      E°pin = E°(Cu²⁺/Cu) − E°(Zn²⁺/Zn)
                      <br />
                      E°pin = (+0,340 V) − (−0,763 V) = <strong>1,103 V</strong>
                    </div>
                    <p className="text-xs text-[#9BB0B5]">
                      Giá trị 1,103 V xác định ở điều kiện chuẩn (nồng độ ion 1 M, nhiệt độ 25 °C).
                    </p>
                  </div>

                  <div className="rounded border border-[#243439] bg-[#0C1316] p-4 space-y-2">
                    <h3 className="font-serif text-base font-semibold" style={{ color: '#F5F2EA' }}>
                      Tóm tắt biến đổi định tính khi pin phóng điện
                    </h3>
                    <ul className="space-y-1.5 text-sm text-[#DCE4E6]">
                      <li>• <strong>Anode (−) Zn:</strong> bị oxi hóa, khối lượng giảm dần.</li>
                      <li>• <strong>Dung dịch <ChemText text="ZnSO₄" />:</strong> nồng độ <ChemText text="Zn²⁺" /> tăng, nhận <ChemText text="NO₃⁻" /> từ cầu muối.</li>
                      <li>• <strong>Cathode (+) Cu:</strong> đồng bám thêm, khối lượng tăng dần.</li>
                      <li>• <strong>Dung dịch <ChemText text="CuSO₄" />:</strong> nồng độ <ChemText text="Cu²⁺" /> giảm, màu xanh nhạt dần, nhận <ChemText text="K⁺" /> từ cầu muối.</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <>
                  {/* Editable Initial Parameters Form */}
                  <form onSubmit={handleApplyParams} className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3
                        className="font-serif text-base font-semibold"
                        style={{ color: '#F5F2EA' }}
                      >
                        Thông số điện phân ban đầu (Faraday)
                      </h3>
                      {isRunning && (
                        <span className="text-xs text-[#E39D6B] font-medium">
                          Hãy bấm “Tạm dừng” trước khi chỉnh và áp dụng thông số mới.
                        </span>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label
                          htmlFor="sim-input-current"
                          className="block text-sm text-[#DCE4E6] mb-1"
                        >
                          Cường độ dòng điện I (A)
                        </label>
                        <input
                          id="sim-input-current"
                          type="text"
                          inputMode="decimal"
                          disabled={isRunning}
                          value={activeRawInput.currentStr}
                          onChange={(e) => handleRawInputChange('currentStr', e.target.value)}
                          className="w-full min-h-[44px] px-3 rounded border border-[#2D434B] bg-[#0C1316] text-[#F5F2EA] font-mono disabled:opacity-60"
                        />
                        {inputErrors.current && (
                          <p role="alert" className="mt-1 text-xs text-[#F5A882]">
                            {inputErrors.current}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="sim-input-time"
                          className="block text-sm text-[#DCE4E6] mb-1"
                        >
                          Thời gian điện phân t
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            id="sim-input-time"
                            type="text"
                            inputMode="decimal"
                            disabled={isRunning}
                            value={activeRawInput.timeStr}
                            onChange={(e) => handleRawInputChange('timeStr', e.target.value)}
                            className="w-full min-h-[44px] px-3 rounded border border-[#2D434B] bg-[#0C1316] text-[#F5F2EA] font-mono disabled:opacity-60"
                          />
                          <select
                            aria-label="Đơn vị thời gian"
                            disabled={isRunning}
                            value={activeRawInput.timeUnit}
                            onChange={(e) =>
                              handleRawInputChange('timeUnit', e.target.value as TimeUnit)
                            }
                            className="min-h-[44px] px-2.5 rounded border border-[#2D434B] bg-[#0C1316] text-[#F5F2EA] text-sm disabled:opacity-60"
                          >
                            <option value="s">giây (s)</option>
                            <option value="min">phút</option>
                            <option value="h">giờ</option>
                          </select>
                        </div>
                        {inputErrors.time && (
                          <p role="alert" className="mt-1 text-xs text-[#F5A882]">
                            {inputErrors.time}
                          </p>
                        )}
                      </div>

                      {activeElectrolysisVariant === 'cuso4-inert' && (
                        <div>
                          <label
                            htmlFor="sim-input-cu2"
                            className="block text-sm text-[#DCE4E6] mb-1"
                          >
                            <ChemText text="Số mol Cu²⁺ ban đầu (mol)" />
                          </label>
                          <input
                            id="sim-input-cu2"
                            type="text"
                            inputMode="decimal"
                            disabled={isRunning}
                            value={activeRawInput.initialCu2MolStr}
                            onChange={(e) =>
                              handleRawInputChange('initialCu2MolStr', e.target.value)
                            }
                            className="w-full min-h-[44px] px-3 rounded border border-[#2D434B] bg-[#0C1316] text-[#F5F2EA] font-mono disabled:opacity-60"
                          />
                          {inputErrors.initialCu2Mol && (
                            <p role="alert" className="mt-1 text-xs text-[#F5A882]">
                              {inputErrors.initialCu2Mol}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-end gap-2">
                        <button
                          type="submit"
                          disabled={isRunning}
                          className="min-h-[44px] px-4 rounded bg-[#78D4C4] text-[#10191C] font-semibold text-sm hover:bg-[#91E0D2] disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          Áp dụng thông số
                        </button>
                        <button
                          type="button"
                          onClick={handleRestoreDefaultParams}
                          className="min-h-[44px] px-3 rounded border border-[#2E444C] text-sm text-[#DCE4E6] hover:border-[#78D4C4] cursor-pointer"
                        >
                          Mặc định
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Live Faraday Summary Strip & "Xem cách tính" */}
                  <div className="rounded border border-[#243439] bg-[#0C1316] p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm tabular-nums">
                        <span>
                          <span className="font-sans text-[#9BB0B5]">Q = It = </span>
                          <strong className="text-[#F5F2EA]">
                            {formatViNumber(snapshot.chargeC, { maxDecimals: 1 })} C
                          </strong>
                        </span>
                        <span>
                          <span className="font-sans text-[#9BB0B5]">
                            <ChemText text="nₑ = Q/F = " />
                          </span>
                          <strong className="text-[#78D4C4]">
                            {formatViNumber(snapshot.electronMol, {
                              minDecimals: 4,
                              maxDecimals: 4,
                            })}{' '}
                            mol
                          </strong>
                        </span>
                        {activeElectrolysisVariant === 'cuso4-inert' && (
                          <>
                            <span>
                              <span className="font-sans text-[#9BB0B5]">V(O₂) = </span>
                              <strong className="text-[#DCE4E6]">
                                {formatViNumber(snapshot.o2VolumeL, {
                                  minDecimals: 3,
                                  maxDecimals: 3,
                                })}{' '}
                                L
                              </strong>
                            </span>
                            <span>
                              <span className="font-sans text-[#9BB0B5]">V(H₂) = </span>
                              <strong className="text-[#DCE4E6]">
                                {formatViNumber(snapshot.h2VolumeL, {
                                  minDecimals: 3,
                                  maxDecimals: 3,
                                })}{' '}
                                L
                              </strong>
                            </span>
                          </>
                        )}
                        {activeElectrolysisVariant === 'nacl-molten' && (
                          <span>
                            <span className="font-sans text-[#9BB0B5]">V(Cl₂) = </span>
                            <strong className="text-[#C8DF78]">
                              {formatViNumber(snapshot.cl2VolumeL, {
                                minDecimals: 3,
                                maxDecimals: 3,
                              })}{' '}
                              L
                            </strong>
                          </span>
                        )}
                        {activeElectrolysisVariant === 'nacl-brine' && (
                          <>
                            <span>
                              <span className="font-sans text-[#9BB0B5]">V(H₂) = </span>
                              <strong className="text-[#78D4C4]">
                                {formatViNumber(snapshot.h2VolumeL, {
                                  minDecimals: 3,
                                  maxDecimals: 3,
                                })}{' '}
                                L
                              </strong>
                            </span>
                            <span>
                              <span className="font-sans text-[#9BB0B5]">V(Cl₂) = </span>
                              <strong className="text-[#C8DF78]">
                                {formatViNumber(snapshot.cl2VolumeL, {
                                  minDecimals: 3,
                                  maxDecimals: 3,
                                })}{' '}
                                L
                              </strong>
                            </span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowDerivation((v) => !v)}
                        aria-expanded={showDerivation}
                        className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 rounded border border-[#78D4C4]/70 text-sm font-medium text-[#78D4C4] hover:bg-[#13292E] cursor-pointer"
                      >
                        {showDerivation ? 'Ẩn cách tính' : 'Xem cách tính'}
                        {showDerivation ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-[#9BB0B5]">
                      Hằng số sử dụng: F = 96 500 C/mol · V khí (25 °C, 1 bar) = n × 24,79 L · M(Cu) = 63,5 g/mol · Cùng một số mol electron{' '}
                      <ChemText text="nₑ" /> đi qua cả hai điện cực (không nhân đôi).{' '}
                      {activeElectrolysisVariant === 'cuso4-inert' &&
                        'Mô hình lí tưởng (hiệu suất 100%, bỏ qua phản ứng phụ và độ tan khí).'}
                      {activeElectrolysisVariant === 'cuso4-copper' &&
                        `Điều kiện áp dụng: hiệu suất 100% và thời gian trong giới hạn thanh Cu anode ${formatViNumber(ANODE_COPPER_INITIAL_G, { minDecimals: 1, maxDecimals: 1 })} g chưa tan hết.`}
                    </p>

                    {showDerivation && (
                      <ol className="pt-3 border-t border-[#1D2C31] space-y-2.5 text-sm">
                        {derivationSteps.map((step, idx) => (
                          <li
                            key={idx}
                            className="rounded bg-[#111C20] p-3 border border-[#203238] space-y-1"
                          >
                            <div className="font-semibold text-[#F5F2EA]">
                              <ChemText text={step.title} />
                            </div>
                            <div className="font-mono text-xs sm:text-sm text-[#DCE4E6]">
                              <ChemText text={step.formula} />
                            </div>
                            <div className="font-mono text-xs sm:text-sm text-[#78D4C4]">
                              ⇒ <ChemText text={step.substitution} /> ={' '}
                              <strong>
                                <ChemText text={step.result} />
                              </strong>
                            </div>
                            {step.note && (
                              <p className="text-xs text-[#B7C4C7]">
                                <ChemText text={step.note} />
                              </p>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  {/* Quantitative Time-Axis Chart + Accessible Data Table */}
                  <ElectrochemChart params={activeParams} snapshot={snapshot} />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
