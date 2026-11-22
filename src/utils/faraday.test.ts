import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFaraday,
  parseDecimalInput,
  formatViNumber,
} from './faraday';

test('parseDecimalInput accepts dot and comma decimal separators', () => {
  assert.equal(parseDecimalInput('2.5'), 2.5);
  assert.equal(parseDecimalInput('2,5'), 2.5);
  assert.equal(parseDecimalInput(' 965 '), 965);
  assert.equal(parseDecimalInput('0,020'), 0.02);
  assert.equal(parseDecimalInput(''), null);
  assert.equal(parseDecimalInput('abc'), null);
  assert.equal(parseDecimalInput('1.2,3'), null);
});

test('Faraday calculation for Cu at I = 2 A, t = 965 s yields exact syllabus values', () => {
  const { errors, result } = calculateFaraday({
    currentStr: '2',
    timeStr: '965',
    timeUnit: 's',
    molarMassStr: '63,5',
    zStr: '2',
    isGas: false,
  });

  assert.deepEqual(errors, {});
  assert.ok(result);
  assert.equal(result.chargeC, 1930);
  assert.ok(Math.abs(result.electronMol - 0.02) < 1e-12);
  assert.ok(Math.abs(result.productMol - 0.01) < 1e-12);
  assert.ok(Math.abs(result.massG - 0.635) < 1e-12);
  assert.equal(result.gasVolumeL, null);
});

test('Faraday calculation for O2 (z = 4) at I = 2 A, t = 965 s yields 0.12395 L at 25 °C, 1 bar', () => {
  const { errors, result } = calculateFaraday({
    currentStr: '2,0',
    timeStr: '965',
    timeUnit: 's',
    molarMassStr: '32',
    zStr: '4',
    isGas: true,
  });

  assert.deepEqual(errors, {});
  assert.ok(result);
  assert.equal(result.chargeC, 1930);
  assert.ok(Math.abs(result.electronMol - 0.02) < 1e-12);
  assert.ok(Math.abs(result.productMol - 0.005) < 1e-12);
  assert.ok(Math.abs(result.massG - 0.16) < 1e-12);
  assert.ok(result.gasVolumeL !== null);
  assert.ok(Math.abs(result.gasVolumeL - 0.12395) < 1e-12);
});

test('Faraday calculation converts minutes and hours correctly', () => {
  const minRun = calculateFaraday({
    currentStr: '5',
    timeStr: '32,1666667',
    timeUnit: 'min',
    molarMassStr: '108',
    zStr: '1',
    isGas: false,
  });
  assert.ok(minRun.result);
  assert.ok(Math.abs(minRun.result.electronMol - 0.1) < 1e-5);

  const hourRun = calculateFaraday({
    currentStr: '1',
    timeStr: '1',
    timeUnit: 'h',
    molarMassStr: '2',
    zStr: '2',
    isGas: true,
  });
  assert.ok(hourRun.result);
  assert.equal(hourRun.result.timeSeconds, 3600);
  assert.equal(hourRun.result.chargeC, 3600);
});

test('Faraday validation flags non-positive, non-integer z, and empty inputs', () => {
  const { errors, result } = calculateFaraday({
    currentStr: '-2',
    timeStr: 'abc',
    timeUnit: 's',
    molarMassStr: '0',
    zStr: '1.5',
    isGas: false,
  });

  assert.equal(result, null);
  assert.ok(errors.current);
  assert.ok(errors.time);
  assert.ok(errors.molarMass);
  assert.ok(errors.z);
});

test('formatViNumber formats thousands with space, decimals with comma, and true minus sign', () => {
  assert.equal(formatViNumber(1930), '1 930');
  assert.equal(formatViNumber(0.02, { minDecimals: 3, maxDecimals: 3 }), '0,020');
  assert.equal(formatViNumber(0.12395, { maxDecimals: 5 }), '0,12395');
  assert.equal(formatViNumber(-0.763, { minDecimals: 3, maxDecimals: 3 }), '−0,763');
});
