import React, { useEffect, useRef, useState } from 'react';
import {
  ElectrolysisSnapshot,
  computeElectronMotionProfile,
} from '../utils/electrochemEngine';
import { formatViNumber } from '../utils/faraday';

export interface HotspotInfo {
  id: string;
  title: string;
  role: string;
  detail: string;
}

function samplePolyline(
  points: readonly [number, number][],
  rawU: number
): [number, number] {
  const u = ((rawU % 1) + 1) % 1;
  let total = 0;
  const segLengths: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1][0] - points[i][0];
    const dy = points[i + 1][1] - points[i][1];
    const len = Math.hypot(dx, dy);
    segLengths.push(len);
    total += len;
  }
  if (total === 0) return points[0];

  let dist = u * total;
  for (let i = 0; i < segLengths.length; i++) {
    const len = segLengths[i];
    if (dist <= len || i === segLengths.length - 1) {
      const frac = len > 0 ? dist / len : 0;
      return [
        points[i][0] + (points[i + 1][0] - points[i][0]) * frac,
        points[i][1] + (points[i + 1][1] - points[i][1]) * frac,
      ];
    }
    dist -= len;
  }
  return points[points.length - 1];
}

function useElectronPhase(
  active: boolean,
  cyclesPerSecond: number,
  reducedMotion: boolean
): number {
  const [phase, setPhase] = useState<number>(0.32);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || reducedMotion) {
      lastRef.current = null;
      return;
    }

    let rafId = 0;
    const tick = (now: number) => {
      if (lastRef.current === null) {
        lastRef.current = now;
        rafId = window.requestAnimationFrame(tick);
        return;
      }
      const dt = Math.min(now - lastRef.current, 60) / 1000;
      lastRef.current = now;
      setPhase((prev) => (prev + dt * cyclesPerSecond) % 1);
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
      lastRef.current = null;
    };
  }, [active, cyclesPerSecond, reducedMotion]);

  return reducedMotion ? 0.32 : phase;
}

interface ElectronOrbProps {
  x: number;
  y: number;
  mode: 'move' | 'detach' | 'attach';
  opacity?: number;
  glowIntensity?: number;
}

const ElectronOrb: React.FC<ElectronOrbProps> = ({
  x,
  y,
  mode,
  opacity = 1,
  glowIntensity = 0.8,
}) => {
  const stroke = mode === 'attach' ? '#F5CE6B' : '#78E2D2';
  const glow = mode === 'attach' ? '#F5CE6B' : '#78E2D2';
  const fill = mode === 'attach' ? '#2D200E' : '#09262C';
  const textFill = mode === 'attach' ? '#FFF5D6' : '#ECFFFC';

  return (
    <g
      transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)})`}
      opacity={opacity}
      pointerEvents="none"
    >
      {/* Outer luminous aura */}
      <circle r="12.5" fill={glow} fillOpacity={(0.14 * glowIntensity).toFixed(2)} />
      <circle r="9.4" fill={glow} fillOpacity={(0.24 * glowIntensity).toFixed(2)} />
      <circle r="7.2" fill={fill} stroke={stroke} strokeWidth="1.6" />
      <text
        x="0"
        y="3"
        textAnchor="middle"
        fill={textFill}
        fontSize="8.5"
        fontWeight="700"
        fontFamily="var(--font-mono)"
      >
        e⁻
      </text>
    </g>
  );
};

interface WireElectronsProps {
  points: readonly [number, number][];
  phase: number;
  count?: number;
  glowIntensity?: number;
}

const WireElectrons: React.FC<WireElectronsProps> = ({
  points,
  phase,
  count = 6,
  glowIntensity = 0.8,
}) => {
  return (
    <g aria-hidden="true" pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => {
        const u = (phase + i / count) % 1;
        const [x, y] = samplePolyline(points, u);
        // Subtle luminous comet trail slightly behind each electron along the wire
        const [tx, ty] = samplePolyline(points, u - 0.022);
        return (
          <g key={i}>
            <circle
              cx={tx.toFixed(1)}
              cy={ty.toFixed(1)}
              r="3.2"
              fill="#78E2D2"
              fillOpacity={(0.36 * glowIntensity).toFixed(2)}
            />
            <ElectronOrb x={x} y={y} mode="move" glowIntensity={glowIntensity} />
          </g>
        );
      })}
    </g>
  );
};

interface AnodeDetachElectronsProps {
  detachX: number;
  detachY: number;
  rodX: number;
  rodTopY: number;
  badgeX: number;
  badgeY: number;
  badgeWidth?: number;
  label: string;
  phase: number;
  glowIntensity?: number;
}

const AnodeDetachElectrons: React.FC<AnodeDetachElectronsProps> = ({
  detachX,
  detachY,
  rodX,
  rodTopY,
  badgeX,
  badgeY,
  badgeWidth = 54,
  label,
  phase,
  glowIntensity = 0.8,
}) => {
  const pathPoints: [number, number][] = [
    [detachX, detachY],
    [rodX, detachY - 12],
    [rodX, rodTopY],
  ];
  const rippleU = (phase * 2) % 1;
  const rippleR = 5 + rippleU * 15;
  const rippleOpacity = Math.max(0, 0.8 * glowIntensity * (1 - rippleU));

  // 3 luminous detachment points sparkling along the submerged anode edge
  const sparkOffsets = [-22, 0, 22];

  return (
    <g aria-hidden="true" pointerEvents="none">
      {sparkOffsets.map((dy, idx) => {
        const su = (phase * 2.2 + idx * 0.33) % 1;
        const pulse = Math.sin(su * Math.PI);
        const sx = detachX + (rodX > detachX ? su * 5 : -su * 5);
        const sy = detachY + dy - su * 6;
        return (
          <g key={idx}>
            <circle
              cx={sx.toFixed(1)}
              cy={sy.toFixed(1)}
              r={(5.5 + pulse * 3.5).toFixed(1)}
              fill="#78E2D2"
              fillOpacity={(0.26 * pulse * glowIntensity).toFixed(2)}
            />
            <circle
              cx={sx.toFixed(1)}
              cy={sy.toFixed(1)}
              r={(2.2 + pulse * 1.4).toFixed(1)}
              fill="#EAFFFC"
              fillOpacity={(0.55 + 0.45 * pulse).toFixed(2)}
            />
          </g>
        );
      })}

      {/* Detachment separation pulse right at anode surface */}
      <circle
        cx={detachX}
        cy={detachY}
        r={rippleR.toFixed(1)}
        fill="none"
        stroke="#78E2D2"
        strokeWidth="1.5"
        strokeDasharray="3 2"
        opacity={rippleOpacity.toFixed(2)}
      />
      {[0, 0.5].map((offset, idx) => {
        const u = (phase * 1.4 + offset) % 1;
        const [x, y] = samplePolyline(pathPoints, u);
        const fade = u < 0.12 ? u / 0.12 : u > 0.88 ? (1 - u) / 0.12 : 1;
        return (
          <ElectronOrb
            key={idx}
            x={x}
            y={y}
            mode="detach"
            opacity={Math.max(0.28, fade)}
            glowIntensity={glowIntensity}
          />
        );
      })}
      {/* Micro-badge "tách 2e⁻" */}
      <rect
        x={badgeX}
        y={badgeY}
        width={badgeWidth}
        height="19"
        rx="4"
        fill="#0E252A"
        fillOpacity="0.92"
        stroke="#78D4C4"
        strokeWidth="1"
      />
      <text
        x={badgeX + badgeWidth / 2}
        y={badgeY + 13}
        textAnchor="middle"
        fill="#78D4C4"
        fontSize="10"
        fontWeight="700"
        fontFamily="var(--font-sans)"
      >
        {label}
      </text>
    </g>
  );
};

interface CathodeAttachElectronsProps {
  rodX: number;
  rodTopY: number;
  attachX: number;
  attachY: number;
  badgeX: number;
  badgeY: number;
  badgeWidth?: number;
  label: string;
  phase: number;
  glowIntensity?: number;
}

const CathodeAttachElectrons: React.FC<CathodeAttachElectronsProps> = ({
  rodX,
  rodTopY,
  attachX,
  attachY,
  badgeX,
  badgeY,
  badgeWidth = 54,
  label,
  phase,
  glowIntensity = 0.8,
}) => {
  const pathPoints: [number, number][] = [
    [rodX, rodTopY],
    [rodX, attachY - 12],
    [attachX, attachY],
  ];
  // Contracting capture ring as electron attaches onto ion/species
  const captureU = (phase * 2) % 1;
  const captureR = 17 - captureU * 12;
  const captureOpacity = Math.max(0, 0.82 * glowIntensity * (1 - Math.abs(captureU - 0.5) * 1.4));

  // 3 luminous attachment points gleaming right on the submerged cathode surface
  const attachOffsets = [-22, 0, 22];

  return (
    <g aria-hidden="true" pointerEvents="none">
      {attachOffsets.map((dy, idx) => {
        const su = (phase * 2.2 + idx * 0.33) % 1;
        const pulse = Math.sin(su * Math.PI);
        return (
          <g key={idx}>
            <circle
              cx={attachX}
              cy={attachY + dy}
              r={(5.5 + pulse * 4).toFixed(1)}
              fill="#F5CE6B"
              fillOpacity={(0.3 * pulse * glowIntensity).toFixed(2)}
            />
            <circle
              cx={attachX}
              cy={attachY + dy}
              r={(2.2 + pulse * 1.5).toFixed(1)}
              fill="#FFF6D6"
              fillOpacity={(0.55 + 0.45 * pulse).toFixed(2)}
            />
          </g>
        );
      })}

      <circle
        cx={attachX}
        cy={attachY}
        r={captureR.toFixed(1)}
        fill="none"
        stroke="#F5CE6B"
        strokeWidth="1.6"
        opacity={captureOpacity.toFixed(2)}
      />
      {[0, 0.5].map((offset, idx) => {
        const u = (phase * 1.4 + offset) % 1;
        const [x, y] = samplePolyline(pathPoints, u);
        const fade = u < 0.12 ? u / 0.12 : u > 0.9 ? (1 - u) / 0.1 : 1;
        return (
          <ElectronOrb
            key={idx}
            x={x}
            y={y}
            mode="attach"
            opacity={Math.max(0.3, fade)}
            glowIntensity={glowIntensity}
          />
        );
      })}
      {/* Micro-badge "bám 2e⁻" */}
      <rect
        x={badgeX}
        y={badgeY}
        width={badgeWidth}
        height="19"
        rx="4"
        fill="#271E11"
        fillOpacity="0.92"
        stroke="#F2C864"
        strokeWidth="1"
      />
      <text
        x={badgeX + badgeWidth / 2}
        y={badgeY + 13}
        textAnchor="middle"
        fill="#F5D384"
        fontSize="10"
        fontWeight="700"
        fontFamily="var(--font-sans)"
      >
        {label}
      </text>
    </g>
  );
};

function makeInteractiveProps(
  info: HotspotInfo,
  activeId: string | null,
  onSelect: (info: HotspotInfo) => void
) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': `${info.title}: xem giải thích chi tiết`,
    'aria-pressed': activeId === info.id,
    className: 'cursor-pointer focus:outline-none',
    onClick: () => onSelect(info),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(info);
      }
    },
  };
}

interface LabZnCuSvgProps {
  circuitClosed: boolean;
  progress: number; // 0..1
  isRunning: boolean;
  playbackSpeed?: number;
  showConventionalCurrent: boolean;
  reducedMotion: boolean;
  activeHotspotId: string | null;
  onSelectHotspot: (info: HotspotInfo) => void;
  onToggleCircuit: () => void;
}

export const LabZnCuSvg: React.FC<LabZnCuSvgProps> = ({
  circuitClosed,
  progress,
  isRunning,
  playbackSpeed = 1,
  showConventionalCurrent,
  reducedMotion,
  activeHotspotId,
  onSelectHotspot,
  onToggleCircuit,
}) => {
  const animate = circuitClosed && isRunning && !reducedMotion;
  const motionProfile = computeElectronMotionProfile(2, playbackSpeed);
  const electronPhase = useElectronPhase(animate, motionProfile.cyclesPerSecond, reducedMotion);
  const znWear = circuitClosed ? progress * 6 : 0;
  const cuPlate = circuitClosed ? progress * 6.5 : 0;
  const cuBlueOpacity = Math.max(0.24, 0.54 - (circuitClosed ? progress * 0.24 : 0));

  const znHotspot: HotspotInfo = {
    id: 'zn-anode',
    title: 'Thanh kẽm Zn · Anode (−)',
    role: 'Xảy ra quá trình oxi hóa',
    detail:
      'Zn dễ nhường electron hơn Cu (E° = −0,763 V < +0,340 V). Khi mạch kín: Zn → Zn²⁺ + 2e⁻. Thanh Zn mòn dần và nồng độ ion Zn²⁺ trong cốc trái tăng lên.',
  };

  const cuHotspot: HotspotInfo = {
    id: 'cu-cathode',
    title: 'Thanh đồng Cu · Cathode (+)',
    role: 'Xảy ra quá trình khử',
    detail:
      'Electron đi qua dây dẫn ngoài tới thanh Cu. Ion Cu²⁺ trong dung dịch nhận electron: Cu²⁺ + 2e⁻ → Cu, tạo lớp đồng đỏ bám dày lên thanh Cu và màu xanh dung dịch nhạt dần.',
  };

  const bridgeHotspot: HotspotInfo = {
    id: 'salt-bridge',
    title: 'Cầu muối KNO₃',
    role: 'Khép kín mạch điện và trung hòa điện tích',
    detail:
      'Cầu muối không dẫn electron. Khi pin hoạt động, anion NO₃⁻ di chuyển sang cốc Zn để trung hòa lượng Zn²⁺ sinh thêm, còn cation K⁺ di chuyển sang cốc Cu để bù điện tích dương do Cu²⁺ giảm.',
  };

  const voltmeterHotspot: HotspotInfo = {
    id: 'voltmeter',
    title: 'Vôn kế & Khóa K',
    role: 'Đo sức điện động chuẩn E°pin = 1,103 V',
    detail:
      'E°pin = E°(Cu²⁺/Cu) − E°(Zn²⁺/Zn) = +0,340 − (−0,763) = 1,103 V (ở 25 °C, nồng độ 1 M). Khi mở khóa K, mạch hở nên dòng electron và dòng ion dừng lại.',
  };

  const highlightStroke = (id: string) => (activeHotspotId === id ? '#78D4C4' : 'transparent');

  return (
    <svg
      viewBox="0 0 680 410"
      className="w-full h-auto block select-none"
      role="img"
      aria-label="Sơ đồ phòng thí nghiệm Pin Galvani Zn-Cu gồm cốc ZnSO4, cốc CuSO4, cầu muối KNO3, khóa K và vôn kế 1,103 V"
    >
      <defs>
        <radialGradient id="labSpotGlow" cx="50%" cy="48%" r="55%">
          <stop offset="0%" stopColor="#1B3137" />
          <stop offset="70%" stopColor="#10191C" />
          <stop offset="100%" stopColor="#0B1215" />
        </radialGradient>
        <linearGradient id="glassReflection" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="15%" stopColor="#FFFFFF" stopOpacity="0.03" />
          <stop offset="85%" stopColor="#FFFFFF" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.14" />
        </linearGradient>
        <linearGradient id="znMetalDark" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7C8D94" />
          <stop offset="45%" stopColor="#C1CFD4" />
          <stop offset="100%" stopColor="#697980" />
        </linearGradient>
        <linearGradient id="cuMetalDark" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8F4926" />
          <stop offset="45%" stopColor="#D78E5D" />
          <stop offset="100%" stopColor="#7A3C1E" />
        </linearGradient>
        <marker
          id="arrowJade"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#78D4C4" />
        </marker>
        <marker
          id="arrowCopper"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#E39D6B" />
        </marker>
        <marker
          id="arrowAmber"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#F2C864" />
        </marker>
      </defs>

      {/* Lab Stage Backdrop & Bench Surface */}
      <rect x="0" y="0" width="680" height="410" rx="8" fill="url(#labSpotGlow)" />
      <line x1="28" y1="364" x2="652" y2="364" stroke="#24383E" strokeWidth="1.5" />
      <rect x="28" y="364" width="624" height="36" fill="#0B1316" opacity="0.65" />

      {/* Outer Circuit Wire */}
      <path
        d="M 148 168 L 148 64 L 245 64"
        fill="none"
        stroke="#C77B4C"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 435 64 L 468 64"
        fill="none"
        stroke="#C77B4C"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* Switch K */}
      <g
        role="button"
        tabIndex={0}
        aria-label={circuitClosed ? 'Khóa K đang đóng, bấm để mở mạch' : 'Khóa K đang mở, bấm để đóng mạch'}
        className="cursor-pointer focus:outline-none"
        onClick={onToggleCircuit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleCircuit();
          }
        }}
      >
        <rect x="462" y="34" width="64" height="46" rx="6" fill="#132126" stroke="#2C444B" strokeWidth="1" />
        <circle cx="472" cy="64" r="4" fill="#E39D6B" />
        <circle cx="516" cy="64" r="4" fill="#E39D6B" />
        <line
          x1="472"
          y1="64"
          x2={circuitClosed ? 516 : 508}
          y2={circuitClosed ? 64 : 44}
          stroke="#F5F2EA"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <text
          x="494"
          y="30"
          textAnchor="middle"
          fill="#DCE4E6"
          fontSize="11.5"
          fontWeight="600"
          fontFamily="var(--font-sans)"
        >
          Khóa K ({circuitClosed ? 'đóng' : 'mở'})
        </text>
      </g>
      <path
        d="M 516 64 L 532 64 L 532 168"
        fill="none"
        stroke="#C77B4C"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Electron Flow Path (e- Zn -> Cu) + Moving Electron Orbs */}
      {circuitClosed && (
        <g>
          {/* Luminous outer-wire electron trajectory aura */}
          <path
            d="M 148 164 L 148 52 L 532 52 L 532 164"
            fill="none"
            stroke="#78E2D2"
            strokeWidth="7"
            strokeOpacity="0.14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 148 158 L 148 52 L 532 52 L 532 158"
            fill="none"
            stroke="#78D4C4"
            strokeWidth="2.4"
            strokeDasharray="8 8"
            markerEnd="url(#arrowJade)"
            className={animate ? 'animate-dash-forward' : ''}
            style={
              animate
                ? { animationDuration: `${motionProfile.dashDurationSeconds.toFixed(2)}s` }
                : undefined
            }
          />
          <WireElectrons
            points={[
              [148, 166],
              [148, 52],
              [532, 52],
              [532, 166],
            ]}
            phase={electronPhase}
            count={motionProfile.wireParticleCount}
            glowIntensity={motionProfile.sparkIntensity}
          />
          <rect x="164" y="16" width="114" height="24" rx="4" fill="#112428" stroke="#78D4C4" strokeWidth="1" />
          <text
            x="221"
            y="32"
            textAnchor="middle"
            fill="#78D4C4"
            fontSize="12"
            fontWeight="700"
            fontFamily="var(--font-sans)"
          >
            e⁻ : Zn → Cu
          </text>
        </g>
      )}

      {/* Optional Conventional Current Overlay (I: Cu -> Zn) */}
      {circuitClosed && showConventionalCurrent && (
        <g>
          <path
            d="M 518 78 L 438 78 M 242 78 L 164 78"
            fill="none"
            stroke="#F2C864"
            strokeWidth="2.2"
            strokeDasharray="4 4"
            markerEnd="url(#arrowAmber)"
            className={animate ? 'animate-dash-forward' : ''}
          />
          <rect x="258" y="99" width="164" height="21" rx="4" fill="#241E11" stroke="#F2C864" strokeWidth="1" />
          <text
            x="340"
            y="113"
            textAnchor="middle"
            fill="#F2C864"
            fontSize="11"
            fontWeight="600"
            fontFamily="var(--font-sans)"
          >
            Dòng I quy ước: Cu → Zn
          </text>
        </g>
      )}

      {/* Voltmeter Readout Hotspot */}
      <g {...makeInteractiveProps(voltmeterHotspot, activeHotspotId, onSelectHotspot)}>
        <rect
          x="245"
          y="36"
          width="190"
          height="58"
          rx="8"
          fill="#0C1417"
          stroke={activeHotspotId === 'voltmeter' ? '#78D4C4' : '#355058'}
          strokeWidth={activeHotspotId === 'voltmeter' ? '2.2' : '1.6'}
        />
        {circuitClosed ? (
          <>
            <text
              x="340"
              y="60"
              textAnchor="middle"
              fill="#78D4C4"
              fontSize="19"
              fontWeight="700"
              fontFamily="var(--font-mono)"
            >
              1,103 V
            </text>
            <text
              x="340"
              y="80"
              textAnchor="middle"
              fill="#DCE4E6"
              fontSize="11"
              fontFamily="var(--font-sans)"
            >
              Vôn kế · E°pin chuẩn (25 °C, 1 M)
            </text>
          </>
        ) : (
          <>
            <text
              x="340"
              y="58"
              textAnchor="middle"
              fill="#F5F2EA"
              fontSize="11.5"
              fontWeight="600"
              fontFamily="var(--font-sans)"
            >
              E°pin theo đề cương: 1,103 V
            </text>
            <text
              x="340"
              y="79"
              textAnchor="middle"
              fill="#E39D6B"
              fontSize="12"
              fontWeight="700"
              fontFamily="var(--font-sans)"
            >
              Mạch đang mở
            </text>
          </>
        )}
      </g>

      {/* Left Beaker: ZnSO4 */}
      <g>
        {/* Liquid */}
        <path
          d="M 78 232 L 242 232 L 242 356 Q 242 362 234 362 L 86 362 Q 78 362 78 356 Z"
          fill="#79B4C2"
          fillOpacity={0.14 + (circuitClosed ? progress * 0.08 : 0)}
        />
        <ellipse cx="160" cy="232" rx="82" ry="6" fill="#9FD3DF" fillOpacity="0.16" />
        {/* Glass walls */}
        <path
          d="M 74 184 L 78 356 Q 78 363 86 363 L 234 363 Q 242 363 242 356 L 246 184"
          fill="url(#glassReflection)"
          stroke="#688891"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <text
          x="160"
          y="386"
          textAnchor="middle"
          fill="#F5F2EA"
          fontSize="13.5"
          fontWeight="600"
          fontFamily="var(--font-sans)"
        >
          Dung dịch ZnSO₄ 1 M
        </text>
        <text
          x="160"
          y="347"
          textAnchor="middle"
          fill="#BFE6EE"
          fontSize="11.5"
          fontFamily="var(--font-sans)"
        >
          {circuitClosed && progress > 0.05 ? '[Zn²⁺] tăng dần' : 'Ion Zn²⁺, SO₄²⁻'}
        </text>
      </g>

      {/* Right Beaker: CuSO4 */}
      <g>
        {/* Blue Liquid */}
        <path
          d="M 438 232 L 602 232 L 602 356 Q 602 362 594 362 L 446 362 Q 438 362 438 356 Z"
          fill="#2687C8"
          fillOpacity={cuBlueOpacity}
        />
        <ellipse cx="520" cy="232" rx="82" ry="6" fill="#5CB6F0" fillOpacity={cuBlueOpacity * 0.75} />
        {/* Glass walls */}
        <path
          d="M 434 184 L 438 356 Q 438 363 446 363 L 594 363 Q 602 363 602 356 L 606 184"
          fill="url(#glassReflection)"
          stroke="#688891"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <text
          x="520"
          y="386"
          textAnchor="middle"
          fill="#F5F2EA"
          fontSize="13.5"
          fontWeight="600"
          fontFamily="var(--font-sans)"
        >
          Dung dịch CuSO₄ 1 M
        </text>
        <text
          x="520"
          y="347"
          textAnchor="middle"
          fill="#D3EEFF"
          fontSize="11.5"
          fontFamily="var(--font-sans)"
        >
          {circuitClosed && progress > 0.05 ? '[Cu²⁺] giảm · xanh nhạt dần' : 'Màu xanh lam Cu²⁺'}
        </text>
      </g>

      {/* Zn Anode (-) Hotspot */}
      <g {...makeInteractiveProps(znHotspot, activeHotspotId, onSelectHotspot)}>
        <rect
          x="128"
          y="162"
          width="40"
          height="168"
          rx="4"
          fill="none"
          stroke={highlightStroke('zn-anode')}
          strokeWidth="2.5"
          strokeDasharray="4 3"
        />
        {/* Original outline showing wear when active */}
        {znWear > 0.4 && (
          <rect
            x="136"
            y="232"
            width="24"
            height="92"
            fill="none"
            stroke="#9CB3BA"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.55"
          />
        )}
        <rect
          x={136 + znWear / 2}
          y="168"
          width={24 - znWear}
          height="156"
          rx="2"
          fill="url(#znMetalDark)"
          stroke="#46585E"
          strokeWidth="1.2"
        />
        {/* Label clearly outside the left wire */}
        <text
          x="124"
          y="126"
          textAnchor="end"
          fill="#F5F2EA"
          fontSize="14"
          fontWeight="700"
          fontFamily="var(--font-sans)"
        >
          Zn · Anode (−)
        </text>
        <text
          x="124"
          y="144"
          textAnchor="end"
          fill="#78D4C4"
          fontSize="11.5"
          fontFamily="var(--font-sans)"
        >
          Oxi hóa · mòn dần
        </text>
        {/* Zn2+ dissolving arrow */}
        {circuitClosed && (
          <g>
            <line
              x1="163"
              y1="278"
              x2="195"
              y2="290"
              stroke="#78D4C4"
              strokeWidth="1.8"
              markerEnd="url(#arrowJade)"
            />
            <text x="168" y="310" fill="#BFE6EE" fontSize="11.5" fontWeight="600">
              Zn²⁺
            </text>
          </g>
        )}
      </g>

      {/* Cu Cathode (+) Hotspot */}
      <g {...makeInteractiveProps(cuHotspot, activeHotspotId, onSelectHotspot)}>
        <rect
          x="512"
          y="162"
          width="40"
          height="168"
          rx="4"
          fill="none"
          stroke={highlightStroke('cu-cathode')}
          strokeWidth="2.5"
          strokeDasharray="4 3"
        />
        {/* Copper deposit layer */}
        {cuPlate > 0.3 && (
          <rect
            x={520 - cuPlate / 2}
            y="232"
            width={24 + cuPlate}
            height="92"
            rx="3"
            fill="#C77B4C"
            fillOpacity="0.88"
            stroke="#F2B88C"
            strokeWidth="1"
          />
        )}
        <rect
          x="520"
          y="168"
          width="24"
          height="156"
          rx="2"
          fill="url(#cuMetalDark)"
          stroke="#5C2A14"
          strokeWidth="1.2"
        />
        {/* Label clearly outside the right wire */}
        <text
          x="556"
          y="126"
          textAnchor="start"
          fill="#F5F2EA"
          fontSize="14"
          fontWeight="700"
          fontFamily="var(--font-sans)"
        >
          Cu · Cathode (+)
        </text>
        <text
          x="556"
          y="144"
          textAnchor="start"
          fill="#E39D6B"
          fontSize="11.5"
          fontFamily="var(--font-sans)"
        >
          Khử · bám dày thêm
        </text>
        {/* Cu2+ plating arrow */}
        {circuitClosed && (
          <g>
            <line
              x1="482"
              y1="290"
              x2="515"
              y2="278"
              stroke="#E39D6B"
              strokeWidth="1.8"
              markerEnd="url(#arrowCopper)"
            />
            <text x="466" y="310" fill="#F5D3BE" fontSize="11.5" fontWeight="600">
              Cu²⁺
            </text>
          </g>
        )}
      </g>

      {/* Salt Bridge KNO3 Hotspot */}
      <g {...makeInteractiveProps(bridgeHotspot, activeHotspotId, onSelectHotspot)}>
        <path
          d="M 218 286 L 218 164 Q 218 134 252 134 L 428 134 Q 462 134 462 164 L 462 286"
          fill="none"
          stroke={activeHotspotId === 'salt-bridge' ? '#78D4C4' : '#7CA0AB'}
          strokeWidth="26"
          strokeLinecap="round"
          strokeOpacity="0.28"
        />
        <path
          d="M 218 286 L 218 164 Q 218 134 252 134 L 428 134 Q 462 134 462 164 L 462 286"
          fill="none"
          stroke="#132227"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <path
          d="M 218 286 L 218 164 Q 218 134 252 134 L 428 134 Q 462 134 462 164 L 462 286"
          fill="none"
          stroke={activeHotspotId === 'salt-bridge' ? '#78D4C4' : '#6A8B95'}
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Salt bridge title */}
        <rect x="284" y="152" width="112" height="22" rx="4" fill="#10191C" stroke="#2D434A" strokeWidth="1" />
        <text
          x="340"
          y="167"
          textAnchor="middle"
          fill="#F5F2EA"
          fontSize="11.5"
          fontWeight="600"
          fontFamily="var(--font-sans)"
        >
          Cầu muối KNO₃
        </text>

        {/* Distinct NO3- -> Zn and K+ -> Cu paths */}
        {circuitClosed && (
          <>
            {/* NO3- moves left to Zn beaker */}
            <path
              d="M 332 130 L 248 130 Q 218 130 218 162 L 218 256"
              fill="none"
              stroke="#78D4C4"
              strokeWidth="2"
              strokeDasharray="6 5"
              markerEnd="url(#arrowJade)"
              className={animate ? 'animate-dash-forward' : ''}
            />
            <text x="220" y="118" textAnchor="middle" fill="#78D4C4" fontSize="11.5" fontWeight="700">
              ← NO₃⁻
            </text>

            {/* K+ moves right to Cu beaker */}
            <path
              d="M 348 138 L 432 138 Q 462 138 462 166 L 462 256"
              fill="none"
              stroke="#E39D6B"
              strokeWidth="2"
              strokeDasharray="3 4"
              markerEnd="url(#arrowCopper)"
              className={animate ? 'animate-dash-forward' : ''}
            />
            <text x="460" y="118" textAnchor="middle" fill="#E39D6B" fontSize="11.5" fontWeight="700">
              K⁺ →
            </text>
          </>
        )}
      </g>

      {/* Detaching e- at Zn Anode (-) & Attaching e- at Cu Cathode (+) */}
      {circuitClosed && (
        <>
          <AnodeDetachElectrons
            detachX={160}
            detachY={268}
            rodX={148}
            rodTopY={172}
            badgeX={82}
            badgeY={254}
            badgeWidth={50}
            label="tách 2e⁻"
            phase={electronPhase}
          />
          <CathodeAttachElectrons
            rodX={532}
            rodTopY={172}
            attachX={518}
            attachY={268}
            badgeX={548}
            badgeY={254}
            badgeWidth={50}
            label="bám 2e⁻"
            phase={electronPhase}
          />
        </>
      )}
    </svg>
  );
};

interface LabCuSO4SvgProps {
  snapshot: ElectrolysisSnapshot;
  isRunning: boolean;
  currentA?: number;
  playbackSpeed?: number;
  reducedMotion: boolean;
  activeHotspotId: string | null;
  onSelectHotspot: (info: HotspotInfo) => void;
}

export const LabCuSO4Svg: React.FC<LabCuSO4SvgProps> = ({
  snapshot,
  isRunning,
  currentA = 2,
  playbackSpeed = 1,
  reducedMotion,
  activeHotspotId,
  onSelectHotspot,
}) => {
  const isInert = snapshot.variant === 'cuso4-inert';
  const activeFlow = snapshot.timeSeconds > 0 || isRunning;
  const animate = activeFlow && isRunning && !reducedMotion;
  const motionProfile = computeElectronMotionProfile(currentA, playbackSpeed);
  const electronPhase = useElectronPhase(animate, motionProfile.cyclesPerSecond, reducedMotion);

  const cuPlatingPx = Math.min(11, snapshot.cuPlatedG * 10);
  const anodeWearPx = !isInert ? Math.min(10, snapshot.cuLostAtAnodeG * 9) : 0;
  const liquidBlueOpacity = isInert ? 0.12 + snapshot.cu2Ratio * 0.44 : 0.54;
  const showO2 = isInert && activeFlow;
  const showH2 = isInert && snapshot.stage === 2 && snapshot.h2Mol > 0;

  const dcHotspot: HotspotInfo = {
    id: 'dc-source',
    title: 'Nguồn điện một chiều (DC)',
    role: 'Quy định dấu hai điện cực trong bình điện phân',
    detail:
      'Khác với pin Galvani, nguồn điện ngoài ép electron đi từ Anode (+) qua nguồn về Cathode (−). Vì vậy trong bình điện phân: Anode mang dấu (+), Cathode mang dấu (−).',
  };

  const cathodeHotspot: HotspotInfo = {
    id: 'cuso4-cathode',
    title: 'Cathode (−) · Nơi xảy ra quá trình khử',
    role: isInert && snapshot.stage === 2 ? 'Giai đoạn 2: 2H⁺ + 2e⁻ → H₂↑' : 'Cu²⁺ + 2e⁻ → Cu',
    detail: isInert
      ? snapshot.stage === 2
        ? 'Ion Cu²⁺ đã hết theo mô hình, nên ở cathode (−) chuyển sang khử H⁺ (môi trường axit sinh ra ở giai đoạn 1) tạo khí H₂ thoát ra.'
        : 'Ion Cu²⁺ di chuyển về cathode (−) nhận 2e⁻ tạo kim loại Cu màu đỏ đồng bám lên điện cực.'
      : 'Ion Cu²⁺ nhận 2e⁻ tạo lớp đồng đỏ bám dày lên cathode (−), đúng bằng khối lượng đồng tan ra từ anode (+).',
  };

  const anodeHotspot: HotspotInfo = {
    id: 'cuso4-anode',
    title: isInert ? 'Anode (+) trơ (than chì / Pt)' : 'Anode (+) bằng đồng (Cu)',
    role: isInert ? '2H₂O → O₂↑ + 4H⁺ + 4e⁻' : 'Cu → Cu²⁺ + 2e⁻ (anode tan)',
    detail: isInert
      ? 'Điện cực trơ không tham gia phản ứng và SO₄²⁻ không bị oxi hóa trong dung dịch, nên H₂O bị oxi hóa sinh bọt khí O₂ và ion H⁺ liên tục ở cả hai giai đoạn.'
      : 'Kim loại Cu dễ bị oxi hóa hơn H₂O nên chính thanh đồng anode tan dần vào dung dịch thành Cu²⁺, giữ nồng độ Cu²⁺ ổn định và không có khí O₂ thoát ra.',
  };

  const solutionHotspot: HotspotInfo = {
    id: 'cuso4-solution',
    title: 'Dung dịch CuSO₄',
    role: isInert ? 'Nồng độ Cu²⁺ giảm dần theo thời gian' : 'Nồng độ Cu²⁺ giữ ổn định',
    detail: isInert
      ? snapshot.reachedDepletion
        ? 'Theo mô hình lí tưởng, toàn bộ Cu²⁺ ban đầu đã bị khử hết thành Cu. Dung dịch trở thành dung dịch H₂SO₄ loãng (màu xanh lam mất đi).'
        : `Còn ${formatViNumber(snapshot.cu2RemainingMol, { minDecimals: 4, maxDecimals: 4 })} mol Cu²⁺ trong bình. Khi Cu²⁺ giảm, màu xanh lam nhạt dần.`
      : 'Cứ 1 mol Cu²⁺ bị khử ở cathode lại có đúng 1 mol Cu tan thành Cu²⁺ ở anode, nên màu xanh dung dịch không đổi (trong giới hạn thanh Cu anode còn khối lượng).',
  };

  return (
    <svg
      viewBox="0 0 680 410"
      className="w-full h-auto block select-none"
      role="img"
      data-electron-cps={motionProfile.cyclesPerSecond.toFixed(3)}
      data-wire-electrons={motionProfile.wireParticleCount}
      aria-label={`Sơ đồ bình điện phân dung dịch CuSO4 dùng ${isInert ? 'điện cực trơ' : 'anode đồng'}`}
    >
      <defs>
        <radialGradient id="labSpotGlow2" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#1B3137" />
          <stop offset="72%" stopColor="#10191C" />
          <stop offset="100%" stopColor="#0B1215" />
        </radialGradient>
        <linearGradient id="glassRef2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.16" />
          <stop offset="12%" stopColor="#FFFFFF" stopOpacity="0.02" />
          <stop offset="88%" stopColor="#FFFFFF" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.14" />
        </linearGradient>
        <linearGradient id="graphiteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#262E32" />
          <stop offset="45%" stopColor="#4F5C62" />
          <stop offset="100%" stopColor="#20282C" />
        </linearGradient>
        <linearGradient id="copperAnodeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8A4221" />
          <stop offset="45%" stopColor="#DB9060" />
          <stop offset="100%" stopColor="#77381B" />
        </linearGradient>
        <marker
          id="arrowJade2"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#78D4C4" />
        </marker>
        <marker
          id="arrowCopper2"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#E39D6B" />
        </marker>
      </defs>

      <rect x="0" y="0" width="680" height="410" rx="8" fill="url(#labSpotGlow2)" />
      <line x1="28" y1="364" x2="652" y2="364" stroke="#24383E" strokeWidth="1.5" />
      <rect x="28" y="364" width="624" height="36" fill="#0B1316" opacity="0.65" />

      {/* Wires from DC Source */}
      <path
        d="M 244 166 L 244 64 L 282 64"
        fill="none"
        stroke="#78D4C4"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path
        d="M 398 64 L 436 64 L 436 166"
        fill="none"
        stroke="#C77B4C"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      {/* Electron Flow: Anode (+) -> DC -> Cathode (-) + Moving Electron Orbs */}
      {activeFlow && (
        <g>
          {/* Luminous outer-wire trajectory aura */}
          <path
            d="M 436 164 L 436 50 L 244 50 L 244 164"
            fill="none"
            stroke="#78E2D2"
            strokeWidth="7"
            strokeOpacity="0.14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 436 154 L 436 50 L 244 50 L 244 154"
            fill="none"
            stroke="#78D4C4"
            strokeWidth="2.4"
            strokeDasharray="8 8"
            markerEnd="url(#arrowJade2)"
            className={animate ? 'animate-dash-forward' : ''}
            style={
              animate
                ? { animationDuration: `${motionProfile.dashDurationSeconds.toFixed(2)}s` }
                : undefined
            }
          />
          <WireElectrons
            points={[
              [436, 164],
              [436, 50],
              [244, 50],
              [244, 164],
            ]}
            phase={electronPhase}
            count={motionProfile.wireParticleCount}
            glowIntensity={motionProfile.sparkIntensity}
          />
          <rect x="444" y="18" width="218" height="24" rx="4" fill="#112428" stroke="#78D4C4" strokeWidth="1" />
          <text
            x="553"
            y="34"
            textAnchor="middle"
            fill="#78D4C4"
            fontSize="11"
            fontWeight="700"
            fontFamily="var(--font-sans)"
          >
            e⁻ : Anode (+) → Cathode (−) · I = {formatViNumber(currentA, { maxDecimals: 2 })} A
          </text>
        </g>
      )}

      {/* DC Source Box Hotspot */}
      <g {...makeInteractiveProps(dcHotspot, activeHotspotId, onSelectHotspot)}>
        <rect
          x="282"
          y="38"
          width="116"
          height="52"
          rx="8"
          fill="#0C1417"
          stroke={activeHotspotId === 'dc-source' ? '#78D4C4' : '#3A545C'}
          strokeWidth={activeHotspotId === 'dc-source' ? '2.2' : '1.6'}
        />
        <text
          x="340"
          y="60"
          textAnchor="middle"
          fill="#F5F2EA"
          fontSize="13.5"
          fontWeight="700"
          fontFamily="var(--font-sans)"
        >
          Nguồn DC
        </text>
        <text
          x="340"
          y="78"
          textAnchor="middle"
          fill="#9BB3B9"
          fontSize="11"
          fontFamily="var(--font-sans)"
        >
          Một chiều
        </text>
        <circle cx="282" cy="64" r="10" fill="#143238" stroke="#78D4C4" strokeWidth="1.6" />
        <text x="282" y="69" textAnchor="middle" fill="#78D4C4" fontSize="15" fontWeight="700">
          −
        </text>
        <circle cx="398" cy="64" r="10" fill="#352016" stroke="#E39D6B" strokeWidth="1.6" />
        <text x="398" y="69" textAnchor="middle" fill="#E39D6B" fontSize="15" fontWeight="700">
          +
        </text>
      </g>

      {/* Glass Electrolysis Bath & Solution Hotspot */}
      <g {...makeInteractiveProps(solutionHotspot, activeHotspotId, onSelectHotspot)}>
        <path
          d="M 156 218 L 524 218 L 524 354 Q 524 362 514 362 L 166 362 Q 156 362 156 354 Z"
          fill="#2687C8"
          fillOpacity={liquidBlueOpacity}
        />
        <ellipse cx="340" cy="218" rx="184" ry="7" fill="#5CB6F0" fillOpacity={liquidBlueOpacity * 0.7} />
        <path
          d="M 150 176 L 156 354 Q 156 363 166 363 L 514 363 Q 524 363 524 354 L 530 176"
          fill="url(#glassRef2)"
          stroke={activeHotspotId === 'cuso4-solution' ? '#78D4C4' : '#6A8B95'}
          strokeWidth={activeHotspotId === 'cuso4-solution' ? '2.5' : '2'}
          strokeLinejoin="round"
        />

        {/* Explicit quantitative status inside bath */}
        <rect x="256" y="324" width="168" height="26" rx="4" fill="#0B1418" fillOpacity="0.88" stroke="#2D444C" strokeWidth="1" />
        <text
          x="340"
          y="341"
          textAnchor="middle"
          fill={isInert && snapshot.reachedDepletion ? '#F5D3BE' : '#D5F2FA'}
          fontSize="11.5"
          fontWeight="600"
          fontFamily="var(--font-mono)"
        >
          {isInert
            ? snapshot.reachedDepletion
              ? 'Cu²⁺: 0 mol (đã hết)'
              : `Cu²⁺ còn: ${formatViNumber(snapshot.cu2RemainingMol, { minDecimals: 4, maxDecimals: 4 })} mol`
            : 'Nồng độ Cu²⁺ ổn định'}
        </text>
      </g>

      {/* Cathode (-) Hotspot */}
      <g {...makeInteractiveProps(cathodeHotspot, activeHotspotId, onSelectHotspot)}>
        <rect
          x="224"
          y="162"
          width="40"
          height="160"
          rx="4"
          fill="none"
          stroke={activeHotspotId === 'cuso4-cathode' ? '#78D4C4' : 'transparent'}
          strokeWidth="2.5"
          strokeDasharray="4 3"
        />
        {/* Plated copper layer */}
        {cuPlatingPx > 0.3 && (
          <rect
            x={232 - cuPlatingPx / 2}
            y="218"
            width={24 + cuPlatingPx}
            height="96"
            rx="3"
            fill="#C77B4C"
            stroke="#F2B88C"
            strokeWidth="1"
          />
        )}
        <rect
          x="232"
          y="166"
          width="24"
          height="148"
          rx="2"
          fill="url(#graphiteGrad)"
          stroke="#6A7D85"
          strokeWidth="1.2"
        />
        {/* Cathode label placed cleanly left of wire */}
        <text
          x="216"
          y="118"
          textAnchor="end"
          fill="#F5F2EA"
          fontSize="14"
          fontWeight="700"
          fontFamily="var(--font-sans)"
        >
          Cathode (−)
        </text>
        <text
          x="216"
          y="136"
          textAnchor="end"
          fill="#78D4C4"
          fontSize="11.5"
          fontFamily="var(--font-sans)"
        >
          {showH2 ? 'Khử H⁺ → H₂↑' : 'Khử Cu²⁺ → Cu đỏ'}
        </text>

        {/* Ion migration arrow Cu2+ -> Cathode */}
        {activeFlow && (!isInert || !snapshot.reachedDepletion) && (
          <g>
            <line
              x1="312"
              y1="268"
              x2="266"
              y2="268"
              stroke="#E39D6B"
              strokeWidth="2"
              markerEnd="url(#arrowCopper2)"
            />
            <text x="290" y="258" textAnchor="middle" fill="#F5D3BE" fontSize="11.5" fontWeight="700">
              ← Cu²⁺
            </text>
          </g>
        )}

        {/* H2 bubbles ONLY in Stage 2 of CuSO4 inert */}
        {showH2 && (
          <g>
            {[0, 1, 2, 3].map((i) => (
              <circle
                key={i}
                cx={224 + (i % 2) * 38}
                cy={290 - i * 18}
                r={3.5 + (i % 2)}
                fill="#F5F2EA"
                fillOpacity="0.85"
                className={animate ? 'animate-bubble-rise' : ''}
                style={animate ? { animationDelay: `${i * 0.4}s` } : undefined}
              />
            ))}
            <rect x="164" y="182" width="58" height="22" rx="4" fill="#13262B" stroke="#F5F2EA" strokeWidth="1" />
            <text x="193" y="197" textAnchor="middle" fill="#F5F2EA" fontSize="11.5" fontWeight="700">
              H₂↑
            </text>
          </g>
        )}
      </g>

      {/* Anode (+) Hotspot */}
      <g {...makeInteractiveProps(anodeHotspot, activeHotspotId, onSelectHotspot)}>
        <rect
          x="416"
          y="162"
          width="40"
          height="160"
          rx="4"
          fill="none"
          stroke={activeHotspotId === 'cuso4-anode' ? '#78D4C4' : 'transparent'}
          strokeWidth="2.5"
          strokeDasharray="4 3"
        />
        {!isInert && anodeWearPx > 0.3 && (
          <rect
            x="424"
            y="218"
            width="24"
            height="96"
            fill="none"
            stroke="#E39D6B"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.6"
          />
        )}
        <rect
          x={424 + anodeWearPx / 2}
          y="166"
          width={Math.max(10, 24 - anodeWearPx)}
          height="148"
          rx="2"
          fill={isInert ? 'url(#graphiteGrad)' : 'url(#copperAnodeGrad)'}
          stroke={isInert ? '#6A7D85' : '#5E2B14'}
          strokeWidth="1.2"
        />

        {/* Anode label placed cleanly right of wire */}
        <text
          x="464"
          y="118"
          textAnchor="start"
          fill="#F5F2EA"
          fontSize="14"
          fontWeight="700"
          fontFamily="var(--font-sans)"
        >
          Anode (+)
        </text>
        <text
          x="464"
          y="136"
          textAnchor="start"
          fill="#E39D6B"
          fontSize="11.5"
          fontFamily="var(--font-sans)"
        >
          {isInert ? 'Than chì · O₂↑ + H⁺' : 'Thanh Cu · tan tạo Cu²⁺'}
        </text>

        {/* O2 bubbles for inert anode */}
        {showO2 && (
          <g>
            {[0, 1, 2, 3].map((i) => (
              <circle
                key={i}
                cx={418 + (i % 2) * 36}
                cy={294 - i * 19}
                r={3.5 + (i % 2)}
                fill="#78D4C4"
                fillOpacity="0.88"
                className={animate ? 'animate-bubble-rise' : ''}
                style={animate ? { animationDelay: `${i * 0.45}s` } : undefined}
              />
            ))}
            <rect x="462" y="182" width="54" height="22" rx="4" fill="#10292D" stroke="#78D4C4" strokeWidth="1" />
            <text x="489" y="197" textAnchor="middle" fill="#78D4C4" fontSize="11.5" fontWeight="700">
              O₂↑
            </text>
          </g>
        )}

        {/* Copper dissolution arrow for copper anode */}
        {!isInert && activeFlow && (
          <g>
            <line
              x1="418"
              y1="268"
              x2="370"
              y2="268"
              stroke="#E39D6B"
              strokeWidth="2"
              markerEnd="url(#arrowCopper2)"
            />
            <text x="394" y="258" textAnchor="middle" fill="#F5D3BE" fontSize="11.5" fontWeight="700">
              ← Cu²⁺
            </text>
          </g>
        )}
      </g>

      {/* Detaching e- at Anode (+) & Attaching e- at Cathode (-) */}
      {activeFlow && (
        <>
          <CathodeAttachElectrons
            rodX={244}
            rodTopY={172}
            attachX={260}
            attachY={268}
            badgeX={164}
            badgeY={256}
            badgeWidth={56}
            label="bám 2e⁻"
            phase={electronPhase}
            glowIntensity={motionProfile.sparkIntensity}
          />
          <AnodeDetachElectrons
            detachX={420}
            detachY={268}
            rodX={436}
            rodTopY={172}
            badgeX={458}
            badgeY={256}
            badgeWidth={56}
            label={isInert ? 'tách 4e⁻' : 'tách 2e⁻'}
            phase={electronPhase}
            glowIntensity={motionProfile.sparkIntensity}
          />
        </>
      )}

      {/* Bottom caption */}
      <text
        x="340"
        y="386"
        textAnchor="middle"
        fill="#DCE4E6"
        fontSize="13"
        fontWeight="600"
        fontFamily="var(--font-sans)"
      >
        {isInert
          ? 'Bình điện phân CuSO₄ · Điện cực trơ (C / Pt)'
          : 'Bình điện phân CuSO₄ · Anode tan bằng đồng (Cu)'}
      </text>
    </svg>
  );
};

interface LabNaClSvgProps {
  snapshot: ElectrolysisSnapshot;
  isRunning: boolean;
  currentA?: number;
  playbackSpeed?: number;
  reducedMotion: boolean;
  activeHotspotId: string | null;
  onSelectHotspot: (info: HotspotInfo) => void;
}

export const LabNaClSvg: React.FC<LabNaClSvgProps> = ({
  snapshot,
  isRunning,
  currentA = 2,
  playbackSpeed = 1,
  reducedMotion,
  activeHotspotId,
  onSelectHotspot,
}) => {
  const isMolten = snapshot.variant === 'nacl-molten';
  const activeFlow = snapshot.timeSeconds > 0 || isRunning;
  const animate = activeFlow && isRunning && !reducedMotion;
  const motionProfile = computeElectronMotionProfile(currentA, playbackSpeed);
  const electronPhase = useElectronPhase(animate, motionProfile.cyclesPerSecond, reducedMotion);

  const cathodeHotspot: HotspotInfo = {
    id: 'nacl-cathode',
    title: 'Cathode (−) · Quá trình khử',
    role: isMolten ? 'Na⁺ + e⁻ → Na (lỏng)' : '2H₂O + 2e⁻ → H₂↑ + 2OH⁻',
    detail: isMolten
      ? 'Môi trường NaCl nóng chảy hoàn toàn không có nước. Chỉ có cation Na⁺ nên Na⁺ bị khử thành kim loại Na lỏng.'
      : 'Trong dung dịch nước, H₂O dễ bị khử hơn ion Na⁺ rất nhiều, nên H₂O nhận electron sinh khí H₂ và ion OH⁻ (tạo dung dịch NaOH) ở ngăn cathode.',
  };

  const anodeHotspot: HotspotInfo = {
    id: 'nacl-anode',
    title: 'Anode (+) · Quá trình oxi hóa',
    role: '2Cl⁻ → Cl₂↑ + 2e⁻',
    detail:
      'Ở cả NaCl nóng chảy và dung dịch NaCl bão hòa, anion Cl⁻ đều bị oxi hóa tại anode (+) tạo khí chlorine (Cl₂) màu vàng lục thoát ra.',
  };

  const diaphragmHotspot: HotspotInfo = {
    id: 'nacl-diaphragm',
    title: isMolten ? 'Bể muối NaCl nóng chảy' : 'Màng ngăn xốp',
    role: isMolten ? 'Chỉ có ion Na⁺ và Cl⁻ tự do' : 'Ngăn Cl₂ tiếp xúc với NaOH',
    detail: isMolten
      ? 'NaCl rắn được nung nóng chảy (~801 °C) để phân li thành ion Na⁺ và Cl⁻ linh động dẫn điện; hoàn toàn không có phân tử H₂O.'
      : 'Màng ngăn xốp cho ion Na⁺ di chuyển qua để trung hòa điện tích nhưng ngăn khí Cl₂ (ngăn anode) trộn với dung dịch NaOH (ngăn cathode), tránh tạo nước Javel (NaClO).',
  };

  const dcHotspot: HotspotInfo = {
    id: 'nacl-dc',
    title: 'Nguồn điện một chiều (DC)',
    role: 'Cực (−) nối Cathode · Cực (+) nối Anode',
    detail:
      'Nguồn DC cung cấp năng lượng để ép phản ứng điện phân không tự xảy ra diễn ra, dẫn electron từ Anode (+) sang Cathode (−).',
  };

  return (
    <svg
      viewBox="0 0 680 410"
      className="w-full h-auto block select-none"
      role="img"
      data-electron-cps={motionProfile.cyclesPerSecond.toFixed(3)}
      data-wire-electrons={motionProfile.wireParticleCount}
      aria-label={
        isMolten
          ? 'Sơ đồ bình điện phân NaCl nóng chảy tạo Na ở cathode âm và Cl2 ở anode dương'
          : 'Sơ đồ bình điện phân dung dịch NaCl bão hòa có màng ngăn xốp tạo H2, NaOH ở ngăn cathode và Cl2 ở ngăn anode'
      }
    >
      <defs>
        <radialGradient id="labSpotGlow3" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor={isMolten ? '#2C1F1A' : '#192F35'} />
          <stop offset="72%" stopColor="#10191C" />
          <stop offset="100%" stopColor="#0B1215" />
        </radialGradient>
        <linearGradient id="moltenBath" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D87D38" stopOpacity="0.46" />
          <stop offset="100%" stopColor="#943E1A" stopOpacity="0.62" />
        </linearGradient>
        <linearGradient id="graphiteGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#262E32" />
          <stop offset="45%" stopColor="#56656C" />
          <stop offset="100%" stopColor="#20282C" />
        </linearGradient>
        <marker
          id="arrowJade3"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#78D4C4" />
        </marker>
        <marker
          id="arrowCl2"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#C8DF78" />
        </marker>
      </defs>

      <rect x="0" y="0" width="680" height="410" rx="8" fill="url(#labSpotGlow3)" />
      <line x1="28" y1="364" x2="652" y2="364" stroke="#24383E" strokeWidth="1.5" />
      <rect x="28" y="364" width="624" height="36" fill="#0B1316" opacity="0.65" />

      {/* Wires */}
      <path
        d="M 232 166 L 232 64 L 282 64"
        fill="none"
        stroke="#78D4C4"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path
        d="M 398 64 L 448 64 L 448 166"
        fill="none"
        stroke="#C77B4C"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      {/* Electron flow + Moving Electron Orbs */}
      {activeFlow && (
        <g>
          {/* Luminous outer-wire trajectory aura */}
          <path
            d="M 448 164 L 448 50 L 232 50 L 232 164"
            fill="none"
            stroke="#78E2D2"
            strokeWidth="7"
            strokeOpacity="0.14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 448 154 L 448 50 L 232 50 L 232 154"
            fill="none"
            stroke="#78D4C4"
            strokeWidth="2.4"
            strokeDasharray="8 8"
            markerEnd="url(#arrowJade3)"
            className={animate ? 'animate-dash-forward' : ''}
            style={
              animate
                ? { animationDuration: `${motionProfile.dashDurationSeconds.toFixed(2)}s` }
                : undefined
            }
          />
          <WireElectrons
            points={[
              [448, 164],
              [448, 50],
              [232, 50],
              [232, 164],
            ]}
            phase={electronPhase}
            count={motionProfile.wireParticleCount}
            glowIntensity={motionProfile.sparkIntensity}
          />
          <rect x="444" y="18" width="218" height="24" rx="4" fill="#112428" stroke="#78D4C4" strokeWidth="1" />
          <text
            x="553"
            y="34"
            textAnchor="middle"
            fill="#78D4C4"
            fontSize="11"
            fontWeight="700"
            fontFamily="var(--font-sans)"
          >
            e⁻ : Anode (+) → Cathode (−) · I = {formatViNumber(currentA, { maxDecimals: 2 })} A
          </text>
        </g>
      )}

      {/* DC Source */}
      <g {...makeInteractiveProps(dcHotspot, activeHotspotId, onSelectHotspot)}>
        <rect
          x="282"
          y="38"
          width="116"
          height="52"
          rx="8"
          fill="#0C1417"
          stroke={activeHotspotId === 'nacl-dc' ? '#78D4C4' : '#3A545C'}
          strokeWidth={activeHotspotId === 'nacl-dc' ? '2.2' : '1.6'}
        />
        <text x="340" y="60" textAnchor="middle" fill="#F5F2EA" fontSize="13.5" fontWeight="700">
          Nguồn DC
        </text>
        <text x="340" y="78" textAnchor="middle" fill="#9BB3B9" fontSize="11" fontFamily="var(--font-sans)">
          Một chiều
        </text>
        <circle cx="282" cy="64" r="10" fill="#143238" stroke="#78D4C4" strokeWidth="1.6" />
        <text x="282" y="69" textAnchor="middle" fill="#78D4C4" fontSize="15" fontWeight="700">
          −
        </text>
        <circle cx="398" cy="64" r="10" fill="#352016" stroke="#E39D6B" strokeWidth="1.6" />
        <text x="398" y="69" textAnchor="middle" fill="#E39D6B" fontSize="15" fontWeight="700">
          +
        </text>
      </g>

      {/* Cell Vessel & Medium */}
      <g>
        {isMolten ? (
          <>
            <path
              d="M 146 218 L 534 218 L 534 352 Q 534 362 522 362 L 158 362 Q 146 362 146 352 Z"
              fill="url(#moltenBath)"
            />
            <ellipse cx="340" cy="218" rx="194" ry="7" fill="#E89E5D" fillOpacity="0.4" />
          </>
        ) : (
          <>
            {/* Left compartment alkaline glow grows as OH- accumulates */}
            <path
              d="M 146 218 L 340 218 L 340 362 L 158 362 Q 146 362 146 352 Z"
              fill="#3FA89A"
              fillOpacity={0.14 + snapshot.progressRatio * 0.24}
            />
            {/* Right compartment brine */}
            <path
              d="M 340 218 L 534 218 L 534 352 Q 534 362 522 362 L 340 362 Z"
              fill="#5D8DA1"
              fillOpacity="0.18"
            />
            <ellipse cx="340" cy="218" rx="194" ry="7" fill="#89C6CF" fillOpacity="0.24" />
          </>
        )}

        {/* Vessel Outline */}
        <path
          d="M 140 176 L 146 352 Q 146 363 158 363 L 522 363 Q 534 363 534 352 L 540 176"
          fill="none"
          stroke={isMolten ? '#B87C55' : '#6A8B95'}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      </g>

      {/* Center Diaphragm (Brine) OR Molten Medium Badge Hotspot */}
      <g {...makeInteractiveProps(diaphragmHotspot, activeHotspotId, onSelectHotspot)}>
        {isMolten ? (
          <>
            <rect
              x="266"
              y="318"
              width="148"
              height="34"
              rx="4"
              fill="#1E130D"
              fillOpacity="0.92"
              stroke={activeHotspotId === 'nacl-diaphragm' ? '#78D4C4' : '#C77B4C'}
              strokeWidth="1.2"
            />
            <text x="340" y="333" textAnchor="middle" fill="#F5D3BE" fontSize="11" fontWeight="700">
              NaCl nóng chảy (~801 °C)
            </text>
            <text x="340" y="347" textAnchor="middle" fill="#E39D6B" fontSize="10.5">
              Không có H₂O · Chỉ Na⁺, Cl⁻
            </text>
          </>
        ) : (
          <>
            {/* Porous Diaphragm Wall */}
            <rect
              x="333"
              y="182"
              width="14"
              height="180"
              fill="#1B2A30"
              stroke={activeHotspotId === 'nacl-diaphragm' ? '#78D4C4' : '#96B2BA'}
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
            <rect
              x="290"
              y="184"
              width="100"
              height="22"
              rx="4"
              fill="#0E1A1E"
              stroke="#78D4C4"
              strokeWidth="1"
            />
            <text x="340" y="199" textAnchor="middle" fill="#F5F2EA" fontSize="11" fontWeight="700">
              Màng ngăn xốp
            </text>

            {/* Compartment Labels */}
            <text x="242" y="348" textAnchor="middle" fill="#B9F2E7" fontSize="11" fontWeight="600">
              Ngăn Cathode · Tạo OH⁻ (NaOH)
            </text>
            <text x="438" y="348" textAnchor="middle" fill="#DCE4E6" fontSize="11" fontWeight="600">
              Ngăn Anode · Thoát Cl₂
            </text>

            {/* Na+ crossing diaphragm right -> left */}
            {activeFlow && (
              <g>
                <line
                  x1="366"
                  y1="278"
                  x2="312"
                  y2="278"
                  stroke="#78D4C4"
                  strokeWidth="2"
                  markerEnd="url(#arrowJade3)"
                />
                <text x="340" y="269" textAnchor="middle" fill="#78D4C4" fontSize="11" fontWeight="700">
                  ← Na⁺
                </text>
              </g>
            )}
          </>
        )}
      </g>

      {/* Cathode (-) Hotspot */}
      <g {...makeInteractiveProps(cathodeHotspot, activeHotspotId, onSelectHotspot)}>
        <rect
          x="212"
          y="162"
          width="40"
          height="156"
          rx="4"
          fill="none"
          stroke={activeHotspotId === 'nacl-cathode' ? '#78D4C4' : 'transparent'}
          strokeWidth="2.5"
          strokeDasharray="4 3"
        />
        <rect
          x="220"
          y="166"
          width="24"
          height="146"
          rx="2"
          fill="url(#graphiteGrad3)"
          stroke="#72868F"
          strokeWidth="1.2"
        />
        <text x="206" y="118" textAnchor="end" fill="#F5F2EA" fontSize="14" fontWeight="700">
          Cathode (−)
        </text>
        <text x="206" y="136" textAnchor="end" fill="#78D4C4" fontSize="11.5">
          {isMolten ? 'Na⁺ + e⁻ → Na(l)' : '2H₂O + 2e⁻ → H₂↑ + 2OH⁻'}
        </text>

        {activeFlow && isMolten && (
          <g>
            {/* Silvery molten sodium layer / droplets */}
            <rect
              x="216"
              y="222"
              width="32"
              height="68"
              rx="5"
              fill="#DCE6EB"
              fillOpacity={0.35 + snapshot.progressRatio * 0.45}
              stroke="#F5F2EA"
              strokeWidth="1.2"
            />
            <rect x="152" y="182" width="60" height="22" rx="4" fill="#182226" stroke="#DCE6EB" strokeWidth="1" />
            <text x="182" y="197" textAnchor="middle" fill="#F5F2EA" fontSize="11.5" fontWeight="700">
              Na (l)
            </text>
            <line
              x1="296"
              y1="264"
              x2="254"
              y2="264"
              stroke="#F5F2EA"
              strokeWidth="1.8"
              markerEnd="url(#arrowJade3)"
            />
            <text x="278" y="254" textAnchor="middle" fill="#F5F2EA" fontSize="11.5" fontWeight="700">
              Na⁺
            </text>
          </g>
        )}

        {activeFlow && !isMolten && (
          <g>
            {[0, 1, 2, 3].map((i) => (
              <circle
                key={i}
                cx={212 + (i % 2) * 38}
                cy={290 - i * 18}
                r={3.5 + (i % 2)}
                fill="#78D4C4"
                fillOpacity="0.9"
                className={animate ? 'animate-bubble-rise' : ''}
                style={animate ? { animationDelay: `${i * 0.38}s` } : undefined}
              />
            ))}
            <rect x="154" y="182" width="56" height="22" rx="4" fill="#10292D" stroke="#78D4C4" strokeWidth="1" />
            <text x="182" y="197" textAnchor="middle" fill="#78D4C4" fontSize="11.5" fontWeight="700">
              H₂↑
            </text>
            <text x="184" y="316" textAnchor="middle" fill="#9DEADF" fontSize="11.5" fontWeight="700">
              OH⁻ tích tụ
            </text>
          </g>
        )}
      </g>

      {/* Anode (+) Hotspot */}
      <g {...makeInteractiveProps(anodeHotspot, activeHotspotId, onSelectHotspot)}>
        <rect
          x="428"
          y="162"
          width="40"
          height="156"
          rx="4"
          fill="none"
          stroke={activeHotspotId === 'nacl-anode' ? '#78D4C4' : 'transparent'}
          strokeWidth="2.5"
          strokeDasharray="4 3"
        />
        <rect
          x="436"
          y="166"
          width="24"
          height="146"
          rx="2"
          fill="url(#graphiteGrad3)"
          stroke="#72868F"
          strokeWidth="1.2"
        />
        <text x="474" y="118" textAnchor="start" fill="#F5F2EA" fontSize="14" fontWeight="700">
          Anode (+)
        </text>
        <text x="474" y="136" textAnchor="start" fill="#C8DF78" fontSize="11.5">
          2Cl⁻ → Cl₂↑ + 2e⁻
        </text>

        {activeFlow && (
          <g>
            {[0, 1, 2, 3].map((i) => (
              <circle
                key={i}
                cx={428 + (i % 2) * 38}
                cy={290 - i * 18}
                r={3.5 + (i % 2)}
                fill="#C8DF78"
                fillOpacity="0.9"
                className={animate ? 'animate-bubble-rise' : ''}
                style={animate ? { animationDelay: `${i * 0.42}s` } : undefined}
              />
            ))}
            <rect x="472" y="182" width="56" height="22" rx="4" fill="#232914" stroke="#C8DF78" strokeWidth="1" />
            <text x="500" y="197" textAnchor="middle" fill="#C8DF78" fontSize="11.5" fontWeight="700">
              Cl₂↑
            </text>
            <line
              x1="384"
              y1="264"
              x2="424"
              y2="264"
              stroke="#C8DF78"
              strokeWidth="1.8"
              markerEnd="url(#arrowCl2)"
            />
            <text x="404" y="254" textAnchor="middle" fill="#C8DF78" fontSize="11.5" fontWeight="700">
              Cl⁻
            </text>
          </g>
        )}
      </g>

      {/* Detaching e- at Anode (+) & Attaching e- at Cathode (-) */}
      {activeFlow && (
        <>
          <CathodeAttachElectrons
            rodX={232}
            rodTopY={172}
            attachX={248}
            attachY={264}
            badgeX={154}
            badgeY={254}
            badgeWidth={56}
            label={isMolten ? 'bám e⁻' : 'bám 2e⁻'}
            phase={electronPhase}
            glowIntensity={motionProfile.sparkIntensity}
          />
          <AnodeDetachElectrons
            detachX={432}
            detachY={264}
            rodX={448}
            rodTopY={172}
            badgeX={470}
            badgeY={254}
            badgeWidth={56}
            label="tách 2e⁻"
            phase={electronPhase}
            glowIntensity={motionProfile.sparkIntensity}
          />
        </>
      )}

      <text x="340" y="386" textAnchor="middle" fill="#DCE4E6" fontSize="13" fontWeight="600">
        {isMolten
          ? 'Bình điện phân NaCl nóng chảy (điện cực trơ)'
          : 'Bình điện phân dung dịch NaCl bão hòa (điện cực trơ, có màng ngăn)'}
      </text>
    </svg>
  );
};
