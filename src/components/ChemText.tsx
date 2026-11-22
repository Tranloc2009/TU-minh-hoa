import React from 'react';

const SUB_MAP: Record<string, string> = {
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9',
  'ₑ': 'e',
  'ₘ': 'm',
};

const SUP_MAP: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
  '⁺': '+',
  '⁻': '−',
  'ⁿ': 'n',
};

const TOKEN_REGEX = /([₀₁₂₃₄₅₆₇₈₉ₑₘ]+|[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿ]+)/g;

interface ChemTextProps {
  text: string;
  className?: string;
}

/**
 * Renders chemical text with semantic HTML <sub> and <sup> tags for uniform typography
 * across fonts while remaining selectable, copyable, and mobile-wrapping friendly.
 */
export const ChemText: React.FC<ChemTextProps> = ({ text, className = '' }) => {
  const parts = text.split(TOKEN_REGEX);

  return (
    <span className={`chem-formula ${className}`}>
      {parts.map((part, index) => {
        if (!part) return null;
        const first = part[0];
        if (first in SUB_MAP) {
          const decoded = Array.from(part)
            .map((ch) => SUB_MAP[ch] ?? ch)
            .join('');
          return <sub key={index}>{decoded}</sub>;
        }
        if (first in SUP_MAP) {
          const decoded = Array.from(part)
            .map((ch) => SUP_MAP[ch] ?? ch)
            .join('');
          return <sup key={index}>{decoded}</sup>;
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
};
