import {
  ElectrolysisParams,
  ElectrolysisSnapshot,
  ElectrolysisVariant,
  computeElectronMotionProfile,
  getDepletionTimeSeconds,
} from './electrochemEngine';
import { formatViNumber } from './faraday';

export type LabExperimentId = 'pin-zn-cu' | 'dien-phan-cuso4' | 'dien-phan-nacl';
export type CameraLevel = 'OVERVIEW' | 'TABLE' | 'OBJECT' | 'REACTION';

export type LabObjectId =
  // Pin Zn-Cu
  | 'zn-cu-beaker-zn'
  | 'zn-cu-beaker-cu'
  | 'zn-cu-electrode-zn'
  | 'zn-cu-electrode-cu'
  | 'zn-cu-salt-bridge'
  | 'zn-cu-wire'
  | 'zn-cu-switch'
  | 'zn-cu-voltmeter'
  // CuSO4 electrolysis
  | 'cuso4-cell'
  | 'cuso4-power'
  | 'cuso4-cathode'
  | 'cuso4-anode'
  | 'cuso4-solution'
  | 'cuso4-wire'
  // NaCl electrolysis
  | 'nacl-cell'
  | 'nacl-power'
  | 'nacl-cathode'
  | 'nacl-anode'
  | 'nacl-membrane'
  | 'nacl-electrolyte';

export interface Vec3Tuple {
  x: number;
  y: number;
  z: number;
}

export interface CameraPreset {
  position: Vec3Tuple;
  target: Vec3Tuple;
  minDistance: number;
  maxDistance: number;
}

// Physical constants for the Galvanic Zn-Cu cell model (§7.4)
export const GALVANIC_EMF_STANDARD_V = 1.103;
export const GALVANIC_R_EXT_OHM = 100;
export const GALVANIC_R_INT_OHM = 2;
export const GALVANIC_TOTAL_DURATION_S = 60;

export interface GalvanicCellState {
  circuitClosed: boolean;
  timeSeconds: number; // 0..60
  totalTimeSeconds: number;
  showConventionalCurrent: boolean;
}

export interface GalvanicCellSnapshot {
  circuitClosed: boolean;
  timeSeconds: number;
  totalTimeSeconds: number;
  progress: number; // 0..1
  emfV: number; // 1.103 V
  terminalVoltageV: number; // 1.103 V open, ~1.081 V closed
  currentMa: number; // 0 mA open, ~10.81 mA closed
  znDissolvedMg: number;
  cuDepositedMg: number;
  cu2ColorIntensity: number; // 1.0 -> 0.45 as Cu2+ decreases
  stageIndex: 0 | 1 | 2 | 3;
  stageTitle: string;
  stageSummary: string;
  cathodeEquation: string;
  anodeEquation: string;
  overallEquation: string;
}

export function createInitialGalvanicState(): GalvanicCellState {
  return {
    circuitClosed: true,
    timeSeconds: 0,
    totalTimeSeconds: GALVANIC_TOTAL_DURATION_S,
    showConventionalCurrent: false,
  };
}

export function computeGalvanicCellSnapshot(state: GalvanicCellState): GalvanicCellSnapshot {
  const total = Math.max(1, state.totalTimeSeconds);
  const clampedTime = Math.max(0, Math.min(state.timeSeconds, total));
  const progress = clampedTime / total;
  const emfV = GALVANIC_EMF_STANDARD_V;
  const closedVoltageV = (emfV * GALVANIC_R_EXT_OHM) / (GALVANIC_R_EXT_OHM + GALVANIC_R_INT_OHM);
  const terminalVoltageV = state.circuitClosed ? closedVoltageV : emfV;
  const currentA = state.circuitClosed ? emfV / (GALVANIC_R_EXT_OHM + GALVANIC_R_INT_OHM) : 0;
  const currentMa = currentA * 1000;

  // Illustrative proportional mass change (scaled to classroom observation over 60s)
  const znDissolvedMg = progress * 22.0;
  const cuDepositedMg = progress * 21.4;
  const cu2ColorIntensity = Math.max(0.42, 1 - progress * 0.55);

  let stageIndex: 0 | 1 | 2 | 3 = 0;
  let stageTitle = 'Ban đầu · Hai bán pin Zn²⁺/Zn và Cu²⁺/Cu (1 M, 25 °C)';
  let stageSummary =
    'Thanh Zn nhúng trong ZnSO₄ 1 M, thanh Cu nhúng trong CuSO₄ 1 M, nối qua cầu muối KNO₃.';

  if (!state.circuitClosed) {
    stageIndex = 0;
    stageTitle = 'Mạch đang mở · Đo sức điện động hở mạch E°pin = 1,103 V';
    stageSummary =
      'Khóa K mở: chưa có dòng electron qua tải ngoài và chưa có dòng ion bù điện tích qua cầu muối.';
  } else if (progress >= 0.99) {
    stageIndex = 3;
    stageTitle = 'Hoàn tất quan sát · Pin phóng điện ổn định qua tải ngoài';
    stageSummary =
      'Thanh Zn mòn dần, đồng đỏ bám dày lên thanh Cu, màu xanh CuSO₄ nhạt dần, cầu muối giữ trung hòa điện tích.';
  } else if (progress >= 0.55) {
    stageIndex = 2;
    stageTitle = 'Giai đoạn 2 · Khử Cu²⁺ tại Cathode (+) Cu và cân bằng ion cầu muối';
    stageSummary =
      'Cu²⁺ nhận 2e⁻ bám đồng đỏ lên thanh Cu; NO₃⁻ sang cốc Zn và K⁺ sang cốc Cu qua cầu muối KNO₃.';
  } else if (progress > 0.02) {
    stageIndex = 1;
    stageTitle = 'Giai đoạn 1 · Oxi hóa ở Anode (−) Zn và dòng electron mạch ngoài';
    stageSummary =
      'Zn nhường 2e⁻ tạo Zn²⁺ tan vào dung dịch; electron chạy qua dây dẫn ngoài từ Zn sang Cu.';
  }

  return {
    circuitClosed: state.circuitClosed,
    timeSeconds: clampedTime,
    totalTimeSeconds: total,
    progress,
    emfV,
    terminalVoltageV,
    currentMa,
    znDissolvedMg,
    cuDepositedMg,
    cu2ColorIntensity,
    stageIndex,
    stageTitle,
    stageSummary,
    cathodeEquation: 'Cu²⁺ + 2e⁻ → Cu',
    anodeEquation: 'Zn → Zn²⁺ + 2e⁻',
    overallEquation: 'Zn + Cu²⁺ → Zn²⁺ + Cu',
  };
}

// Table center X positions in the unified 3D laboratory room
export const TABLE_POSITIONS: Record<LabExperimentId, Vec3Tuple> = {
  'pin-zn-cu': { x: -3.55, y: 0, z: 0.4 },
  'dien-phan-cuso4': { x: 0, y: 0, z: 0.4 },
  'dien-phan-nacl': { x: 3.55, y: 0, z: 0.4 },
};

export const TABLE_TOP_Y = 0.92;

export interface LabTableMeta {
  id: LabExperimentId;
  shortCode: string;
  badgeLabel: string;
  title: string;
  subtitle: string;
  summary: string;
  center: Vec3Tuple;
}

export const LAB_TABLES: Record<LabExperimentId, LabTableMeta> = {
  'pin-zn-cu': {
    id: 'pin-zn-cu',
    shortCode: '01 / PIN ĐIỆN',
    badgeLabel: 'Zn–Cu',
    title: 'Pin Zn–Cu',
    subtitle: 'Pin Galvani tự phát dòng điện',
    summary:
      'Quan sát dòng electron chạy qua dây ngoài từ Zn sang Cu và sự dịch chuyển ion K⁺, NO₃⁻ qua cầu muối KNO₃.',
    center: TABLE_POSITIONS['pin-zn-cu'],
  },
  'dien-phan-cuso4': {
    id: 'dien-phan-cuso4',
    shortCode: '02 / ĐIỆN PHÂN',
    badgeLabel: 'CuSO₄',
    title: 'Điện phân CuSO₄',
    subtitle: 'Điện cực trơ (2 giai đoạn) & Anode đồng tan',
    summary:
      'Quan sát lớp đồng đỏ bám trên cathode (−), khí O₂/H₂ tại mốc hết Cu²⁺ và đối chiếu với biến thể anode đồng.',
    center: TABLE_POSITIONS['dien-phan-cuso4'],
  },
  'dien-phan-nacl': {
    id: 'dien-phan-nacl',
    shortCode: '03 / ĐIỆN PHÂN NaCl',
    badgeLabel: 'NaCl',
    title: 'Điện phân NaCl',
    subtitle: 'Nóng chảy & Dung dịch bão hòa có màng ngăn',
    summary:
      'Phân biệt điện phân NaCl nóng chảy (thu Na, Cl₂) với dung dịch NaCl có màng trao đổi cation (thu H₂, Cl₂, NaOH).',
    center: TABLE_POSITIONS['dien-phan-nacl'],
  },
};

export interface LabObjectMeta {
  id: LabObjectId;
  station: LabExperimentId;
  name: string;
  kind: string;
  /** Offset relative to station table center (x, y from floor, z) */
  anchorOffset: Vec3Tuple;
  /** Camera position offset relative to station center when inspecting this object */
  cameraOffset: Vec3Tuple;
  /** Camera look target offset relative to station center */
  targetOffset: Vec3Tuple;
  defaultDescription: string;
}

export const LAB_OBJECTS: Record<LabObjectId, LabObjectMeta> = {
  // === STATION 1: PIN Zn-Cu ===
  'zn-cu-beaker-zn': {
    id: 'zn-cu-beaker-zn',
    station: 'pin-zn-cu',
    name: 'Cốc dung dịch ZnSO₄',
    kind: 'Bán pin Anode (−)',
    anchorOffset: { x: -0.52, y: 1.18, z: 0.04 },
    cameraOffset: { x: -1.15, y: 1.72, z: 1.55 },
    targetOffset: { x: -0.5, y: 1.18, z: 0.04 },
    defaultDescription:
      'Chứa dung dịch ZnSO₄ 1 M (không màu). Khi pin hoạt động, Zn²⁺ sinh ra từ thanh Zn làm tăng nồng độ Zn²⁺; anion NO₃⁻ từ cầu muối đi vào để trung hòa điện tích.',
  },
  'zn-cu-beaker-cu': {
    id: 'zn-cu-beaker-cu',
    station: 'pin-zn-cu',
    name: 'Cốc dung dịch CuSO₄',
    kind: 'Bán pin Cathode (+)',
    anchorOffset: { x: 0.52, y: 1.18, z: 0.04 },
    cameraOffset: { x: 1.15, y: 1.72, z: 1.55 },
    targetOffset: { x: 0.5, y: 1.18, z: 0.04 },
    defaultDescription:
      'Chứa dung dịch CuSO₄ 1 M màu xanh lam. Khi pin hoạt động, Cu²⁺ bị khử thành Cu bám lên thanh đồng nên màu xanh nhạt dần; cation K⁺ từ cầu muối đi vào bù điện tích dương.',
  },
  'zn-cu-electrode-zn': {
    id: 'zn-cu-electrode-zn',
    station: 'pin-zn-cu',
    name: 'Thanh kẽm (Zn) · Anode (−)',
    kind: 'Điện cực âm · Oxi hóa',
    anchorOffset: { x: -0.66, y: 1.42, z: 0.04 },
    cameraOffset: { x: -1.35, y: 1.76, z: 1.38 },
    targetOffset: { x: -0.62, y: 1.32, z: 0.04 },
    defaultDescription:
      'Tại cực âm (anode), Zn có tính khử mạnh hơn nên bị oxi hóa: Zn → Zn²⁺ + 2e⁻. Thanh Zn mòn dần và phát electron lên dây dẫn ngoài.',
  },
  'zn-cu-electrode-cu': {
    id: 'zn-cu-electrode-cu',
    station: 'pin-zn-cu',
    name: 'Thanh đồng (Cu) · Cathode (+)',
    kind: 'Điện cực dương · Khử',
    anchorOffset: { x: 0.66, y: 1.42, z: 0.04 },
    cameraOffset: { x: 1.35, y: 1.76, z: 1.38 },
    targetOffset: { x: 0.62, y: 1.32, z: 0.04 },
    defaultDescription:
      'Tại cực dương (cathode), electron từ mạch ngoài đi tới khử ion Cu²⁺ trong dung dịch: Cu²⁺ + 2e⁻ → Cu. Lớp đồng đỏ bám thêm làm khối lượng thanh Cu tăng lên.',
  },
  'zn-cu-salt-bridge': {
    id: 'zn-cu-salt-bridge',
    station: 'pin-zn-cu',
    name: 'Cầu muối KNO₃',
    kind: 'Cân bằng điện tích ion',
    anchorOffset: { x: 0, y: 1.56, z: 0.04 },
    cameraOffset: { x: 0, y: 1.75, z: 1.72 },
    targetOffset: { x: 0, y: 1.36, z: 0.04 },
    defaultDescription:
      'Ion K⁺ di chuyển về ngăn Cu, còn NO₃⁻ di chuyển về ngăn Zn, giúp khép kín mạch điện bên trong và duy trì trung hòa điện tích hai dung dịch.',
  },
  'zn-cu-wire': {
    id: 'zn-cu-wire',
    station: 'pin-zn-cu',
    name: 'Dây dẫn mạch ngoài',
    kind: 'Đường chuyển động electron',
    anchorOffset: { x: -0.35, y: 1.82, z: -0.18 },
    cameraOffset: { x: 0, y: 2.05, z: 1.85 },
    targetOffset: { x: 0, y: 1.68, z: -0.1 },
    defaultDescription:
      'Dẫn dòng electron một chiều từ thanh Zn (cực âm) sang thanh Cu (cực dương) khi công tắc đóng. Electron không đi qua cầu muối.',
  },
  'zn-cu-switch': {
    id: 'zn-cu-switch',
    station: 'pin-zn-cu',
    name: 'Công tắc (Khóa K)',
    kind: 'Đóng / mở mạch tải ngoài',
    anchorOffset: { x: 0, y: 1.08, z: 0.64 },
    cameraOffset: { x: 0.35, y: 1.55, z: 1.72 },
    targetOffset: { x: 0, y: 1.02, z: 0.56 },
    defaultDescription:
      'Điều khiển trạng thái mạch tải ngoài. Khi mở mạch, vôn kế đo sức điện động chuẩn 1,103 V và không có dòng e⁻. Khi đóng mạch, điện áp tải khoảng 1,081 V và electron chạy từ Zn sang Cu.',
  },
  'zn-cu-voltmeter': {
    id: 'zn-cu-voltmeter',
    station: 'pin-zn-cu',
    name: 'Vôn kế số',
    kind: 'Đo hiệu điện thế hai cực',
    anchorOffset: { x: 0, y: 1.88, z: -0.44 },
    cameraOffset: { x: 0, y: 2.04, z: 1.25 },
    targetOffset: { x: 0, y: 1.78, z: -0.38 },
    defaultDescription:
      'Hiển thị điện áp thực theo mô hình pin Zn–Cu: hở mạch 1,103 V (E°pin = 0,340 − (−0,763)); khi đóng qua tải 100 Ω (r = 2 Ω) còn khoảng 1,081 V.',
  },

  // === STATION 2: ĐIỆN PHÂN CuSO4 ===
  'cuso4-cell': {
    id: 'cuso4-cell',
    station: 'dien-phan-cuso4',
    name: 'Bình điện phân CuSO₄',
    kind: 'Bình thủy tinh phản ứng',
    anchorOffset: { x: -0.25, y: 1.24, z: 0.08 },
    cameraOffset: { x: -0.2, y: 1.78, z: 1.92 },
    targetOffset: { x: -0.22, y: 1.24, z: 0.05 },
    defaultDescription:
      'Chứa dung dịch CuSO₄ và hai điện cực nhúng song song. Thay đổi giữa điện cực trơ (2 giai đoạn) và anode đồng (anode tan) làm thay đổi hoàn toàn sản phẩm ở cực dương.',
  },
  'cuso4-power': {
    id: 'cuso4-power',
    station: 'dien-phan-cuso4',
    name: 'Nguồn điện một chiều DC',
    kind: 'Cung cấp dòng điện I ổn định',
    anchorOffset: { x: 0.72, y: 1.2, z: -0.18 },
    cameraOffset: { x: 0.85, y: 1.56, z: 1.48 },
    targetOffset: { x: 0.68, y: 1.14, z: -0.18 },
    defaultDescription:
      'Bơm electron ra cực âm nối với Cathode (−) và rút electron từ Anode (+) nối cực dương. Cường độ dòng I quyết định trực tiếp tốc độ điện phân theo định luật Faraday.',
  },
  'cuso4-cathode': {
    id: 'cuso4-cathode',
    station: 'dien-phan-cuso4',
    name: 'Cathode (−)',
    kind: 'Cực âm · Quá trình khử',
    anchorOffset: { x: -0.54, y: 1.38, z: 0.08 },
    cameraOffset: { x: -1.08, y: 1.66, z: 1.42 },
    targetOffset: { x: -0.52, y: 1.26, z: 0.08 },
    defaultDescription:
      'Nối với cực âm nguồn DC. Ion Cu²⁺ nhận 2e⁻ tạo lớp đồng đỏ bám dày dần lên bề mặt; với điện cực trơ sau mốc hết Cu²⁺, nước/H⁺ bị khử sinh bọt khí H₂.',
  },
  'cuso4-anode': {
    id: 'cuso4-anode',
    station: 'dien-phan-cuso4',
    name: 'Anode (+)',
    kind: 'Cực dương · Quá trình oxi hóa',
    anchorOffset: { x: 0.04, y: 1.38, z: 0.08 },
    cameraOffset: { x: 0.42, y: 1.66, z: 1.44 },
    targetOffset: { x: 0.02, y: 1.26, z: 0.08 },
    defaultDescription:
      'Nối với cực dương nguồn DC. Nếu là điện cực trơ: 2H₂O → O₂↑ + 4H⁺ + 4e⁻ (thoát khí O₂). Nếu là anode đồng: Cu → Cu²⁺ + 2e⁻ (đồng tan vào dung dịch, không có khí O₂).',
  },
  'cuso4-solution': {
    id: 'cuso4-solution',
    station: 'dien-phan-cuso4',
    name: 'Dung dịch CuSO₄',
    kind: 'Chất điện li chứa Cu²⁺, SO₄²⁻',
    anchorOffset: { x: -0.25, y: 1.12, z: 0.14 },
    cameraOffset: { x: -0.25, y: 1.54, z: 1.62 },
    targetOffset: { x: -0.25, y: 1.14, z: 0.08 },
    defaultDescription:
      'Với điện cực trơ, màu xanh lam của Cu²⁺ nhạt dần rồi mất hẳn tại mốc hết Cu²⁺ và dung dịch trở nên có tính axit (H₂SO₄). Với anode đồng, nồng độ Cu²⁺ và màu xanh giữ không đổi.',
  },
  'cuso4-wire': {
    id: 'cuso4-wire',
    station: 'dien-phan-cuso4',
    name: 'Dây nối mạch điện phân',
    kind: 'Chiều electron ngoài bình',
    anchorOffset: { x: 0.28, y: 1.66, z: -0.05 },
    cameraOffset: { x: 0.25, y: 1.98, z: 1.9 },
    targetOffset: { x: 0.15, y: 1.52, z: -0.05 },
    defaultDescription:
      'Electron đi ra từ Anode (+) qua nguồn một chiều DC về Cathode (−). Tốc độ dòng electron tỉ lệ trực tiếp với cường độ dòng điện I.',
  },

  // === STATION 3: ĐIỆN PHÂN NaCl ===
  'nacl-cell': {
    id: 'nacl-cell',
    station: 'dien-phan-nacl',
    name: 'Bình điện phân NaCl',
    kind: 'Bình hai ngăn / Nóng chảy',
    anchorOffset: { x: 0.22, y: 1.24, z: 0.08 },
    cameraOffset: { x: 0.2, y: 1.82, z: 1.96 },
    targetOffset: { x: 0.22, y: 1.24, z: 0.06 },
    defaultDescription:
      'Cấu tạo thay đổi rõ rệt theo biến thể: bình nung nóng chảy không có nước (thu Na + Cl₂) hoặc bể hai ngăn có màng trao đổi cation (thu H₂ + Cl₂ + NaOH).',
  },
  'nacl-power': {
    id: 'nacl-power',
    station: 'dien-phan-nacl',
    name: 'Nguồn điện một chiều DC',
    kind: 'Nguồn cung cấp dòng điện phân',
    anchorOffset: { x: -0.78, y: 1.18, z: -0.14 },
    cameraOffset: { x: -0.95, y: 1.56, z: 1.48 },
    targetOffset: { x: -0.76, y: 1.14, z: -0.14 },
    defaultDescription:
      'Cấp dòng điện một chiều ổn định cưỡng bức phản ứng oxi hóa – khử không tự diễn biến. Ghi chú an toàn: Cl₂ là khí độc, mô phỏng chỉ dùng cho học tập.',
  },
  'nacl-anode': {
    id: 'nacl-anode',
    station: 'dien-phan-nacl',
    name: 'Anode (+) · Ngăn sinh khí Cl₂',
    kind: 'Cực dương · Oxi hóa Cl⁻',
    anchorOffset: { x: -0.08, y: 1.4, z: 0.08 },
    cameraOffset: { x: -0.45, y: 1.66, z: 1.46 },
    targetOffset: { x: -0.08, y: 1.28, z: 0.08 },
    defaultDescription:
      'Ở cả hai biến thể (nóng chảy và dung dịch), ion Cl⁻ đều bị oxi hóa tại anode (+): 2Cl⁻ → Cl₂↑ + 2e⁻, giải phóng bọt khí Cl₂ màu vàng lục.',
  },
  'nacl-cathode': {
    id: 'nacl-cathode',
    station: 'dien-phan-nacl',
    name: 'Cathode (−)',
    kind: 'Cực âm · Khử Na⁺ hoặc H₂O',
    anchorOffset: { x: 0.54, y: 1.4, z: 0.08 },
    cameraOffset: { x: 1.02, y: 1.66, z: 1.46 },
    targetOffset: { x: 0.52, y: 1.28, z: 0.08 },
    defaultDescription:
      'Trong NaCl nóng chảy (không có H₂O): Na⁺ + e⁻ → Na. Trong dung dịch NaCl bão hòa: H₂O dễ bị khử hơn Na⁺ nên tạo khí H₂ và OH⁻ (NaOH): 2H₂O + 2e⁻ → H₂↑ + 2OH⁻.',
  },
  'nacl-membrane': {
    id: 'nacl-membrane',
    station: 'dien-phan-nacl',
    name: 'Màng trao đổi cation',
    kind: 'Ngăn tách Cl₂ và NaOH',
    anchorOffset: { x: 0.23, y: 1.28, z: 0.14 },
    cameraOffset: { x: 0.22, y: 1.64, z: 1.54 },
    targetOffset: { x: 0.23, y: 1.24, z: 0.08 },
    defaultDescription:
      'Chỉ cho phép cation Na⁺ đi từ ngăn anode sang ngăn cathode để tạo NaOH tinh khiết, đồng thời ngăn khí Cl₂ trộn lẫn với H₂ và ngăn Cl₂ phản ứng với OH⁻ tạo nước Javen.',
  },
  'nacl-electrolyte': {
    id: 'nacl-electrolyte',
    station: 'dien-phan-nacl',
    name: 'Chất điện li NaCl',
    kind: 'Muối nóng chảy / Dung dịch bão hòa',
    anchorOffset: { x: 0.23, y: 1.08, z: 0.18 },
    cameraOffset: { x: 0.23, y: 1.54, z: 1.66 },
    targetOffset: { x: 0.23, y: 1.12, z: 0.08 },
    defaultDescription:
      'Chất điện li quyết định bản chất quá trình ở cathode (−): không có nước thì khử trực tiếp Na⁺ thành kim loại Na; có nước thì khử H₂O sinh khí H₂ và dung dịch kiềm NaOH.',
  },
};

export function getObjectsForStation(
  station: LabExperimentId,
  naclVariant: 'nacl-molten' | 'nacl-brine' = 'nacl-brine'
): LabObjectMeta[] {
  return Object.values(LAB_OBJECTS).filter((obj) => {
    if (obj.station !== station) return false;
    if (obj.id === 'nacl-membrane' && naclVariant === 'nacl-molten') return false;
    return true;
  });
}

export function getWorldAnchorForObject(objectId: LabObjectId): Vec3Tuple {
  const obj = LAB_OBJECTS[objectId];
  const base = TABLE_POSITIONS[obj.station];
  return {
    x: base.x + obj.anchorOffset.x,
    y: base.y + obj.anchorOffset.y,
    z: base.z + obj.anchorOffset.z,
  };
}

/**
 * Computes responsive camera preset for any of the 4 camera levels
 * (OVERVIEW, TABLE, OBJECT, REACTION). Adapts framing distance cleanly
 * for narrow mobile viewports (e.g., 390px) so all 3 tables remain visible in OVERVIEW.
 */
export function getCameraPreset(
  level: CameraLevel,
  station: LabExperimentId | null,
  objectId: LabObjectId | null,
  aspect: number
): CameraPreset {
  const safeAspect = Number.isFinite(aspect) && aspect > 0.25 ? aspect : 16 / 9;

  if (level === 'OVERVIEW' || !station) {
    // Fit full 3-table span (~10.5m) inside horizontal FOV for both desktop & narrow 390px portrait screens
    const halfVRad = (21 * Math.PI) / 180;
    const tanHalfH = Math.max(0.24, Math.tan(halfVRad) * safeAspect);
    const requiredZ = 5.45 / tanHalfH;
    const zDist = Math.max(7.9, Math.min(16.2, requiredZ * 0.94));
    const yHeight = safeAspect < 1 ? 4.95 + (zDist - 8.0) * 0.32 : 5.25;
    return {
      position: { x: 0, y: yHeight, z: zDist },
      target: { x: 0, y: 1.15, z: -0.25 },
      minDistance: 4.5,
      maxDistance: Math.max(16, zDist * 1.45),
    };
  }

  const base = TABLE_POSITIONS[station];
  const mobilePullback = safeAspect < 0.95 ? 1.28 : 1;

  if (level === 'TABLE') {
    return {
      position: {
        x: base.x + 0.12,
        y: 2.38 + (mobilePullback - 1) * 0.45,
        z: base.z + 2.75 * mobilePullback,
      },
      target: { x: base.x, y: 1.26, z: base.z - 0.04 },
      minDistance: 1.1,
      maxDistance: 6.5,
    };
  }

  if (level === 'REACTION') {
    // Low eye-level workbench view directly observing electrodes, wires, bubbles & ion paths
    return {
      position: {
        x: base.x,
        y: 1.42,
        z: base.z + 1.88 * mobilePullback,
      },
      target: { x: base.x, y: 1.32, z: base.z + 0.02 },
      minDistance: 0.9,
      maxDistance: 4.8,
    };
  }

  // OBJECT view
  const resolvedObjectId: LabObjectId =
    objectId && LAB_OBJECTS[objectId]?.station === station
      ? objectId
      : getObjectsForStation(station)[0].id;
  const meta = LAB_OBJECTS[resolvedObjectId];
  return {
    position: {
      x: base.x + meta.cameraOffset.x * mobilePullback,
      y: meta.cameraOffset.y,
      z: base.z + meta.cameraOffset.z * mobilePullback,
    },
    target: {
      x: base.x + meta.targetOffset.x,
      y: meta.targetOffset.y,
      z: base.z + meta.targetOffset.z,
    },
    minDistance: 0.7,
    maxDistance: 4.5,
  };
}

export function easeInOutCubic(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function interpolateVec3(a: Vec3Tuple, b: Vec3Tuple, alpha: number): Vec3Tuple {
  return {
    x: a.x + (b.x - a.x) * alpha,
    y: a.y + (b.y - a.y) * alpha,
    z: a.z + (b.z - a.z) * alpha,
  };
}

// === Deterministic 3D Visual State Adapter (Single Source of Truth -> 3D Scene) ===

export interface Lab3DVisuals {
  // Station 1: Pin Zn-Cu
  znCu: {
    circuitClosed: boolean;
    switchLeverAngleRad: number; // 0 = closed flat, 0.58 rad = open raised
    voltmeterText: string;
    electronPhase: number; // deterministic 0..1 based on sim time
    electronsActive: boolean;
    ionsActive: boolean;
    znThinScale: number; // 1.0 -> 0.78 as Zn dissolves
    cuPlatingScale: number; // 0 -> 1.0 as Cu deposits
    cuSolutionBlueRatio: number; // 1.0 -> 0.42
    showConventionalCurrent: boolean;
  };
  // Station 2: CuSO4 Electrolysis
  cuso4: {
    variant: 'cuso4-inert' | 'cuso4-copper';
    powerVoltageText: string;
    powerCurrentText: string;
    timeSeconds: number;
    electronPhase: number;
    electronSpeedMultiplier: number;
    wireParticleCount: number;
    electronsActive: boolean;
    cathodeCuThickness: number; // 0..1 (plateaus strictly after depletion in cuso4-inert!)
    anodeCuRemainingRatio: number; // 1..0.35 in cuso4-copper
    solutionBlueRatio: number; // 1..0.08 in cuso4-inert; constant 1.0 in cuso4-copper
    o2BubbleIntensity: number; // 0..1 (0 in cuso4-copper)
    h2BubbleIntensity: number; // 0..1 (strictly > 0 ONLY in stage 2 after Cu2+ depletion!)
    reachedDepletion: boolean;
    inStage2: boolean;
  };
  // Station 3: NaCl Electrolysis
  nacl: {
    variant: 'nacl-molten' | 'nacl-brine';
    powerVoltageText: string;
    powerCurrentText: string;
    timeSeconds: number;
    electronPhase: number;
    electronSpeedMultiplier: number;
    wireParticleCount: number;
    electronsActive: boolean;
    showMembrane: boolean;
    cl2BubbleIntensity: number; // anode (+) in both variants
    h2BubbleIntensity: number; // cathode (-) ONLY in nacl-brine
    moltenNaDepositRatio: number; // cathode (-) ONLY in nacl-molten
    naIonMembraneActive: boolean; // ONLY in nacl-brine when t > 0
  };
}

export function computeLab3DVisuals(args: {
  galvanic: GalvanicCellSnapshot;
  cuso4Variant: 'cuso4-inert' | 'cuso4-copper';
  cuso4Params: ElectrolysisParams;
  cuso4Snapshot: ElectrolysisSnapshot;
  naclVariant: 'nacl-molten' | 'nacl-brine';
  naclParams: ElectrolysisParams;
  naclSnapshot: ElectrolysisSnapshot;
  activeStation: LabExperimentId | null;
  isRunning: boolean;
  playbackSpeed: number;
}): Lab3DVisuals {
  const {
    galvanic,
    cuso4Variant,
    cuso4Params,
    cuso4Snapshot,
    naclVariant,
    naclParams,
    naclSnapshot,
    activeStation,
    isRunning,
    playbackSpeed,
  } = args;

  // Deterministic phases driven directly by simulation time (so pause/scrub/step are 100% reproducible!)
  const znElectronsActive = galvanic.circuitClosed && (galvanic.timeSeconds > 0 || (activeStation === 'pin-zn-cu' && isRunning));
  const znPhase = (galvanic.timeSeconds * 0.22) % 1;

  const cuso4Profile = computeElectronMotionProfile(cuso4Params.currentA, playbackSpeed);
  const cuso4Active = cuso4Snapshot.timeSeconds > 0 || (activeStation === 'dien-phan-cuso4' && isRunning);
  const cuso4Phase = ((cuso4Snapshot.timeSeconds / 180) * cuso4Profile.currentFactor) % 1;

  const cuso4DepTime = getDepletionTimeSeconds(cuso4Params);
  const cuso4MaxCuMol =
    cuso4Variant === 'cuso4-inert'
      ? Math.max(cuso4Params.initialCu2Mol, 0.001)
      : Math.max((cuso4Params.currentA * cuso4Params.totalTimeSeconds) / (2 * 96500), 0.005);
  const cathodeCuThickness = Math.max(0, Math.min(1, cuso4Snapshot.cuPlatedMol / cuso4MaxCuMol));
  const anodeCuRemainingRatio =
    cuso4Variant === 'cuso4-copper' && cuso4Params.anodeCuInitialG > 0
      ? Math.max(0.35, cuso4Snapshot.anodeCuRemainingG / cuso4Params.anodeCuInitialG)
      : 1;

  const cuso4O2Active = cuso4Variant === 'cuso4-inert' && cuso4Snapshot.timeSeconds > 0;
  const cuso4H2Active = cuso4Variant === 'cuso4-inert' && cuso4Snapshot.stage === 2;

  const naclProfile = computeElectronMotionProfile(naclParams.currentA, playbackSpeed);
  const naclActive = naclSnapshot.timeSeconds > 0 || (activeStation === 'dien-phan-nacl' && isRunning);
  const naclPhase = ((naclSnapshot.timeSeconds / 160) * naclProfile.currentFactor) % 1;

  const moltenNaDepositRatio =
    naclVariant === 'nacl-molten'
      ? Math.max(0, Math.min(1, naclSnapshot.progressRatio))
      : 0;

  return {
    znCu: {
      circuitClosed: galvanic.circuitClosed,
      switchLeverAngleRad: galvanic.circuitClosed ? 0.02 : 0.56,
      voltmeterText: `${formatViNumber(galvanic.terminalVoltageV, { minDecimals: 3, maxDecimals: 3 })} V`,
      electronPhase: znPhase,
      electronsActive: znElectronsActive,
      ionsActive: znElectronsActive,
      znThinScale: Math.max(0.76, 1 - galvanic.progress * 0.24),
      cuPlatingScale: galvanic.progress,
      cuSolutionBlueRatio: galvanic.cu2ColorIntensity,
      showConventionalCurrent: false,
    },
    cuso4: {
      variant: cuso4Variant,
      powerVoltageText: cuso4Variant === 'cuso4-inert' ? '6,00 V' : '2,40 V',
      powerCurrentText: `${formatViNumber(cuso4Params.currentA, { maxDecimals: 1 })} A`,
      timeSeconds: cuso4Snapshot.timeSeconds,
      electronPhase: cuso4Phase,
      electronSpeedMultiplier: cuso4Profile.currentFactor,
      wireParticleCount: cuso4Profile.wireParticleCount,
      electronsActive: cuso4Active,
      cathodeCuThickness,
      anodeCuRemainingRatio,
      solutionBlueRatio: cuso4Variant === 'cuso4-inert' ? Math.max(0.06, cuso4Snapshot.cu2Ratio) : 1,
      o2BubbleIntensity: cuso4O2Active ? Math.min(1, 0.45 + 0.55 * Math.min(1, cuso4Params.currentA / 4)) : 0,
      h2BubbleIntensity: cuso4H2Active ? Math.min(1, 0.55 + 0.45 * Math.min(1, cuso4Params.currentA / 4)) : 0,
      reachedDepletion:
        cuso4Variant === 'cuso4-inert' &&
        cuso4DepTime !== null &&
        cuso4Snapshot.timeSeconds >= cuso4DepTime - 1e-6,
      inStage2: cuso4H2Active,
    },
    nacl: {
      variant: naclVariant,
      powerVoltageText: naclVariant === 'nacl-molten' ? '7,50 V' : '4,50 V',
      powerCurrentText: `${formatViNumber(naclParams.currentA, { maxDecimals: 1 })} A`,
      timeSeconds: naclSnapshot.timeSeconds,
      electronPhase: naclPhase,
      electronSpeedMultiplier: naclProfile.currentFactor,
      wireParticleCount: naclProfile.wireParticleCount,
      electronsActive: naclActive,
      showMembrane: naclVariant === 'nacl-brine',
      cl2BubbleIntensity: naclActive ? Math.min(1, 0.5 + 0.5 * Math.min(1, naclParams.currentA / 4)) : 0,
      h2BubbleIntensity:
        naclVariant === 'nacl-brine' && naclActive
          ? Math.min(1, 0.5 + 0.5 * Math.min(1, naclParams.currentA / 4))
          : 0,
      moltenNaDepositRatio,
      naIonMembraneActive: naclVariant === 'nacl-brine' && naclActive,
    },
  };
}

// === Smart Anchored HTML Popup Placement (with hysteresis + viewport clamping) ===

export interface SmartPopupLayout {
  visible: boolean;
  mode: 'anchored' | 'bottom-sheet';
  side: 'left' | 'right';
  left: number;
  top: number;
  anchorX: number;
  anchorY: number;
  connectX: number;
  connectY: number;
}

export function computeSmartPopupLayout(args: {
  anchorX: number;
  anchorY: number;
  inFrontOfCamera: boolean;
  occluded: boolean;
  viewportWidth: number;
  viewportHeight: number;
  popupWidth: number;
  popupHeight: number;
  previousSide: 'left' | 'right' | null;
}): SmartPopupLayout {
  const {
    anchorX,
    anchorY,
    inFrontOfCamera,
    occluded,
    viewportWidth,
    viewportHeight,
    popupWidth,
    popupHeight,
    previousSide,
  } = args;

  // On mobile viewports (< 640px), always use ergonomic bottom sheet without occluding the 3D scene
  if (viewportWidth < 640) {
    return {
      visible: true,
      mode: 'bottom-sheet',
      side: 'right',
      left: 0,
      top: Math.max(0, viewportHeight - popupHeight),
      anchorX,
      anchorY,
      connectX: anchorX,
      connectY: anchorY,
    };
  }

  const margin = 18;
  const topSafe = 32;
  const bottomSafe = 36;
  const horizontalGap = 52;

  const outOfFrustum =
    !inFrontOfCamera ||
    anchorX < -40 ||
    anchorX > viewportWidth + 40 ||
    anchorY < -40 ||
    anchorY > viewportHeight + 40;

  if (outOfFrustum || occluded) {
    return {
      visible: false,
      mode: 'anchored',
      side: previousSide ?? 'right',
      left: margin,
      top: topSafe,
      anchorX,
      anchorY,
      connectX: anchorX,
      connectY: anchorY,
    };
  }

  const spaceRight = viewportWidth - (anchorX + horizontalGap + margin);
  const spaceLeft = anchorX - horizontalGap - margin;

  // Hysteresis band (±36px) to prevent rapid left-right jumping during gentle orbit
  const hysteresis = 36;
  const flipThreshold = viewportWidth * 0.66;
  let side: 'left' | 'right';
  if (previousSide === 'left') {
    if (spaceLeft >= popupWidth * 0.72 && anchorX > flipThreshold - hysteresis) {
      side = 'left';
    } else if (spaceRight >= popupWidth * 0.75) {
      side = 'right';
    } else {
      side = spaceLeft >= spaceRight ? 'left' : 'right';
    }
  } else if (previousSide === 'right') {
    if (spaceRight >= popupWidth * 0.72 && anchorX < flipThreshold + hysteresis) {
      side = 'right';
    } else if (spaceLeft >= popupWidth * 0.75) {
      side = 'left';
    } else {
      side = spaceRight >= spaceLeft ? 'right' : 'left';
    }
  } else {
    // Keep centered 3D apparatus clear by docking to outer right rail unless anchor is far right
    if (anchorX > flipThreshold && spaceLeft >= popupWidth * 0.8) {
      side = 'left';
    } else if (spaceRight >= popupWidth * 0.65) {
      side = 'right';
    } else {
      side = spaceLeft > spaceRight ? 'left' : 'right';
    }
  }

  // Dock cleanly to outer viewport rail so central beakers/electrodes stay completely unobstructed
  let left =
    side === 'right'
      ? Math.max(anchorX + horizontalGap, viewportWidth - popupWidth - 22)
      : Math.min(anchorX - horizontalGap - popupWidth, 22);

  left = Math.max(margin, Math.min(left, viewportWidth - popupWidth - margin));

  const maxTop = Math.max(topSafe, viewportHeight - popupHeight - bottomSafe);
  const top = Math.max(topSafe, Math.min(anchorY - popupHeight * 0.44, maxTop));

  const connectX = side === 'right' ? left : left + popupWidth;
  const connectY = Math.max(top + 28, Math.min(anchorY, top + popupHeight - 28));

  return {
    visible: true,
    mode: 'anchored',
    side,
    left,
    top,
    anchorX,
    anchorY,
    connectX,
    connectY,
  };
}

// === 10-Step Guided Exploration Frames per Experiment & Variant (50 distinct steps total) ===

export type LabGuideKey =
  | 'pin-zn-cu'
  | 'cuso4-inert'
  | 'cuso4-copper'
  | 'nacl-molten'
  | 'nacl-brine';

export interface LabGuidedStep {
  stepNumber: number; // 1..10
  title: string;
  description: string;
  formula: string;
  cameraLevel: CameraLevel;
  focusObject: LabObjectId | null;
  /** For Pin Zn-Cu: timeSeconds 0..60 & circuitClosed; for electrolysis: ratio 0..1 or 'depletion' */
  pinTimeSeconds?: number;
  pinCircuitClosed?: boolean;
  timeFraction?: number; // 0..1 along totalTimeSeconds
  useDepletionTime?: boolean;
  accentTag: string;
}

export const LAB_STEP_GUIDES: Record<LabGuideKey, LabGuidedStep[]> = {
  'pin-zn-cu': [
    {
      stepNumber: 1,
      title: 'Toàn cảnh bộ pin Zn–Cu',
      description: 'Quan sát cấu tạo đầy đủ hai bán pin đặt cạnh nhau trên bàn thí nghiệm 01.',
      formula: 'Zn(s) | Zn²⁺(1 M) || Cu²⁺(1 M) | Cu(s)',
      cameraLevel: 'TABLE',
      focusObject: null,
      pinTimeSeconds: 0,
      pinCircuitClosed: false,
      accentTag: 'Cấu tạo',
    },
    {
      stepNumber: 2,
      title: 'Xác định hai điện cực Zn và Cu',
      description: 'Thanh Zn (xám kim loại) là cực âm Anode; thanh Cu (đồng đỏ) là cực dương Cathode.',
      formula: 'E°(Zn²⁺/Zn) = −0,763 V < E°(Cu²⁺/Cu) = +0,340 V',
      cameraLevel: 'OBJECT',
      focusObject: 'zn-cu-electrode-zn',
      pinTimeSeconds: 0,
      pinCircuitClosed: false,
      accentTag: 'Điện cực',
    },
    {
      stepNumber: 3,
      title: 'Quan sát hai dung dịch điện li',
      description: 'Cốc trái chứa ZnSO₄ 1 M trong suốt; cốc phải chứa CuSO₄ 1 M màu xanh lam đặc trưng của Cu²⁺.',
      formula: 'ZnSO₄ (1 M) · CuSO₄ (1 M) · 25 °C',
      cameraLevel: 'OBJECT',
      focusObject: 'zn-cu-beaker-cu',
      pinTimeSeconds: 0,
      pinCircuitClosed: false,
      accentTag: 'Dung dịch',
    },
    {
      stepNumber: 4,
      title: 'Cầu muối KNO₃ nối hai ngăn',
      description: 'Ống thủy tinh chữ U chứa gel KNO₃ giúp khép kín mạch ion mà không trộn trực tiếp hai dung dịch.',
      formula: 'NO₃⁻ → cốc Zn · K⁺ → cốc Cu',
      cameraLevel: 'OBJECT',
      focusObject: 'zn-cu-salt-bridge',
      pinTimeSeconds: 0,
      pinCircuitClosed: false,
      accentTag: 'Cầu muối',
    },
    {
      stepNumber: 5,
      title: 'Mạch mở và sức điện động chuẩn',
      description: 'Khi khóa K đang mở, chưa có dòng electron chạy qua tải; vôn kế đo đúng E°pin = 1,103 V.',
      formula: 'E°pin = 0,340 − (−0,763) = 1,103 V (I = 0)',
      cameraLevel: 'OBJECT',
      focusObject: 'zn-cu-voltmeter',
      pinTimeSeconds: 0,
      pinCircuitClosed: false,
      accentTag: 'Hở mạch',
    },
    {
      stepNumber: 6,
      title: 'Đóng công tắc (Khóa K)',
      description: 'Hạ cần công tắc đồng xuống ngàm tiếp điểm: mạch kín, điện áp trên tải 100 Ω còn khoảng 1,081 V.',
      formula: 'U = E°pin · R / (R + r) ≈ 1,081 V',
      cameraLevel: 'OBJECT',
      focusObject: 'zn-cu-switch',
      pinTimeSeconds: 8,
      pinCircuitClosed: true,
      accentTag: 'Đóng mạch',
    },
    {
      stepNumber: 7,
      title: 'Chiều chuyển động electron mạch ngoài',
      description: 'Electron tách từ thanh Zn chạy liên tục theo dây dẫn ngoài sang thanh Cu (ngược chiều dòng quy ước I).',
      formula: 'e⁻ : Anode (−) Zn → dây ngoài → Cathode (+) Cu',
      cameraLevel: 'OBJECT',
      focusObject: 'zn-cu-wire',
      pinTimeSeconds: 20,
      pinCircuitClosed: true,
      accentTag: 'Dòng e⁻',
    },
    {
      stepNumber: 8,
      title: 'Quá trình oxi hóa tại thanh Zn',
      description: 'Nguyên tử Zn nhường 2e⁻ tan vào dung dịch dưới dạng Zn²⁺ khiến thanh kẽm mòn dần theo thời gian.',
      formula: 'Anode (−): Zn → Zn²⁺ + 2e⁻',
      cameraLevel: 'OBJECT',
      focusObject: 'zn-cu-electrode-zn',
      pinTimeSeconds: 34,
      pinCircuitClosed: true,
      accentTag: 'Oxi hóa',
    },
    {
      stepNumber: 9,
      title: 'Khử Cu²⁺ tại thanh Cu & dịch chuyển ion',
      description: 'Ion Cu²⁺ nhận 2e⁻ bám đồng đỏ lên thanh Cu; K⁺ sang ngăn Cu và NO₃⁻ sang ngăn Zn giữ cân bằng điện tích.',
      formula: 'Cathode (+): Cu²⁺ + 2e⁻ → Cu↓',
      cameraLevel: 'OBJECT',
      focusObject: 'zn-cu-electrode-cu',
      pinTimeSeconds: 48,
      pinCircuitClosed: true,
      accentTag: 'Khử & Ion',
    },
    {
      stepNumber: 10,
      title: 'Tổng hợp phản ứng pin Galvani Zn–Cu',
      description: 'Góc nhìn phản ứng toàn diện: Zn mòn, Cu dày thêm, màu xanh CuSO₄ nhạt dần, phản ứng tự diễn biến sinh điện.',
      formula: 'Zn + Cu²⁺ → Zn²⁺ + Cu (E°pin = 1,103 V)',
      cameraLevel: 'REACTION',
      focusObject: null,
      pinTimeSeconds: 60,
      pinCircuitClosed: true,
      accentTag: 'Tổng kết',
    },
  ],

  'cuso4-inert': [
    {
      stepNumber: 1,
      title: 'Nhận diện bình điện phân CuSO₄ điện cực trơ',
      description: 'Hai thanh than chì trơ nhúng trong dung dịch CuSO₄ màu xanh lam, nối với nguồn điện một chiều DC.',
      formula: 'CuSO₄ (aq) · Điện cực trơ (Graphite / Pt)',
      cameraLevel: 'TABLE',
      focusObject: null,
      timeFraction: 0,
      accentTag: 'Hệ thống',
    },
    {
      stepNumber: 2,
      title: 'Đổi dấu cực so với Pin Galvani',
      description: 'Nguồn DC ép cực nối dương là Anode (+) (oxi hóa), cực nối âm là Cathode (−) (khử).',
      formula: 'Nguồn DC (+) → Anode (+) · Nguồn DC (−) → Cathode (−)',
      cameraLevel: 'OBJECT',
      focusObject: 'cuso4-power',
      timeFraction: 0,
      accentTag: 'Nguồn DC',
    },
    {
      stepNumber: 3,
      title: 'Bắt đầu đóng dòng điện phân',
      description: 'Electron đi từ Anode (+) qua nguồn DC sang Cathode (−) với tốc độ tỉ lệ theo cường độ I.',
      formula: 'Q = I · t · nₑ = Q / 96 500',
      cameraLevel: 'OBJECT',
      focusObject: 'cuso4-wire',
      timeFraction: 0.12,
      accentTag: 'Đóng dòng',
    },
    {
      stepNumber: 4,
      title: 'Giai đoạn 1 · Đồng bắt đầu bám ở Cathode (−)',
      description: 'Cu²⁺ có tính oxi hóa mạnh hơn H₂O nên bị khử trước, phủ lớp đồng đỏ lên thanh cực âm.',
      formula: 'Cathode (−): Cu²⁺ + 2e⁻ → Cu↓',
      cameraLevel: 'OBJECT',
      focusObject: 'cuso4-cathode',
      timeFraction: 0.24,
      accentTag: 'Bám đồng',
    },
    {
      stepNumber: 5,
      title: 'Giai đoạn 1 · Khí O₂ thoát ra ở Anode (+)',
      description: 'Anion SO₄²⁻ không bị oxi hóa trong nước; nước bị oxi hóa tại anode trơ giải phóng bọt khí O₂ và ion H⁺.',
      formula: 'Anode (+): 2H₂O → O₂↑ + 4H⁺ + 4e⁻',
      cameraLevel: 'OBJECT',
      focusObject: 'cuso4-anode',
      timeFraction: 0.35,
      accentTag: 'Sinh O₂',
    },
    {
      stepNumber: 6,
      title: 'Màu xanh dung dịch nhạt dần',
      description: 'Khi Cu²⁺ giảm dần theo số mol electron trao đổi, dung dịch nhạt màu xanh và pH giảm do H₂SO₄ tạo thành.',
      formula: '2CuSO₄ + 2H₂O → 2Cu↓ + O₂↑ + 2H₂SO₄',
      cameraLevel: 'OBJECT',
      focusObject: 'cuso4-solution',
      timeFraction: 0.44,
      accentTag: 'Nồng độ',
    },
    {
      stepNumber: 7,
      title: 'Chạm mốc Cu²⁺ vừa hết hoàn toàn',
      description: 'Tại nₑ = 2·n(Cu²⁺ ban đầu), lượng Cu bám đạt cực đại và dung dịch mất hẳn màu xanh lam.',
      formula: 't(hết Cu²⁺) = 2 · n(Cu²⁺) · F / I',
      cameraLevel: 'REACTION',
      focusObject: null,
      useDepletionTime: true,
      accentTag: 'Mốc cạn Cu²⁺',
    },
    {
      stepNumber: 8,
      title: 'Giai đoạn 2 · Cathode chuyển sang sinh khí H₂',
      description: 'Vượt qua mốc cạn Cu²⁺, khối lượng đồng đi ngang; ở cathode (−) bắt đầu xuất hiện bọt khí H₂.',
      formula: 'Cathode (−): 2H⁺ + 2e⁻ → H₂↑',
      cameraLevel: 'OBJECT',
      focusObject: 'cuso4-cathode',
      timeFraction: 0.72,
      accentTag: 'Sinh H₂',
    },
    {
      stepNumber: 9,
      title: 'Điện phân nước ở cả hai điện cực',
      description: 'Lúc này H₂ thoát ở cathode (−) và O₂ tiếp tục thoát ở anode (+) theo tỉ lệ mol 2 : 1.',
      formula: '2H₂O —(đp)→ 2H₂↑ + O₂↑',
      cameraLevel: 'REACTION',
      focusObject: null,
      timeFraction: 0.88,
      accentTag: 'Giai đoạn 2',
    },
    {
      stepNumber: 10,
      title: 'Tổng kết Faraday hai giai đoạn',
      description: 'Đồ thị m(Cu) tăng tuyến tính rồi nằm ngang sau mốc hết Cu²⁺, trong khi khí O₂ tăng liên tục còn H₂ chỉ xuất hiện ở giai đoạn 2.',
      formula: 'n(Cu) = n(Cu²⁺ bđ) · n(O₂) = nₑ/4 · n(H₂) = (nₑ − 2nCu²⁺)/2',
      cameraLevel: 'TABLE',
      focusObject: null,
      timeFraction: 1,
      accentTag: 'Tổng kết',
    },
  ],

  'cuso4-copper': [
    {
      stepNumber: 1,
      title: 'Cấu tạo bình điện phân anode đồng (anode tan)',
      description: 'Anode (+) được làm trực tiếp từ tấm đồng kim loại; dung dịch là CuSO₄ màu xanh lam.',
      formula: 'Anode (+): Cu · Cathode (−): Cu · Dung dịch CuSO₄',
      cameraLevel: 'TABLE',
      focusObject: null,
      timeFraction: 0,
      accentTag: 'Cấu tạo',
    },
    {
      stepNumber: 2,
      title: 'Vai trò nguồn DC trong mạ và tinh luyện đồng',
      description: 'Nguồn DC áp thấp hơn so với điện cực trơ vì không cần phân hủy nước ở cực dương.',
      formula: 'I ổn định → tốc độ mạ đồng đồng đều',
      cameraLevel: 'OBJECT',
      focusObject: 'cuso4-power',
      timeFraction: 0,
      accentTag: 'Nguồn DC',
    },
    {
      stepNumber: 3,
      title: 'Đóng mạch · Dòng electron qua dây dẫn',
      description: 'Electron rút ra khỏi tấm Cu ở anode (+) chạy qua nguồn DC về cathode (−).',
      formula: 'e⁻ : Anode (+) Cu → nguồn DC → Cathode (−)',
      cameraLevel: 'OBJECT',
      focusObject: 'cuso4-wire',
      timeFraction: 0.14,
      accentTag: 'Dòng e⁻',
    },
    {
      stepNumber: 4,
      title: 'Anode đồng bị oxi hóa (hiện tượng dương cực tan)',
      description: 'Đồng kim loại dễ bị oxi hóa hơn H₂O nên tan dần vào dung dịch thành ion Cu²⁺, không có khí O₂.',
      formula: 'Anode (+): Cu → Cu²⁺ + 2e⁻',
      cameraLevel: 'OBJECT',
      focusObject: 'cuso4-anode',
      timeFraction: 0.28,
      accentTag: 'Anode tan',
    },
    {
      stepNumber: 5,
      title: 'Cathode (−) nhận lớp đồng đỏ tinh khiết',
      description: 'Ion Cu²⁺ trong dung dịch nhận 2e⁻ ở cathode tạo lớp đồng mới phủ đều bề mặt.',
      formula: 'Cathode (−): Cu²⁺ + 2e⁻ → Cu↓',
      cameraLevel: 'OBJECT',
      focusObject: 'cuso4-cathode',
      timeFraction: 0.42,
      accentTag: 'Mạ đồng',
    },
    {
      stepNumber: 6,
      title: 'Nồng độ Cu²⁺ và màu xanh dung dịch không đổi',
      description: 'Mỗi mol Cu²⁺ bị khử ở cathode được bù đúng 1 mol Cu²⁺ tan ra từ anode nên màu xanh giữ nguyên.',
      formula: '[Cu²⁺] = hằng số · Không sinh khí O₂ hay H₂',
      cameraLevel: 'OBJECT',
      focusObject: 'cuso4-solution',
      timeFraction: 0.56,
      accentTag: 'Cân bằng Cu²⁺',
    },
    {
      stepNumber: 7,
      title: 'Quan sát trực tiếp độ dày hai điện cực',
      description: 'Góc cận cảnh phản ứng cho thấy tấm anode đồng mảnh dần rõ rệt trong khi cathode dày lên tương ứng.',
      formula: 'Δm(cathode tăng) = Δm(anode giảm)',
      cameraLevel: 'REACTION',
      focusObject: null,
      timeFraction: 0.7,
      accentTag: 'Đối chiếu',
    },
    {
      stepNumber: 8,
      title: 'Kiểm tra khối lượng Cu tan theo Faraday',
      description: 'Áp dụng công thức m = A·I·t / (n·F) với A = 63,5 và n = 2 để tính chính xác lượng đồng chuyển dịch.',
      formula: 'm(Cu) = 63,5 · I · t / (2 · 96 500)',
      cameraLevel: 'OBJECT',
      focusObject: 'cuso4-anode',
      timeFraction: 0.82,
      accentTag: 'Faraday',
    },
    {
      stepNumber: 9,
      title: 'Ứng dụng công nghiệp: tinh luyện đồng & mạ điện',
      description: 'Quá trình chuyển đồng từ cực dương sang cực âm là cơ sở sản xuất đồng tinh khiết 99,99% và kỹ thuật mạ điện.',
      formula: 'Cu (thô, anode) → Cu (tinh khiết, cathode)',
      cameraLevel: 'OBJECT',
      focusObject: 'cuso4-cathode',
      timeFraction: 0.92,
      accentTag: 'Ứng dụng',
    },
    {
      stepNumber: 10,
      title: 'Tổng kết biến thể anode đồng',
      description: 'Không sinh khí, màu xanh không đổi, lượng Cu tan ở anode luôn bằng lượng Cu bám ở cathode ở hiệu suất 100%.',
      formula: 'm(Cu bám) = m(Cu tan) = (nₑ / 2) × 63,5 g',
      cameraLevel: 'TABLE',
      focusObject: null,
      timeFraction: 1,
      accentTag: 'Tổng kết',
    },
  ],

  'nacl-molten': [
    {
      stepNumber: 1,
      title: 'Hệ điện phân NaCl nóng chảy (khan nước)',
      description: 'Muối ăn NaCl được đun nóng chảy (~801 °C) trong bình chịu nhiệt; hoàn toàn không có nước.',
      formula: 'NaCl (lỏng) → Na⁺ + Cl⁻ (không có H₂O)',
      cameraLevel: 'TABLE',
      focusObject: null,
      timeFraction: 0,
      accentTag: 'Nóng chảy',
    },
    {
      stepNumber: 2,
      title: 'Quan sát khối muối điện li nóng chảy',
      description: 'Trạng thái nóng chảy giúp các ion Na⁺ và Cl⁻ chuyển động tự do, dẫn điện tốt mà không cần dung môi nước.',
      formula: 'Chất điện li: Na⁺ tự do và Cl⁻ tự do',
      cameraLevel: 'OBJECT',
      focusObject: 'nacl-electrolyte',
      timeFraction: 0,
      accentTag: 'Chất điện li',
    },
    {
      stepNumber: 3,
      title: 'Cấp nguồn điện một chiều DC',
      description: 'Nguồn DC đẩy electron về cực âm Cathode (−) và rút electron từ cực dương Anode (+).',
      formula: 'Anode (+): cực dương · Cathode (−): cực âm',
      cameraLevel: 'OBJECT',
      focusObject: 'nacl-power',
      timeFraction: 0.12,
      accentTag: 'Nguồn DC',
    },
    {
      stepNumber: 4,
      title: 'Ion Cl⁻ di chuyển về Anode (+) và bị oxi hóa',
      description: 'Các anion Cl⁻ nhường electron tại cực dương tạo thành bọt khí clo màu vàng lục thoát lên.',
      formula: 'Anode (+): 2Cl⁻ → Cl₂↑ + 2e⁻',
      cameraLevel: 'OBJECT',
      focusObject: 'nacl-anode',
      timeFraction: 0.28,
      accentTag: 'Khí Cl₂',
    },
    {
      stepNumber: 5,
      title: 'Ion Na⁺ di chuyển về Cathode (−) và bị khử',
      description: 'Vì không có nước cạnh tranh, cation Na⁺ trực tiếp nhận 1e⁻ tạo kim loại natri (Na lỏng ở nhiệt độ cao).',
      formula: 'Cathode (−): Na⁺ + e⁻ → Na',
      cameraLevel: 'OBJECT',
      focusObject: 'nacl-cathode',
      timeFraction: 0.44,
      accentTag: 'Kim loại Na',
    },
    {
      stepNumber: 6,
      title: 'Góc phản ứng cận cảnh hai cực',
      description: 'Trái ngược với điện phân dung dịch, ở đây thu được Na kim loại ở cathode và Cl₂ ở anode, hoàn toàn không có H₂ hay NaOH.',
      formula: '2NaCl (nóng chảy) —(đpnc)→ 2Na + Cl₂↑',
      cameraLevel: 'REACTION',
      focusObject: null,
      timeFraction: 0.58,
      accentTag: 'Phản ứng',
    },
    {
      stepNumber: 7,
      title: 'So sánh số mol sản phẩm hai cực',
      description: 'Với cùng số mol electron nₑ: n(Na) = nₑ còn n(Cl₂) = nₑ / 2 (tỉ lệ mol Na : Cl₂ = 2 : 1).',
      formula: 'n(Na) = nₑ · n(Cl₂) = nₑ / 2',
      cameraLevel: 'OBJECT',
      focusObject: 'nacl-cathode',
      timeFraction: 0.72,
      accentTag: 'Tỉ lệ mol',
    },
    {
      stepNumber: 8,
      title: 'Lưu ý an toàn hóa chất Cl₂ và Na',
      description: 'Khí Cl₂ độc và Na lỏng rất hoạt động (dễ phản ứng mãnh liệt với nước và oxi); trong công nghiệp phải tách riêng trong buồng kín.',
      formula: 'Cảnh báo học thuật: Cl₂ (độc), Na (phản ứng mạnh với H₂O)',
      cameraLevel: 'OBJECT',
      focusObject: 'nacl-anode',
      timeFraction: 0.82,
      accentTag: 'An toàn',
    },
    {
      stepNumber: 9,
      title: 'Quy tắc điều chế kim loại mạnh nhóm IA, IIA',
      description: 'Các kim loại có tính khử rất mạnh (Na, K, Ca, Mg, Al) bắt buộc điều chế bằng phương pháp điện phân nóng chảy.',
      formula: 'Điện phân nóng chảy → điều chế Na, K, Mg, Ca, Al',
      cameraLevel: 'REACTION',
      focusObject: null,
      timeFraction: 0.92,
      accentTag: 'Nguyên tắc',
    },
    {
      stepNumber: 10,
      title: 'Tổng kết điện phân NaCl nóng chảy',
      description: 'Toàn bộ số liệu m(Na) và V(Cl₂) tại cuối thí nghiệm đồng bộ với công thức Faraday trong bảng kết quả.',
      formula: 'm(Na) = 23 · nₑ · V(Cl₂) = (nₑ / 2) × 24,79 L',
      cameraLevel: 'TABLE',
      focusObject: null,
      timeFraction: 1,
      accentTag: 'Tổng kết',
    },
  ],

  'nacl-brine': [
    {
      stepNumber: 1,
      title: 'Bình điện phân dung dịch NaCl bão hòa có màng ngăn',
      description: 'Bình chữ nhật chia hai ngăn riêng biệt bởi màng trao đổi cation ở giữa, chứa dung dịch NaCl bão hòa.',
      formula: 'NaCl (bão hòa) + H₂O · Có màng ngăn',
      cameraLevel: 'TABLE',
      focusObject: null,
      timeFraction: 0,
      accentTag: 'Cấu tạo',
    },
    {
      stepNumber: 2,
      title: 'Vai trò của màng trao đổi cation ở giữa bình',
      description: 'Màng ngăn cho ion Na⁺ đi sang ngăn cathode nhưng chặn khí Cl₂ và OH⁻ trộn lẫn với nhau.',
      formula: 'Màng trao đổi cation: cho Na⁺ qua, tách Cl₂ khỏi OH⁻',
      cameraLevel: 'OBJECT',
      focusObject: 'nacl-membrane',
      timeFraction: 0,
      accentTag: 'Màng ngăn',
    },
    {
      stepNumber: 3,
      title: 'Đóng nguồn DC bắt đầu điện phân',
      description: 'Nguồn một chiều cấp dòng I đi qua dung dịch muối ăn bão hòa; electron chạy từ Anode (+) sang Cathode (−).',
      formula: 'e⁻ : Anode (+) → Nguồn DC → Cathode (−)',
      cameraLevel: 'OBJECT',
      focusObject: 'nacl-power',
      timeFraction: 0.14,
      accentTag: 'Nguồn DC',
    },
    {
      stepNumber: 4,
      title: 'Ngăn Anode (+) · Oxi hóa Cl⁻ tạo khí Cl₂',
      description: 'Trong dung dịch NaCl bão hòa, Cl⁻ bị oxi hóa tại anode (+) tạo dòng bọt khí Cl₂ màu vàng lục.',
      formula: 'Anode (+): 2Cl⁻ → Cl₂↑ + 2e⁻',
      cameraLevel: 'OBJECT',
      focusObject: 'nacl-anode',
      timeFraction: 0.28,
      accentTag: 'Ngăn Anode',
    },
    {
      stepNumber: 5,
      title: 'Ngăn Cathode (−) · H₂O bị khử thay vì Na⁺',
      description: 'Nước dễ bị khử hơn ion Na⁺ nên ở cathode (−) thoát khí H₂ không màu và sinh ra ion OH⁻.',
      formula: 'Cathode (−): 2H₂O + 2e⁻ → H₂↑ + 2OH⁻',
      cameraLevel: 'OBJECT',
      focusObject: 'nacl-cathode',
      timeFraction: 0.44,
      accentTag: 'Ngăn Cathode',
    },
    {
      stepNumber: 6,
      title: 'Cation Na⁺ dịch chuyển qua màng tạo NaOH',
      description: 'Ion Na⁺ đi xuyên màng từ ngăn anode sang ngăn cathode kết hợp cùng OH⁻ hình thành dung dịch xút NaOH.',
      formula: 'Na⁺ (qua màng) + OH⁻ (cathode) → NaOH (aq)',
      cameraLevel: 'OBJECT',
      focusObject: 'nacl-membrane',
      timeFraction: 0.58,
      accentTag: 'Dòng Na⁺',
    },
    {
      stepNumber: 7,
      title: 'Góc phản ứng · Tách biệt hoàn toàn H₂ và Cl₂',
      description: 'Quan sát ngang bình: khí Cl₂ chỉ xuất hiện bên ngăn trái (anode), khí H₂ và NaOH chỉ xuất hiện bên ngăn phải (cathode).',
      formula: 'n(H₂) = n(Cl₂) = nₑ / 2 · n(NaOH) = nₑ',
      cameraLevel: 'REACTION',
      focusObject: null,
      timeFraction: 0.72,
      accentTag: 'Phân tách',
    },
    {
      stepNumber: 8,
      title: 'Điều gì xảy ra nếu bỏ màng ngăn?',
      description: 'Không có màng ngăn, Cl₂ phản ứng ngay với NaOH tạo nước Javen (NaCl + NaClO + H₂O) thay vì thu được NaOH và Cl₂ riêng.',
      formula: 'Cl₂ + 2NaOH → NaCl + NaClO + H₂O (nước Javen)',
      cameraLevel: 'OBJECT',
      focusObject: 'nacl-electrolyte',
      timeFraction: 0.82,
      accentTag: 'Mở rộng',
    },
    {
      stepNumber: 9,
      title: 'Lưu ý an toàn với Cl₂, H₂ và NaOH',
      description: 'Hỗn hợp H₂ + Cl₂ dễ nổ khi gặp ánh sáng, Cl₂ độc và NaOH gây ăn mòn; quá trình công nghiệp luôn vận hành kín.',
      formula: 'An toàn hóa học: tách riêng H₂, Cl₂ và dung dịch kiềm NaOH',
      cameraLevel: 'REACTION',
      focusObject: null,
      timeFraction: 0.92,
      accentTag: 'An toàn',
    },
    {
      stepNumber: 10,
      title: 'Tổng kết công nghiệp clo – kiềm',
      description: 'Phương trình tổng hợp điện phân dung dịch NaCl có màng ngăn thu đồng thời ba sản phẩm quan trọng: NaOH, H₂ và Cl₂.',
      formula: '2NaCl + 2H₂O —(đpdd, có màng ngăn)→ 2NaOH + H₂↑ + Cl₂↑',
      cameraLevel: 'TABLE',
      focusObject: null,
      timeFraction: 1,
      accentTag: 'Tổng kết',
    },
  ],
};
