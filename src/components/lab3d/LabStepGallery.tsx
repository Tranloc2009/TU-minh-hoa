import React from 'react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { LAB_STEP_GUIDES, LabGuideKey, LabGuidedStep } from '../../utils/lab3dState';
import { ChemText } from '../ChemText';

interface LabStepGalleryProps {
  guideKey: LabGuideKey;
  activeStepNumber: number; // 1..10
  thumbnails: Record<string, string>;
  onSelectStep: (step: LabGuidedStep, observeIn3D?: boolean) => void;
}

/**
 * Clean procedural SVG visual frame distinct for each of the 10 steps (fallback before 3D snapshot cache)
 * so every thumbnail clearly depicts its exact apparatus focus, electrode sign, and chemical stage.
 */
function StepMiniSchematic({ guideKey, step }: { guideKey: LabGuideKey; step: LabGuidedStep }) {
  const isGalvanic = guideKey === 'pin-zn-cu';
  const isCuInert = guideKey === 'cuso4-inert';
  const isCuAnode = guideKey === 'cuso4-copper';
  const isMolten = guideKey === 'nacl-molten';
  const isBrine = guideKey === 'nacl-brine';

  const progress =
    isGalvanic
      ? (step.pinTimeSeconds ?? 0) / 60
      : step.useDepletionTime
        ? 0.5
        : (step.timeFraction ?? 0);

  const isClosed = isGalvanic ? Boolean(step.pinCircuitClosed) : progress > 0;
  const stage2 = isCuInert && progress > 0.52;

  return (
    <svg
      viewBox="0 0 180 96"
      className="w-full h-full block bg-[#0E181B]"
      role="img"
      aria-label={`Minh họa bước ${step.stepNumber}: ${step.title}`}
    >
      {/* Subtle lab table surface */}
      <rect x="0" y="76" width="180" height="20" fill="#2B1E17" />
      <line x1="0" y1="76" x2="180" y2="76" stroke="#365056" strokeWidth="1" />

      {isGalvanic ? (
        <>
          {/* Two beakers */}
          <rect x="26" y="40" width="44" height="36" rx="2" fill="#182C31" stroke="#62838B" strokeWidth="1.2" />
          <rect x="28" y="50" width="40" height="25" fill="#9EC7D1" fillOpacity="0.28" />
          <rect x="110" y="40" width="44" height="36" rx="2" fill="#182C31" stroke="#62838B" strokeWidth="1.2" />
          <rect
            x="112"
            y="50"
            width="40"
            height="25"
            fill="#1D7CE0"
            fillOpacity={Math.max(0.28, 0.72 - progress * 0.4)}
          />
          {/* Zn & Cu electrodes */}
          <rect
            x="35"
            y="30"
            width={Math.max(5, 9 - progress * 2.5)}
            height="41"
            fill="#B7C2C8"
          />
          <rect
            x="136"
            y="30"
            width={9 + progress * 3}
            height="41"
            fill="#C77B4C"
          />
          {/* Salt bridge */}
          <path
            d="M 58 60 L 58 34 Q 58 26 68 26 L 112 26 Q 122 26 122 34 L 122 60"
            fill="none"
            stroke={step.focusObject === 'zn-cu-salt-bridge' ? '#78D4C4' : '#A9D6D0'}
            strokeWidth="5"
            strokeOpacity="0.72"
          />
          {/* Wire + voltmeter */}
          <path d="M 39 30 L 39 14 L 74 14 M 106 14 L 140 14 L 140 30" fill="none" stroke="#C77B4C" strokeWidth="1.8" />
          <rect x="74" y="6" width="32" height="16" rx="3" fill="#122126" stroke="#78D4C4" strokeWidth="1.2" />
          <text x="90" y="17" textAnchor="middle" fill="#78D4C4" fontSize="7.5" fontFamily="monospace">
            {isClosed ? '1,08V' : '1,10V'}
          </text>
          {/* Active e- dots when closed */}
          {isClosed && (
            <>
              <circle cx="54" cy="14" r="2.6" fill="#78D4C4" />
              <circle cx="122" cy="14" r="2.6" fill="#78D4C4" />
              <circle cx="90" cy="26" r="2.2" fill="#E8B17E" />
            </>
          )}
        </>
      ) : (
        <>
          {/* Electrolysis tank */}
          <rect
            x="34"
            y="34"
            width="92"
            height="42"
            rx="2"
            fill={isMolten ? '#382B24' : '#13252B'}
            stroke="#62838B"
            strokeWidth="1.3"
          />
          <rect
            x="37"
            y="45"
            width="86"
            height="29"
            fill={isMolten ? '#D97B30' : isBrine ? '#5CB0BA' : '#1675DA'}
            fillOpacity={
              isCuInert ? Math.max(0.12, 0.72 - Math.min(1, progress * 2) * 0.6) : 0.56
            }
          />
          {/* Cation exchange membrane for brine */}
          {isBrine && (
            <rect
              x="78"
              y="36"
              width="4"
              height="38"
              fill="#78D4C4"
              fillOpacity={step.focusObject === 'nacl-membrane' ? 0.95 : 0.6}
            />
          )}
          {/* Left electrode & right electrode */}
          <rect
            x="52"
            y="26"
            width={isCuInert || isCuAnode ? 8 + Math.min(1, progress * 1.6) * 4 : 8}
            height="44"
            fill={isCuInert || isCuAnode ? (progress > 0.05 ? '#C77B4C' : '#3C464A') : '#3C464A'}
          />
          <rect
            x="100"
            y="26"
            width={isCuAnode ? Math.max(4.5, 9 - progress * 4) : 8}
            height="44"
            fill={isCuAnode ? '#C77B4C' : '#3C464A'}
          />
          {/* DC Power Supply */}
          <rect x="136" y="46" width="32" height="30" rx="2" fill="#1E2C30" stroke="#78D4C4" strokeWidth="1.1" />
          <text x="152" y="61" textAnchor="middle" fill="#78D4C4" fontSize="7" fontFamily="monospace">
            DC
          </text>
          {/* Wire arc */}
          <path d="M 56 26 L 56 14 L 152 14 L 152 46" fill="none" stroke="#78D4C4" strokeWidth="1.4" strokeDasharray={isClosed ? '4 2' : undefined} />
          <path d="M 104 26 L 104 20 L 145 20 L 145 46" fill="none" stroke="#C77B4C" strokeWidth="1.4" />

          {/* Bubbles / Products */}
          {isCuInert && progress > 0 && (
            <>
              <circle cx="104" cy="40" r="2.2" fill="#78D4C4" />
              <circle cx="109" cy="49" r="1.8" fill="#78D4C4" />
              {stage2 && (
                <>
                  <circle cx="54" cy="41" r="2.2" fill="#F5F2EA" />
                  <circle cx="59" cy="51" r="1.8" fill="#F5F2EA" />
                </>
              )}
            </>
          )}
          {(isMolten || isBrine) && progress > 0 && (
            <>
              <circle cx="56" cy="40" r="2.3" fill="#C8DF78" />
              <circle cx="61" cy="50" r="1.8" fill="#C8DF78" />
              {isBrine ? (
                <>
                  <circle cx="104" cy="41" r="2.2" fill="#EDF4F1" />
                  <circle cx="84" cy="58" r="2" fill="#E8B17E" />
                </>
              ) : (
                <circle cx="104" cy="46" r="3.4" fill="#DCE4E6" />
              )}
            </>
          )}
        </>
      )}

      {/* Focus ring indicator */}
      <rect
        x="3"
        y="3"
        width="174"
        height="90"
        rx="4"
        fill="none"
        stroke={step.cameraLevel === 'REACTION' ? '#C77B4C' : '#365056'}
        strokeWidth="1"
      />
    </svg>
  );
}

export const LabStepGallery: React.FC<LabStepGalleryProps> = ({
  guideKey,
  activeStepNumber,
  thumbnails,
  onSelectStep,
}) => {
  const steps = LAB_STEP_GUIDES[guideKey];
  const currentStep = steps[Math.max(0, Math.min(steps.length - 1, activeStepNumber - 1))];

  const handlePrev = () => {
    const prevIdx = Math.max(0, activeStepNumber - 2);
    onSelectStep(steps[prevIdx], true);
  };

  const handleNext = () => {
    const nextIdx = Math.min(steps.length - 1, activeStepNumber);
    onSelectStep(steps[nextIdx], true);
  };

  return (
    <div className="space-y-4" data-testid="lab-step-gallery">
      {/* Selected Step Detail Banner */}
      <div className="rounded-lg border border-[#2C444B] bg-[#0F1B1F] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#78D4C4]">
            <span>
              BƯỚC {String(currentStep.stepNumber).padStart(2, '0')} / 10
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-[#E3A678]">{currentStep.accentTag}</span>
          </div>
          <h3 className="font-serif text-lg font-semibold text-[#EDF4F1]" style={{ color: '#EDF4F1' }}>
            <ChemText text={currentStep.title} />
          </h3>
          <p className="text-sm text-[#B8CAC9] leading-relaxed">
            <ChemText text={currentStep.description} />
          </p>
          <div className="inline-block rounded bg-[#14252A] border border-[#2B464E] px-2.5 py-1 text-xs sm:text-sm font-mono text-[#78D4C4]">
            <ChemText text={currentStep.formula} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={activeStepNumber <= 1}
            onClick={handlePrev}
            aria-label="Bước trước"
            className="min-h-[44px] inline-flex items-center gap-1 px-3 rounded border border-[#365056] bg-[#162529] text-sm text-[#EDF4F1] hover:border-[#78D4C4] disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Trước
          </button>
          <button
            type="button"
            disabled={activeStepNumber >= steps.length}
            onClick={handleNext}
            aria-label="Bước tiếp theo"
            className="min-h-[44px] inline-flex items-center gap-1 px-3 rounded border border-[#365056] bg-[#162529] text-sm text-[#EDF4F1] hover:border-[#78D4C4] disabled:opacity-40 cursor-pointer"
          >
            Sau
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectStep(currentStep, true)}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 rounded bg-[#78D4C4] text-[#10191C] font-semibold text-sm hover:bg-[#93E3D5] transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            Quan sát trong 3D
          </button>
        </div>
      </div>

      {/* Horizontal 10-Frame Strip (01 -> 10, touch-scrollable on mobile) */}
      <div
        role="list"
        aria-label="Chuỗi 10 bước khám phá phản ứng"
        className="flex gap-2.5 overflow-x-auto pb-2 snap-x"
      >
        {steps.map((step) => {
          const isActive = step.stepNumber === activeStepNumber;
          const thumbKey = `${guideKey}-${step.stepNumber}`;
          const capturedUrl = thumbnails[thumbKey];

          return (
            <button
              key={step.stepNumber}
              type="button"
              role="listitem"
              aria-current={isActive ? 'step' : undefined}
              onClick={() => onSelectStep(step, true)}
              className={`snap-start shrink-0 w-[166px] text-left rounded-md border p-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#78D4C4] ${
                isActive
                  ? 'border-[#78D4C4] bg-[#172B30]'
                  : 'border-[#26393F] bg-[#0E181B] hover:border-[#4B6B73]'
              }`}
            >
              <div className="relative h-[84px] rounded overflow-hidden border border-[#22353A] mb-2">
                {capturedUrl ? (
                  <img
                    src={capturedUrl}
                    alt={`Khung hình bước ${step.stepNumber}: ${step.title}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <StepMiniSchematic guideKey={guideKey} step={step} />
                )}
                <span
                  className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold ${
                    isActive
                      ? 'bg-[#78D4C4] text-[#10191C]'
                      : 'bg-[#10191C]/90 text-[#EDF4F1]'
                  }`}
                >
                  {String(step.stepNumber).padStart(2, '0')}
                </span>
              </div>
              <div className="text-xs font-semibold text-[#EDF4F1] line-clamp-2 leading-snug">
                <ChemText text={step.title} />
              </div>
              <div className="mt-1 text-[11px] text-[#8FA8AC] truncate">
                {step.accentTag}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
