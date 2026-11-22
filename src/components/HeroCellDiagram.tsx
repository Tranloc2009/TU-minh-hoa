import React from 'react';

export const HeroCellDiagram: React.FC = () => {
  return (
    <figure className="w-full" aria-labelledby="hero-diagram-caption">
      <div className="bg-paper-soft border border-rule rounded-sm p-4 sm:p-6">
        <svg
          viewBox="0 0 640 390"
          className="w-full h-auto block"
          role="img"
          aria-label="Sơ đồ minh họa pin Galvani Zn–Cu gồm hai cốc dung dịch ZnSO4 và CuSO4 1 M, thanh kẽm là anode cực âm, thanh đồng là cathode cực dương, dây dẫn có chiều electron từ Zn sang Cu, cầu muối KNO3 và vôn kế chỉ 1,103 V."
        >
          <defs>
            <marker
              id="hero-arrow-e"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#A34E32" />
            </marker>
            <marker
              id="hero-arrow-no3"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#172B2E" />
            </marker>
            <marker
              id="hero-arrow-k"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#266C63" />
            </marker>
          </defs>

          {/* Subtle paper canvas */}
          <rect x="0" y="0" width="640" height="390" fill="#FCFBF7" />

          {/* Top External Circuit Wire */}
          <path
            d="M 142 155 L 142 62 L 260 62"
            fill="none"
            stroke="#172B2E"
            strokeWidth="2.2"
          />
          <path
            d="M 380 62 L 498 62 L 498 155"
            fill="none"
            stroke="#172B2E"
            strokeWidth="2.2"
          />

          {/* Electron Flow Indicator along outer wire */}
          <line
            x1="166"
            y1="44"
            x2="236"
            y2="44"
            stroke="#A34E32"
            strokeWidth="2"
            markerEnd="url(#hero-arrow-e)"
          />
          <text
            x="200"
            y="35"
            textAnchor="middle"
            fill="#A34E32"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="13"
            fontWeight="600"
          >
            Chiều e⁻
          </text>

          <line
            x1="404"
            y1="44"
            x2="474"
            y2="44"
            stroke="#A34E32"
            strokeWidth="2"
            markerEnd="url(#hero-arrow-e)"
          />
          <text
            x="439"
            y="35"
            textAnchor="middle"
            fill="#A34E32"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="13"
            fontWeight="600"
          >
            e⁻
          </text>

          {/* Voltmeter Box */}
          <rect
            x="260"
            y="36"
            width="120"
            height="52"
            rx="4"
            fill="#F7F4EC"
            stroke="#172B2E"
            strokeWidth="1.8"
          />
          <text
            x="320"
            y="53"
            textAnchor="middle"
            fill="#465B5E"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="11"
            fontWeight="500"
          >
            Vôn kế (E°pin)
          </text>
          <text
            x="320"
            y="77"
            textAnchor="middle"
            fill="#172B2E"
            fontFamily="IBM Plex Mono, monospace"
            fontSize="18"
            fontWeight="600"
          >
            1,103 V
          </text>

          {/* Left Beaker (ZnSO4) */}
          <path
            d="M 80 185 L 80 318 Q 80 328 90 328 L 240 328 Q 250 328 250 318 L 250 185"
            fill="none"
            stroke="#172B2E"
            strokeWidth="2"
          />
          {/* ZnSO4 liquid fill (pale neutral/cool tint) */}
          <path
            d="M 82 222 L 248 222 L 248 317 Q 248 326 239 326 L 91 326 Q 82 326 82 317 Z"
            fill="#E9EFEF"
          />
          <line x1="82" y1="222" x2="248" y2="222" stroke="#99B0B3" strokeWidth="1.2" />

          {/* Right Beaker (CuSO4) */}
          <path
            d="M 390 185 L 390 318 Q 390 328 400 328 L 550 328 Q 560 328 560 318 L 560 185"
            fill="none"
            stroke="#172B2E"
            strokeWidth="2"
          />
          {/* CuSO4 liquid fill (oxidized copper-verdigris blue-green tint) */}
          <path
            d="M 392 222 L 558 222 L 558 317 Q 558 326 549 326 L 401 326 Q 392 326 392 317 Z"
            fill="#CEE5E2"
          />
          <line x1="392" y1="222" x2="558" y2="222" stroke="#266C63" strokeWidth="1.2" />

          {/* Salt Bridge (U-tube KNO3) */}
          <path
            d="M 216 268 L 216 154 Q 216 130 240 130 L 400 130 Q 424 130 424 154 L 424 268"
            fill="none"
            stroke="#172B2E"
            strokeWidth="22"
            strokeLinecap="round"
          />
          <path
            d="M 216 268 L 216 154 Q 216 130 240 130 L 400 130 Q 424 130 424 154 L 424 268"
            fill="none"
            stroke="#F7F4EC"
            strokeWidth="18"
            strokeLinecap="round"
          />

          {/* Salt Bridge Label & Ion Arrows */}
          <text
            x="320"
            y="112"
            textAnchor="middle"
            fill="#172B2E"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="12.5"
            fontWeight="600"
          >
            Cầu muối KNO₃
          </text>
          {/* NO3- moving left to Zn */}
          <line
            x1="306"
            y1="130"
            x2="250"
            y2="130"
            stroke="#172B2E"
            strokeWidth="1.6"
            strokeDasharray="4 3"
            markerEnd="url(#hero-arrow-no3)"
          />
          <text
            x="278"
            y="156"
            textAnchor="middle"
            fill="#172B2E"
            fontFamily="IBM Plex Mono, monospace"
            fontSize="11.5"
            fontWeight="500"
          >
            NO₃⁻
          </text>

          {/* K+ moving right to Cu */}
          <line
            x1="334"
            y1="130"
            x2="390"
            y2="130"
            stroke="#266C63"
            strokeWidth="1.6"
            markerEnd="url(#hero-arrow-k)"
          />
          <text
            x="364"
            y="156"
            textAnchor="middle"
            fill="#266C63"
            fontFamily="IBM Plex Mono, monospace"
            fontSize="11.5"
            fontWeight="600"
          >
            K⁺
          </text>

          {/* Zn Electrode Strip (Left) */}
          <rect
            x="126"
            y="152"
            width="32"
            height="142"
            fill="#A6B0B2"
            stroke="#172B2E"
            strokeWidth="1.6"
          />
          <text
            x="142"
            y="206"
            textAnchor="middle"
            fill="#172B2E"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="14"
            fontWeight="700"
          >
            Zn
          </text>

          {/* Cu Electrode Strip (Right) */}
          <rect
            x="482"
            y="152"
            width="32"
            height="142"
            fill="#C77657"
            stroke="#172B2E"
            strokeWidth="1.6"
          />
          <text
            x="498"
            y="206"
            textAnchor="middle"
            fill="#FCFBF7"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="14"
            fontWeight="700"
          >
            Cu
          </text>

          {/* Direct Pole Annotations — cleanly clear of vertical wires */}
          <text
            x="128"
            y="108"
            textAnchor="end"
            fill="#172B2E"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="13.5"
            fontWeight="700"
          >
            Anode (−)
          </text>
          <text
            x="128"
            y="126"
            textAnchor="end"
            fill="#465B5E"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="12"
          >
            Oxi hóa Zn
          </text>

          <text
            x="512"
            y="108"
            textAnchor="start"
            fill="#A34E32"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="13.5"
            fontWeight="700"
          >
            Cathode (+)
          </text>
          <text
            x="512"
            y="126"
            textAnchor="start"
            fill="#465B5E"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="12"
          >
            Khử Cu²⁺
          </text>

          {/* Solution Labels inside beakers */}
          <text
            x="165"
            y="314"
            textAnchor="middle"
            fill="#172B2E"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="12.5"
            fontWeight="500"
          >
            dd ZnSO₄ 1 M
          </text>
          <text
            x="475"
            y="314"
            textAnchor="middle"
            fill="#172B2E"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="12.5"
            fontWeight="500"
          >
            dd CuSO₄ 1 M
          </text>

          {/* Half-reaction footers directly below each beaker */}
          <text
            x="165"
            y="355"
            textAnchor="middle"
            fill="#172B2E"
            fontFamily="IBM Plex Mono, monospace"
            fontSize="12.5"
            fontWeight="500"
          >
            Zn → Zn²⁺ + 2e⁻
          </text>
          <text
            x="475"
            y="355"
            textAnchor="middle"
            fill="#172B2E"
            fontFamily="IBM Plex Mono, monospace"
            fontSize="12.5"
            fontWeight="500"
          >
            Cu²⁺ + 2e⁻ → Cu
          </text>
        </svg>
      </div>
      <figcaption
        id="hero-diagram-caption"
        className="mt-3 text-sm text-ink-muted leading-relaxed"
      >
        Hình 5.1. Sơ đồ pin Galvani Zn–Cu chuẩn (25 °C, 1 M): electron đi qua dây ngoài từ thanh Zn (anode, −) sang thanh Cu (cathode, +); cầu muối KNO₃ dẫn ion NO₃⁻ sang ngăn Zn và K⁺ sang ngăn Cu; vôn kế chỉ 1,103 V.
      </figcaption>
    </figure>
  );
};
