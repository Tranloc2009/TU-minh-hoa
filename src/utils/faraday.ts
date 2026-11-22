export const FARADAY_CONSTANT = 96500; // C/mol
export const MOLAR_GAS_VOLUME_25C_1BAR = 24.79; // L/mol at 25 °C, 1 bar

export type TimeUnit = 's' | 'min' | 'h';

export interface ProductPreset {
  id: string;
  label: string;
  formula: string;
  halfReaction: string;
  molarMass: number; // g/mol
  z: number; // mol e- per 1 mol product
  isGas: boolean;
  electrodeNote: string;
}

export const FARADAY_PRESETS: ProductPreset[] = [
  {
    id: 'cu',
    label: 'Đồng (Cu)',
    formula: 'Cu',
    halfReaction: 'Cu²⁺ + 2e⁻ → Cu',
    molarMass: 63.5,
    z: 2,
    isGas: false,
    electrodeNote: 'Cathode (quá trình khử Cu²⁺)',
  },
  {
    id: 'ag',
    label: 'Bạc (Ag)',
    formula: 'Ag',
    halfReaction: 'Ag⁺ + e⁻ → Ag',
    molarMass: 108,
    z: 1,
    isGas: false,
    electrodeNote: 'Cathode (quá trình khử Ag⁺)',
  },
  {
    id: 'al',
    label: 'Nhôm (Al)',
    formula: 'Al',
    halfReaction: 'Al³⁺ + 3e⁻ → Al',
    molarMass: 27,
    z: 3,
    isGas: false,
    electrodeNote: 'Cathode (điện phân Al₂O₃ nóng chảy)',
  },
  {
    id: 'na',
    label: 'Natri (Na)',
    formula: 'Na',
    halfReaction: 'Na⁺ + e⁻ → Na',
    molarMass: 23,
    z: 1,
    isGas: false,
    electrodeNote: 'Cathode (điện phân NaCl nóng chảy)',
  },
  {
    id: 'h2',
    label: 'Khí hydrogen (H₂)',
    formula: 'H₂',
    halfReaction: '2H₂O + 2e⁻ → H₂↑ + 2OH⁻ (hoặc 2H⁺ + 2e⁻ → H₂↑)',
    molarMass: 2,
    z: 2,
    isGas: true,
    electrodeNote: 'Cathode (khử H⁺ hoặc H₂O)',
  },
  {
    id: 'cl2',
    label: 'Khí chlorine (Cl₂)',
    formula: 'Cl₂',
    halfReaction: '2Cl⁻ → Cl₂↑ + 2e⁻',
    molarMass: 71,
    z: 2,
    isGas: true,
    electrodeNote: 'Anode (oxi hóa Cl⁻)',
  },
  {
    id: 'o2',
    label: 'Khí oxygen (O₂)',
    formula: 'O₂',
    halfReaction: '2H₂O → O₂↑ + 4H⁺ + 4e⁻',
    molarMass: 32,
    z: 4,
    isGas: true,
    electrodeNote: 'Anode trơ (oxi hóa H₂O)',
  },
];

export interface FaradayInputRaw {
  currentStr: string;
  timeStr: string;
  timeUnit: TimeUnit;
  molarMassStr: string;
  zStr: string;
  isGas: boolean;
  formulaLabel?: string;
}

export interface FaradayValidationErrors {
  current?: string;
  time?: string;
  molarMass?: string;
  z?: string;
}

export interface FaradayCalculationResult {
  currentA: number;
  timeOriginal: number;
  timeUnit: TimeUnit;
  timeSeconds: number;
  molarMass: number;
  z: number;
  isGas: boolean;
  chargeC: number;
  electronMol: number;
  productMol: number;
  massG: number;
  gasVolumeL: number | null;
}

/**
 * Parses a decimal string accepting both dot (.) and comma (,) as decimal separators.
 * Returns null if empty, malformed, or not a finite number.
 */
export function parseDecimalInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Allow optional whitespace inside numbers only if formatted nicely, reject letters/multiple separators
  const compact = trimmed.replace(/\s+/g, '');

  // Reject if contains both comma and dot in ambiguous way or multiple commas/dots
  const commaCount = (compact.match(/,/g) || []).length;
  const dotCount = (compact.match(/\./g) || []).length;
  if (commaCount > 1 || dotCount > 1 || (commaCount >= 1 && dotCount >= 1)) {
    return null;
  }

  const normalized = compact.replace(',', '.');
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function convertTimeToSeconds(value: number, unit: TimeUnit): number {
  if (unit === 'min') return value * 60;
  if (unit === 'h') return value * 3600;
  return value;
}

export function validateFaradayInputs(input: FaradayInputRaw): {
  errors: FaradayValidationErrors;
  parsed: {
    currentA: number;
    timeOriginal: number;
    molarMass: number;
    z: number;
  } | null;
} {
  const errors: FaradayValidationErrors = {};

  const currentA = parseDecimalInput(input.currentStr);
  if (currentA === null) {
    errors.current = 'Vui lòng nhập cường độ dòng điện là một số hợp lệ (ví dụ: 2 hoặc 2,5).';
  } else if (currentA <= 0) {
    errors.current = 'Cường độ dòng điện I phải lớn hơn 0 A.';
  } else if (currentA > 1e6) {
    errors.current = 'Giá trị dòng điện vượt quá phạm vi tính thông thường (≤ 1 000 000 A).';
  }

  const timeOriginal = parseDecimalInput(input.timeStr);
  if (timeOriginal === null) {
    errors.time = 'Vui lòng nhập thời gian là một số hợp lệ (ví dụ: 965 hoặc 30).';
  } else if (timeOriginal <= 0) {
    errors.time = 'Thời gian điện phân t phải lớn hơn 0.';
  } else if (timeOriginal > 1e8) {
    errors.time = 'Giá trị thời gian quá lớn.';
  }

  const molarMass = parseDecimalInput(input.molarMassStr);
  if (molarMass === null) {
    errors.molarMass = 'Vui lòng nhập khối lượng mol M hợp lệ (g/mol).';
  } else if (molarMass <= 0) {
    errors.molarMass = 'Khối lượng mol M phải lớn hơn 0 g/mol.';
  } else if (molarMass > 1000) {
    errors.molarMass = 'Khối lượng mol M không hợp lệ (≤ 1000 g/mol).';
  }

  const z = parseDecimalInput(input.zStr);
  if (z === null) {
    errors.z = 'Vui lòng nhập số electron trao đổi z hợp lệ.';
  } else if (z <= 0 || !Number.isInteger(z)) {
    errors.z = 'Số electron trao đổi z phải là số nguyên dương (1, 2, 3, 4...).';
  } else if (z > 12) {
    errors.z = 'Số electron trao đổi z thường nằm trong khoảng 1 đến 12.';
  }

  if (Object.keys(errors).length > 0 || currentA === null || timeOriginal === null || molarMass === null || z === null) {
    return { errors, parsed: null };
  }

  return {
    errors: {},
    parsed: { currentA, timeOriginal, molarMass, z },
  };
}

export function calculateFaraday(input: FaradayInputRaw): {
  errors: FaradayValidationErrors;
  result: FaradayCalculationResult | null;
} {
  const { errors, parsed } = validateFaradayInputs(input);
  if (!parsed) {
    return { errors, result: null };
  }

  const timeSeconds = convertTimeToSeconds(parsed.timeOriginal, input.timeUnit);
  const chargeC = parsed.currentA * timeSeconds;
  const electronMol = chargeC / FARADAY_CONSTANT;
  const productMol = electronMol / parsed.z;
  const massG = productMol * parsed.molarMass;
  const gasVolumeL = input.isGas ? productMol * MOLAR_GAS_VOLUME_25C_1BAR : null;

  return {
    errors: {},
    result: {
      currentA: parsed.currentA,
      timeOriginal: parsed.timeOriginal,
      timeUnit: input.timeUnit,
      timeSeconds,
      molarMass: parsed.molarMass,
      z: parsed.z,
      isGas: input.isGas,
      chargeC,
      electronMol,
      productMol,
      massG,
      gasVolumeL,
    },
  };
}

/**
 * Formats numbers using Vietnamese scientific convention:
 * - space as thousands separator (e.g. 1 930)
 * - comma as decimal separator (e.g. 0,635)
 * - true minus sign (−) for negative numbers
 */
export function formatViNumber(
  value: number,
  options: { minDecimals?: number; maxDecimals?: number } = {}
): string {
  const { minDecimals = 0, maxDecimals = 5 } = options;
  const isNeg = value < 0;
  const abs = Math.abs(value);

  // Avoid floating point noise like 0.6350000000000001
  const fixed = abs.toFixed(maxDecimals);
  let [intPart, decPart = ''] = fixed.split('.');

  if (maxDecimals > minDecimals) {
    // Strip trailing zeros down to minDecimals
    while (decPart.length > minDecimals && decPart.endsWith('0')) {
      decPart = decPart.slice(0, -1);
    }
  }

  const intGrouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const combined = decPart.length > 0 ? `${intGrouped},${decPart}` : intGrouped;
  return isNeg && Number(fixed) !== 0 ? `−${combined}` : combined;
}
