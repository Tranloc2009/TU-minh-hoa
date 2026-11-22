import { LESSONS, LessonContentBlock, LessonData, LessonPitfall, WorkedExample } from '../data/lessons';
import { PRACTICE_QUESTIONS, PracticeQuestion } from '../data/practice';
import { buildBalancedQuiz } from './chemistry';
import {
  ElectrolysisParams,
  ElectrolysisSnapshot,
  ElectrolysisVariant,
  computeElectrolysisAtTime,
} from './electrochemEngine';
import {
  GalvanicCellSnapshot,
  LAB_OBJECTS,
  LabExperimentId,
  LabObjectId,
  TABLE_POSITIONS,
  TABLE_TOP_Y,
  Vec3Tuple,
  CameraPreset,
  getCameraPreset,
} from './lab3dState';

// ============================================================================
// 1. UNIFIED 3D LEARNING WORLD ZONES & CAMERA PRESETS
// ============================================================================

export type WorldZone =
  | 'OVERVIEW'
  | 'BOARD'
  | 'PRACTICE'
  | 'TABLE'
  | 'OBJECT'
  | 'REACTION'
  | 'MICRO';

export type CameraSpeedMode = 'fast' | 'normal' | 'slow';

export const CAMERA_SPEED_DURATION_MS: Record<CameraSpeedMode, number> = {
  fast: 480,
  normal: 900,
  slow: 1450,
};

// Coordinates of the expanded architectural laboratory room
export const WORLD_ANCHORS = {
  boardCenter: { x: -3.55, y: 2.42, z: -3.65 } as Vec3Tuple,
  practiceDesk: { x: 4.35, y: 0, z: 2.3 } as Vec3Tuple,
  practicePaperCenter: { x: 4.35, y: 0.96, z: 2.26 } as Vec3Tuple,
};

// ============================================================================
// 2. SIMULATION SPEED & DETERMINISTIC STEP ENGINE (0.25x -> 4x)
// ============================================================================

export const SPEED_PRESETS = [0.25, 0.5, 1, 1.5, 2, 4] as const;
export type SpeedMultiplier = (typeof SPEED_PRESETS)[number];

/**
 * Advances simulation time strictly via simulationDelta = realDelta * speedMultiplier
 * scaled by a consistent base timeline rate so 1x playback is comfortable to watch
 * and 2x / 4x advance chemical quantities and charts in exact proportion.
 */
export function advanceSimulationTime(args: {
  currentTimeSeconds: number;
  totalTimeSeconds: number;
  realDeltaSeconds: number;
  speedMultiplier: number;
  basePlaybackDurationSeconds?: number;
}): { nextTimeSeconds: number; reachedEnd: boolean } {
  const {
    currentTimeSeconds,
    totalTimeSeconds,
    realDeltaSeconds,
    speedMultiplier,
    basePlaybackDurationSeconds = 18,
  } = args;

  if (totalTimeSeconds <= 0 || realDeltaSeconds <= 0 || speedMultiplier <= 0) {
    return {
      nextTimeSeconds: Math.max(0, Math.min(totalTimeSeconds, currentTimeSeconds)),
      reachedEnd: totalTimeSeconds <= 0 || currentTimeSeconds >= totalTimeSeconds,
    };
  }

  // simulationDelta = (total / baseDuration) * realDelta * speedMultiplier
  const simDelta = (totalTimeSeconds / basePlaybackDurationSeconds) * realDeltaSeconds * speedMultiplier;
  const rawNext = currentTimeSeconds + simDelta;
  if (rawNext >= totalTimeSeconds) {
    return { nextTimeSeconds: totalTimeSeconds, reachedEnd: true };
  }
  return { nextTimeSeconds: Math.max(0, rawNext), reachedEnd: false };
}

/**
 * Deterministic manual forward/backward time step for each experiment.
 * Backward stepping reproduces exact earlier chemical products, charts, and 3D particle state.
 */
export function stepSimulationTime(args: {
  station: LabExperimentId;
  currentTimeSeconds: number;
  totalTimeSeconds: number;
  direction: 1 | -1;
}): number {
  const { station, currentTimeSeconds, totalTimeSeconds, direction } = args;
  if (totalTimeSeconds <= 0) return 0;
  const stepSize =
    station === 'pin-zn-cu'
      ? Math.max(2, Math.round(totalTimeSeconds / 12))
      : Math.max(10, Math.round(totalTimeSeconds / 10));
  const next = currentTimeSeconds + direction * stepSize;
  return Math.max(0, Math.min(totalTimeSeconds, Math.round(next * 10) / 10));
}

// ============================================================================
// 3. SMART TEACHING BOARD — 10 MODULES BUILT FROM REAL SYLLABUS LESSONS
// ============================================================================

export interface BoardEquationLink {
  id: string;
  label: string;
  formula: string;
  explanation: string;
  station: LabExperimentId;
  highlightObject?: LabObjectId;
  microZone?: MicroZoneId;
}

export interface BoardModule {
  id: string;
  order: number;
  title: string;
  shortTitle: string;
  lessonSlug: string;
  lessonNumber: number;
  sourcePages: string;
  summary: string;
  blocks: LessonContentBlock[];
  workedExamples: WorkedExample[];
  pitfalls: LessonPitfall[];
  equations: BoardEquationLink[];
  observeTarget: {
    label: string;
    station: LabExperimentId;
    cuso4Variant?: 'cuso4-inert' | 'cuso4-copper';
    naclVariant?: 'nacl-molten' | 'nacl-brine';
    objectId?: LabObjectId;
    microZone: MicroZoneId;
    microLabel: string;
  };
}

function getLesson(num: number): LessonData {
  return LESSONS.find((l) => l.number === num) ?? LESSONS[0];
}

export function buildBoardModules(): BoardModule[] {
  const l1 = getLesson(1);
  const l2 = getLesson(2);
  const l3 = getLesson(3);
  const l4 = getLesson(4);
  const l5 = getLesson(5);
  const l6 = getLesson(6);

  return [
    {
      id: 'mod-1-redox-pairs',
      order: 1,
      title: 'Cặp oxi hóa – khử và điện cực',
      shortTitle: '1. Cặp oxi hóa – khử',
      lessonSlug: l1.slug,
      lessonNumber: 1,
      sourcePages: l1.sourcePages,
      summary: l1.summary,
      blocks: l1.coreBlocks,
      workedExamples: l1.workedExamples,
      pitfalls: l1.pitfalls,
      equations: [
        {
          id: 'eq-m1-zn',
          label: 'Cặp Zn²⁺/Zn',
          formula: 'Zn²⁺ + 2e⁻ ⇌ Zn',
          explanation: 'Dạng oxi hóa (Zn²⁺) viết trước, dạng khử (Zn) viết sau. Thanh Zn nhúng trong ZnSO₄ tạo bán pin kẽm.',
          station: 'pin-zn-cu',
          highlightObject: 'zn-cu-electrode-zn',
          microZone: 'zncu-zn',
        },
        {
          id: 'eq-m1-cu',
          label: 'Cặp Cu²⁺/Cu',
          formula: 'Cu²⁺ + 2e⁻ ⇌ Cu',
          explanation: 'Thanh đồng nhúng trong dung dịch CuSO₄ tạo điện cực kim loại Cu²⁺/Cu.',
          station: 'pin-zn-cu',
          highlightObject: 'zn-cu-electrode-cu',
          microZone: 'zncu-cu',
        },
      ],
      observeTarget: {
        label: 'Quan sát bán pin Zn & Cu',
        station: 'pin-zn-cu',
        objectId: 'zn-cu-electrode-zn',
        microZone: 'zncu-zn',
        microLabel: 'Quan sát vi mô bề mặt Zn',
      },
    },
    {
      id: 'mod-2-potentials',
      order: 2,
      title: 'Thế điện cực chuẩn E° và so sánh tính oxi hóa – khử',
      shortTitle: '2. Thế điện cực chuẩn E°',
      lessonSlug: l2.slug,
      lessonNumber: 2,
      sourcePages: l2.sourcePages,
      summary: l2.summary,
      blocks: l2.coreBlocks,
      workedExamples: l2.workedExamples,
      pitfalls: l2.pitfalls,
      equations: [
        {
          id: 'eq-m2-she',
          label: 'Điện cực hydrogen chuẩn',
          formula: '2H⁺(1 M) + 2e⁻ ⇌ H₂(1 bar)   E° = 0,000 V',
          explanation: 'Mốc chuẩn quốc tế để đo thế điện cực chuẩn E° của mọi cặp oxi hóa – khử khác.',
          station: 'pin-zn-cu',
          highlightObject: 'zn-cu-voltmeter',
        },
        {
          id: 'eq-m2-emf',
          label: 'Chênh lệch thế Zn–Cu',
          formula: 'E°pin = E°(Cu²⁺/Cu) − E°(Zn²⁺/Zn) = +0,340 − (−0,763) = 1,103 V',
          explanation: 'Vì E°(Zn²⁺/Zn) < E°(Cu²⁺/Cu), Zn có tính khử mạnh hơn Cu và đóng vai trò cực âm.',
          station: 'pin-zn-cu',
          highlightObject: 'zn-cu-voltmeter',
        },
      ],
      observeTarget: {
        label: 'Xem số đo Vôn kế 1,103 V',
        station: 'pin-zn-cu',
        objectId: 'zn-cu-voltmeter',
        microZone: 'zncu-cu',
        microLabel: 'Quan sát vi mô cực Cu',
      },
    },
    {
      id: 'mod-3-alpha-rule',
      order: 3,
      title: 'Quy tắc α và dự đoán chiều phản ứng oxi hóa – khử',
      shortTitle: '3. Quy tắc α',
      lessonSlug: l3.slug,
      lessonNumber: 3,
      sourcePages: l3.sourcePages,
      summary: l3.summary,
      blocks: l3.coreBlocks,
      workedExamples: l3.workedExamples,
      pitfalls: l3.pitfalls,
      equations: [
        {
          id: 'eq-m3-zncu',
          label: 'Phản ứng tự diễn biến Zn + Cu²⁺',
          formula: 'Zn + Cu²⁺ → Zn²⁺ + Cu',
          explanation: 'Chất oxi hóa mạnh hơn (Cu²⁺) tác dụng với chất khử mạnh hơn (Zn) tạo Zn²⁺ và Cu.',
          station: 'pin-zn-cu',
          highlightObject: 'zn-cu-beaker-cu',
          microZone: 'zncu-cu',
        },
      ],
      observeTarget: {
        label: 'Quan sát phản ứng Zn–Cu',
        station: 'pin-zn-cu',
        objectId: 'zn-cu-beaker-cu',
        microZone: 'zncu-cu',
        microLabel: 'Quan sát vi mô Cu²⁺ nhận e⁻',
      },
    },
    {
      id: 'mod-4-pin-structure',
      order: 4,
      title: 'Cấu tạo và nguyên lý hoạt động của Pin Galvani Zn–Cu',
      shortTitle: '4. Cấu tạo Pin Zn–Cu',
      lessonSlug: l4.slug,
      lessonNumber: 4,
      sourcePages: l4.sourcePages,
      summary: 'Chuyển hóa hóa năng thành điện năng nhờ hai bán pin tách biệt: Anode (−) Zn và Cathode (+) Cu.',
      blocks: l4.coreBlocks.slice(0, 2),
      workedExamples: l4.workedExamples.slice(0, 1),
      pitfalls: l4.pitfalls.slice(0, 2),
      equations: [
        {
          id: 'eq-m4-anode',
          label: 'Bước 1 · Tại Anode (−) thanh Zn',
          formula: 'Zn → Zn²⁺ + 2e⁻',
          explanation: 'Zn bị oxi hóa (nhường 2e⁻), thanh kẽm mòn dần và giải phóng ion Zn²⁺ vào dung dịch.',
          station: 'pin-zn-cu',
          highlightObject: 'zn-cu-electrode-zn',
          microZone: 'zncu-zn',
        },
        {
          id: 'eq-m4-cathode',
          label: 'Bước 2 · Tại Cathode (+) thanh Cu',
          formula: 'Cu²⁺ + 2e⁻ → Cu',
          explanation: 'Ion Cu²⁺ trong dung dịch nhận 2e⁻ từ dây dẫn và bám thành lớp đồng đỏ trên thanh Cu.',
          station: 'pin-zn-cu',
          highlightObject: 'zn-cu-electrode-cu',
          microZone: 'zncu-cu',
        },
        {
          id: 'eq-m4-overall',
          label: 'Bước 3 · Phản ứng tổng trong pin',
          formula: 'Zn + Cu²⁺ → Zn²⁺ + Cu   (E°pin = 1,103 V)',
          explanation: 'Tổng hai bán phản ứng bảo toàn số electron (2e⁻) và tạo ra dòng điện một chiều ở mạch ngoài.',
          station: 'pin-zn-cu',
          highlightObject: 'zn-cu-wire',
          microZone: 'zncu-cu',
        },
      ],
      observeTarget: {
        label: 'Quan sát trên mô hình Zn–Cu',
        station: 'pin-zn-cu',
        objectId: 'zn-cu-wire',
        microZone: 'zncu-zn',
        microLabel: 'Quan sát vi mô điện cực Zn',
      },
    },
    {
      id: 'mod-5-electron-saltbridge',
      order: 5,
      title: 'Chiều electron, dòng điện và vai trò cầu muối KNO₃',
      shortTitle: '5. Electron & Cầu muối',
      lessonSlug: l4.slug,
      lessonNumber: 4,
      sourcePages: l4.sourcePages,
      summary: 'Phân biệt rõ dòng electron ở mạch ngoài (Zn → Cu) với dòng ion trong cầu muối (K⁺ → ngăn Cu, NO₃⁻ → ngăn Zn).',
      blocks: l4.coreBlocks.length > 2 ? l4.coreBlocks.slice(2) : l4.coreBlocks,
      workedExamples: l4.workedExamples.slice(1),
      pitfalls: l4.pitfalls,
      equations: [
        {
          id: 'eq-m5-wire',
          label: 'Mạch ngoài (dây dẫn kim loại)',
          formula: 'e⁻ : Anode (−) Zn → Cathode (+) Cu',
          explanation: 'Electron chỉ đi qua dây dẫn ngoài; chiều dòng điện quy ước ngược lại từ Cu sang Zn.',
          station: 'pin-zn-cu',
          highlightObject: 'zn-cu-wire',
        },
        {
          id: 'eq-m5-bridge',
          label: 'Trong cầu muối KNO₃',
          formula: 'NO₃⁻ → ngăn Zn   ·   K⁺ → ngăn Cu',
          explanation: 'Anion NO₃⁻ bù dư điện tích dương Zn²⁺; cation K⁺ bù thiếu Cu²⁺. Electron không đi qua cầu muối.',
          station: 'pin-zn-cu',
          highlightObject: 'zn-cu-salt-bridge',
          microZone: 'zncu-bridge',
        },
      ],
      observeTarget: {
        label: 'Quan sát cầu muối KNO₃',
        station: 'pin-zn-cu',
        objectId: 'zn-cu-salt-bridge',
        microZone: 'zncu-bridge',
        microLabel: 'Quan sát vi mô cầu muối',
      },
    },
    {
      id: 'mod-6-electrolysis-intro',
      order: 6,
      title: 'Nguyên lý điện phân và phân biệt dấu cực với Pin Galvani',
      shortTitle: '6. Nguyên lý điện phân',
      lessonSlug: l5.slug,
      lessonNumber: 5,
      sourcePages: l5.sourcePages,
      summary: 'Dùng nguồn điện một chiều cưỡng bức phản ứng oxi hóa – khử. Anode (+) oxi hóa, Cathode (−) khử.',
      blocks: l5.coreBlocks.slice(0, 1),
      workedExamples: [],
      pitfalls: l5.pitfalls.slice(0, 2),
      equations: [
        {
          id: 'eq-m6-rule',
          label: 'Quy tắc bản chất luôn đúng',
          formula: 'Anode: luôn xảy ra oxi hóa   ·   Cathode: luôn xảy ra khử',
          explanation: 'Trong bình điện phân, Anode nối cực dương (+) nguồn DC và Cathode nối cực âm (−) nguồn DC — ngược dấu so với pin điện.',
          station: 'dien-phan-cuso4',
          highlightObject: 'cuso4-power',
        },
      ],
      observeTarget: {
        label: 'Quan sát nguồn DC & hai cực',
        station: 'dien-phan-cuso4',
        cuso4Variant: 'cuso4-inert',
        objectId: 'cuso4-power',
        microZone: 'cuso4-cathode',
        microLabel: 'Quan sát vi mô Cathode CuSO₄',
      },
    },
    {
      id: 'mod-7-cuso4',
      order: 7,
      title: 'Điện phân dung dịch CuSO₄ (Điện cực trơ & Anode đồng)',
      shortTitle: '7. Điện phân CuSO₄',
      lessonSlug: l5.slug,
      lessonNumber: 5,
      sourcePages: l5.sourcePages,
      summary: 'So sánh 2 giai đoạn với điện cực trơ (hết Cu²⁺ sinh H₂) và hiện tượng anode tan với điện cực đồng.',
      blocks: l5.coreBlocks.slice(1, 3),
      workedExamples: l5.workedExamples.slice(0, 1),
      pitfalls: l5.pitfalls,
      equations: [
        {
          id: 'eq-m7-cat1',
          label: 'Cathode (−) · Giai đoạn 1',
          formula: 'Cu²⁺ + 2e⁻ → Cu',
          explanation: 'Ion Cu²⁺ bị khử tạo lớp đồng đỏ bám trên cathode; màu xanh dung dịch nhạt dần với điện cực trơ.',
          station: 'dien-phan-cuso4',
          highlightObject: 'cuso4-cathode',
          microZone: 'cuso4-cathode',
        },
        {
          id: 'eq-m7-an-inert',
          label: 'Anode (+) trơ · Thoát khí O₂',
          formula: '2H₂O → O₂↑ + 4H⁺ + 4e⁻',
          explanation: 'SO₄²⁻ không bị oxi hóa trong nước nên H₂O bị oxi hóa sinh khí O₂ và H⁺ (làm giảm pH).',
          station: 'dien-phan-cuso4',
          highlightObject: 'cuso4-anode',
          microZone: 'cuso4-anode',
        },
        {
          id: 'eq-m7-an-cu',
          label: 'Anode (+) bằng đồng (Anode tan)',
          formula: 'Cu → Cu²⁺ + 2e⁻',
          explanation: 'Khi dùng anode Cu, đồng tan trực tiếp thay cho nước; không có khí O₂ và nồng độ Cu²⁺ giữ không đổi.',
          station: 'dien-phan-cuso4',
          highlightObject: 'cuso4-anode',
          microZone: 'cuso4-anode',
        },
      ],
      observeTarget: {
        label: 'Quan sát bình CuSO₄',
        station: 'dien-phan-cuso4',
        cuso4Variant: 'cuso4-inert',
        objectId: 'cuso4-cell',
        microZone: 'cuso4-cathode',
        microLabel: 'Quan sát vi mô điện phân CuSO₄',
      },
    },
    {
      id: 'mod-8-nacl',
      order: 8,
      title: 'Điện phân NaCl nóng chảy và dung dịch có màng trao đổi cation',
      shortTitle: '8. Điện phân NaCl',
      lessonSlug: l5.slug,
      lessonNumber: 5,
      sourcePages: l5.sourcePages,
      summary: 'Phân biệt vai trò của H₂O ở cathode (−): nóng chảy thu kim loại Na; dung dịch có màng thu H₂, Cl₂ và NaOH.',
      blocks: l5.coreBlocks.length > 2 ? l5.coreBlocks.slice(2) : l5.coreBlocks,
      workedExamples: l5.workedExamples.slice(1),
      pitfalls: l5.pitfalls,
      equations: [
        {
          id: 'eq-m8-molten',
          label: 'NaCl nóng chảy (không có nước)',
          formula: '2NaCl(nc) → 2Na + Cl₂↑',
          explanation: 'Cathode khử trực tiếp Na⁺ + e⁻ → Na; Anode oxi hóa 2Cl⁻ → Cl₂↑ + 2e⁻.',
          station: 'dien-phan-nacl',
          highlightObject: 'nacl-cell',
          microZone: 'nacl-molten',
        },
        {
          id: 'eq-m8-brine',
          label: 'Dung dịch NaCl bão hòa có màng',
          formula: '2NaCl + 2H₂O → H₂↑ + Cl₂↑ + 2NaOH',
          explanation: 'Cathode khử H₂O tạo H₂ và OH⁻; màng trao đổi cation cho Na⁺ sang ngăn cathode và ngăn Cl₂ phản ứng với NaOH.',
          station: 'dien-phan-nacl',
          highlightObject: 'nacl-membrane',
          microZone: 'nacl-brine-membrane',
        },
      ],
      observeTarget: {
        label: 'Quan sát bình NaCl có màng',
        station: 'dien-phan-nacl',
        naclVariant: 'nacl-brine',
        objectId: 'nacl-membrane',
        microZone: 'nacl-brine-membrane',
        microLabel: 'Quan sát vi mô màng trao đổi cation',
      },
    },
    {
      id: 'mod-9-faraday',
      order: 9,
      title: 'Định luật Faraday và phương pháp giải bài toán điện phân',
      shortTitle: '9. Định luật Faraday',
      lessonSlug: l6.slug,
      lessonNumber: 6,
      sourcePages: l6.sourcePages,
      summary: l6.summary,
      blocks: l6.coreBlocks,
      workedExamples: l6.workedExamples,
      pitfalls: l6.pitfalls,
      equations: [
        {
          id: 'eq-m9-ne',
          label: 'Số mol electron trao đổi',
          formula: 'nₑ = Q / F = (I · t) / 96 500   (mol)',
          explanation: 'Bước đầu tiên của mọi bài toán Faraday: quy đổi thời gian t ra giây để tính chính xác nₑ.',
          station: 'dien-phan-cuso4',
          highlightObject: 'cuso4-power',
        },
        {
          id: 'eq-m9-mass',
          label: 'Khối lượng chất giải phóng ở điện cực',
          formula: 'm = (A · I · t) / (n · F)',
          explanation: 'Với Cu (A = 64, n = 2) tại I = 2 A, t = 965 s → nₑ = 0,02 mol → m(Cu) = 0,64 g.',
          station: 'dien-phan-cuso4',
          highlightObject: 'cuso4-cathode',
          microZone: 'cuso4-cathode',
        },
      ],
      observeTarget: {
        label: 'Kiểm chứng Faraday trên CuSO₄',
        station: 'dien-phan-cuso4',
        cuso4Variant: 'cuso4-inert',
        objectId: 'cuso4-cathode',
        microZone: 'cuso4-cathode',
        microLabel: 'Quan sát vi mô lớp Cu bám',
      },
    },
    {
      id: 'mod-10-summary',
      order: 10,
      title: 'Tổng kết Chương 5 · So sánh Pin điện & Bình điện phân',
      shortTitle: '10. Tổng kết & Vận dụng',
      lessonSlug: l6.slug,
      lessonNumber: 6,
      sourcePages: 'Đề cương Chương 5 · Trang 1–4, 6–7, 9',
      summary: 'Hệ thống hóa dấu điện cực, chiều electron, vai trò cầu muối/màng ngăn và những lỗi sai thường gặp nhất.',
      blocks: [
        {
          heading: 'Bảng đối chiếu nhanh Pin Galvani và Bình điện phân',
          paragraphs: [
            'Điểm cốt lõi không bao giờ đổi trong toàn bộ điện hóa học: Anode luôn là nơi xảy ra quá trình oxi hóa (nhường electron), còn Cathode luôn là nơi xảy ra quá trình khử (nhận electron).',
          ],
          table: {
            caption: 'So sánh bản chất hai loại thiết bị điện hóa',
            headers: ['Tiêu chí', 'Pin Galvani (Zn–Cu)', 'Bình điện phân (CuSO₄, NaCl)'],
            rows: [
              ['Bản chất năng lượng', 'Hóa năng → Điện năng (tự diễn biến)', 'Điện năng → Hóa năng (cưỡng bức)'],
              ['Anode (oxi hóa)', 'Cực âm (−) · Zn → Zn²⁺ + 2e⁻', 'Cực dương (+) · nối cực + nguồn DC'],
              ['Cathode (khử)', 'Cực dương (+) · Cu²⁺ + 2e⁻ → Cu', 'Cực âm (−) · nối cực − nguồn DC'],
              ['Chiều electron ngoài', 'Từ Anode (−) sang Cathode (+)', 'Từ Anode (+) qua nguồn DC về Cathode (−)'],
            ],
          },
        },
      ],
      workedExamples: [...l4.workedExamples.slice(0, 1), ...l6.workedExamples.slice(0, 1)],
      pitfalls: [...l4.pitfalls.slice(0, 2), ...l5.pitfalls.slice(0, 2)],
      equations: [
        {
          id: 'eq-m10-pin',
          label: 'Pin Zn–Cu',
          formula: 'Anode (−): Zn → Zn²⁺ + 2e⁻  |  Cathode (+): Cu²⁺ + 2e⁻ → Cu',
          explanation: 'Dòng electron tự chạy từ Zn sang Cu tạo suất điện động chuẩn 1,103 V.',
          station: 'pin-zn-cu',
          highlightObject: 'zn-cu-wire',
          microZone: 'zncu-zn',
        },
        {
          id: 'eq-m10-elec',
          label: 'Điện phân CuSO₄ trơ',
          formula: 'Cathode (−): Cu²⁺ + 2e⁻ → Cu  |  Anode (+): 2H₂O → O₂↑ + 4H⁺ + 4e⁻',
          explanation: 'Nguồn DC rút electron từ anode dương và đẩy electron vào cathode âm.',
          station: 'dien-phan-cuso4',
          highlightObject: 'cuso4-cell',
          microZone: 'cuso4-cathode',
        },
      ],
      observeTarget: {
        label: 'So sánh trực tiếp tại bàn Zn–Cu',
        station: 'pin-zn-cu',
        objectId: 'zn-cu-voltmeter',
        microZone: 'zncu-bridge',
        microLabel: 'Quan sát vi mô cầu muối',
      },
    },
  ];
}

export const BOARD_MODULES: BoardModule[] = buildBoardModules();

export function getBoardModuleIndexForSlug(slug: string): number {
  const idx = BOARD_MODULES.findIndex((m) => m.lessonSlug === slug);
  return idx >= 0 ? idx : 0;
}

// ============================================================================
// 4. PRACTICE DESK DECKS — REAL QUESTION BANK + 3D VISUAL PICKING QUESTIONS
// ============================================================================

export interface VisualLabQuestion {
  id: string;
  kind: 'visual-3d';
  prompt: string;
  station: LabExperimentId;
  cuso4Variant?: 'cuso4-inert' | 'cuso4-copper';
  naclVariant?: 'nacl-molten' | 'nacl-brine';
  candidateObjects: LabObjectId[];
  correctObjectId: LabObjectId;
  explanation: string;
  wrongHint: string;
}

export type DeskQuestionItem =
  | (PracticeQuestion & { kind: 'standard'; observeStation: LabExperimentId; observeMicroZone?: MicroZoneId })
  | VisualLabQuestion;

export interface PracticeDeck {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  lessonFilter?: number;
  questions: DeskQuestionItem[];
}

function inferObserveTargetForQuestion(q: PracticeQuestion): {
  observeStation: LabExperimentId;
  observeMicroZone?: MicroZoneId;
} {
  if (q.lessonNumber <= 4) {
    return { observeStation: 'pin-zn-cu', observeMicroZone: q.lessonNumber === 4 ? 'zncu-bridge' : 'zncu-zn' };
  }
  if (q.lessonNumber === 5) {
    if (/NaCl|Cl₂|NaOH|màng/i.test(q.prompt)) {
      return { observeStation: 'dien-phan-nacl', observeMicroZone: 'nacl-brine-membrane' };
    }
    return { observeStation: 'dien-phan-cuso4', observeMicroZone: 'cuso4-cathode' };
  }
  return { observeStation: 'dien-phan-cuso4', observeMicroZone: 'cuso4-cathode' };
}

export const VISUAL_LAB_QUESTIONS: VisualLabQuestion[] = [
  {
    id: 'vis-q1-zn-anode',
    kind: 'visual-3d',
    prompt: 'Hãy chọn trực tiếp trên bàn Pin Zn–Cu điện cực xảy ra quá trình oxi hóa (Anode âm).',
    station: 'pin-zn-cu',
    candidateObjects: ['zn-cu-electrode-zn', 'zn-cu-electrode-cu', 'zn-cu-salt-bridge'],
    correctObjectId: 'zn-cu-electrode-zn',
    explanation: 'Trong pin Zn–Cu, thanh kẽm (Zn) có E° nhỏ hơn (−0,763 V) nên là Anode (−), xảy ra sự oxi hóa: Zn → Zn²⁺ + 2e⁻.',
    wrongHint: 'Nhớ quy tắc: trong pin Galvani, kim loại có E° nhỏ hơn là Anode (−) và bị oxi hóa nhường electron.',
  },
  {
    id: 'vis-q2-salt-bridge',
    kind: 'visual-3d',
    prompt: 'Hãy chọn bộ phận giúp khép kín mạch bên trong và trung hòa điện tích hai dung dịch bằng dòng ion K⁺, NO₃⁻.',
    station: 'pin-zn-cu',
    candidateObjects: ['zn-cu-salt-bridge', 'zn-cu-wire', 'zn-cu-switch'],
    correctObjectId: 'zn-cu-salt-bridge',
    explanation: 'Cầu muối KNO₃ dẫn ion NO₃⁻ về ngăn Zn và K⁺ về ngăn Cu để giữ trung hòa điện tích hai bán pin.',
    wrongHint: 'Dây dẫn và công tắc chỉ dẫn electron ở mạch ngoài; sự dịch chuyển ion diễn ra ở cầu muối KNO₃.',
  },
  {
    id: 'vis-q3-cu-cathode',
    kind: 'visual-3d',
    prompt: 'Trong pin Zn–Cu đang phát điện, hãy chọn điện cực có khối lượng tăng dần do kim loại đồng bám lên.',
    station: 'pin-zn-cu',
    candidateObjects: ['zn-cu-electrode-zn', 'zn-cu-electrode-cu', 'zn-cu-voltmeter'],
    correctObjectId: 'zn-cu-electrode-cu',
    explanation: 'Tại Cathode (+) thanh đồng xảy ra quá trình khử Cu²⁺ + 2e⁻ → Cu nên đồng bám thêm làm tăng khối lượng cực Cu.',
    wrongHint: 'Thanh Zn bị mòn đi do tạo Zn²⁺ tan vào dung dịch; đồng bám lên thanh Cu.',
  },
  {
    id: 'vis-q4-cuso4-anode',
    kind: 'visual-3d',
    prompt: 'Trong bình điện phân dung dịch CuSO₄ dùng điện cực trơ, hãy chọn điện cực giải phóng khí O₂.',
    station: 'dien-phan-cuso4',
    cuso4Variant: 'cuso4-inert',
    candidateObjects: ['cuso4-cathode', 'cuso4-anode', 'cuso4-power'],
    correctObjectId: 'cuso4-anode',
    explanation: 'Tại Anode (+) trơ, nước bị oxi hóa: 2H₂O → O₂↑ + 4H⁺ + 4e⁻ tạo các bọt khí O₂.',
    wrongHint: 'Khí O₂ sinh ra do sự oxi hóa H₂O tại cực dương Anode (+), còn Cathode (−) nhận đồng bám.',
  },
  {
    id: 'vis-q5-nacl-membrane',
    kind: 'visual-3d',
    prompt: 'Trong bình điện phân dung dịch NaCl bão hòa, hãy chọn bộ phận ngăn khí Cl₂ tiếp xúc với NaOH và cho ion Na⁺ đi qua.',
    station: 'dien-phan-nacl',
    naclVariant: 'nacl-brine',
    candidateObjects: ['nacl-anode', 'nacl-cathode', 'nacl-membrane'],
    correctObjectId: 'nacl-membrane',
    explanation: 'Màng trao đổi cation cho Na⁺ di chuyển sang ngăn cathode để tạo NaOH sạch, đồng thời ngăn Cl₂ trộn với H₂/OH⁻.',
    wrongHint: 'Hãy quan sát vách ngăn ở chính giữa bể hai ngăn dung dịch NaCl.',
  },
  {
    id: 'vis-q6-nacl-anode',
    kind: 'visual-3d',
    prompt: 'Trong bình điện phân dung dịch NaCl có màng, hãy chọn điện cực xảy ra quá trình oxi hóa 2Cl⁻ → Cl₂↑ + 2e⁻.',
    station: 'dien-phan-nacl',
    naclVariant: 'nacl-brine',
    candidateObjects: ['nacl-anode', 'nacl-cathode', 'nacl-power'],
    correctObjectId: 'nacl-anode',
    explanation: 'Ion Cl⁻ bị oxi hóa tại Anode (+) nối với cực dương nguồn DC, giải phóng khí Cl₂ màu vàng lục.',
    wrongHint: 'Quá trình oxi hóa Cl⁻ luôn xảy ra tại Anode (+) của bình điện phân.',
  },
];

function wrapStandardQuestions(qs: PracticeQuestion[]): DeskQuestionItem[] {
  return qs.map((q) => ({
    ...q,
    kind: 'standard' as const,
    ...inferObserveTargetForQuestion(q),
  }));
}

export function buildPracticeDecks(): PracticeDeck[] {
  const byLesson = (num: number) =>
    wrapStandardQuestions(PRACTICE_QUESTIONS.filter((q) => q.lessonNumber === num));

  return [
    {
      id: 'deck-balanced-12',
      title: 'Đề kiểm tra tổng hợp Chương 5',
      subtitle: '12 câu phân bổ đều cả 6 bài (trắc nghiệm, đúng/sai, tính số)',
      category: 'Bài tập tổng hợp',
      questions: wrapStandardQuestions(buildBalancedQuiz(PRACTICE_QUESTIONS)),
    },
    {
      id: 'deck-visual-3d',
      title: 'Thực hành nhận biết điện cực 3D',
      subtitle: '6 câu chọn trực tiếp dụng cụ & điện cực ngay trên mô hình 3D',
      category: 'Nhận biết điện cực 3D',
      questions: VISUAL_LAB_QUESTIONS,
    },
    {
      id: 'deck-theory-redox',
      title: 'Cặp oxi hóa – khử & Quy tắc α',
      subtitle: '12 câu từ Bài 1 và Bài 3 trong ngân hàng đề cương',
      category: 'Phản ứng oxi hóa – khử',
      lessonFilter: 1,
      questions: [...byLesson(1), ...byLesson(3)],
    },
    {
      id: 'deck-emf-pin',
      title: 'Thế điện cực chuẩn & Pin Galvani',
      subtitle: '12 câu từ Bài 2 và Bài 4 (tính E°pin, chiều e⁻, cầu muối)',
      category: 'Suất điện động & Pin',
      lessonFilter: 4,
      questions: [...byLesson(2), ...byLesson(4)],
    },
    {
      id: 'deck-electrolysis',
      title: 'Bài tập Điện phân CuSO₄ & NaCl',
      subtitle: '6 câu trọng tâm Bài 5 về sản phẩm ở anode/cathode và màng ngăn',
      category: 'Điện phân',
      lessonFilter: 5,
      questions: byLesson(5),
    },
    {
      id: 'deck-faraday',
      title: 'Bài tập Định luật Faraday',
      subtitle: '6 câu tính toán định lượng Bài 6 (m, nₑ, V khí, thời gian t)',
      category: 'Định luật Faraday',
      lessonFilter: 6,
      questions: byLesson(6),
    },
  ];
}

export const PRACTICE_DECKS: PracticeDeck[] = buildPracticeDecks();

// ============================================================================
// 5. MICROSCOPIC 3D VIEW ENGINE (DETERMINISTIC ION & REACTION MODEL)
// ============================================================================

export type MicroZoneId =
  | 'zncu-zn'
  | 'zncu-cu'
  | 'zncu-bridge'
  | 'cuso4-cathode'
  | 'cuso4-anode'
  | 'nacl-molten'
  | 'nacl-brine-membrane';

export type IonSpeciesId =
  | 'Zn2+'
  | 'Cu2+'
  | 'K+'
  | 'NO3-'
  | 'Na+'
  | 'Cl-'
  | 'SO42-'
  | 'OH-'
  | 'H+'
  | 'H2O'
  | 'e-';

export interface IonSpeciesMeta {
  id: IonSpeciesId;
  symbol: string;
  name: string;
  colorHex: number;
  cssColor: string;
  radius: number;
  hydrated: boolean;
  roleSummary: string;
}

export const MICRO_SPECIES_META: Record<IonSpeciesId, IonSpeciesMeta> = {
  'Zn2+': {
    id: 'Zn2+',
    symbol: 'Zn²⁺',
    name: 'Ion kẽm (Zn²⁺)',
    colorHex: 0xc2d1d9,
    cssColor: '#C2D1D9',
    radius: 0.032,
    hydrated: true,
    roleSummary: 'Sinh ra khi nguyên tử Zn trên anode (−) nhường 2e⁻ và đi vào dung dịch ZnSO₄.',
  },
  'Cu2+': {
    id: 'Cu2+',
    symbol: 'Cu²⁺',
    name: 'Ion đồng(II) (Cu²⁺)',
    colorHex: 0x2692f2,
    cssColor: '#2692F2',
    radius: 0.034,
    hydrated: true,
    roleSummary: 'Tạo màu xanh lam cho dung dịch CuSO₄; tiến về cathode nhận 2e⁻ tạo kim loại Cu bám lên điện cực.',
  },
  'K+': {
    id: 'K+',
    symbol: 'K⁺',
    name: 'Cation kali (K⁺)',
    colorHex: 0x62e0c8,
    cssColor: '#62E0C8',
    radius: 0.031,
    hydrated: true,
    roleSummary: 'Di chuyển từ cầu muối KNO₃ sang ngăn Cu để bù điện tích dương bị giảm khi Cu²⁺ bị khử.',
  },
  'NO3-': {
    id: 'NO3-',
    symbol: 'NO₃⁻',
    name: 'Anion nitrate (NO₃⁻)',
    colorHex: 0xf0a05a,
    cssColor: '#F0A05A',
    radius: 0.034,
    hydrated: true,
    roleSummary: 'Di chuyển từ cầu muối KNO₃ sang ngăn Zn để trung hòa lượng ion Zn²⁺ sinh thêm.',
  },
  'Na+': {
    id: 'Na+',
    symbol: 'Na⁺',
    name: 'Cation natri (Na⁺)',
    colorHex: 0x87c6f5,
    cssColor: '#87C6F5',
    radius: 0.03,
    hydrated: true,
    roleSummary: 'Trong NaCl nóng chảy bị khử thành Na; trong dung dịch đi qua màng trao đổi cation sang ngăn cathode tạo NaOH.',
  },
  'Cl-': {
    id: 'Cl-',
    symbol: 'Cl⁻',
    name: 'Anion chloride (Cl⁻)',
    colorHex: 0xb7df5c,
    cssColor: '#B7DF5C',
    radius: 0.035,
    hydrated: true,
    roleSummary: 'Tiến về Anode (+) nhường electron: 2Cl⁻ → Cl₂↑ + 2e⁻ tạo khí chlorine màu vàng lục.',
  },
  'SO42-': {
    id: 'SO42-',
    symbol: 'SO₄²⁻',
    name: 'Anion sulfate (SO₄²⁻)',
    colorHex: 0xd9a86c,
    cssColor: '#D9A86C',
    radius: 0.038,
    hydrated: true,
    roleSummary: 'Ion bền trong dung dịch nước, không bị oxi hóa ở anode trơ (H₂O bị oxi hóa thay thế).',
  },
  'OH-': {
    id: 'OH-',
    symbol: 'OH⁻',
    name: 'Ion hydroxide (OH⁻)',
    colorHex: 0x9b8cf2,
    cssColor: '#9B8CF2',
    radius: 0.029,
    hydrated: true,
    roleSummary: 'Tạo ra tại cathode khi H₂O bị khử (2H₂O + 2e⁻ → H₂↑ + 2OH⁻), kết hợp với Na⁺ tạo dung dịch NaOH.',
  },
  'H+': {
    id: 'H+',
    symbol: 'H⁺',
    name: 'Ion hydrogen (H⁺)',
    colorHex: 0xff7c8a,
    cssColor: '#FF7C8A',
    radius: 0.024,
    hydrated: true,
    roleSummary: 'Sinh ra tại anode trơ khi H₂O bị oxi hóa (2H₂O → O₂↑ + 4H⁺ + 4e⁻), làm dung dịch CuSO₄ chuyển môi trường acid.',
  },
  'H2O': {
    id: 'H2O',
    symbol: 'H₂O',
    name: 'Phân tử nước (H₂O)',
    colorHex: 0x9ee0f5,
    cssColor: '#9EE0F5',
    radius: 0.025,
    hydrated: false,
    roleSummary: 'Tham gia oxi hóa ở anode trơ (sinh O₂ + H⁺) hoặc khử ở cathode (sinh H₂ + OH⁻) khi không có chất dễ phản ứng hơn.',
  },
  'e-': {
    id: 'e-',
    symbol: 'e⁻',
    name: 'Electron (e⁻)',
    colorHex: 0x78f5e0,
    cssColor: '#78F5E0',
    radius: 0.022,
    hydrated: false,
    roleSummary: 'Chỉ di chuyển dọc thanh kim loại và dây dẫn ngoài; không chạy tự do xuyên qua dung dịch điện li hay cầu muối.',
  },
};

export interface MicroZoneMeta {
  id: MicroZoneId;
  station: LabExperimentId;
  title: string;
  shortLabel: string;
  focusCenterLocal: Vec3Tuple; // relative to TABLE_POSITIONS[station]
  cameraOffsetLocal: Vec3Tuple;
  ringRadius: number;
  mechanismTitle: string;
  mechanismDetail: string;
  equationDefault: string;
  speciesList: IonSpeciesId[];
}

export const MICRO_ZONES: Record<MicroZoneId, MicroZoneMeta> = {
  'zncu-zn': {
    id: 'zncu-zn',
    station: 'pin-zn-cu',
    title: 'Bề mặt điện cực Zn · Anode (−)',
    shortLabel: 'Điện cực Zn',
    focusCenterLocal: { x: -0.62, y: 1.24, z: 0.04 },
    cameraOffsetLocal: { x: -0.92, y: 1.38, z: 0.88 },
    ringRadius: 0.28,
    mechanismTitle: 'Sự oxi hóa tại anode (−)',
    mechanismDetail:
      'Nguyên tử Zn ở bề mặt mạng tinh thể nhường 2 electron lên mạch ngoài và tách vào dung dịch dưới dạng ion Zn²⁺.',
    equationDefault: 'Zn → Zn²⁺ + 2e⁻',
    speciesList: ['Zn2+', 'SO42-', 'NO3-', 'e-'],
  },
  'zncu-cu': {
    id: 'zncu-cu',
    station: 'pin-zn-cu',
    title: 'Bề mặt điện cực Cu · Cathode (+)',
    shortLabel: 'Điện cực Cu',
    focusCenterLocal: { x: 0.62, y: 1.24, z: 0.04 },
    cameraOffsetLocal: { x: 0.92, y: 1.38, z: 0.88 },
    ringRadius: 0.28,
    mechanismTitle: 'Sự khử Cu²⁺ tại cathode (+)',
    mechanismDetail:
      'Ion Cu²⁺ trong dung dịch tiến đến bề mặt thanh đồng, nhận 2 electron từ dây dẫn ngoài và kết tủa thành lớp kim loại Cu bám lên bề mặt.',
    equationDefault: 'Cu²⁺ + 2e⁻ → Cu',
    speciesList: ['Cu2+', 'SO42-', 'K+', 'e-'],
  },
  'zncu-bridge': {
    id: 'zncu-bridge',
    station: 'pin-zn-cu',
    title: 'Bên trong cầu muối KNO₃',
    shortLabel: 'Cầu muối KNO₃',
    focusCenterLocal: { x: 0, y: 1.48, z: 0.04 },
    cameraOffsetLocal: { x: 0, y: 1.56, z: 1.02 },
    ringRadius: 0.34,
    mechanismTitle: 'Cân bằng điện tích qua cầu muối',
    mechanismDetail:
      'Cation K⁺ dịch chuyển sang ngăn Cu; anion NO₃⁻ dịch chuyển sang ngăn Zn để trung hòa điện tích hai dung dịch. Electron không chạy qua cầu muối.',
    equationDefault: 'NO₃⁻ → ngăn Zn   ·   K⁺ → ngăn Cu',
    speciesList: ['K+', 'NO3-'],
  },
  'cuso4-cathode': {
    id: 'cuso4-cathode',
    station: 'dien-phan-cuso4',
    title: 'Vùng Cathode (−) · Bình CuSO₄',
    shortLabel: 'Cathode (−)',
    focusCenterLocal: { x: -0.52, y: 1.24, z: 0.08 },
    cameraOffsetLocal: { x: -0.78, y: 1.38, z: 0.92 },
    ringRadius: 0.3,
    mechanismTitle: 'Quá trình khử tại Cathode (−)',
    mechanismDetail:
      'Giai đoạn 1: ion Cu²⁺ nhận 2e⁻ bám đồng đỏ lên cathode. Với điện cực trơ, khi Cu²⁺ đã cạn hẳn, H₂O bị khử sinh bọt khí H₂ và OH⁻.',
    equationDefault: 'Cu²⁺ + 2e⁻ → Cu',
    speciesList: ['Cu2+', 'H2O', 'OH-', 'e-'],
  },
  'cuso4-anode': {
    id: 'cuso4-anode',
    station: 'dien-phan-cuso4',
    title: 'Vùng Anode (+) · Bình CuSO₄',
    shortLabel: 'Anode (+)',
    focusCenterLocal: { x: 0.02, y: 1.24, z: 0.08 },
    cameraOffsetLocal: { x: 0.34, y: 1.38, z: 0.92 },
    ringRadius: 0.3,
    mechanismTitle: 'Quá trình oxi hóa tại Anode (+)',
    mechanismDetail:
      'Điện cực trơ: phân tử H₂O bị oxi hóa sinh khí O₂ và H⁺. Anode đồng: kim loại Cu bị oxi hóa tan thành Cu²⁺, không giải phóng khí O₂.',
    equationDefault: '2H₂O → O₂↑ + 4H⁺ + 4e⁻',
    speciesList: ['H2O', 'H+', 'Cu2+', 'SO42-', 'e-'],
  },
  'nacl-molten': {
    id: 'nacl-molten',
    station: 'dien-phan-nacl',
    title: 'Chất điện li NaCl nóng chảy (không có H₂O)',
    shortLabel: 'NaCl nóng chảy',
    focusCenterLocal: { x: 0.22, y: 1.22, z: 0.08 },
    cameraOffsetLocal: { x: 0.22, y: 1.54, z: 1.08 },
    ringRadius: 0.38,
    mechanismTitle: 'Điện phân muối nóng chảy không có nước',
    mechanismDetail:
      'Chỉ tồn tại ion Na⁺ và Cl⁻ tự do ở nhiệt độ cao: Na⁺ nhận electron ở cathode (−) tạo Na lỏng; Cl⁻ nhường electron ở anode (+) tạo khí Cl₂.',
    equationDefault: 'Cathode: Na⁺ + e⁻ → Na  |  Anode: 2Cl⁻ → Cl₂↑ + 2e⁻',
    speciesList: ['Na+', 'Cl-', 'e-'],
  },
  'nacl-brine-membrane': {
    id: 'nacl-brine-membrane',
    station: 'dien-phan-nacl',
    title: 'Màng trao đổi cation & hai ngăn dung dịch NaCl',
    shortLabel: 'Màng trao đổi cation',
    focusCenterLocal: { x: 0.22, y: 1.24, z: 0.1 },
    cameraOffsetLocal: { x: 0.22, y: 1.44, z: 1.06 },
    ringRadius: 0.4,
    mechanismTitle: 'Màng trao đổi cation chọn lọc ion Na⁺',
    mechanismDetail:
      'Cho phép các cation phù hợp như Na⁺ đi qua sang ngăn cathode để tạo NaOH và góp phần hạn chế sự trộn lẫn sản phẩm Cl₂ với H₂/OH⁻ (mô hình hóa cấu trúc chọn lọc ion, không phải lỗ lọc cơ học theo tỷ lệ thật).',
    equationDefault: 'Na⁺ → qua màng  |  2H₂O + 2e⁻ → H₂↑ + 2OH⁻  |  2Cl⁻ → Cl₂↑ + 2e⁻',
    speciesList: ['Na+', 'Cl-', 'H2O', 'OH-', 'e-'],
  },
};

export function getMicroZonesForStation(
  station: LabExperimentId,
  naclVariant: 'nacl-molten' | 'nacl-brine'
): MicroZoneMeta[] {
  if (station === 'pin-zn-cu') {
    return [MICRO_ZONES['zncu-zn'], MICRO_ZONES['zncu-cu'], MICRO_ZONES['zncu-bridge']];
  }
  if (station === 'dien-phan-cuso4') {
    return [MICRO_ZONES['cuso4-cathode'], MICRO_ZONES['cuso4-anode']];
  }
  return naclVariant === 'nacl-molten'
    ? [MICRO_ZONES['nacl-molten']]
    : [MICRO_ZONES['nacl-brine-membrane']];
}

export interface MicroParticleInstance {
  id: string;
  species: IonSpeciesId;
  position: Vec3Tuple; // world space
  scale: number;
  highlighted: boolean;
  hydrated: boolean;
}

export interface MicroscopicFrameData {
  zone: MicroZoneId;
  station: LabExperimentId;
  particles: MicroParticleInstance[];
  activeSpecies: IonSpeciesId[];
  equationText: string;
  mechanismTitle: string;
  mechanismDetail: string;
  hasWater: boolean;
  hasO2AtAnode: boolean;
  hasH2AtCathode: boolean;
  hasMembrane: boolean;
}

// Deterministic pseudo-random helper
function hashUnit(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Pure deterministic generator for microscopic ion positions (thermal harmonics + directed drift).
 * Guarantees:
 * - Zero electrons inside solution or salt bridge
 * - Zero water molecules or H2 in molten NaCl
 * - Zero O2 at copper anode in CuSO4
 * - Stage-2 transition in CuSO4 inert once Cu2+ is depleted
 * - 100% reproducible on pause, speed change, or backward scrub
 */
export function computeMicroscopicFrame(args: {
  zone: MicroZoneId;
  galvanic: GalvanicCellSnapshot;
  cuso4Variant: 'cuso4-inert' | 'cuso4-copper';
  cuso4Snapshot: ElectrolysisSnapshot;
  naclVariant: 'nacl-molten' | 'nacl-brine';
  naclSnapshot: ElectrolysisSnapshot;
  trackedSpecies: IonSpeciesId | null;
  reducedMotion: boolean;
  particleDensityScale?: number; // 0.65 on low-power / software WebGL, 1.0 on GPU
}): MicroscopicFrameData {
  const {
    zone,
    galvanic,
    cuso4Variant,
    cuso4Snapshot,
    naclVariant,
    naclSnapshot,
    trackedSpecies,
    reducedMotion,
    particleDensityScale = 1,
  } = args;

  const meta = MICRO_ZONES[zone];
  const base = TABLE_POSITIONS[meta.station];
  const particles: MicroParticleInstance[] = [];
  const count = (n: number) => Math.max(3, Math.round(n * particleDensityScale));

  const thermal = (t: number, idx: number, amp = 0.018): Vec3Tuple => {
    if (reducedMotion) return { x: 0, y: 0, z: 0 };
    return {
      x: Math.sin(t * 1.4 + idx * 2.13) * amp,
      y: Math.cos(t * 1.15 + idx * 1.71) * amp * 0.85,
      z: Math.sin(t * 1.3 + idx * 2.89) * amp,
    };
  };

  let equationText = meta.equationDefault;
  let mechanismTitle = meta.mechanismTitle;
  let mechanismDetail = meta.mechanismDetail;
  let hasWater = true;
  let hasO2AtAnode = false;
  let hasH2AtCathode = false;
  let hasMembrane = false;
  const speciesSet = new Set<IonSpeciesId>();

  const pushParticle = (
    id: string,
    species: IonSpeciesId,
    localX: number,
    localY: number,
    localZ: number,
    scale = 1
  ) => {
    speciesSet.add(species);
    const sp = MICRO_SPECIES_META[species];
    particles.push({
      id,
      species,
      position: {
        x: base.x + localX,
        y: base.y + localY,
        z: base.z + localZ,
      },
      scale: trackedSpecies === species ? scale * 1.28 : trackedSpecies ? scale * 0.78 : scale,
      highlighted: trackedSpecies === species,
      hydrated: sp.hydrated && !(zone === 'nacl-molten'),
    });
  };

  if (zone === 'zncu-zn') {
    const t = galvanic.circuitClosed ? galvanic.timeSeconds : 0;
    const drift = galvanic.circuitClosed ? 1 : 0;
    const nZn = count(8);
    for (let i = 0; i < nZn; i++) {
      // Zn2+ detaching from x = -0.66 outward into beaker center (-0.52)
      const cycle = drift ? ((t * 0.16 + i / nZn) % 1) : (i / nZn) * 0.85;
      const th = thermal(t, i + 10);
      const lx = -0.63 + cycle * 0.28 + th.x;
      const ly = 1.08 + hashUnit(i * 7 + 1) * 0.32 + th.y;
      const lz = (hashUnit(i * 11 + 2) - 0.5) * 0.24 + th.z;
      pushParticle(`zn2-${i}`, 'Zn2+', lx, ly, lz);
    }
    const nNo3 = count(5);
    for (let i = 0; i < nNo3; i++) {
      const cycle = drift ? ((t * 0.14 + i / nNo3) % 1) : i / nNo3;
      const th = thermal(t, i + 40);
      pushParticle(
        `no3-zn-${i}`,
        'NO3-',
        -0.36 - cycle * 0.18 + th.x,
        1.14 + hashUnit(i * 5 + 3) * 0.26 + th.y,
        (hashUnit(i * 9 + 4) - 0.5) * 0.2 + th.z
      );
    }
    const nSo4 = count(4);
    for (let i = 0; i < nSo4; i++) {
      const th = thermal(t, i + 70, 0.022);
      pushParticle(
        `so4-zn-${i}`,
        'SO42-',
        -0.5 + (hashUnit(i * 13 + 5) - 0.5) * 0.22 + th.x,
        1.08 + hashUnit(i * 17 + 6) * 0.28 + th.y,
        (hashUnit(i * 19 + 7) - 0.5) * 0.2 + th.z
      );
    }
    // Electrons ONLY inside the metallic Zn bar moving upward into the external wire
    if (galvanic.circuitClosed) {
      for (let i = 0; i < 4; i++) {
        const up = (t * 0.28 + i / 4) % 1;
        pushParticle(`e-zn-${i}`, 'e-', -0.66, 1.12 + up * 0.52, 0.04, 0.9);
      }
    }
    if (!galvanic.circuitClosed) {
      mechanismDetail =
        'Công tắc đang mở: không có dòng electron qua tải ngoài nên không có quá trình oxi hóa liên tục trên thanh Zn (vôn kế đo E°pin = 1,103 V).';
    }
  } else if (zone === 'zncu-cu') {
    const t = galvanic.circuitClosed ? galvanic.timeSeconds : 0;
    const drift = galvanic.circuitClosed ? 1 : 0;
    const nCu = count(9);
    for (let i = 0; i < nCu; i++) {
      // Cu2+ migrating from beaker center (+0.42) onto Cu electrode (+0.65)
      const cycle = drift ? ((t * 0.16 + i / nCu) % 1) : (i / nCu) * 0.85;
      const th = thermal(t, i + 100);
      const lx = 0.36 + cycle * 0.27 + th.x;
      const ly = 1.08 + hashUnit(i * 7 + 11) * 0.32 + th.y;
      const lz = (hashUnit(i * 11 + 12) - 0.5) * 0.24 + th.z;
      pushParticle(`cu2-${i}`, 'Cu2+', lx, ly, lz);
    }
    const nK = count(5);
    for (let i = 0; i < nK; i++) {
      const cycle = drift ? ((t * 0.14 + i / nK) % 1) : i / nK;
      const th = thermal(t, i + 140);
      pushParticle(
        `k-cu-${i}`,
        'K+',
        0.34 + cycle * 0.16 + th.x,
        1.14 + hashUnit(i * 5 + 13) * 0.26 + th.y,
        (hashUnit(i * 9 + 14) - 0.5) * 0.2 + th.z
      );
    }
    const nSo4 = count(4);
    for (let i = 0; i < nSo4; i++) {
      const th = thermal(t, i + 170, 0.022);
      pushParticle(
        `so4-cu-${i}`,
        'SO42-',
        0.5 + (hashUnit(i * 13 + 15) - 0.5) * 0.22 + th.x,
        1.08 + hashUnit(i * 17 + 16) * 0.28 + th.y,
        (hashUnit(i * 19 + 17) - 0.5) * 0.2 + th.z
      );
    }
    // Electrons ONLY inside the metallic Cu bar coming down from wire
    if (galvanic.circuitClosed) {
      for (let i = 0; i < 4; i++) {
        const down = (t * 0.28 + i / 4) % 1;
        pushParticle(`e-cu-${i}`, 'e-', 0.66, 1.62 - down * 0.5, 0.04, 0.9);
      }
    }
    if (!galvanic.circuitClosed) {
      mechanismDetail =
        'Công tắc đang mở: electron không đi tới thanh Cu nên không diễn ra quá trình khử tạo lớp đồng mới.';
    }
  } else if (zone === 'zncu-bridge') {
    const t = galvanic.circuitClosed ? galvanic.timeSeconds : 0;
    const drift = galvanic.circuitClosed ? 1 : 0;
    const nPairs = count(6);
    for (let i = 0; i < nPairs; i++) {
      // K+ moving left (-0.32) -> right (+0.32) along top arch of salt bridge
      const uK = drift ? ((t * 0.14 + i / nPairs) % 1) : i / nPairs;
      const thK = thermal(t, i + 200, 0.008);
      const xK = -0.3 + uK * 0.6 + thK.x;
      const yK = 1.54 - Math.pow((uK - 0.5) * 2, 4) * 0.22 + thK.y;
      pushParticle(`bridge-k-${i}`, 'K+', xK, yK, 0.065 + thK.z * 0.4);

      // NO3- moving right (+0.32) -> left (-0.32)
      const uN = drift ? ((t * 0.14 + i / nPairs + 0.5) % 1) : i / nPairs;
      const thN = thermal(t, i + 230, 0.008);
      const xN = 0.3 - uN * 0.6 + thN.x;
      const yN = 1.5 - Math.pow((uN - 0.5) * 2, 4) * 0.22 + thN.y;
      pushParticle(`bridge-no3-${i}`, 'NO3-', xN, yN, 0.015 + thN.z * 0.4);
    }
    // Explicitly ZERO electrons in salt bridge!
  } else if (zone === 'cuso4-cathode') {
    const t = cuso4Snapshot.timeSeconds;
    const inStage2 = cuso4Variant === 'cuso4-inert' && cuso4Snapshot.stage === 2;
    hasH2AtCathode = inStage2;
    hasO2AtAnode = cuso4Variant === 'cuso4-inert' && t > 0;
    equationText = `Cathode (−): ${cuso4Snapshot.cathodeEquation}`;

    if (inStage2) {
      mechanismTitle = 'Giai đoạn 2 · Cu²⁺ đã cạn, khử nước sinh H₂';
      mechanismDetail =
        'Ion Cu²⁺ trong dung dịch đã bị khử hết. Lớp đồng ngừng dày thêm; phân tử H₂O bị khử tại cathode tạo bọt khí H₂ và ion OH⁻.';
      const nW = count(7);
      for (let i = 0; i < nW; i++) {
        const cycle = (t * 0.003 + i / nW) % 1;
        const th = thermal(t * 0.05, i + 300);
        pushParticle(
          `h2o-c2-${i}`,
          'H2O',
          -0.28 - cycle * 0.22 + th.x,
          1.08 + hashUnit(i * 7 + 21) * 0.3 + th.y,
          0.08 + (hashUnit(i * 11 + 22) - 0.5) * 0.22 + th.z
        );
      }
      const nOh = count(5);
      for (let i = 0; i < nOh; i++) {
        const cycle = (t * 0.0028 + i / nOh) % 1;
        const th = thermal(t * 0.05, i + 330);
        pushParticle(
          `oh-c2-${i}`,
          'OH-',
          -0.5 + cycle * 0.2 + th.x,
          1.12 + hashUnit(i * 5 + 23) * 0.28 + th.y,
          0.08 + (hashUnit(i * 9 + 24) - 0.5) * 0.2 + th.z
        );
      }
    } else {
      mechanismTitle = 'Khử ion Cu²⁺ tạo đồng bám trên Cathode (−)';
      mechanismDetail =
        cuso4Variant === 'cuso4-copper'
          ? 'Ion Cu²⁺ nhận 2e⁻ bám lên cathode, đồng thời anode Cu tan bổ sung lượng Cu²⁺ tương đương nên màu xanh giữ nguyên.'
          : 'Ion Cu²⁺ tiến về cực âm cathode, nhận 2e⁻ và tạo lớp đồng đỏ bám dày dần; nồng độ Cu²⁺ giảm dần cho tới mốc hết Cu²⁺.';
      const remainingRatio =
        cuso4Variant === 'cuso4-copper' ? 1 : Math.max(0.22, cuso4Snapshot.cu2Ratio);
      const nCu = Math.max(3, Math.round(count(9) * remainingRatio));
      for (let i = 0; i < nCu; i++) {
        const cycle = t > 0 ? ((t * 0.0032 + i / nCu) % 1) : (i / nCu) * 0.85;
        const th = thermal(t * 0.05, i + 350);
        pushParticle(
          `cu2-cat-${i}`,
          'Cu2+',
          -0.22 - cycle * 0.28 + th.x,
          1.08 + hashUnit(i * 7 + 31) * 0.32 + th.y,
          0.08 + (hashUnit(i * 11 + 32) - 0.5) * 0.22 + th.z
        );
      }
      const nW = count(4);
      for (let i = 0; i < nW; i++) {
        const th = thermal(t * 0.05, i + 380, 0.02);
        pushParticle(
          `h2o-cat-${i}`,
          'H2O',
          -0.36 + (hashUnit(i * 13 + 33) - 0.5) * 0.24 + th.x,
          1.1 + hashUnit(i * 17 + 34) * 0.28 + th.y,
          0.08 + (hashUnit(i * 19 + 35) - 0.5) * 0.2 + th.z
        );
      }
    }
    if (t > 0) {
      for (let i = 0; i < 4; i++) {
        const down = (t * 0.006 + i / 4) % 1;
        pushParticle(`e-cucat-${i}`, 'e-', -0.54, 1.56 - down * 0.44, 0.08, 0.88);
      }
    }
  } else if (zone === 'cuso4-anode') {
    const t = cuso4Snapshot.timeSeconds;
    equationText = `Anode (+): ${cuso4Snapshot.anodeEquation}`;
    if (cuso4Variant === 'cuso4-copper') {
      hasO2AtAnode = false;
      mechanismTitle = 'Anode đồng tan · Cu → Cu²⁺ + 2e⁻';
      mechanismDetail =
        'Với anode bằng đồng, kim loại Cu trực tiếp bị oxi hóa tan thành Cu²⁺ đi vào dung dịch. Không xảy ra sự oxi hóa H₂O và không sinh khí O₂.';
      const nCu = count(8);
      for (let i = 0; i < nCu; i++) {
        const cycle = t > 0 ? ((t * 0.0032 + i / nCu) % 1) : (i / nCu) * 0.85;
        const th = thermal(t * 0.05, i + 400);
        pushParticle(
          `cu2-an-${i}`,
          'Cu2+',
          0.02 - cycle * 0.26 + th.x,
          1.08 + hashUnit(i * 7 + 41) * 0.32 + th.y,
          0.08 + (hashUnit(i * 11 + 42) - 0.5) * 0.22 + th.z
        );
      }
    } else {
      hasO2AtAnode = t > 0;
      mechanismTitle = 'Oxi hóa H₂O tại Anode (+) trơ · Sinh khí O₂';
      mechanismDetail =
        'Anion SO₄²⁻ không bị oxi hóa trong dung dịch nước; phân tử H₂O nhường electron tạo khí O₂ nổi lên và ion H⁺ làm tăng tính acid.';
      const nW = count(6);
      for (let i = 0; i < nW; i++) {
        const cycle = t > 0 ? ((t * 0.003 + i / nW) % 1) : i / nW;
        const th = thermal(t * 0.05, i + 420);
        pushParticle(
          `h2o-an-${i}`,
          'H2O',
          -0.22 + cycle * 0.22 + th.x,
          1.08 + hashUnit(i * 5 + 43) * 0.3 + th.y,
          0.08 + (hashUnit(i * 9 + 44) - 0.5) * 0.2 + th.z
        );
      }
      const nH = count(6);
      for (let i = 0; i < nH; i++) {
        const cycle = t > 0 ? ((t * 0.0028 + i / nH) % 1) : i / nH;
        const th = thermal(t * 0.05, i + 450);
        pushParticle(
          `hplus-an-${i}`,
          'H+',
          0.0 - cycle * 0.22 + th.x,
          1.12 + hashUnit(i * 13 + 45) * 0.28 + th.y,
          0.08 + (hashUnit(i * 17 + 46) - 0.5) * 0.2 + th.z
        );
      }
    }
    const nSo4 = count(4);
    for (let i = 0; i < nSo4; i++) {
      const th = thermal(t * 0.05, i + 480, 0.02);
      pushParticle(
        `so4-an-${i}`,
        'SO42-',
        -0.12 + (hashUnit(i * 19 + 47) - 0.5) * 0.24 + th.x,
        1.1 + hashUnit(i * 23 + 48) * 0.26 + th.y,
        0.08 + (hashUnit(i * 29 + 49) - 0.5) * 0.18 + th.z
      );
    }
    if (t > 0) {
      for (let i = 0; i < 4; i++) {
        const up = (t * 0.006 + i / 4) % 1;
        pushParticle(`e-cuan-${i}`, 'e-', 0.04, 1.12 + up * 0.44, 0.08, 0.88);
      }
    }
  } else if (zone === 'nacl-molten') {
    const t = naclSnapshot.timeSeconds;
    hasWater = false; // CRITICAL: ZERO water in molten NaCl!
    hasMembrane = false;
    hasH2AtCathode = false;
    equationText = 'Cathode (−): Na⁺ + e⁻ → Na   |   Anode (+): 2Cl⁻ → Cl₂↑ + 2e⁻';

    const nNa = count(8);
    for (let i = 0; i < nNa; i++) {
      // Na+ moving toward right cathode (+0.52)
      const cycle = t > 0 ? ((t * 0.0032 + i / nNa) % 1) : (i / nNa) * 0.85;
      const th = thermal(t * 0.05, i + 500);
      pushParticle(
        `na-mol-${i}`,
        'Na+',
        0.16 + cycle * 0.34 + th.x,
        1.1 + hashUnit(i * 7 + 51) * 0.24 + th.y,
        0.08 + (hashUnit(i * 11 + 52) - 0.5) * 0.22 + th.z
      );
    }
    const nCl = count(8);
    for (let i = 0; i < nCl; i++) {
      // Cl- moving toward left anode (-0.08)
      const cycle = t > 0 ? ((t * 0.0032 + i / nCl) % 1) : (i / nCl) * 0.85;
      const th = thermal(t * 0.05, i + 530);
      pushParticle(
        `cl-mol-${i}`,
        'Cl-',
        0.28 - cycle * 0.34 + th.x,
        1.1 + hashUnit(i * 5 + 53) * 0.24 + th.y,
        0.08 + (hashUnit(i * 9 + 54) - 0.5) * 0.22 + th.z
      );
    }
  } else if (zone === 'nacl-brine-membrane') {
    const t = naclSnapshot.timeSeconds;
    hasWater = true;
    hasMembrane = true;
    hasH2AtCathode = t > 0;
    equationText = 'Cathode (−): 2H₂O + 2e⁻ → H₂↑ + 2OH⁻   |   Anode (+): 2Cl⁻ → Cl₂↑ + 2e⁻';

    // Na+ crossing membrane from anode side (+0.02) -> cathode side (+0.44)
    const nNa = count(7);
    for (let i = 0; i < nNa; i++) {
      const cycle = t > 0 ? ((t * 0.003 + i / nNa) % 1) : i / nNa;
      const th = thermal(t * 0.05, i + 600, 0.012);
      pushParticle(
        `na-brine-${i}`,
        'Na+',
        0.02 + cycle * 0.42 + th.x,
        1.1 + hashUnit(i * 7 + 61) * 0.28 + th.y,
        0.08 + (hashUnit(i * 11 + 62) - 0.5) * 0.2 + th.z
      );
    }
    // Cl- staying in anode compartment (-0.08 .. +0.16)
    const nCl = count(6);
    for (let i = 0; i < nCl; i++) {
      const cycle = t > 0 ? ((t * 0.003 + i / nCl) % 1) : i / nCl;
      const th = thermal(t * 0.05, i + 630);
      pushParticle(
        `cl-brine-${i}`,
        'Cl-',
        0.16 - cycle * 0.22 + th.x,
        1.1 + hashUnit(i * 5 + 63) * 0.28 + th.y,
        0.08 + (hashUnit(i * 9 + 64) - 0.5) * 0.2 + th.z
      );
    }
    // OH- formed in cathode compartment (+0.30 .. +0.52)
    const nOh = count(6);
    for (let i = 0; i < nOh; i++) {
      const cycle = t > 0 ? ((t * 0.0028 + i / nOh) % 1) : i / nOh;
      const th = thermal(t * 0.05, i + 660);
      pushParticle(
        `oh-brine-${i}`,
        'OH-',
        0.5 - cycle * 0.18 + th.x,
        1.12 + hashUnit(i * 13 + 65) * 0.26 + th.y,
        0.08 + (hashUnit(i * 17 + 66) - 0.5) * 0.2 + th.z
      );
    }
    // H2O near cathode
    const nW = count(5);
    for (let i = 0; i < nW; i++) {
      const th = thermal(t * 0.05, i + 690, 0.018);
      pushParticle(
        `h2o-brine-${i}`,
        'H2O',
        0.38 + (hashUnit(i * 19 + 67) - 0.5) * 0.22 + th.x,
        1.08 + hashUnit(i * 23 + 68) * 0.28 + th.y,
        0.08 + (hashUnit(i * 29 + 69) - 0.5) * 0.18 + th.z
      );
    }
  }

  return {
    zone,
    station: meta.station,
    particles,
    activeSpecies: Array.from(speciesSet),
    equationText,
    mechanismTitle,
    mechanismDetail,
    hasWater,
    hasO2AtAnode,
    hasH2AtCathode,
    hasMembrane,
  };
}

// ============================================================================
// 6. UNIFIED WORLD CAMERA DIRECTOR PRESETS
// ============================================================================

export function getWorldCameraPreset(args: {
  zone: WorldZone;
  station: LabExperimentId | null;
  objectId: LabObjectId | null;
  microZone: MicroZoneId;
  aspect: number;
}): CameraPreset {
  const { zone, station, objectId, microZone, aspect } = args;
  const safeAspect = Number.isFinite(aspect) && aspect > 0.25 ? aspect : 16 / 9;

  if (zone === 'OVERVIEW') {
    // Fit Smart Board (back-left), 3 Lab Tables (center), and Practice Desk (front-right) cleanly!
    const halfVRad = (21 * Math.PI) / 180;
    const tanHalfH = Math.max(0.24, Math.tan(halfVRad) * safeAspect);
    const requiredZ = 6.25 / tanHalfH;
    const zDist = Math.max(9.6, Math.min(18.2, requiredZ * 0.96));
    const yHeight = safeAspect < 1 ? 5.65 + (zDist - 9.6) * 0.34 : 5.75;
    return {
      position: { x: 0.2, y: yHeight, z: zDist },
      target: { x: 0.15, y: 1.25, z: -0.1 },
      minDistance: 4.5,
      maxDistance: Math.max(18, zDist * 1.45),
    };
  }

  if (zone === 'BOARD') {
    const bc = WORLD_ANCHORS.boardCenter;
    const mobileBack = safeAspect < 0.95 ? 1.35 : 1;
    return {
      position: { x: bc.x + 0.06, y: bc.y + 0.05, z: bc.z + 4.35 * mobileBack },
      target: { x: bc.x, y: bc.y, z: bc.z },
      minDistance: 2.2,
      maxDistance: 8.5,
    };
  }

  if (zone === 'PRACTICE') {
    const pp = WORLD_ANCHORS.practicePaperCenter;
    const mobileBack = safeAspect < 0.95 ? 1.28 : 1;
    return {
      position: { x: pp.x - 0.55 * mobileBack, y: pp.y + 1.45 * mobileBack, z: pp.z + 1.85 * mobileBack },
      target: { x: pp.x, y: pp.y + 0.04, z: pp.z },
      minDistance: 1.1,
      maxDistance: 6.2,
    };
  }

  if (zone === 'MICRO') {
    const meta = MICRO_ZONES[microZone];
    const base = TABLE_POSITIONS[meta.station];
    const mobileBack = safeAspect < 0.95 ? 1.24 : 1;
    return {
      position: {
        x: base.x + meta.cameraOffsetLocal.x * mobileBack,
        y: base.y + meta.cameraOffsetLocal.y,
        z: base.z + meta.cameraOffsetLocal.z * mobileBack,
      },
      target: {
        x: base.x + meta.focusCenterLocal.x,
        y: base.y + meta.focusCenterLocal.y,
        z: base.z + meta.focusCenterLocal.z,
      },
      minDistance: 0.55,
      maxDistance: 3.4,
    };
  }

  // Delegate TABLE / OBJECT / REACTION cleanly to existing tested preset calculator
  return getCameraPreset(zone, station, objectId, safeAspect);
}

// ============================================================================
// 7. BEFORE / AFTER COMPARISON SNAPSHOT (SINGLE SOURCE OF TRUTH)
// ============================================================================

export interface BeforeAfterMetric {
  label: string;
  beforeText: string;
  afterText: string;
}

export function buildBeforeAfterComparison(args: {
  station: LabExperimentId;
  galvanic: GalvanicCellSnapshot;
  cuso4Variant: 'cuso4-inert' | 'cuso4-copper';
  cuso4Params: ElectrolysisParams;
  cuso4Snapshot: ElectrolysisSnapshot;
  naclVariant: 'nacl-molten' | 'nacl-brine';
  naclParams: ElectrolysisParams;
  naclSnapshot: ElectrolysisSnapshot;
}): BeforeAfterMetric[] {
  const { station, galvanic, cuso4Variant, cuso4Params, cuso4Snapshot, naclVariant, naclParams, naclSnapshot } = args;

  if (station === 'pin-zn-cu') {
    return [
      {
        label: 'Thời điểm mô phỏng',
        beforeText: '0 s (ban đầu)',
        afterText: `${galvanic.timeSeconds.toFixed(1).replace('.', ',')} s`,
      },
      {
        label: 'Thanh Zn · Anode (−)',
        beforeText: 'Chưa mòn (0 mg)',
        afterText: `Đã oxi hóa ${galvanic.znDissolvedMg.toFixed(1).replace('.', ',')} mg`,
      },
      {
        label: 'Thanh Cu · Cathode (+)',
        beforeText: 'Chưa bám thêm (0 mg)',
        afterText: `Đồng bám thêm ${galvanic.cuDepositedMg.toFixed(1).replace('.', ',')} mg`,
      },
      {
        label: 'Dung dịch CuSO₄',
        beforeText: 'Xanh lam đậm (1,00 M)',
        afterText: galvanic.progress > 0.05 ? 'Màu xanh nhạt dần do Cu²⁺ giảm' : 'Xanh lam đậm',
      },
    ];
  }

  if (station === 'dien-phan-cuso4') {
    const startSnap = computeElectrolysisAtTime(cuso4Params, 0);
    return [
      {
        label: 'Số mol electron nₑ',
        beforeText: `${startSnap.electronMol.toFixed(4).replace('.', ',')} mol`,
        afterText: `${cuso4Snapshot.electronMol.toFixed(4).replace('.', ',')} mol`,
      },
      {
        label: 'Đồng bám Cathode (−)',
        beforeText: '0,000 g',
        afterText: `${cuso4Snapshot.cuPlatedG.toFixed(3).replace('.', ',')} g`,
      },
      {
        label: cuso4Variant === 'cuso4-inert' ? 'Cu²⁺ còn lại trong dung dịch' : 'Anode đồng hòa tan',
        beforeText:
          cuso4Variant === 'cuso4-inert'
            ? `${startSnap.cu2RemainingMol.toFixed(4).replace('.', ',')} mol`
            : '0,000 g',
        afterText:
          cuso4Variant === 'cuso4-inert'
            ? `${cuso4Snapshot.cu2RemainingMol.toFixed(4).replace('.', ',')} mol`
            : `${cuso4Snapshot.cuLostAtAnodeG.toFixed(3).replace('.', ',')} g`,
      },
      {
        label: 'Khí giải phóng',
        beforeText: '0,000 L',
        afterText:
          cuso4Variant === 'cuso4-inert'
            ? `O₂: ${cuso4Snapshot.o2VolumeL.toFixed(3).replace('.', ',')} L · H₂: ${cuso4Snapshot.h2VolumeL.toFixed(3).replace('.', ',')} L`
            : 'Không có khí O₂ / H₂',
      },
    ];
  }

  const startNaCl = computeElectrolysisAtTime(naclParams, 0);
  return [
    {
      label: 'Số mol electron nₑ',
      beforeText: `${startNaCl.electronMol.toFixed(4).replace('.', ',')} mol`,
      afterText: `${naclSnapshot.electronMol.toFixed(4).replace('.', ',')} mol`,
    },
    {
      label: 'Khí Cl₂ tại Anode (+)',
      beforeText: '0,000 L',
      afterText: `${naclSnapshot.cl2VolumeL.toFixed(3).replace('.', ',')} L`,
    },
    {
      label: naclVariant === 'nacl-molten' ? 'Kim loại Na tại Cathode (−)' : 'Khí H₂ tại Cathode (−)',
      beforeText: naclVariant === 'nacl-molten' ? '0,000 g' : '0,000 L',
      afterText:
        naclVariant === 'nacl-molten'
          ? `${naclSnapshot.naProducedG.toFixed(3).replace('.', ',')} g`
          : `${naclSnapshot.h2VolumeL.toFixed(3).replace('.', ',')} L`,
    },
    {
      label: naclVariant === 'nacl-molten' ? 'Môi trường điện li' : 'NaOH (OH⁻) tạo thành',
      beforeText: naclVariant === 'nacl-molten' ? 'NaCl nóng chảy (không có H₂O)' : '0,0000 mol',
      afterText:
        naclVariant === 'nacl-molten'
          ? 'NaCl nóng chảy (không có H₂O)'
          : `${naclSnapshot.ohProducedMol.toFixed(4).replace('.', ',')} mol`,
    },
  ];
}

// Re-export TABLE_TOP_Y for convenience in world scene modules
export { TABLE_TOP_Y, LAB_OBJECTS };
