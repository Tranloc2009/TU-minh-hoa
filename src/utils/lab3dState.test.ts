import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LAB_OBJECTS,
  LAB_STEP_GUIDES,
  LabGuideKey,
  computeGalvanicCellSnapshot,
  computeLab3DVisuals,
  computeSmartPopupLayout,
  createInitialGalvanicState,
  easeInOutCubic,
  getCameraPreset,
  getObjectsForStation,
} from './lab3dState';
import { computeElectrolysisAtTime, getDefaultParams, getDepletionTimeSeconds } from './electrochemEngine';

test('Galvanic Zn-Cu voltmeter matches 1.103 V open circuit and ~1.081 V closed circuit', () => {
  const openSnap = computeGalvanicCellSnapshot({
    ...createInitialGalvanicState(),
    circuitClosed: false,
    timeSeconds: 0,
  });
  assert.equal(openSnap.terminalVoltageV, 1.103);
  assert.equal(openSnap.currentMa, 0);

  const closedSnap = computeGalvanicCellSnapshot({
    ...createInitialGalvanicState(),
    circuitClosed: true,
    timeSeconds: 20,
  });
  assert.ok(Math.abs(closedSnap.terminalVoltageV - 1.08137) < 0.001);
  assert.ok(closedSnap.currentMa > 10 && closedSnap.currentMa < 12);
  assert.ok(closedSnap.cuDepositedMg > 0);
  assert.ok(closedSnap.znDissolvedMg > 0);
});

test('computeLab3DVisuals deterministically maps CuSO4 depletion & variant physics', () => {
  const inertParams = getDefaultParams('cuso4-inert'); // I=2A, t=1930s, nCu2+=0.01 -> dep = 965s
  const depTime = getDepletionTimeSeconds(inertParams)!;
  assert.equal(depTime, 965);

  const galvanic = computeGalvanicCellSnapshot(createInitialGalvanicState());
  const naclParams = getDefaultParams('nacl-brine');
  const naclSnap = computeElectrolysisAtTime(naclParams, 400);

  // Before depletion (t = 482.5 s)
  const snapBefore = computeElectrolysisAtTime(inertParams, depTime / 2);
  const visBefore = computeLab3DVisuals({
    galvanic,
    cuso4Variant: 'cuso4-inert',
    cuso4Params: inertParams,
    cuso4Snapshot: snapBefore,
    naclVariant: 'nacl-brine',
    naclParams,
    naclSnapshot: naclSnap,
    activeStation: 'dien-phan-cuso4',
    isRunning: false,
    playbackSpeed: 1,
  });
  assert.ok(visBefore.cuso4.cathodeCuThickness > 0.45 && visBefore.cuso4.cathodeCuThickness < 0.55);
  assert.equal(visBefore.cuso4.h2BubbleIntensity, 0);
  assert.ok(visBefore.cuso4.o2BubbleIntensity > 0);
  assert.equal(visBefore.cuso4.inStage2, false);

  // After depletion (t = 1500 s)
  const snapAfter = computeElectrolysisAtTime(inertParams, 1500);
  const visAfter = computeLab3DVisuals({
    galvanic,
    cuso4Variant: 'cuso4-inert',
    cuso4Params: inertParams,
    cuso4Snapshot: snapAfter,
    naclVariant: 'nacl-brine',
    naclParams,
    naclSnapshot: naclSnap,
    activeStation: 'dien-phan-cuso4',
    isRunning: false,
    playbackSpeed: 1,
  });
  assert.equal(visAfter.cuso4.cathodeCuThickness, 1); // plateaus at max Cu
  assert.ok(visAfter.cuso4.h2BubbleIntensity > 0); // H2 starts at cathode
  assert.equal(visAfter.cuso4.inStage2, true);

  // Copper anode variant: zero O2/H2, constant blue solution, dissolving anode
  const cuParams = getDefaultParams('cuso4-copper');
  const cuSnap = computeElectrolysisAtTime(cuParams, 965);
  const visCu = computeLab3DVisuals({
    galvanic,
    cuso4Variant: 'cuso4-copper',
    cuso4Params: cuParams,
    cuso4Snapshot: cuSnap,
    naclVariant: 'nacl-molten',
    naclParams: getDefaultParams('nacl-molten'),
    naclSnapshot: computeElectrolysisAtTime(getDefaultParams('nacl-molten'), 400),
    activeStation: 'dien-phan-cuso4',
    isRunning: false,
    playbackSpeed: 1,
  });
  assert.equal(visCu.cuso4.o2BubbleIntensity, 0);
  assert.equal(visCu.cuso4.h2BubbleIntensity, 0);
  assert.equal(visCu.cuso4.solutionBlueRatio, 1);
  assert.ok(visCu.cuso4.anodeCuRemainingRatio < 1);
  // NaCl molten has no membrane and no H2
  assert.equal(visCu.nacl.showMembrane, false);
  assert.equal(visCu.nacl.h2BubbleIntensity, 0);
  assert.ok(visCu.nacl.moltenNaDepositRatio > 0);
});

test('Smart popup layout clamps to viewport, uses hysteresis, hides when occluded, and switches to bottom sheet at 390px', () => {
  // Desktop right-side anchor -> popup placed on left
  const rightAnchor = computeSmartPopupLayout({
    anchorX: 1180,
    anchorY: 420,
    inFrontOfCamera: true,
    occluded: false,
    viewportWidth: 1440,
    viewportHeight: 900,
    popupWidth: 310,
    popupHeight: 220,
    previousSide: null,
  });
  assert.equal(rightAnchor.visible, true);
  assert.equal(rightAnchor.mode, 'anchored');
  assert.equal(rightAnchor.side, 'left');
  assert.ok(rightAnchor.left >= 16 && rightAnchor.left + 310 <= 1440 - 16);

  // Hysteresis prevents immediate side flip on small threshold crossing (1440 * 0.66 = 950.4)
  const jitter = computeSmartPopupLayout({
    anchorX: 935, // slightly left of threshold 950.4, within 36px hysteresis band
    anchorY: 420,
    inFrontOfCamera: true,
    occluded: false,
    viewportWidth: 1440,
    viewportHeight: 900,
    popupWidth: 310,
    popupHeight: 220,
    previousSide: 'left',
  });
  assert.equal(jitter.side, 'left');

  // Occluded object hides anchored popup
  const occluded = computeSmartPopupLayout({
    anchorX: 700,
    anchorY: 400,
    inFrontOfCamera: true,
    occluded: true,
    viewportWidth: 1440,
    viewportHeight: 900,
    popupWidth: 310,
    popupHeight: 220,
    previousSide: 'right',
  });
  assert.equal(occluded.visible, false);

  // 390px mobile switches to bottom-sheet
  const mobile = computeSmartPopupLayout({
    anchorX: 195,
    anchorY: 220,
    inFrontOfCamera: true,
    occluded: false,
    viewportWidth: 390,
    viewportHeight: 844,
    popupWidth: 310,
    popupHeight: 240,
    previousSide: null,
  });
  assert.equal(mobile.visible, true);
  assert.equal(mobile.mode, 'bottom-sheet');
});

test('Responsive camera presets pull back on narrow 390px mobile viewport and ease smoothly', () => {
  const desktopOverview = getCameraPreset('OVERVIEW', null, null, 1440 / 900);
  const mobileOverview = getCameraPreset('OVERVIEW', null, null, 390 / 680);
  assert.ok(mobileOverview.position.z > desktopOverview.position.z);
  assert.ok(mobileOverview.position.y > desktopOverview.position.y);

  assert.equal(easeInOutCubic(0), 0);
  assert.equal(easeInOutCubic(0.5), 0.5);
  assert.equal(easeInOutCubic(1), 1);

  // NaCl molten excludes membrane object; brine includes membrane
  const moltenObjs = getObjectsForStation('dien-phan-nacl', 'nacl-molten').map((o) => o.id);
  const brineObjs = getObjectsForStation('dien-phan-nacl', 'nacl-brine').map((o) => o.id);
  assert.equal(moltenObjs.includes('nacl-membrane'), false);
  assert.equal(brineObjs.includes('nacl-membrane'), true);
});

test('All 5 experiment variants have exactly 10 distinct guided storyboard steps with valid object references', () => {
  const keys: LabGuideKey[] = [
    'pin-zn-cu',
    'cuso4-inert',
    'cuso4-copper',
    'nacl-molten',
    'nacl-brine',
  ];

  for (const key of keys) {
    const steps = LAB_STEP_GUIDES[key];
    assert.equal(steps.length, 10, `${key} should have 10 steps`);
    const titles = new Set(steps.map((s) => s.title));
    assert.equal(titles.size, 10, `${key} should have 10 unique step titles`);
    steps.forEach((step, idx) => {
      assert.equal(step.stepNumber, idx + 1);
      assert.ok(step.formula.length > 0);
      if (step.focusObject) {
        assert.ok(LAB_OBJECTS[step.focusObject], `Invalid focusObject ${step.focusObject}`);
      }
    });
  }
});
