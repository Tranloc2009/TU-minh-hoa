import React, { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import { ChemText } from './ChemText';
import { FaradayCalculator } from './FaradayCalculator';
import { CuSO4SimSvg, MoltenNaClSimSvg, ZnCuSimSvg } from './SimulationDiagrams';

export type SimTabId = 'pin-zn-cu' | 'dien-phan-cuso4' | 'nacl-nong-chay' | 'faraday';

interface SimConfig {
  id: Exclude<SimTabId, 'faraday'>;
  title: string;
  systemType: string;
  predictionQuestion: string;
  predictionOptions: string[];
  correctPredictionIndex: number;
  predictionExplanation: string;
  steps: string[];
}

const SIM_CONFIGS: Record<Exclude<SimTabId, 'faraday'>, SimConfig> = {
  'pin-zn-cu': {
    id: 'pin-zn-cu',
    title: 'Pin Galvani Zn–Cu',
    systemType: 'Pin điện hóa · Anode (−) và Cathode (+)',
    predictionQuestion:
      'Dự đoán trước khi chạy: Khi đóng khóa K của pin Zn–Cu, electron ở dây dẫn ngoài và ion NO₃⁻ trong cầu muối sẽ di chuyển về phía nào?',
    predictionOptions: [
      'Electron đi từ Zn → Cu; ion NO₃⁻ đi sang ngăn Zn.',
      'Electron đi từ Cu → Zn; ion NO₃⁻ đi sang ngăn Cu.',
      'Electron chạy qua cầu muối từ Zn sang Cu.',
    ],
    correctPredictionIndex: 0,
    predictionExplanation:
      'Tại anode (−), Zn bị oxi hóa (Zn → Zn²⁺ + 2e⁻) giải phóng electron đi qua dây ngoài sang cathode (+) Cu (nơi Cu²⁺ + 2e⁻ → Cu). Để trung hòa điện tích dương Zn²⁺ sinh thêm, anion NO₃⁻ trong cầu muối di chuyển sang ngăn Zn và cation K⁺ sang ngăn Cu.',
    steps: [
      'Trạng thái ban đầu: Hai bán pin Zn²⁺/Zn (−0,763 V) và Cu²⁺/Cu (+0,340 V) ở 1 M, 25 °C nối qua vôn kế và cầu muối KNO₃.',
      'Bước 1 (Anode −): Thanh Zn nhường electron (Zn → Zn²⁺ + 2e⁻), khối lượng thanh Zn giảm dần; electron đi lên dây dẫn ngoài về phía Cu.',
      'Bước 2 (Cathode +): Tại thanh Cu, ion Cu²⁺ nhận electron (Cu²⁺ + 2e⁻ → Cu) tạo lớp đồng đỏ bám lên thanh Cu; màu xanh dung dịch nhạt dần.',
      'Bước 3 (Cầu muối KNO₃): Ion NO₃⁻ di chuyển vào ngăn Zn và ion K⁺ di chuyển vào ngăn Cu để giữ trung hòa điện tích, duy trì sức điện động chuẩn 1,103 V.',
    ],
  },
  'dien-phan-cuso4': {
    id: 'dien-phan-cuso4',
    title: 'Điện phân dung dịch CuSO₄',
    systemType: 'Bình điện phân · Anode (+) và Cathode (−)',
    predictionQuestion:
      'Dự đoán trước khi chạy: Nếu thay anode than chì (trơ) bằng anode bằng đồng (Cu) trong bình điện phân CuSO₄, hiện tượng ở anode (+) thay đổi như thế nào?',
    predictionOptions: [
      'Vẫn có khí O₂ thoát ra mạnh như cũ.',
      'Không còn khí O₂ thoát ra; chính thanh Cu anode bị oxi hóa tan dần tạo Cu²⁺.',
      'Đồng bám dày lên thanh anode (+).',
    ],
    correctPredictionIndex: 1,
    predictionExplanation:
      'Với anode trơ, nước bị oxi hóa tạo khí O₂ (2H₂O → O₂↑ + 4H⁺ + 4e⁻). Khi đổi sang anode Cu (anode tan), kim loại Cu dễ bị oxi hóa hơn H₂O nên xảy ra Cu → Cu²⁺ + 2e⁻, giữ nồng độ Cu²⁺ trong dung dịch không đổi.',
    steps: [
      'Trạng thái ban đầu: Nối nguồn điện một chiều (DC) — cực âm nối Cathode (−), cực dương nối Anode (+). Chú ý dấu cực ngược lại so với pin Galvani!',
      'Bước 1 (Di chuyển ion): Dưới điện trường nguồn DC, cation Cu²⁺ tiến về Cathode (−); electron rời Anode (+) đi qua nguồn DC về Cathode (−).',
      'Bước 2 (Tại Cathode −): Ion Cu²⁺ nhận 2e⁻ bị khử tạo lớp kim loại Cu màu đỏ đồng bám lên bề mặt Cathode (Cu²⁺ + 2e⁻ → Cu).',
      'Bước 3 (Tại Anode +): Với điện cực trơ, H₂O bị oxi hóa giải phóng bọt khí O₂ và nồng độ Cu²⁺ giảm dần; với anode Cu, thanh Cu tan ra thành Cu²⁺ bù đúng lượng đã khử nên màu dung dịch giữ nguyên.',
    ],
  },
  'nacl-nong-chay': {
    id: 'nacl-nong-chay',
    title: 'Điện phân NaCl nóng chảy',
    systemType: 'Bình điện phân nóng chảy · Không có nước',
    predictionQuestion:
      'Dự đoán trước khi chạy: Khi điện phân NaCl nóng chảy (~801 °C), sản phẩm tạo thành ở Cathode (−) là gì?',
    predictionOptions: [
      'Khí H₂ và dung dịch NaOH.',
      'Kim loại natri (Na) ở trạng thái lỏng.',
      'Khí chlorine (Cl₂) màu vàng lục.',
    ],
    correctPredictionIndex: 1,
    predictionExplanation:
      'Hệ NaCl nóng chảy chỉ gồm ion Na⁺ và Cl⁻ (hoàn toàn không có H₂O). Do đó ở cathode (−), ion Na⁺ nhận electron bị khử trực tiếp thành kim loại Na lỏng (Na⁺ + e⁻ → Na); còn ở anode (+), Cl⁻ bị oxi hóa thành khí Cl₂ (2Cl⁻ → Cl₂↑ + 2e⁻).',
    steps: [
      'Trạng thái ban đầu: Muối NaCl được đun nóng chảy ở ~801 °C phân li hoàn toàn thành các ion tự do Na⁺ và Cl⁻ (không có mặt nước).',
      'Bước 1 (Phân cực bởi nguồn DC): Cation Na⁺ di chuyển về Cathode (−); anion Cl⁻ di chuyển về Anode (+).',
      'Bước 2 (Quá trình tại hai cực): Tại Cathode (−): Na⁺ + e⁻ → Na(l) nổi lên lớp trên; tại Anode (+): 2Cl⁻ → Cl₂↑ + 2e⁻ tạo bọt khí vàng lục thoát ra.',
      'Bước 3 (Phản ứng tổng): 2NaCl —đpnc→ 2Na(l) + Cl₂↑. Đây là phương pháp công nghiệp điều chế kim loại kiềm Na.',
    ],
  },
};

interface SimulationLabProps {
  initialTab: SimTabId;
  onTabChange: (tab: SimTabId) => void;
}

export const SimulationLab: React.FC<SimulationLabProps> = ({ initialTab, onTabChange }) => {
  const [activeTab, setActiveTab] = useState<SimTabId>(initialTab);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [step, setStep] = useState<number>(0);

  // Specific parameters
  const [isCircuitClosed, setIsCircuitClosed] = useState<boolean>(true);
  const [cuso4Mode, setCuso4Mode] = useState<'inert' | 'copper'>('inert');

  // Prediction answers per simulation
  const [predictions, setPredictions] = useState<Record<string, number | null>>({
    'pin-zn-cu': null,
    'dien-phan-cuso4': null,
    'nacl-nong-chay': null,
  });

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Automatic step progression while running
  useEffect(() => {
    if (!isRunning || activeTab === 'faraday') return;
    if (activeTab === 'pin-zn-cu' && !isCircuitClosed) {
      setIsRunning(false);
      return;
    }

    const timer = window.setInterval(() => {
      setStep((prev) => (prev < 3 ? prev + 1 : 3));
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isRunning, activeTab, isCircuitClosed]);

  const handleSelectTab = (tab: SimTabId) => {
    setActiveTab(tab);
    onTabChange(tab);
    setIsRunning(false);
    setStep(0);
  };

  const handleStart = () => {
    if (activeTab === 'pin-zn-cu' && !isCircuitClosed) {
      setIsCircuitClosed(true);
    }
    setStep((prev) => (prev === 0 ? 1 : prev));
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleNextStep = () => {
    setIsRunning(false);
    if (activeTab === 'pin-zn-cu' && !isCircuitClosed) {
      setIsCircuitClosed(true);
    }
    setStep((prev) => (prev < 3 ? prev + 1 : 0));
  };

  const handleReset = () => {
    setIsRunning(false);
    setStep(0);
    if (activeTab === 'pin-zn-cu') {
      setIsCircuitClosed(true);
    }
  };

  const handleToggleCircuit = (closed: boolean) => {
    setIsCircuitClosed(closed);
    if (!closed) {
      setIsRunning(false);
    }
  };

  const currentSim = activeTab !== 'faraday' ? SIM_CONFIGS[activeTab] : null;
  const chosenPrediction = currentSim ? predictions[currentSim.id] : null;

  const getReactionSummary = () => {
    if (activeTab === 'pin-zn-cu') {
      return {
        anodeLabel: 'Anode (−) · thanh Zn (Oxi hóa)',
        anodeEq: 'Zn → Zn²⁺ + 2e⁻',
        cathodeLabel: 'Cathode (+) · thanh Cu (Khử)',
        cathodeEq: 'Cu²⁺ + 2e⁻ → Cu',
        overallEq: 'Zn + Cu²⁺ → Zn²⁺ + Cu   (E°pin = 1,103 V)',
        products: 'Ion Zn²⁺ tan thêm (thanh Zn mòn); kim loại Cu bám lên thanh Cu; mạch ngoài có dòng điện 1,103 V.',
      };
    }
    if (activeTab === 'dien-phan-cuso4') {
      if (cuso4Mode === 'inert') {
        return {
          anodeLabel: 'Anode (+) · Điện cực trơ Pt/C (Oxi hóa)',
          anodeEq: '2H₂O → O₂↑ + 4H⁺ + 4e⁻',
          cathodeLabel: 'Cathode (−) · Điện cực trơ (Khử)',
          cathodeEq: 'Cu²⁺ + 2e⁻ → Cu',
          overallEq: '2CuSO₄ + 2H₂O —đpdd→ 2Cu + O₂↑ + 2H₂SO₄',
          products: 'Kim loại Cu bám lên cathode (−); khí O₂ thoát ra ở anode (+); dung dịch nhạt màu xanh và tăng tính acid (H⁺).',
        };
      }
      return {
        anodeLabel: 'Anode (+) · Thanh Cu tan (Oxi hóa)',
        anodeEq: 'Cu → Cu²⁺ + 2e⁻',
        cathodeLabel: 'Cathode (−) · Thanh dẫn (Khử)',
        cathodeEq: 'Cu²⁺ + 2e⁻ → Cu',
        overallEq: 'Cu (anode) → Cu (cathode)  ·  [Cu²⁺] không đổi',
        products: 'Thanh Cu ở anode mòn dần tạo Cu²⁺; kim loại Cu tinh khiết bám lên cathode; không có khí thoát ra.',
      };
    }
    return {
      anodeLabel: 'Anode (+) · Điện cực than chì (Oxi hóa)',
      anodeEq: '2Cl⁻ → Cl₂↑ + 2e⁻',
      cathodeLabel: 'Cathode (−) · Điện cực trơ (Khử)',
      cathodeEq: 'Na⁺ + e⁻ → Na(l)',
      overallEq: '2NaCl —đpnc→ 2Na(l) + Cl₂↑',
      products: 'Kim loại natri nóng chảy Na(l) ở cathode (−); khí chlorine Cl₂ màu vàng lục ở anode (+).',
    };
  };

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <header className="mb-4">
        <p className="text-sm text-ink-muted">Hóa học 12 · Chương 5</p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-ink font-serif mt-1">
          Phòng mô phỏng điện hóa &amp; Máy tính Faraday
        </h1>
        <p className="text-base text-ink-muted mt-1.5 max-w-3xl">
          Quan sát đường đi của electron ở dây dẫn ngoài, sự di chuyển của ion trong dung dịch hoặc cầu muối, và sự đổi dấu cực giữa pin Galvani với bình điện phân.
        </p>
      </header>

      {/* Selector Bar */}
      <div
        className="flex flex-wrap gap-2 border-b border-rule pb-4 mb-6"
        role="tablist"
        aria-label="Chọn mô phỏng hoặc máy tính Faraday"
      >
        {(
          [
            { id: 'pin-zn-cu', label: 'Pin Zn–Cu' },
            { id: 'dien-phan-cuso4', label: 'Điện phân CuSO₄' },
            { id: 'nacl-nong-chay', label: 'NaCl nóng chảy' },
            { id: 'faraday', label: 'Máy tính Faraday' },
          ] as { id: SimTabId; label: string }[]
        ).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleSelectTab(tab.id)}
              className={`min-h-[44px] px-4 py-2 text-sm sm:text-base font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-verdigris text-white border-verdigris'
                  : 'bg-paper-soft text-ink border-rule hover:border-verdigris hover:text-verdigris'
              }`}
            >
              <ChemText text={tab.label} />
            </button>
          );
        })}
      </div>

      {activeTab === 'faraday' ? (
        <FaradayCalculator />
      ) : currentSim ? (
        <div className="space-y-6">
          {/* Prediction Box before running */}
          <section
            aria-labelledby="prediction-heading"
            className="bg-paper-soft border border-rule p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <h2 id="prediction-heading" className="text-lg font-semibold text-ink font-serif">
                Câu hỏi dự đoán trước khi chạy
              </h2>
              <span className="text-xs text-ink-muted">{currentSim.systemType}</span>
            </div>
            <p className="text-base text-ink mb-4">
              <ChemText text={currentSim.predictionQuestion} />
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {currentSim.predictionOptions.map((option, idx) => {
                const isSelected = chosenPrediction === idx;
                const isCorrect = idx === currentSim.correctPredictionIndex;
                let styleClass =
                  'bg-paper border-rule text-ink hover:border-verdigris';
                if (chosenPrediction !== null) {
                  if (isSelected && isCorrect) {
                    styleClass = 'bg-verdigris-tint border-verdigris text-ink font-medium';
                  } else if (isSelected && !isCorrect) {
                    styleClass = 'bg-copper-tint border-copper text-ink font-medium';
                  } else if (isCorrect) {
                    styleClass = 'bg-verdigris-tint/50 border-verdigris text-ink';
                  }
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPredictions((prev) => ({ ...prev, [currentSim.id]: idx }));
                      if (step === 0) {
                        setStep(1);
                        setIsRunning(true);
                      }
                    }}
                    className={`min-h-[44px] px-3.5 py-2.5 text-left text-sm border transition-colors cursor-pointer ${styleClass}`}
                  >
                    <ChemText text={option} />
                  </button>
                );
              })}
            </div>
            {chosenPrediction !== null && (
              <div
                className="mt-4 pt-3.5 border-t border-rule text-sm leading-relaxed"
                role="status"
              >
                <strong
                  className={
                    chosenPrediction === currentSim.correctPredictionIndex
                      ? 'text-verdigris'
                      : 'text-copper'
                  }
                >
                  {chosenPrediction === currentSim.correctPredictionIndex
                    ? 'Dự đoán chính xác. '
                    : 'Chưa chính xác — hãy đối chiếu trên sơ đồ đang chạy. '}
                </strong>
                <ChemText text={currentSim.predictionExplanation} />
              </div>
            )}
          </section>

          {/* Main Interactive Stage + Controls */}
          <div className="bg-paper-soft border border-rule p-4 sm:p-6 space-y-5">
            {/* Toolbar: Controls + Mode-specific toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rule">
              <div className="flex flex-wrap items-center gap-2.5">
                {!isRunning ? (
                  <button
                    type="button"
                    onClick={handleStart}
                    className="min-h-[44px] px-4 py-2 bg-verdigris hover:bg-verdigris-dark text-white text-sm font-medium inline-flex items-center gap-2 cursor-pointer whitespace-nowrap transition-colors"
                  >
                    <Play className="w-4 h-4" aria-hidden="true" />
                    <span>Bắt đầu</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePause}
                    className="min-h-[44px] px-4 py-2 bg-copper hover:bg-copper-dark text-white text-sm font-medium inline-flex items-center gap-2 cursor-pointer whitespace-nowrap transition-colors"
                  >
                    <Pause className="w-4 h-4" aria-hidden="true" />
                    <span>Tạm dừng</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="min-h-[44px] px-3.5 py-2 bg-paper border border-rule hover:border-verdigris text-ink text-sm font-medium inline-flex items-center gap-2 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <StepForward className="w-4 h-4" aria-hidden="true" />
                  <span>Từng bước ({step}/3)</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="min-h-[44px] px-3.5 py-2 bg-paper border border-rule hover:border-ink text-ink text-sm font-medium inline-flex items-center gap-2 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  <span>Đặt lại</span>
                </button>
              </div>

              {/* Simulation-Specific Toggle */}
              {activeTab === 'pin-zn-cu' && (
                <div className="flex items-center gap-2" role="group" aria-label="Trạng thái khóa mạch điện">
                  <span className="text-sm text-ink-muted mr-1">Mạch điện:</span>
                  <button
                    type="button"
                    aria-pressed={isCircuitClosed}
                    onClick={() => handleToggleCircuit(true)}
                    className={`min-h-[44px] px-3.5 py-2 text-sm font-medium border cursor-pointer whitespace-nowrap ${
                      isCircuitClosed
                        ? 'bg-verdigris-tint border-verdigris text-ink'
                        : 'bg-paper border-rule text-ink-muted hover:text-ink'
                    }`}
                  >
                    Đóng mạch
                  </button>
                  <button
                    type="button"
                    aria-pressed={!isCircuitClosed}
                    onClick={() => handleToggleCircuit(false)}
                    className={`min-h-[44px] px-3.5 py-2 text-sm font-medium border cursor-pointer whitespace-nowrap ${
                      !isCircuitClosed
                        ? 'bg-copper-tint border-copper text-ink'
                        : 'bg-paper border-rule text-ink-muted hover:text-ink'
                    }`}
                  >
                    Mở mạch
                  </button>
                </div>
              )}

              {activeTab === 'dien-phan-cuso4' && (
                <div className="flex items-center gap-2" role="group" aria-label="Chọn loại điện cực cho bình điện phân CuSO4">
                  <span className="text-sm text-ink-muted mr-1">Loại anode:</span>
                  <button
                    type="button"
                    aria-pressed={cuso4Mode === 'inert'}
                    onClick={() => setCuso4Mode('inert')}
                    className={`min-h-[44px] px-3.5 py-2 text-sm font-medium border cursor-pointer whitespace-nowrap ${
                      cuso4Mode === 'inert'
                        ? 'bg-verdigris-tint border-verdigris text-ink'
                        : 'bg-paper border-rule text-ink-muted hover:text-ink'
                    }`}
                  >
                    Điện cực trơ (Pt/C)
                  </button>
                  <button
                    type="button"
                    aria-pressed={cuso4Mode === 'copper'}
                    onClick={() => setCuso4Mode('copper')}
                    className={`min-h-[44px] px-3.5 py-2 text-sm font-medium border cursor-pointer whitespace-nowrap ${
                      cuso4Mode === 'copper'
                        ? 'bg-copper-tint border-copper text-ink'
                        : 'bg-paper border-rule text-ink-muted hover:text-ink'
                    }`}
                  >
                    Anode tan (Cu)
                  </button>
                </div>
              )}
            </div>

            {/* SVG Stage */}
            <div className="max-w-[760px] mx-auto" data-testid="simulation-stage">
              {activeTab === 'pin-zn-cu' && (
                <ZnCuSimSvg
                  isRunning={isRunning}
                  isCircuitClosed={isCircuitClosed}
                  step={step}
                />
              )}
              {activeTab === 'dien-phan-cuso4' && (
                <CuSO4SimSvg
                  isRunning={isRunning}
                  electrodeMode={cuso4Mode}
                  step={step}
                />
              )}
              {activeTab === 'nacl-nong-chay' && (
                <MoltenNaClSimSvg isRunning={isRunning} step={step} />
              )}
            </div>

            {/* Live Observation Description */}
            <div className="bg-paper border border-rule p-4">
              <div className="text-xs font-semibold text-verdigris mb-1">
                Đang quan sát {activeTab === 'pin-zn-cu' && !isCircuitClosed ? '(Mạch đang mở)' : `· Bước ${step} / 3`}
              </div>
              <p className="text-base text-ink">
                {activeTab === 'pin-zn-cu' && !isCircuitClosed ? (
                  'Khóa K đang mở: mạch ngoài bị ngắt nên dòng electron dừng lại, vôn kế chỉ 0,000 V và không còn dòng di chuyển có hướng của ion qua cầu muối.'
                ) : (
                  <ChemText text={currentSim.steps[step]} />
                )}
              </p>
            </div>

            {/* Half-reactions, Overall Equation & Products Below Diagram */}
            {(() => {
              const summary = getReactionSummary();
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-paper border border-rule">
                    <div className="text-sm font-semibold text-ink">{summary.anodeLabel}</div>
                    <div className="font-mono text-base font-semibold text-copper mt-1.5">
                      <ChemText text={summary.anodeEq} />
                    </div>
                  </div>
                  <div className="p-4 bg-paper border border-rule">
                    <div className="text-sm font-semibold text-ink">{summary.cathodeLabel}</div>
                    <div className="font-mono text-base font-semibold text-verdigris mt-1.5">
                      <ChemText text={summary.cathodeEq} />
                    </div>
                  </div>
                  <div className="md:col-span-2 p-4 bg-paper border border-rule space-y-2">
                    <div>
                      <span className="text-sm font-semibold text-ink">Phương trình tổng: </span>
                      <span className="font-mono text-base font-semibold text-ink">
                        <ChemText text={summary.overallEq} />
                      </span>
                    </div>
                    <p className="text-sm text-ink-muted">
                      <strong className="text-ink">Sản phẩm &amp; hiện tượng: </strong>
                      <ChemText text={summary.products} />
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
};
