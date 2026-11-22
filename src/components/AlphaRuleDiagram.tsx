import React, { useState } from 'react';
import { ChemText } from './ChemText';

interface AlphaPairPreset {
  id: string;
  label: string;
  leftOx: string;
  leftRed: string;
  leftE0: string;
  rightOx: string;
  rightRed: string;
  rightE0: string;
  equation: string;
  note: string;
}

const ALPHA_PRESETS: AlphaPairPreset[] = [
  {
    id: 'cu-ag',
    label: 'Cu và Ag⁺',
    leftOx: 'Cu²⁺',
    leftRed: 'Cu',
    leftE0: '+0,340 V',
    rightOx: 'Ag⁺',
    rightRed: 'Ag',
    rightE0: '+0,799 V',
    equation: 'Cu + 2Ag⁺ → Cu²⁺ + 2Ag',
    note: 'Ví dụ chuẩn trong đề cương: đồng đẩy bạc ra khỏi dung dịch muối AgNO₃.',
  },
  {
    id: 'zn-cu',
    label: 'Zn và Cu²⁺',
    leftOx: 'Zn²⁺',
    leftRed: 'Zn',
    leftE0: '−0,763 V',
    rightOx: 'Cu²⁺',
    rightRed: 'Cu',
    rightE0: '+0,340 V',
    equation: 'Zn + Cu²⁺ → Zn²⁺ + Cu',
    note: 'Cơ sở của phản ứng trong pin Galvani Zn–Cu.',
  },
  {
    id: 'fe-h',
    label: 'Fe và H⁺ (acid loãng)',
    leftOx: 'Fe²⁺',
    leftRed: 'Fe',
    leftE0: '−0,440 V',
    rightOx: '2H⁺',
    rightRed: 'H₂',
    rightE0: '0,000 V',
    equation: 'Fe + 2H⁺ → Fe²⁺ + H₂↑',
    note: 'Kim loại có E° < 0,000 V đẩy được H₂ khỏi dung dịch HCl, H₂SO₄ loãng.',
  },
  {
    id: 'cu-fe3',
    label: 'Cu và Fe³⁺',
    leftOx: 'Cu²⁺',
    leftRed: 'Cu',
    leftE0: '+0,340 V',
    rightOx: 'Fe³⁺',
    rightRed: 'Fe²⁺',
    rightE0: '+0,771 V',
    equation: 'Cu + 2Fe³⁺ → Cu²⁺ + 2Fe²⁺',
    note: 'Cu khử Fe³⁺ về Fe²⁺ (không khử tiếp xuống Fe).',
  },
  {
    id: 'fe2-ag',
    label: 'Fe²⁺ và Ag⁺',
    leftOx: 'Fe³⁺',
    leftRed: 'Fe²⁺',
    leftE0: '+0,771 V',
    rightOx: 'Ag⁺',
    rightRed: 'Ag',
    rightE0: '+0,799 V',
    equation: 'Fe²⁺ + Ag⁺ → Fe³⁺ + Ag↓',
    note: 'Ag⁺ dư oxi hóa ion Fe²⁺ lên Fe³⁺ và kết tủa bạc.',
  },
];

export const AlphaRuleDiagram: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(ALPHA_PRESETS[0].id);
  const current = ALPHA_PRESETS.find((p) => p.id === selectedId) ?? ALPHA_PRESETS[0];

  return (
    <div className="my-8 border border-rule bg-paper-soft p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-rule">
        <div>
          <h3 className="text-lg font-semibold text-ink font-serif">
            Sơ đồ tương tác Quy tắc α
          </h3>
          <p className="text-sm text-ink-muted">
            Chọn cặp phản ứng để quan sát cách nối dạng khử (E° nhỏ) với dạng oxi hóa (E° lớn).
          </p>
        </div>
      </div>

      <div
        className="flex flex-wrap gap-2 mt-4 mb-5"
        role="tablist"
        aria-label="Chọn cặp phản ứng theo quy tắc alpha"
      >
        {ALPHA_PRESETS.map((preset) => {
          const active = preset.id === current.id;
          return (
            <button
              key={preset.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedId(preset.id)}
              className={`min-h-[44px] px-3.5 py-2 text-sm font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-verdigris text-white border-verdigris'
                  : 'bg-paper text-ink border-rule hover:border-verdigris hover:text-verdigris'
              }`}
            >
              <ChemText text={preset.label} />
            </button>
          );
        })}
      </div>

      <figure aria-labelledby="alpha-diagram-caption">
        <svg
          viewBox="0 0 560 255"
          className="w-full max-w-[560px] mx-auto h-auto block"
          role="img"
          aria-label={`Sơ đồ quy tắc alpha giữa cặp ${current.leftOx}/${current.leftRed} (${current.leftE0}) và cặp ${current.rightOx}/${current.rightRed} (${current.rightE0}), tạo phản ứng ${current.equation}.`}
        >
          <defs>
            <marker
              id="alpha-arrowhead"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#A34E32" />
            </marker>
          </defs>

          {/* Left column header */}
          <text
            x="145"
            y="24"
            textAnchor="middle"
            fill="#465B5E"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="12"
            fontWeight="500"
          >
            E° nhỏ hơn
          </text>
          <text
            x="145"
            y="43"
            textAnchor="middle"
            fill="#172B2E"
            fontFamily="IBM Plex Mono, monospace"
            fontSize="13.5"
            fontWeight="600"
          >
            {current.leftE0}
          </text>

          {/* Right column header */}
          <text
            x="415"
            y="24"
            textAnchor="middle"
            fill="#465B5E"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="12"
            fontWeight="500"
          >
            E° lớn hơn
          </text>
          <text
            x="415"
            y="43"
            textAnchor="middle"
            fill="#172B2E"
            fontFamily="IBM Plex Mono, monospace"
            fontSize="13.5"
            fontWeight="600"
          >
            {current.rightE0}
          </text>

          {/* Horizontal comparison arrow */}
          <line
            x1="210"
            y1="38"
            x2="350"
            y2="38"
            stroke="#BEB6A5"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text
            x="280"
            y="32"
            textAnchor="middle"
            fill="#465B5E"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="11.5"
          >
            E° tăng dần →
          </text>

          {/* Alpha curve path: Ox2 (top right) -> Red1 (bottom left) -> Ox1 (top left) -> Red2 (bottom right) */}
          <path
            d="M 372 95 C 315 110, 240 165, 190 182 C 138 196, 128 115, 190 95 C 245 78, 320 155, 366 178"
            fill="none"
            stroke="#A34E32"
            strokeWidth="2.6"
            markerEnd="url(#alpha-arrowhead)"
          />

          {/* Four species boxes */}
          {/* Top Left: Ox1 (yếu hơn - sản phẩm) */}
          <rect
            x="92"
            y="66"
            width="106"
            height="46"
            rx="4"
            fill="#F7F4EC"
            stroke="#172B2E"
            strokeWidth="1.4"
          />
          <text
            x="145"
            y="95"
            textAnchor="middle"
            fill="#172B2E"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="16"
            fontWeight="700"
          >
            {current.leftOx}
          </text>
          <text
            x="145"
            y="128"
            textAnchor="middle"
            fill="#465B5E"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="11.5"
          >
            Dạng Ox yếu hơn
          </text>

          {/* Bottom Left: Red1 (mạnh hơn - chất tham gia) */}
          <rect
            x="92"
            y="162"
            width="106"
            height="46"
            rx="4"
            fill="#E5F0EE"
            stroke="#266C63"
            strokeWidth="1.8"
          />
          <text
            x="145"
            y="191"
            textAnchor="middle"
            fill="#172B2E"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="16"
            fontWeight="700"
          >
            {current.leftRed}
          </text>
          <text
            x="145"
            y="226"
            textAnchor="middle"
            fill="#266C63"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="12"
            fontWeight="600"
          >
            Chất khử mạnh hơn
          </text>

          {/* Top Right: Ox2 (mạnh hơn - chất tham gia) */}
          <rect
            x="362"
            y="66"
            width="106"
            height="46"
            rx="4"
            fill="#F7EBE6"
            stroke="#A34E32"
            strokeWidth="1.8"
          />
          <text
            x="415"
            y="95"
            textAnchor="middle"
            fill="#172B2E"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="16"
            fontWeight="700"
          >
            {current.rightOx}
          </text>
          <text
            x="415"
            y="128"
            textAnchor="middle"
            fill="#A34E32"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="12"
            fontWeight="600"
          >
            Chất Ox mạnh hơn
          </text>

          {/* Bottom Right: Red2 (yếu hơn - sản phẩm) */}
          <rect
            x="362"
            y="162"
            width="106"
            height="46"
            rx="4"
            fill="#F7F4EC"
            stroke="#172B2E"
            strokeWidth="1.4"
          />
          <text
            x="415"
            y="191"
            textAnchor="middle"
            fill="#172B2E"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="16"
            fontWeight="700"
          >
            {current.rightRed}
          </text>
          <text
            x="415"
            y="226"
            textAnchor="middle"
            fill="#465B5E"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="11.5"
          >
            Dạng khử yếu hơn
          </text>
        </svg>

        <div className="mt-4 pt-4 border-t border-rule flex flex-col gap-1.5">
          <div className="text-sm text-ink-muted">Phản ứng tự xảy ra ở điều kiện chuẩn:</div>
          <div className="text-lg font-semibold text-ink font-mono">
            <ChemText text={current.equation} />
          </div>
          <figcaption id="alpha-diagram-caption" className="text-sm text-ink-muted">
            {current.note}
          </figcaption>
        </div>
      </figure>
    </div>
  );
};
