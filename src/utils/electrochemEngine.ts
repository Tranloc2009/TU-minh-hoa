import {
  FARADAY_CONSTANT,
  MOLAR_GAS_VOLUME_25C_1BAR,
  TimeUnit,
  convertTimeToSeconds,
  formatViNumber,
  parseDecimalInput,
} from './faraday';

export const MOLAR_MASS_CU = 63.5; // g/mol
export const MOLAR_MASS_NA = 23; // g/mol
export const ANODE_COPPER_INITIAL_G = 5.0; // g available copper in anode model

export type ElectrolysisVariant =
  | 'cuso4-inert'
  | 'cuso4-copper'
  | 'nacl-molten'
  | 'nacl-brine';

export interface ElectrolysisRawInput {
  currentStr: string;
  timeStr: string;
  timeUnit: TimeUnit;
  initialCu2MolStr: string;
}

export interface ElectrolysisValidationErrors {
  current?: string;
  time?: string;
  initialCu2Mol?: string;
}

export interface ElectrolysisParams {
  variant: ElectrolysisVariant;
  currentA: number;
  timeOriginal: number;
  timeUnit: TimeUnit;
  totalTimeSeconds: number;
  initialCu2Mol: number; // used by cuso4-inert
  anodeCuInitialG: number; // used by cuso4-copper
}

export interface ElectrolysisSnapshot {
  variant: ElectrolysisVariant;
  timeSeconds: number;
  totalTimeSeconds: number;
  progressRatio: number; // 0..1
  chargeC: number;
  electronMol: number;
  /** Stage 0 = t=0 chưa chạy; 1 = giai đoạn chính; 2 = sau khi hết Cu2+ (chỉ cuso4-inert) */
  stage: 0 | 1 | 2;
  stageLabel: string;
  reachedDepletion: boolean;
  depletionTimeSeconds: number | null;
  cathodeEquation: string;
  anodeEquation: string;
  overallEquation: string;
  // CuSO4 inert & copper
  cuPlatedMol: number;
  cuPlatedG: number;
  cuLostAtAnodeMol: number;
  cuLostAtAnodeG: number;
  anodeCuRemainingG: number;
  cu2RemainingMol: number;
  cu2Ratio: number; // 0..1 for qualitative color intensity
  // Gases & products
  o2Mol: number;
  o2VolumeL: number;
  h2Mol: number;
  h2VolumeL: number;
  cl2Mol: number;
  cl2VolumeL: number;
  naProducedMol: number;
  naProducedG: number;
  ohProducedMol: number;
  hPlusProducedMol: number;
}

export interface ElectrolysisMilestone {
  timeSeconds: number;
  label: string;
  description: string;
  isDepletion?: boolean;
}

export interface ChartPoint {
  t: number;
  cuPlatedG: number;
  cuLostAtAnodeG: number;
  naProducedG: number;
  o2Mol: number;
  h2Mol: number;
  cl2Mol: number;
  cu2RemainingMol: number;
}

export interface DerivationStep {
  title: string;
  formula: string;
  substitution: string;
  result: string;
  note?: string;
}

export function getDefaultRawInput(variant: ElectrolysisVariant): ElectrolysisRawInput {
  if (variant === 'cuso4-inert') {
    return {
      currentStr: '2',
      timeStr: '1930',
      timeUnit: 's',
      initialCu2MolStr: '0,010',
    };
  }
  return {
    currentStr: '2',
    timeStr: '965',
    timeUnit: 's',
    initialCu2MolStr: '0,010',
  };
}

export function getDefaultParams(variant: ElectrolysisVariant): ElectrolysisParams {
  const raw = getDefaultRawInput(variant);
  const { params } = validateElectrolysisParams(variant, raw);
  if (!params) {
    throw new Error(`Invalid default parameters for variant ${variant}`);
  }
  return params;
}

export function getMaxCopperAnodeTimeSeconds(
  currentA: number,
  anodeCuInitialG: number = ANODE_COPPER_INITIAL_G
): number {
  const maxCuMol = anodeCuInitialG / MOLAR_MASS_CU;
  const maxElectronMol = 2 * maxCuMol;
  return (maxElectronMol * FARADAY_CONSTANT) / currentA;
}

export function validateElectrolysisParams(
  variant: ElectrolysisVariant,
  raw: ElectrolysisRawInput
): {
  errors: ElectrolysisValidationErrors;
  params: ElectrolysisParams | null;
} {
  const errors: ElectrolysisValidationErrors = {};

  const currentA = parseDecimalInput(raw.currentStr);
  if (currentA === null) {
    errors.current = 'Nhập cường độ dòng điện hợp lệ (ví dụ: 2 hoặc 2,5).';
  } else if (currentA <= 0) {
    errors.current = 'Cường độ dòng điện I phải lớn hơn 0 A.';
  } else if (currentA > 100) {
    errors.current = 'Cường độ dòng điện trong phòng thí nghiệm cần nằm trong khoảng (0; 100] A.';
  }

  const timeOriginal = parseDecimalInput(raw.timeStr);
  let totalTimeSeconds = 0;
  if (timeOriginal === null) {
    errors.time = 'Nhập thời gian điện phân hợp lệ (cho phép 0, ví dụ: 965 hoặc 1930).';
  } else if (timeOriginal < 0) {
    errors.time = 'Thời gian điện phân t không được âm (t ≥ 0).';
  } else {
    totalTimeSeconds = convertTimeToSeconds(timeOriginal, raw.timeUnit);
    if (totalTimeSeconds > 86400) {
      errors.time = 'Thời gian tối đa trong mô phỏng là 24 giờ (86 400 s).';
    }
  }

  let initialCu2Mol = 0.01;
  if (variant === 'cuso4-inert') {
    const parsedCu = parseDecimalInput(raw.initialCu2MolStr);
    if (parsedCu === null) {
      errors.initialCu2Mol = 'Nhập số mol Cu²⁺ ban đầu hợp lệ (ví dụ: 0,010).';
    } else if (parsedCu <= 0) {
      errors.initialCu2Mol = 'Số mol Cu²⁺ ban đầu phải lớn hơn 0 mol.';
    } else if (parsedCu > 5) {
      errors.initialCu2Mol = 'Số mol Cu²⁺ ban đầu trong bình thí nghiệm cần ≤ 5 mol.';
    } else {
      initialCu2Mol = parsedCu;
    }
  }

  if (
    variant === 'cuso4-copper' &&
    !errors.current &&
    !errors.time &&
    currentA !== null &&
    currentA > 0
  ) {
    const maxSec = getMaxCopperAnodeTimeSeconds(currentA, ANODE_COPPER_INITIAL_G);
    if (totalTimeSeconds > maxSec) {
      const maxSecFloor = Math.floor(maxSec);
      errors.time = `Với thanh anode Cu ${formatViNumber(ANODE_COPPER_INITIAL_G, { minDecimals: 1, maxDecimals: 1 })} g ở I = ${formatViNumber(currentA, { maxDecimals: 2 })} A, thời gian tối đa trước khi anode tan hết là ${formatViNumber(maxSecFloor, { maxDecimals: 0 })} s.`;
    }
  }

  if (Object.keys(errors).length > 0 || currentA === null || timeOriginal === null) {
    return { errors, params: null };
  }

  return {
    errors: {},
    params: {
      variant,
      currentA,
      timeOriginal,
      timeUnit: raw.timeUnit,
      totalTimeSeconds,
      initialCu2Mol,
      anodeCuInitialG: ANODE_COPPER_INITIAL_G,
    },
  };
}

export function getDepletionTimeSeconds(params: ElectrolysisParams): number | null {
  if (params.variant !== 'cuso4-inert') return null;
  return (2 * params.initialCu2Mol * FARADAY_CONSTANT) / params.currentA;
}

export function computeElectrolysisAtTime(
  params: ElectrolysisParams,
  rawTimeSeconds: number
): ElectrolysisSnapshot {
  const clampedTime = Math.max(0, Math.min(rawTimeSeconds, params.totalTimeSeconds));
  const progressRatio =
    params.totalTimeSeconds > 0 ? clampedTime / params.totalTimeSeconds : 0;
  const chargeC = params.currentA * clampedTime;
  const electronMol = chargeC / FARADAY_CONSTANT;

  if (params.variant === 'cuso4-inert') {
    const depletionTimeSeconds = getDepletionTimeSeconds(params)!;
    const depletionElectronMol = 2 * params.initialCu2Mol;
    const neStage1 = Math.min(electronMol, depletionElectronMol);
    const neStage2 = Math.max(0, electronMol - depletionElectronMol);

    const cuPlatedMol = neStage1 / 2;
    const cuPlatedG = cuPlatedMol * MOLAR_MASS_CU;
    const cu2RemainingMol = Math.max(0, params.initialCu2Mol - cuPlatedMol);
    const cu2Ratio =
      params.initialCu2Mol > 0 ? cu2RemainingMol / params.initialCu2Mol : 0;

    // Anode continuously oxidizes H2O across both stages: 2H2O -> O2 + 4H+ + 4e-
    const o2Mol = electronMol / 4;
    const o2VolumeL = o2Mol * MOLAR_GAS_VOLUME_25C_1BAR;

    // Cathode produces H2 only strictly after Cu2+ is depleted (neStage2 > 0)
    const h2Mol = neStage2 / 2;
    const h2VolumeL = h2Mol * MOLAR_GAS_VOLUME_25C_1BAR;

    // Net H+ accumulated in solution: 4e- at anode creates 4 H+ (so n(H+) = electronMol),
    // minus 2 H+ consumed per H2 in stage 2 (neStage2) => remains neStage1 = 2 * n(Cu plated)
    const hPlusProducedMol = neStage1;

    const reachedDepletion = clampedTime >= depletionTimeSeconds - 1e-9;
    const inStage2 = neStage2 > 1e-12;

    let stage: 0 | 1 | 2 = 1;
    let stageLabel = 'Giai đoạn 1 · Khử Cu²⁺ thành Cu ở cathode, oxi hóa H₂O tạo O₂ ở anode';
    if (clampedTime <= 1e-12) {
      stage = 0;
      stageLabel = 'Ban đầu (t = 0 s) · Chưa đóng dòng điện phân';
    } else if (inStage2) {
      stage = 2;
      stageLabel = 'Giai đoạn 2 (sau khi hết Cu²⁺) · Điện phân nước: H₂ thoát ở cathode, O₂ tiếp tục thoát ở anode';
    } else if (reachedDepletion) {
      stage = 1;
      stageLabel = 'Mốc chuyển giai đoạn · Cu²⁺ vừa hết theo mô hình';
    }

    const cathodeEquation = inStage2
      ? '2H⁺ + 2e⁻ → H₂↑ (hoặc 2H₂O + 2e⁻ → H₂↑ + 2OH⁻)'
      : 'Cu²⁺ + 2e⁻ → Cu';
    const anodeEquation = '2H₂O → O₂↑ + 4H⁺ + 4e⁻';
    const overallEquation = inStage2
      ? '2H₂O → 2H₂↑ + O₂↑ (tiếp sau 2CuSO₄ + 2H₂O → 2Cu + O₂↑ + 2H₂SO₄)'
      : '2CuSO₄ + 2H₂O → 2Cu↓ + O₂↑ + 2H₂SO₄';

    return {
      variant: params.variant,
      timeSeconds: clampedTime,
      totalTimeSeconds: params.totalTimeSeconds,
      progressRatio,
      chargeC,
      electronMol,
      stage,
      stageLabel,
      reachedDepletion,
      depletionTimeSeconds,
      cathodeEquation,
      anodeEquation,
      overallEquation,
      cuPlatedMol,
      cuPlatedG,
      cuLostAtAnodeMol: 0,
      cuLostAtAnodeG: 0,
      anodeCuRemainingG: 0,
      cu2RemainingMol,
      cu2Ratio,
      o2Mol,
      o2VolumeL,
      h2Mol,
      h2VolumeL,
      cl2Mol: 0,
      cl2VolumeL: 0,
      naProducedMol: 0,
      naProducedG: 0,
      ohProducedMol: 0,
      hPlusProducedMol,
    };
  }

  if (params.variant === 'cuso4-copper') {
    const cuMol = electronMol / 2;
    const cuG = cuMol * MOLAR_MASS_CU;
    const anodeCuRemainingG = Math.max(0, params.anodeCuInitialG - cuG);
    const stage: 0 | 1 = clampedTime <= 1e-12 ? 0 : 1;

    return {
      variant: params.variant,
      timeSeconds: clampedTime,
      totalTimeSeconds: params.totalTimeSeconds,
      progressRatio,
      chargeC,
      electronMol,
      stage,
      stageLabel:
        stage === 0
          ? 'Ban đầu (t = 0 s) · Chưa đóng dòng điện phân'
          : 'Anode tan · Cu tan ở anode (+), Cu bám đúng lượng tương đương ở cathode (−)',
      reachedDepletion: false,
      depletionTimeSeconds: null,
      cathodeEquation: 'Cu²⁺ + 2e⁻ → Cu',
      anodeEquation: 'Cu → Cu²⁺ + 2e⁻',
      overallEquation: 'Cu (anode) → Cu (cathode) · [Cu²⁺] dung dịch không đổi',
      cuPlatedMol: cuMol,
      cuPlatedG: cuG,
      cuLostAtAnodeMol: cuMol,
      cuLostAtAnodeG: cuG,
      anodeCuRemainingG,
      cu2RemainingMol: params.initialCu2Mol,
      cu2Ratio: 1,
      o2Mol: 0,
      o2VolumeL: 0,
      h2Mol: 0,
      h2VolumeL: 0,
      cl2Mol: 0,
      cl2VolumeL: 0,
      naProducedMol: 0,
      naProducedG: 0,
      ohProducedMol: 0,
      hPlusProducedMol: 0,
    };
  }

  if (params.variant === 'nacl-molten') {
    const naProducedMol = electronMol;
    const naProducedG = naProducedMol * MOLAR_MASS_NA;
    const cl2Mol = electronMol / 2;
    const cl2VolumeL = cl2Mol * MOLAR_GAS_VOLUME_25C_1BAR;
    const stage: 0 | 1 = clampedTime <= 1e-12 ? 0 : 1;

    return {
      variant: params.variant,
      timeSeconds: clampedTime,
      totalTimeSeconds: params.totalTimeSeconds,
      progressRatio,
      chargeC,
      electronMol,
      stage,
      stageLabel:
        stage === 0
          ? 'Ban đầu (t = 0 s) · Muối NaCl nóng chảy (chỉ gồm ion Na⁺ và Cl⁻, không có nước)'
          : 'Điện phân nóng chảy · Na lỏng tạo ở cathode (−), khí Cl₂ thoát ở anode (+)',
      reachedDepletion: false,
      depletionTimeSeconds: null,
      cathodeEquation: 'Na⁺ + e⁻ → Na',
      anodeEquation: '2Cl⁻ → Cl₂↑ + 2e⁻',
      overallEquation: '2NaCl (nóng chảy) → 2Na + Cl₂↑',
      cuPlatedMol: 0,
      cuPlatedG: 0,
      cuLostAtAnodeMol: 0,
      cuLostAtAnodeG: 0,
      anodeCuRemainingG: 0,
      cu2RemainingMol: 0,
      cu2Ratio: 0,
      o2Mol: 0,
      o2VolumeL: 0,
      h2Mol: 0,
      h2VolumeL: 0,
      cl2Mol,
      cl2VolumeL,
      naProducedMol,
      naProducedG,
      ohProducedMol: 0,
      hPlusProducedMol: 0,
    };
  }

  // nacl-brine (saturated NaCl solution, inert electrodes, with diaphragm)
  const h2Mol = electronMol / 2;
  const h2VolumeL = h2Mol * MOLAR_GAS_VOLUME_25C_1BAR;
  const cl2Mol = electronMol / 2;
  const cl2VolumeL = cl2Mol * MOLAR_GAS_VOLUME_25C_1BAR;
  const ohProducedMol = electronMol;
  const stage: 0 | 1 = clampedTime <= 1e-12 ? 0 : 1;

  return {
    variant: params.variant,
    timeSeconds: clampedTime,
    totalTimeSeconds: params.totalTimeSeconds,
    progressRatio,
    chargeC,
    electronMol,
    stage,
    stageLabel:
      stage === 0
        ? 'Ban đầu (t = 0 s) · Dung dịch NaCl bão hòa có màng ngăn xốp'
        : 'Điện phân có màng ngăn · H₂ và OH⁻ (NaOH) ở ngăn cathode (−), khí Cl₂ ở ngăn anode (+)',
    reachedDepletion: false,
    depletionTimeSeconds: null,
    cathodeEquation: '2H₂O + 2e⁻ → H₂↑ + 2OH⁻',
    anodeEquation: '2Cl⁻ → Cl₂↑ + 2e⁻',
    overallEquation: '2NaCl + 2H₂O —(đpdd, có màng ngăn)→ 2NaOH + H₂↑ + Cl₂↑',
    cuPlatedMol: 0,
    cuPlatedG: 0,
    cuLostAtAnodeMol: 0,
    cuLostAtAnodeG: 0,
    anodeCuRemainingG: 0,
    cu2RemainingMol: 0,
    cu2Ratio: 0,
    o2Mol: 0,
    o2VolumeL: 0,
    h2Mol,
    h2VolumeL,
    cl2Mol,
    cl2VolumeL,
    naProducedMol: 0,
    naProducedG: 0,
    ohProducedMol,
    hPlusProducedMol: 0,
  };
}

export function getElectrolysisMilestones(params: ElectrolysisParams): ElectrolysisMilestone[] {
  const total = params.totalTimeSeconds;
  if (total <= 0) {
    return [
      {
        timeSeconds: 0,
        label: 't = 0 s',
        description: 'Trạng thái ban đầu, chưa có điện lượng đi qua bình.',
      },
    ];
  }

  if (params.variant === 'cuso4-inert') {
    const dep = getDepletionTimeSeconds(params)!;
    const list: ElectrolysisMilestone[] = [
      {
        timeSeconds: 0,
        label: 'Ban đầu (t = 0 s)',
        description: 'Chưa đóng mạch; dung dịch CuSO₄ màu xanh lam đậm.',
      },
    ];

    if (dep > 0 && dep < total - 1e-6) {
      list.push({
        timeSeconds: dep / 2,
        label: `Giữa giai đoạn 1 (${formatViNumber(dep / 2, { maxDecimals: 1 })} s)`,
        description: 'Cu bám dần lên cathode (−), khí O₂ thoát ở anode (+), Cu²⁺ giảm một nửa.',
      });
      list.push({
        timeSeconds: dep,
        label: `Mốc hết Cu²⁺ (${formatViNumber(dep, { maxDecimals: 1 })} s)`,
        description: 'Cu²⁺ đã hết theo mô hình (nₑ = 2n(Cu²⁺ ban đầu)). Lượng Cu đạt cực đại.',
        isDepletion: true,
      });
      list.push({
        timeSeconds: dep + (total - dep) / 2,
        label: `Giai đoạn 2 (${formatViNumber(dep + (total - dep) / 2, { maxDecimals: 1 })} s)`,
        description: 'Cathode chuyển sang khử H⁺ tạo khí H₂; anode tiếp tục sinh khí O₂.',
      });
    } else if (Math.abs(dep - total) <= 1e-6) {
      list.push({
        timeSeconds: total / 2,
        label: `Giữa quá trình (${formatViNumber(total / 2, { maxDecimals: 1 })} s)`,
        description: 'Cu bám lên cathode (−), O₂ thoát ở anode (+), màu xanh nhạt dần.',
      });
    } else {
      list.push({
        timeSeconds: total / 2,
        label: `Giữa quá trình (${formatViNumber(total / 2, { maxDecimals: 1 })} s)`,
        description: 'Cu²⁺ vẫn còn dư trong suốt thời gian đặt ra; chưa xuất hiện khí H₂.',
      });
    }

    list.push({
      timeSeconds: total,
      label: `Kết thúc (${formatViNumber(total, { maxDecimals: 1 })} s)`,
      description:
        total > dep + 1e-6
          ? 'Hoàn tất thời gian điện phân ở giai đoạn 2 (điện phân nước).'
          : Math.abs(dep - total) <= 1e-6
            ? 'Vừa chạm mốc hết Cu²⁺ theo mô hình.'
            : 'Kết thúc trong giai đoạn 1; Cu²⁺ vẫn còn trong dung dịch.',
      isDepletion: Math.abs(dep - total) <= 1e-6,
    });

    return list;
  }

  return [
    {
      timeSeconds: 0,
      label: 'Ban đầu (t = 0 s)',
      description: 'Chưa đóng mạch nguồn một chiều DC.',
    },
    {
      timeSeconds: total / 3,
      label: `Giai đoạn đầu (${formatViNumber(total / 3, { maxDecimals: 1 })} s)`,
      description: 'Electron di chuyển từ anode (+) qua nguồn DC về cathode (−), sản phẩm bắt đầu tạo thành.',
    },
    {
      timeSeconds: (2 * total) / 3,
      label: `Đang điện phân (${formatViNumber((2 * total) / 3, { maxDecimals: 1 })} s)`,
      description: 'Sản phẩm tích lũy tỉ lệ thuận với điện lượng Q = It và số mol electron nₑ = Q/F.',
    },
    {
      timeSeconds: total,
      label: `Kết thúc (${formatViNumber(total, { maxDecimals: 1 })} s)`,
      description: 'Hoàn tất thời gian điện phân đã chọn.',
    },
  ];
}

export function generateChartSeries(
  params: ElectrolysisParams,
  sampleCount: number = 48
): ChartPoint[] {
  const total = params.totalTimeSeconds;
  if (total <= 0) {
    const snap = computeElectrolysisAtTime(params, 0);
    return [
      {
        t: 0,
        cuPlatedG: snap.cuPlatedG,
        cuLostAtAnodeG: snap.cuLostAtAnodeG,
        naProducedG: snap.naProducedG,
        o2Mol: snap.o2Mol,
        h2Mol: snap.h2Mol,
        cl2Mol: snap.cl2Mol,
        cu2RemainingMol: snap.cu2RemainingMol,
      },
    ];
  }

  const timeValues = new Set<number>();
  for (let i = 0; i <= sampleCount; i++) {
    timeValues.add((total * i) / sampleCount);
  }
  const dep = getDepletionTimeSeconds(params);
  if (dep !== null && dep > 0 && dep < total) {
    timeValues.add(dep);
  }

  const sortedTimes = Array.from(timeValues).sort((a, b) => a - b);
  return sortedTimes.map((t) => {
    const snap = computeElectrolysisAtTime(params, t);
    return {
      t,
      cuPlatedG: snap.cuPlatedG,
      cuLostAtAnodeG: snap.cuLostAtAnodeG,
      naProducedG: snap.naProducedG,
      o2Mol: snap.o2Mol,
      h2Mol: snap.h2Mol,
      cl2Mol: snap.cl2Mol,
      cu2RemainingMol: snap.cu2RemainingMol,
    };
  });
}

export function buildFaradayDerivation(
  params: ElectrolysisParams,
  snapshot: ElectrolysisSnapshot
): DerivationStep[] {
  const iStr = formatViNumber(params.currentA, { maxDecimals: 3 });
  const tStr = formatViNumber(snapshot.timeSeconds, { maxDecimals: 1 });
  const qStr = formatViNumber(snapshot.chargeC, { maxDecimals: 2 });
  const neStr = formatViNumber(snapshot.electronMol, { minDecimals: 4, maxDecimals: 5 });

  const steps: DerivationStep[] = [
    {
      title: 'Bước 1 · Tính điện lượng Q đi qua bình tại thời điểm hiện tại',
      formula: 'Q = I · t',
      substitution: `${iStr} A × ${tStr} s`,
      result: `${qStr} C`,
      note:
        params.timeUnit !== 's'
          ? `Quy đổi từ đơn vị ${params.timeUnit === 'min' ? 'phút (× 60)' : 'giờ (× 3 600)'} sang giây trước khi tính.`
          : undefined,
    },
    {
      title: 'Bước 2 · Tính số mol electron trao đổi chung cho cả hai điện cực',
      formula: 'nₑ = Q / F (với F = 96 500 C/mol)',
      substitution: `${qStr} / 96 500`,
      result: `${neStr} mol`,
      note: 'Cùng một dòng điện đi qua bình nên tổng nₑ nhường ở anode (+) bằng đúng tổng nₑ nhận ở cathode (−).',
    },
  ];

  if (params.variant === 'cuso4-inert') {
    const neNeed = 2 * params.initialCu2Mol;
    const neNeedStr = formatViNumber(neNeed, { minDecimals: 3, maxDecimals: 5 });
    const cu0Str = formatViNumber(params.initialCu2Mol, { minDecimals: 3, maxDecimals: 5 });
    const cuMolStr = formatViNumber(snapshot.cuPlatedMol, { minDecimals: 4, maxDecimals: 5 });
    const cuGStr = formatViNumber(snapshot.cuPlatedG, { minDecimals: 3, maxDecimals: 4 });
    const o2MolStr = formatViNumber(snapshot.o2Mol, { minDecimals: 4, maxDecimals: 5 });
    const o2VolStr = formatViNumber(snapshot.o2VolumeL, { minDecimals: 3, maxDecimals: 4 });

    steps.push({
      title: 'Bước 3 · So sánh nₑ với lượng electron cần để khử hết Cu²⁺',
      formula: 'nₑ(cần khử hết Cu²⁺) = 2 · n(Cu²⁺ ban đầu)',
      substitution: `2 × ${cu0Str} mol`,
      result: `${neNeedStr} mol`,
      note:
        snapshot.electronMol > neNeed + 1e-12
          ? `Vì nₑ = ${neStr} mol > ${neNeedStr} mol nên Cu²⁺ đã hết (giai đoạn 2), phần electron dư (${formatViNumber(snapshot.electronMol - neNeed, { minDecimals: 4, maxDecimals: 5 })} mol) khử H⁺ tạo khí H₂.`
          : snapshot.reachedDepletion
            ? 'nₑ vừa chạm đúng mốc 2n(Cu²⁺ ban đầu): Cu²⁺ vừa hết, chưa phát sinh H₂.'
            : 'Vì nₑ < 2n(Cu²⁺ ban đầu) nên Cu²⁺ vẫn còn dư, cathode chỉ mới tạo Cu (chưa có H₂).',
    });

    steps.push({
      title: 'Bước 4 · Tính sản phẩm ở Cathode (−)',
      formula: 'Cu²⁺ + 2e⁻ → Cu (M = 63,5 g/mol)',
      substitution: `n(Cu) = ${cuMolStr} mol → m(Cu) = ${cuMolStr} × 63,5`,
      result: `${cuGStr} g Cu · n(H₂) = ${formatViNumber(snapshot.h2Mol, { minDecimals: 4, maxDecimals: 5 })} mol (${formatViNumber(snapshot.h2VolumeL, { minDecimals: 3, maxDecimals: 4 })} L ở 25 °C, 1 bar)`,
    });

    steps.push({
      title: 'Bước 5 · Tính khí O₂ ở Anode (+)',
      formula: '2H₂O → O₂↑ + 4H⁺ + 4e⁻ ⇒ n(O₂) = nₑ / 4',
      substitution: `${neStr} / 4 = ${o2MolStr} mol → V(O₂) = ${o2MolStr} × 24,79`,
      result: `${o2MolStr} mol O₂ (${o2VolStr} L ở 25 °C, 1 bar)`,
    });
  } else if (params.variant === 'cuso4-copper') {
    const cuMolStr = formatViNumber(snapshot.cuPlatedMol, { minDecimals: 4, maxDecimals: 5 });
    const cuGStr = formatViNumber(snapshot.cuPlatedG, { minDecimals: 3, maxDecimals: 4 });
    steps.push({
      title: 'Bước 3 · Tính khối lượng Cu tan ở Anode (+) và bám ở Cathode (−)',
      formula: 'n(Cu) = nₑ / 2 ; m(Cu) = n(Cu) × 63,5',
      substitution: `n(Cu) = ${neStr} / 2 = ${cuMolStr} mol → m = ${cuMolStr} × 63,5`,
      result: `Anode giảm ${cuGStr} g Cu · Cathode tăng ${cuGStr} g Cu`,
      note: 'Với hiệu suất 100%, lượng Cu tan ra từ anode đúng bằng lượng Cu bám vào cathode nên nồng độ Cu²⁺ không đổi.',
    });
  } else if (params.variant === 'nacl-molten') {
    const naMolStr = formatViNumber(snapshot.naProducedMol, { minDecimals: 4, maxDecimals: 5 });
    const naGStr = formatViNumber(snapshot.naProducedG, { minDecimals: 3, maxDecimals: 4 });
    const cl2MolStr = formatViNumber(snapshot.cl2Mol, { minDecimals: 4, maxDecimals: 5 });
    const cl2VolStr = formatViNumber(snapshot.cl2VolumeL, { minDecimals: 3, maxDecimals: 4 });

    steps.push({
      title: 'Bước 3 · Tính Na ở Cathode (−) và Cl₂ ở Anode (+)',
      formula: 'n(Na) = nₑ (z = 1, M = 23) ; n(Cl₂) = nₑ / 2 (z = 2)',
      substitution: `m(Na) = ${naMolStr} × 23 ; V(Cl₂) = ${cl2MolStr} × 24,79`,
      result: `${naGStr} g Na (${naMolStr} mol) · ${cl2MolStr} mol Cl₂ (${cl2VolStr} L)`,
    });
  } else {
    const h2MolStr = formatViNumber(snapshot.h2Mol, { minDecimals: 4, maxDecimals: 5 });
    const h2VolStr = formatViNumber(snapshot.h2VolumeL, { minDecimals: 3, maxDecimals: 4 });
    const cl2MolStr = formatViNumber(snapshot.cl2Mol, { minDecimals: 4, maxDecimals: 5 });
    const cl2VolStr = formatViNumber(snapshot.cl2VolumeL, { minDecimals: 3, maxDecimals: 4 });
    const ohMolStr = formatViNumber(snapshot.ohProducedMol, { minDecimals: 4, maxDecimals: 5 });

    steps.push({
      title: 'Bước 3 · Tính H₂, OH⁻ ở ngăn Cathode (−) và Cl₂ ở ngăn Anode (+)',
      formula: 'n(H₂) = nₑ / 2 ; n(OH⁻) = nₑ ; n(Cl₂) = nₑ / 2',
      substitution: `V(H₂) = ${h2MolStr} × 24,79 ; V(Cl₂) = ${cl2MolStr} × 24,79`,
      result: `${h2MolStr} mol H₂ (${h2VolStr} L) · ${ohMolStr} mol OH⁻ (NaOH) · ${cl2MolStr} mol Cl₂ (${cl2VolStr} L)`,
    });
  }

  return steps;
}
