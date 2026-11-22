import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFaradayDerivation,
  computeElectrolysisAtTime,
  generateChartSeries,
  getDefaultParams,
  getElectrolysisMilestones,
  validateElectrolysisParams,
} from './electrochemEngine.ts';

test('Checkpoint 2: CuSO4 inert at I = 2 A, t = 965 s, n(Cu2+) = 0.010 mol', () => {
  const params = getDefaultParams('cuso4-inert'); // I = 2 A, tTotal = 1930 s, n(Cu2+) = 0.010 mol
  const snap = computeElectrolysisAtTime(params, 965);

  assert.equal(snap.chargeC, 1930);
  assert.ok(Math.abs(snap.electronMol - 0.02) < 1e-9);
  assert.ok(Math.abs(snap.cuPlatedG - 0.635) < 1e-9);
  assert.ok(Math.abs(snap.o2Mol - 0.005) < 1e-9);
  assert.equal(snap.h2Mol, 0);
  assert.equal(snap.cu2RemainingMol, 0);
  assert.equal(snap.reachedDepletion, true);
  assert.equal(snap.stage, 1);
  assert.equal(snap.cathodeEquation, 'Cu²⁺ + 2e⁻ → Cu');
});

test('Checkpoint 3: CuSO4 inert at t = 1930 s reaches stage 2 and backward scrub restores stage 1', () => {
  const params = getDefaultParams('cuso4-inert');
  const snapEnd = computeElectrolysisAtTime(params, 1930);

  assert.equal(snapEnd.chargeC, 3860);
  assert.ok(Math.abs(snapEnd.electronMol - 0.04) < 1e-9);
  assert.ok(Math.abs(snapEnd.cuPlatedG - 0.635) < 1e-9);
  assert.ok(Math.abs(snapEnd.o2Mol - 0.01) < 1e-9);
  assert.ok(Math.abs(snapEnd.h2Mol - 0.01) < 1e-9);
  assert.equal(snapEnd.cu2RemainingMol, 0);
  assert.equal(snapEnd.stage, 2);
  assert.match(snapEnd.cathodeEquation, /H₂/);

  // Scrub backward before 965 s -> returns to stage 1 with Cu2+ > 0 and H2 = 0
  const snapBack = computeElectrolysisAtTime(params, 482.5);
  assert.equal(snapBack.stage, 1);
  assert.equal(snapBack.h2Mol, 0);
  assert.ok(Math.abs(snapBack.cu2RemainingMol - 0.005) < 1e-9);
  assert.ok(Math.abs(snapBack.cuPlatedG - 0.3175) < 1e-9);
  assert.equal(snapBack.cathodeEquation, 'Cu²⁺ + 2e⁻ → Cu');
});

test('Checkpoint 4: CuSO4 copper anode at I = 2 A, t = 965 s has equal Cu lost and Cu plated', () => {
  const params = getDefaultParams('cuso4-copper');
  const snap = computeElectrolysisAtTime(params, 965);

  assert.ok(Math.abs(snap.cuPlatedG - 0.635) < 1e-9);
  assert.ok(Math.abs(snap.cuLostAtAnodeG - 0.635) < 1e-9);
  assert.equal(snap.o2Mol, 0);
  assert.equal(snap.h2Mol, 0);
  assert.equal(snap.anodeEquation, 'Cu → Cu²⁺ + 2e⁻');
  assert.equal(snap.cathodeEquation, 'Cu²⁺ + 2e⁻ → Cu');
});

test('Checkpoint 5: NaCl molten vs saturated brine switches cathode product from Na to H2 while Cl2 remains at anode', () => {
  const molten = computeElectrolysisAtTime(getDefaultParams('nacl-molten'), 965);
  assert.ok(Math.abs(molten.naProducedMol - 0.02) < 1e-9);
  assert.ok(Math.abs(molten.naProducedG - 0.46) < 1e-9);
  assert.ok(Math.abs(molten.cl2Mol - 0.01) < 1e-9);
  assert.equal(molten.h2Mol, 0);
  assert.equal(molten.cathodeEquation, 'Na⁺ + e⁻ → Na');
  assert.equal(molten.anodeEquation, '2Cl⁻ → Cl₂↑ + 2e⁻');

  const brine = computeElectrolysisAtTime(getDefaultParams('nacl-brine'), 965);
  assert.ok(Math.abs(brine.h2Mol - 0.01) < 1e-9);
  assert.ok(Math.abs(brine.cl2Mol - 0.01) < 1e-9);
  assert.ok(Math.abs(brine.ohProducedMol - 0.02) < 1e-9);
  assert.equal(brine.naProducedMol, 0);
  assert.equal(brine.cathodeEquation, '2H₂O + 2e⁻ → H₂↑ + 2OH⁻');
  assert.equal(brine.anodeEquation, '2Cl⁻ → Cl₂↑ + 2e⁻');
});

test('Validation allows t = 0, accepts Vietnamese decimal comma, and rejects invalid/excessive values', () => {
  const zeroRes = validateElectrolysisParams('cuso4-inert', {
    currentStr: '2,5',
    timeStr: '0',
    timeUnit: 's',
    initialCu2MolStr: '0,01',
  });
  assert.equal(Object.keys(zeroRes.errors).length, 0);
  assert.ok(zeroRes.params);
  const zeroSnap = computeElectrolysisAtTime(zeroRes.params, 0);
  assert.equal(zeroSnap.chargeC, 0);
  assert.equal(zeroSnap.cuPlatedG, 0);
  assert.equal(zeroSnap.stage, 0);

  const badRes = validateElectrolysisParams('cuso4-inert', {
    currentStr: '-2',
    timeStr: '-10',
    timeUnit: 's',
    initialCu2MolStr: '',
  });
  assert.ok(badRes.errors.current);
  assert.ok(badRes.errors.time);
  assert.ok(badRes.errors.initialCu2Mol);
  assert.equal(badRes.params, null);

  // Exceeding 5.0 g copper anode mass at I = 2 A (max ~7598 s)
  const overAnode = validateElectrolysisParams('cuso4-copper', {
    currentStr: '2',
    timeStr: '10000',
    timeUnit: 's',
    initialCu2MolStr: '0,01',
  });
  assert.ok(overAnode.errors.time);
  assert.equal(overAnode.params, null);
});

test('Chart series and milestones include exact Cu2+ depletion point and derivation matches snapshot', () => {
  const params = getDefaultParams('cuso4-inert');
  const series = generateChartSeries(params, 20);
  const depPoint = series.find((p) => Math.abs(p.t - 965) < 1e-6);
  assert.ok(depPoint, 'Chart series must include exact depletion point t = 965 s');
  assert.ok(Math.abs(depPoint.cuPlatedG - 0.635) < 1e-9);
  assert.equal(depPoint.h2Mol, 0);

  const milestones = getElectrolysisMilestones(params);
  assert.ok(milestones.some((m) => m.isDepletion && Math.abs(m.timeSeconds - 965) < 1e-6));

  const snap = computeElectrolysisAtTime(params, 1930);
  const steps = buildFaradayDerivation(params, snap);
  assert.equal(steps.length, 5);
  assert.match(steps[0].result, /3 860 C/);
  assert.match(steps[1].result, /0,0400 mol/);
});
