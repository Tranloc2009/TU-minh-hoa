import { ElectrodeCouple } from '../data/potentials';
import { formatViNumber, parseDecimalInput } from './faraday';

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

function coeffPrefix(n: number): string {
  return n === 1 ? '' : String(n);
}

export interface CoupleComparisonResult {
  anodeCouple: ElectrodeCouple; // smaller E° (stronger reducing form)
  cathodeCouple: ElectrodeCouple; // larger E° (stronger oxidizing form)
  cellPotentialV: number; // E°pin = E°cathode - E°anode
  spontaneousEquation: string; // Balanced net ionic equation
  anodeHalfReaction: string; // Oxidation
  cathodeHalfReaction: string; // Reduction
  waterWarning: string | null;
}

const WATER_REACTIVE_IDS = new Set(['k', 'ba', 'ca', 'na']);

export function compareElectrodeCouples(
  first: ElectrodeCouple,
  second: ElectrodeCouple
): CoupleComparisonResult {
  const [anodeCouple, cathodeCouple] =
    first.e0 <= second.e0 ? [first, second] : [second, first];

  const cellPotentialV = Number((cathodeCouple.e0 - anodeCouple.e0).toFixed(3));

  const commonE = lcm(anodeCouple.electrons, cathodeCouple.electrons);
  const multAnode = commonE / anodeCouple.electrons;
  const multCathode = commonE / cathodeCouple.electrons;

  const redReactant = `${coeffPrefix(anodeCouple.reducedCoeff * multAnode)}${anodeCouple.reducedForm}`;
  const oxReactant = `${coeffPrefix(cathodeCouple.oxidizedCoeff * multCathode)}${cathodeCouple.oxidizedForm}`;
  const oxProduct = `${coeffPrefix(anodeCouple.oxidizedCoeff * multAnode)}${anodeCouple.oxidizedForm}`;
  const redProduct = `${coeffPrefix(cathodeCouple.reducedCoeff * multCathode)}${cathodeCouple.reducedForm}`;

  const spontaneousEquation = `${redReactant} + ${oxReactant} → ${oxProduct} + ${redProduct}`;

  const anodeHalfReaction = `${coeffPrefix(anodeCouple.reducedCoeff)}${anodeCouple.reducedForm} → ${coeffPrefix(anodeCouple.oxidizedCoeff)}${anodeCouple.oxidizedForm} + ${coeffPrefix(anodeCouple.electrons)}e⁻`;
  const cathodeHalfReaction = `${coeffPrefix(cathodeCouple.oxidizedCoeff)}${cathodeCouple.oxidizedForm} + ${coeffPrefix(cathodeCouple.electrons)}e⁻ → ${coeffPrefix(cathodeCouple.reducedCoeff)}${cathodeCouple.reducedForm}`;

  let waterWarning: string | null = null;
  if (WATER_REACTIVE_IDS.has(anodeCouple.id)) {
    waterWarning = `Lưu ý thực tế: ${anodeCouple.reducedForm} là kim loại mạnh phản ứng trực tiếp với H₂O trước trong dung dịch nước (tạo OH⁻ và H₂), nên không đẩy trực tiếp ${cathodeCouple.reducedForm} ra khỏi dung dịch muối bằng cách cho kim loại vào dung dịch.`;
  }

  return {
    anodeCouple,
    cathodeCouple,
    cellPotentialV,
    spontaneousEquation,
    anodeHalfReaction,
    cathodeHalfReaction,
    waterWarning,
  };
}

export function formatPotentialV(e0: number): string {
  const sign = e0 > 0 ? '+' : e0 < 0 ? '−' : '';
  return `${sign}${formatViNumber(Math.abs(e0), { minDecimals: 3, maxDecimals: 3 })} V`;
}

export function checkNumericAnswer(
  rawInput: string,
  expected: number,
  tolerance: number
): { valid: boolean; isCorrect: boolean; parsedValue: number | null } {
  const parsed = parseDecimalInput(rawInput);
  if (parsed === null) {
    return { valid: false, isCorrect: false, parsedValue: null };
  }
  const diff = Math.abs(parsed - expected);
  return {
    valid: true,
    isCorrect: diff <= tolerance + 1e-9,
    parsedValue: parsed,
  };
}

/**
 * Deterministically or randomly selects a balanced 12-question quick quiz (2 from each of the 6 lessons).
 */
export function buildBalancedQuiz<T extends { id: string; lessonNumber: number }>(
  bank: T[],
  rng: () => number = Math.random
): T[] {
  const result: T[] = [];
  for (let lesson = 1; lesson <= 6; lesson++) {
    const pool = bank.filter((q) => q.lessonNumber === lesson);
    const shuffled = [...pool].sort(() => rng() - 0.5);
    result.push(...shuffled.slice(0, 2));
  }
  return result;
}
