import React from 'react';

interface ZnCuSimSvgProps {
  isRunning: boolean;
  isCircuitClosed: boolean;
  step: number; // 0..3
}

export const ZnCuSimSvg: React.FC<ZnCuSimSvgProps> = ({
  isRunning,
  isCircuitClosed,
  step,
}) => {
  const activeFlow = isRunning && isCircuitClosed;
  const znShrink = isCircuitClosed ? step * 2.5 : 0;
  const cuGrowth = isCircuitClosed ? step * 2.5 : 0;

  return (
    <svg
      viewBox="0 0 680 400"
      className="w-full h-auto block"
      role="img"
      aria-label={`Mô phỏng pin Zn–Cu, mạch đang ${isCircuitClosed ? 'đóng, vôn kế chỉ 1,103 V' : 'mở, dòng điện dừng'}. Anode cực âm là thanh Zn, cathode cực dương là thanh Cu, cầu muối KNO3.`}
    >
      <defs>
        <marker id="sim-arr-e" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#A34E32" />
        </marker>
        <marker id="sim-arr-no3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#172B2E" />
        </marker>
        <marker id="sim-arr-k" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#266C63" />
        </marker>
      </defs>

      <rect x="8" y="8" width="664" height="384" fill="#FCFBF7" stroke="#D7D1C3" strokeWidth="1" />

      {/* External Wire */}
      <path d="M 152 162 L 152 62 L 246 62" fill="none" stroke="#172B2E" strokeWidth="2.4" />
      {/* Switch segment between x=408 and x=450 */}
      <path d="M 366 62 L 408 62" fill="none" stroke="#172B2E" strokeWidth="2.4" />
      <circle cx="408" cy="62" r="3.5" fill="#172B2E" />
      <circle cx="450" cy="62" r="3.5" fill="#172B2E" />
      {isCircuitClosed ? (
        <line x1="408" y1="62" x2="450" y2="62" stroke="#266C63" strokeWidth="3" />
      ) : (
        <line x1="408" y1="62" x2="444" y2="40" stroke="#A34E32" strokeWidth="3" />
      )}
      <text
        x="429"
        y="86"
        textAnchor="middle"
        fill={isCircuitClosed ? '#266C63' : '#A34E32'}
        fontFamily="Be Vietnam Pro, sans-serif"
        fontSize="11.5"
        fontWeight="600"
      >
        {isCircuitClosed ? 'Khóa K đóng' : 'Khóa K mở'}
      </text>
      <path d="M 450 62 L 528 62 L 528 162" fill="none" stroke="#172B2E" strokeWidth="2.4" />

      {/* Animated Electron Flow Line (Distinct Copper-Red Dotted/Dashed Line) */}
      {isCircuitClosed && (
        <>
          <path
            d="M 152 150 L 152 50 L 238 50"
            fill="none"
            stroke="#A34E32"
            strokeWidth="2.2"
            strokeDasharray="6 6"
            className={activeFlow ? 'animate-dash-forward' : ''}
            markerEnd="url(#sim-arr-e)"
          />
          <path
            d="M 374 50 L 528 50 L 528 148"
            fill="none"
            stroke="#A34E32"
            strokeWidth="2.2"
            strokeDasharray="6 6"
            className={activeFlow ? 'animate-dash-forward' : ''}
            markerEnd="url(#sim-arr-e)"
          />
          <text
            x="196"
            y="38"
            textAnchor="middle"
            fill="#A34E32"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="12"
            fontWeight="600"
          >
            Dòng e⁻ (Zn → Cu)
          </text>
          <text
            x="488"
            y="38"
            textAnchor="middle"
            fill="#A34E32"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="12"
            fontWeight="600"
          >
            e⁻ đi về Cu
          </text>
        </>
      )}

      {/* Voltmeter */}
      <rect x="246" y="34" width="120" height="54" rx="4" fill="#F7F4EC" stroke="#172B2E" strokeWidth="1.8" />
      <text x="306" y="51" textAnchor="middle" fill="#465B5E" fontFamily="Be Vietnam Pro, sans-serif" fontSize="11">
        Vôn kế chuẩn
      </text>
      <text
        x="306"
        y="76"
        textAnchor="middle"
        fill={isCircuitClosed ? '#172B2E' : '#A34E32'}
        fontFamily="IBM Plex Mono, monospace"
        fontSize="17"
        fontWeight="600"
      >
        {isCircuitClosed ? '1,103 V' : '0,000 V'}
      </text>

      {/* Left Beaker (ZnSO4) */}
      <path d="M 88 190 L 88 326 Q 88 336 98 336 L 260 336 Q 270 336 270 326 L 270 190" fill="none" stroke="#172B2E" strokeWidth="2" />
      <path d="M 90 228 L 268 228 L 268 325 Q 268 334 259 334 L 99 334 Q 90 334 90 325 Z" fill="#E9EFEF" />
      <line x1="90" y1="228" x2="268" y2="228" stroke="#99B0B3" strokeWidth="1.2" />

      {/* Right Beaker (CuSO4) */}
      <path d="M 410 190 L 410 326 Q 410 336 420 336 L 582 336 Q 592 336 592 326 L 592 190" fill="none" stroke="#172B2E" strokeWidth="2" />
      <path
        d="M 412 228 L 590 228 L 590 325 Q 590 334 581 334 L 421 334 Q 412 334 412 325 Z"
        fill={step >= 3 && isCircuitClosed ? '#DFEFEC' : '#C6E2DE'}
      />
      <line x1="412" y1="228" x2="590" y2="228" stroke="#266C63" strokeWidth="1.2" />

      {/* Salt Bridge (U-tube KNO3) */}
      <path
        d="M 236 276 L 236 164 Q 236 140 260 140 L 420 140 Q 444 140 444 164 L 444 276"
        fill="none"
        stroke="#172B2E"
        strokeWidth="24"
        strokeLinecap="round"
      />
      <path
        d="M 236 276 L 236 164 Q 236 140 260 140 L 420 140 Q 444 140 444 164 L 444 276"
        fill="none"
        stroke="#F7F4EC"
        strokeWidth="20"
        strokeLinecap="round"
      />
      <text x="340" y="120" textAnchor="middle" fill="#172B2E" fontFamily="Be Vietnam Pro, sans-serif" fontSize="12.5" fontWeight="600">
        Cầu muối KNO₃
      </text>

      {/* Distinct Ion Paths inside Salt Bridge */}
      {/* NO3- (dashed dark ink arrow moving left toward Zn beaker) */}
      <path
        d="M 332 135 L 254 135 Q 241 135 241 154 L 241 200"
        fill="none"
        stroke="#172B2E"
        strokeWidth="1.8"
        strokeDasharray="4 3"
        className={activeFlow ? 'animate-dash-forward' : ''}
        markerEnd="url(#sim-arr-no3)"
      />
      <text x="290" y="164" textAnchor="middle" fill="#172B2E" fontFamily="IBM Plex Mono, monospace" fontSize="11.5" fontWeight="600">
        NO₃⁻ → Zn
      </text>

      {/* K+ (solid verdigris arrow moving right toward Cu beaker) */}
      <path
        d="M 348 145 L 426 145 Q 439 145 439 160 L 439 200"
        fill="none"
        stroke="#266C63"
        strokeWidth="2"
        strokeDasharray={activeFlow ? '10 4' : 'none'}
        className={activeFlow ? 'animate-dash-forward' : ''}
        markerEnd="url(#sim-arr-k)"
      />
      <text x="392" y="164" textAnchor="middle" fill="#266C63" fontFamily="IBM Plex Mono, monospace" fontSize="11.5" fontWeight="600">
        K⁺ → Cu
      </text>

      {/* Zn Electrode (Anode -) */}
      <rect
        x={136 + znShrink / 2}
        y="160"
        width={32 - znShrink}
        height="140"
        fill="#A6B0B2"
        stroke="#172B2E"
        strokeWidth="1.6"
      />
      <text x="152" y="210" textAnchor="middle" fill="#172B2E" fontFamily="Be Vietnam Pro, sans-serif" fontSize="14" fontWeight="700">
        Zn
      </text>
      {isCircuitClosed && step >= 1 && (
        <text x="195" y="264" textAnchor="middle" fill="#172B2E" fontFamily="IBM Plex Mono, monospace" fontSize="11.5" fontWeight="600">
          → Zn²⁺
        </text>
      )}

      {/* Cu Electrode (Cathode +) */}
      <rect
        x={512 - cuGrowth / 2}
        y="160"
        width={32 + cuGrowth}
        height="140"
        fill="#C77657"
        stroke="#172B2E"
        strokeWidth="1.6"
      />
      <text x="528" y="210" textAnchor="middle" fill="#FCFBF7" fontFamily="Be Vietnam Pro, sans-serif" fontSize="14" fontWeight="700">
        Cu
      </text>
      {isCircuitClosed && step >= 2 && (
        <text x="480" y="264" textAnchor="middle" fill="#A34E32" fontFamily="IBM Plex Mono, monospace" fontSize="11.5" fontWeight="600">
          Cu²⁺ →
        </text>
      )}

      {/* Electrode Pole Callouts — cleanly clear of vertical wires */}
      <text x="138" y="114" textAnchor="end" fill="#172B2E" fontFamily="Be Vietnam Pro, sans-serif" fontSize="13.5" fontWeight="700">
        Anode (−)
      </text>
      <text x="138" y="132" textAnchor="end" fill="#465B5E" fontFamily="Be Vietnam Pro, sans-serif" fontSize="11.5">
        Oxi hóa (mòn dần)
      </text>

      <text x="542" y="114" textAnchor="start" fill="#A34E32" fontFamily="Be Vietnam Pro, sans-serif" fontSize="13.5" fontWeight="700">
        Cathode (+)
      </text>
      <text x="542" y="132" textAnchor="start" fill="#465B5E" fontFamily="Be Vietnam Pro, sans-serif" fontSize="11.5">
        Khử (Cu bám thêm)
      </text>

      {/* Solution & Equation Labels */}
      <text x="179" y="324" textAnchor="middle" fill="#172B2E" fontFamily="Be Vietnam Pro, sans-serif" fontSize="12.5" fontWeight="500">
        dd ZnSO₄ 1 M
      </text>
      <text x="501" y="324" textAnchor="middle" fill="#172B2E" fontFamily="Be Vietnam Pro, sans-serif" fontSize="12.5" fontWeight="500">
        dd CuSO₄ 1 M
      </text>
      <text x="179" y="366" textAnchor="middle" fill="#172B2E" fontFamily="IBM Plex Mono, monospace" fontSize="12.5" fontWeight="600">
        Zn → Zn²⁺ + 2e⁻
      </text>
      <text x="501" y="366" textAnchor="middle" fill="#172B2E" fontFamily="IBM Plex Mono, monospace" fontSize="12.5" fontWeight="600">
        Cu²⁺ + 2e⁻ → Cu
      </text>
    </svg>
  );
};

interface CuSO4SimSvgProps {
  isRunning: boolean;
  electrodeMode: 'inert' | 'copper';
  step: number;
}

export const CuSO4SimSvg: React.FC<CuSO4SimSvgProps> = ({
  isRunning,
  electrodeMode,
  step,
}) => {
  const isInert = electrodeMode === 'inert';
  const cuPlating = step * 2.5;
  const anodeCorrosion = !isInert ? step * 2.5 : 0;

  return (
    <svg
      viewBox="0 0 680 400"
      className="w-full h-auto block"
      role="img"
      aria-label={`Mô phỏng bình điện phân dung dịch CuSO4 dùng ${isInert ? 'điện cực trơ (cathode có Cu bám, anode có khí O2 thoát ra)' : 'anode tan bằng đồng Cu (anode Cu tan dần, cathode có Cu bám)'}.`}
    >
      <defs>
        <marker id="el-arr-e" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#A34E32" />
        </marker>
        <marker id="el-arr-ion" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#266C63" />
        </marker>
      </defs>

      <rect x="8" y="8" width="664" height="384" fill="#FCFBF7" stroke="#D7D1C3" strokeWidth="1" />

      {/* DC Power Source at Top */}
      <rect x="266" y="28" width="148" height="54" rx="4" fill="#F7F4EC" stroke="#172B2E" strokeWidth="1.8" />
      <text x="340" y="47" textAnchor="middle" fill="#172B2E" fontFamily="Be Vietnam Pro, sans-serif" fontSize="12" fontWeight="600">
        Nguồn điện 1 chiều (DC)
      </text>
      <text x="292" y="71" textAnchor="middle" fill="#266C63" fontFamily="IBM Plex Mono, monospace" fontSize="16" fontWeight="700">
        −
      </text>
      <text x="340" y="70" textAnchor="middle" fill="#465B5E" fontFamily="Be Vietnam Pro, sans-serif" fontSize="11">
        DC
      </text>
      <text x="388" y="71" textAnchor="middle" fill="#A34E32" fontFamily="IBM Plex Mono, monospace" fontSize="16" fontWeight="700">
        +
      </text>

      {/* External Wires: Left connects DC (-) to Cathode (-); Right connects DC (+) to Anode (+) */}
      <path d="M 266 55 L 210 55 L 210 156" fill="none" stroke="#172B2E" strokeWidth="2.4" />
      <path d="M 414 55 L 470 55 L 470 156" fill="none" stroke="#172B2E" strokeWidth="2.4" />

      {/* Electron Flow: Anode (+) -> DC -> Cathode (-) */}
      <path
        d="M 484 148 L 484 44 L 420 44"
        fill="none"
        stroke="#A34E32"
        strokeWidth="2.2"
        strokeDasharray="6 6"
        className={isRunning ? 'animate-dash-forward' : ''}
        markerEnd="url(#el-arr-e)"
      />
      <path
        d="M 260 44 L 196 44 L 196 146"
        fill="none"
        stroke="#A34E32"
        strokeWidth="2.2"
        strokeDasharray="6 6"
        className={isRunning ? 'animate-dash-forward' : ''}
        markerEnd="url(#el-arr-e)"
      />
      <text x="536" y="42" textAnchor="middle" fill="#A34E32" fontFamily="Be Vietnam Pro, sans-serif" fontSize="12" fontWeight="600">
        e⁻ rời Anode (+)
      </text>
      <text x="144" y="42" textAnchor="middle" fill="#A34E32" fontFamily="Be Vietnam Pro, sans-serif" fontSize="12" fontWeight="600">
        e⁻ về Cathode (−)
      </text>

      {/* Single Electrolysis Vessel */}
      <path
        d="M 134 176 L 134 328 Q 134 340 146 340 L 534 340 Q 546 340 546 328 L 546 176"
        fill="none"
        stroke="#172B2E"
        strokeWidth="2.2"
      />
      {/* CuSO4 Solution: fades with step if inert, stays deep blue if Cu anode */}
      <path
        d="M 136 210 L 544 210 L 544 327 Q 544 338 533 338 L 147 338 Q 136 338 136 327 Z"
        fill={isInert && step >= 2 ? '#D9ECE9' : '#BFE0DC'}
      />
      <line x1="136" y1="210" x2="544" y2="210" stroke="#266C63" strokeWidth="1.2" />

      {/* Left Electrode: Cathode (−) */}
      <rect x="194" y="156" width="32" height="148" fill="#525B5C" stroke="#172B2E" strokeWidth="1.6" />
      {/* Copper plating layer on Cathode */}
      {step >= 1 && (
        <rect
          x={194 - cuPlating / 2}
          y="212"
          width={32 + cuPlating}
          height="92"
          fill="#C77657"
          stroke="#833B24"
          strokeWidth="1.4"
          opacity="0.92"
        />
      )}
      <text x="210" y="196" textAnchor="middle" fill="#FCFBF7" fontFamily="Be Vietnam Pro, sans-serif" fontSize="12.5" fontWeight="700">
        C
      </text>

      {/* Right Electrode: Anode (+) — either Graphite (inert) or Copper (soluble) */}
      <rect
        x={454 + anodeCorrosion / 2}
        y="156"
        width={32 - anodeCorrosion}
        height="148"
        fill={isInert ? '#525B5C' : '#C77657'}
        stroke="#172B2E"
        strokeWidth="1.6"
      />
      <text x="470" y="196" textAnchor="middle" fill="#FCFBF7" fontFamily="Be Vietnam Pro, sans-serif" fontSize="12.5" fontWeight="700">
        {isInert ? 'Pt/C' : 'Cu'}
      </text>

      {/* O2 Bubbles at Inert Anode OR Cu2+ dissolving from Copper Anode */}
      {isInert ? (
        <g>
          {(isRunning || step >= 1) && (
            <>
              <circle cx="445" cy="264" r="5" fill="#FCFBF7" stroke="#266C63" strokeWidth="1.4" className={isRunning ? 'animate-bubble-rise' : ''} />
              <circle cx="496" cy="248" r="6" fill="#FCFBF7" stroke="#266C63" strokeWidth="1.4" className={isRunning ? 'animate-bubble-rise' : ''} />
              <circle cx="448" cy="232" r="4.5" fill="#FCFBF7" stroke="#266C63" strokeWidth="1.4" className={isRunning ? 'animate-bubble-rise' : ''} />
            </>
          )}
          <text x="514" y="232" textAnchor="start" fill="#266C63" fontFamily="IBM Plex Mono, monospace" fontSize="12" fontWeight="600">
            O₂↑
          </text>
        </g>
      ) : (
        <g>
          <path
            d="M 448 258 L 376 258"
            fill="none"
            stroke="#A34E32"
            strokeWidth="1.8"
            strokeDasharray="4 3"
            className={isRunning ? 'animate-dash-forward' : ''}
            markerEnd="url(#el-arr-e)"
          />
          <text x="412" y="248" textAnchor="middle" fill="#A34E32" fontFamily="IBM Plex Mono, monospace" fontSize="11.5" fontWeight="600">
            Cu → Cu²⁺
          </text>
        </g>
      )}

      {/* Cu2+ migrating to Cathode (−) */}
      <path
        d="M 326 258 L 242 258"
        fill="none"
        stroke="#266C63"
        strokeWidth="2"
        strokeDasharray={isRunning ? '8 4' : 'none'}
        className={isRunning ? 'animate-dash-forward' : ''}
        markerEnd="url(#el-arr-ion)"
      />
      <text x="286" y="248" textAnchor="middle" fill="#266C63" fontFamily="IBM Plex Mono, monospace" fontSize="11.5" fontWeight="600">
        Cu²⁺ → Cathode
      </text>

      {/* Pole Headers — cleanly outside vertical wires at x=196 and x=484 */}
      <text x="180" y="114" textAnchor="end" fill="#266C63" fontFamily="Be Vietnam Pro, sans-serif" fontSize="13.5" fontWeight="700">
        Cathode (−)
      </text>
      <text x="180" y="132" textAnchor="end" fill="#465B5E" fontFamily="Be Vietnam Pro, sans-serif" fontSize="11.5">
        Khử Cu²⁺ → Cu bám
      </text>

      <text x="500" y="114" textAnchor="start" fill="#A34E32" fontFamily="Be Vietnam Pro, sans-serif" fontSize="13.5" fontWeight="700">
        Anode (+)
      </text>
      <text x="500" y="132" textAnchor="start" fill="#465B5E" fontFamily="Be Vietnam Pro, sans-serif" fontSize="11.5">
        {isInert ? 'Oxi hóa H₂O → O₂↑' : 'Anode Cu tan dần'}
      </text>

      {/* Solution Status */}
      <text x="340" y="326" textAnchor="middle" fill="#172B2E" fontFamily="Be Vietnam Pro, sans-serif" fontSize="12.5" fontWeight="500">
        dd CuSO₄ ({isInert ? 'nồng độ Cu²⁺ giảm dần' : 'nồng độ Cu²⁺ không đổi'})
      </text>

      {/* Half-reaction footers */}
      <text x="210" y="368" textAnchor="middle" fill="#172B2E" fontFamily="IBM Plex Mono, monospace" fontSize="12.5" fontWeight="600">
        Cu²⁺ + 2e⁻ → Cu
      </text>
      <text x="470" y="368" textAnchor="middle" fill="#172B2E" fontFamily="IBM Plex Mono, monospace" fontSize="12.5" fontWeight="600">
        {isInert ? '2H₂O → O₂↑ + 4H⁺ + 4e⁻' : 'Cu → Cu²⁺ + 2e⁻'}
      </text>
    </svg>
  );
};

interface MoltenNaClSimSvgProps {
  isRunning: boolean;
  step: number;
}

export const MoltenNaClSimSvg: React.FC<MoltenNaClSimSvgProps> = ({
  isRunning,
  step,
}) => {
  return (
    <svg
      viewBox="0 0 680 400"
      className="w-full h-auto block"
      role="img"
      aria-label="Mô phỏng điện phân NaCl nóng chảy (không có nước), gồm nguồn điện một chiều, cathode cực âm tạo natri lỏng Na, anode cực dương giải phóng khí chlorine Cl2."
    >
      <defs>
        <marker id="mc-arr-e" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#A34E32" />
        </marker>
        <marker id="mc-arr-na" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#266C63" />
        </marker>
        <marker id="mc-arr-cl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#172B2E" />
        </marker>
      </defs>

      <rect x="8" y="8" width="664" height="384" fill="#FCFBF7" stroke="#D7D1C3" strokeWidth="1" />

      {/* DC Power Source */}
      <rect x="266" y="28" width="148" height="54" rx="4" fill="#F7F4EC" stroke="#172B2E" strokeWidth="1.8" />
      <text x="340" y="47" textAnchor="middle" fill="#172B2E" fontFamily="Be Vietnam Pro, sans-serif" fontSize="12" fontWeight="600">
        Nguồn điện 1 chiều (DC)
      </text>
      <text x="292" y="71" textAnchor="middle" fill="#266C63" fontFamily="IBM Plex Mono, monospace" fontSize="16" fontWeight="700">
        −
      </text>
      <text x="340" y="70" textAnchor="middle" fill="#465B5E" fontFamily="Be Vietnam Pro, sans-serif" fontSize="11">
        DC
      </text>
      <text x="388" y="71" textAnchor="middle" fill="#A34E32" fontFamily="IBM Plex Mono, monospace" fontSize="16" fontWeight="700">
        +
      </text>

      {/* External Wires */}
      <path d="M 266 55 L 210 55 L 210 156" fill="none" stroke="#172B2E" strokeWidth="2.4" />
      <path d="M 414 55 L 470 55 L 470 156" fill="none" stroke="#172B2E" strokeWidth="2.4" />

      {/* Electron Flow */}
      <path
        d="M 484 148 L 484 44 L 420 44"
        fill="none"
        stroke="#A34E32"
        strokeWidth="2.2"
        strokeDasharray="6 6"
        className={isRunning ? 'animate-dash-forward' : ''}
        markerEnd="url(#mc-arr-e)"
      />
      <path
        d="M 260 44 L 196 44 L 196 146"
        fill="none"
        stroke="#A34E32"
        strokeWidth="2.2"
        strokeDasharray="6 6"
        className={isRunning ? 'animate-dash-forward' : ''}
        markerEnd="url(#mc-arr-e)"
      />
      <text x="536" y="42" textAnchor="middle" fill="#A34E32" fontFamily="Be Vietnam Pro, sans-serif" fontSize="12" fontWeight="600">
        e⁻ rời Anode (+)
      </text>
      <text x="144" y="42" textAnchor="middle" fill="#A34E32" fontFamily="Be Vietnam Pro, sans-serif" fontSize="12" fontWeight="600">
        e⁻ về Cathode (−)
      </text>

      {/* Molten Bath Crucible */}
      <path
        d="M 134 176 L 134 328 Q 134 340 146 340 L 534 340 Q 546 340 546 328 L 546 176"
        fill="none"
        stroke="#172B2E"
        strokeWidth="2.4"
      />
      {/* Warm molten salt tint (amber-parchment, strictly molten ions only, NO water) */}
      <path
        d="M 136 212 L 544 212 L 544 327 Q 544 338 533 338 L 147 338 Q 136 338 136 327 Z"
        fill="#F3E5D0"
      />
      <line x1="136" y1="212" x2="544" y2="212" stroke="#A34E32" strokeWidth="1.2" />

      {/* Left Inert Electrode: Cathode (−) */}
      <rect x="194" y="156" width="32" height="148" fill="#525B5C" stroke="#172B2E" strokeWidth="1.6" />
      <text x="210" y="196" textAnchor="middle" fill="#FCFBF7" fontFamily="Be Vietnam Pro, sans-serif" fontSize="12.5" fontWeight="700">
        Fe/C
      </text>

      {/* Molten Na droplets/layer near Cathode (−) */}
      {step >= 1 && (
        <g>
          <rect
            x="174"
            y="214"
            width="72"
            height={8 + step * 3}
            rx="4"
            fill="#C7CDD0"
            stroke="#172B2E"
            strokeWidth="1.3"
          />
          <text x="166" y="232" textAnchor="end" fill="#172B2E" fontFamily="IBM Plex Mono, monospace" fontSize="11.5" fontWeight="600">
            Na(l)
          </text>
        </g>
      )}

      {/* Right Inert Electrode: Anode (+) */}
      <rect x="454" y="156" width="32" height="148" fill="#525B5C" stroke="#172B2E" strokeWidth="1.6" />
      <text x="470" y="196" textAnchor="middle" fill="#FCFBF7" fontFamily="Be Vietnam Pro, sans-serif" fontSize="12.5" fontWeight="700">
        C
      </text>

      {/* Cl2 gas bubbles rising at Anode (+) */}
      {(isRunning || step >= 1) && (
        <g>
          <circle cx="446" cy="264" r="5.5" fill="#DCE5A2" stroke="#5A6623" strokeWidth="1.3" className={isRunning ? 'animate-bubble-rise' : ''} />
          <circle cx="496" cy="248" r="6" fill="#DCE5A2" stroke="#5A6623" strokeWidth="1.3" className={isRunning ? 'animate-bubble-rise' : ''} />
          <circle cx="450" cy="230" r="4.5" fill="#DCE5A2" stroke="#5A6623" strokeWidth="1.3" className={isRunning ? 'animate-bubble-rise' : ''} />
        </g>
      )}
      <text x="508" y="232" textAnchor="start" fill="#4E5B1A" fontFamily="IBM Plex Mono, monospace" fontSize="12" fontWeight="700">
        Cl₂↑
      </text>

      {/* Ion Migration Arrows: ONLY Na+ and Cl- */}
      <path
        d="M 332 258 L 242 258"
        fill="none"
        stroke="#266C63"
        strokeWidth="2"
        strokeDasharray={isRunning ? '8 4' : 'none'}
        className={isRunning ? 'animate-dash-forward' : ''}
        markerEnd="url(#mc-arr-na)"
      />
      <text x="288" y="248" textAnchor="middle" fill="#266C63" fontFamily="IBM Plex Mono, monospace" fontSize="12" fontWeight="600">
        Na⁺ → Cathode
      </text>

      <path
        d="M 352 284 L 442 284"
        fill="none"
        stroke="#172B2E"
        strokeWidth="1.8"
        strokeDasharray="4 3"
        className={isRunning ? 'animate-dash-forward' : ''}
        markerEnd="url(#mc-arr-cl)"
      />
      <text x="396" y="274" textAnchor="middle" fill="#172B2E" fontFamily="IBM Plex Mono, monospace" fontSize="12" fontWeight="600">
        Cl⁻ → Anode
      </text>

      {/* Pole Headers — cleanly outside vertical wires at x=196 and x=484 */}
      <text x="180" y="114" textAnchor="end" fill="#266C63" fontFamily="Be Vietnam Pro, sans-serif" fontSize="13.5" fontWeight="700">
        Cathode (−)
      </text>
      <text x="180" y="132" textAnchor="end" fill="#465B5E" fontFamily="Be Vietnam Pro, sans-serif" fontSize="11.5">
        Khử Na⁺ → Na lỏng
      </text>

      <text x="500" y="114" textAnchor="start" fill="#A34E32" fontFamily="Be Vietnam Pro, sans-serif" fontSize="13.5" fontWeight="700">
        Anode (+)
      </text>
      <text x="500" y="132" textAnchor="start" fill="#465B5E" fontFamily="Be Vietnam Pro, sans-serif" fontSize="11.5">
        Oxi hóa Cl⁻ → Cl₂↑
      </text>

      {/* Bath Label */}
      <text x="340" y="326" textAnchor="middle" fill="#172B2E" fontFamily="Be Vietnam Pro, sans-serif" fontSize="12.5" fontWeight="500">
        NaCl nóng chảy (~801 °C) · Chỉ có ion Na⁺ và Cl⁻ (không có H₂O)
      </text>

      {/* Half-reaction footers */}
      <text x="210" y="368" textAnchor="middle" fill="#172B2E" fontFamily="IBM Plex Mono, monospace" fontSize="12.5" fontWeight="600">
        Na⁺ + e⁻ → Na(l)
      </text>
      <text x="470" y="368" textAnchor="middle" fill="#172B2E" fontFamily="IBM Plex Mono, monospace" fontSize="12.5" fontWeight="600">
        2Cl⁻ → Cl₂↑ + 2e⁻
      </text>
    </svg>
  );
};
