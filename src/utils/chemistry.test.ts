import test from 'node:test';
import assert from 'node:assert/strict';
import { STANDARD_POTENTIALS } from '../data/potentials';
import {
  compareElectrodeCouples,
  checkNumericAnswer,
  buildBalancedQuiz,
  formatPotentialV,
} from './chemistry';

test('Zn–Cu and Cu–Ag standard cell potentials match syllabus exactly', () => {
  const zn = STANDARD_POTENTIALS.find((c) => c.id === 'zn')!;
  const cu = STANDARD_POTENTIALS.find((c) => c.id === 'cu')!;
  const ag = STANDARD_POTENTIALS.find((c) => c.id === 'ag')!;

  const znCu = compareElectrodeCouples(zn, cu);
  assert.equal(znCu.anodeCouple.id, 'zn');
  assert.equal(znCu.cathodeCouple.id, 'cu');
  assert.equal(znCu.cellPotentialV, 1.103);
  assert.equal(znCu.spontaneousEquation, 'Zn + Cu²⁺ → Zn²⁺ + Cu');
  assert.equal(znCu.waterWarning, null);

  // Order of arguments should not matter
  const cuAg = compareElectrodeCouples(ag, cu);
  assert.equal(cuAg.anodeCouple.id, 'cu');
  assert.equal(cuAg.cathodeCouple.id, 'ag');
  assert.equal(cuAg.cellPotentialV, 0.459);
  assert.equal(cuAg.spontaneousEquation, 'Cu + 2Ag⁺ → Cu²⁺ + 2Ag');
});

test('Alpha rule balances Fe3+/Fe2+ with Cu and flags water-reactive metals like Na', () => {
  const cu = STANDARD_POTENTIALS.find((c) => c.id === 'cu')!;
  const fe3 = STANDARD_POTENTIALS.find((c) => c.id === 'fe3')!;
  const na = STANDARD_POTENTIALS.find((c) => c.id === 'na')!;

  const cuFe3 = compareElectrodeCouples(cu, fe3);
  assert.equal(cuFe3.spontaneousEquation, 'Cu + 2Fe³⁺ → Cu²⁺ + 2Fe²⁺');
  assert.equal(cuFe3.cellPotentialV, 0.431);

  const naCu = compareElectrodeCouples(na, cu);
  assert.ok(naCu.waterWarning && naCu.waterWarning.includes('H₂O'));
});

test('formatPotentialV uses consistent sign and 3 decimal places with unit V', () => {
  assert.equal(formatPotentialV(-0.763), '−0,763 V');
  assert.equal(formatPotentialV(0), '0,000 V');
  assert.equal(formatPotentialV(0.34), '+0,340 V');
});

test('checkNumericAnswer accepts comma and dot within tolerance', () => {
  assert.deepEqual(checkNumericAnswer('1,103', 1.103, 0.01), {
    valid: true,
    isCorrect: true,
    parsedValue: 1.103,
  });
  assert.deepEqual(checkNumericAnswer('1.11', 1.103, 0.01), {
    valid: true,
    isCorrect: true,
    parsedValue: 1.11,
  });
  assert.deepEqual(checkNumericAnswer('1.2', 1.103, 0.01), {
    valid: true,
    isCorrect: false,
    parsedValue: 1.2,
  });
  assert.deepEqual(checkNumericAnswer('không biết', 1.103, 0.01), {
    valid: false,
    isCorrect: false,
    parsedValue: null,
  });
});

test('buildBalancedQuiz returns exactly 12 questions distributed evenly across 6 lessons', () => {
  const mockBank = Array.from({ length: 36 }, (_, idx) => ({
    id: `q${idx + 1}`,
    lessonNumber: (idx % 6) + 1,
  }));

  const quiz = buildBalancedQuiz(mockBank, () => 0.4);
  assert.equal(quiz.length, 12);
  for (let lesson = 1; lesson <= 6; lesson++) {
    const count = quiz.filter((q) => q.lessonNumber === lesson).length;
    assert.equal(count, 2);
  }
});
