import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  GalvanicCellSnapshot,
  LAB_OBJECTS,
  LAB_TABLES,
  Lab3DVisuals,
  LabExperimentId,
  LabObjectId,
  SmartPopupLayout,
  TABLE_POSITIONS,
  TABLE_TOP_Y,
  Vec3Tuple,
  computeSmartPopupLayout,
  easeInOutCubic,
  getWorldAnchorForObject,
  interpolateVec3,
} from '../../utils/lab3dState';
import {
  CAMERA_SPEED_DURATION_MS,
  CameraSpeedMode,
  IonSpeciesId,
  MICRO_SPECIES_META,
  MICRO_ZONES,
  MicroZoneId,
  MicroscopicFrameData,
  WORLD_ANCHORS,
  WorldZone,
  getWorldCameraPreset,
} from '../../utils/labWorldState';
import { ElectrolysisParams, ElectrolysisSnapshot } from '../../utils/electrochemEngine';
import { formatViNumber } from '../../utils/faraday';
import { ChemText } from '../ChemText';
import {
  LabSceneRig,
  buildLabScene,
  disposeLabScene,
  updateLabSceneVisuals,
} from './labSceneBuilder';
import {
  ArrowLeft,
  BookOpen,
  Eye,
  FileText,
  FlaskConical,
  Microscope,
  Pause,
  Play,
  Power,
  X,
} from 'lucide-react';

export interface Lab3DCanvasHandle {
  captureThumbnail: () => string | null;
}

export interface MicroDisplayOptions {
  showIonLabels: boolean;
  showArrows: boolean;
  showEquations: boolean;
  showReactionZone: boolean;
  showHydration: boolean;
  cutaway: boolean;
}

export interface VisualQuizState {
  active: boolean;
  prompt: string;
  candidateObjects: LabObjectId[];
  selectedObjectId: LabObjectId | null;
}

interface Lab3DCanvasProps {
  worldZone: WorldZone;
  selectedStation: LabExperimentId | null;
  selectedObject: LabObjectId | null;
  microZone: MicroZoneId;
  microFrame: MicroscopicFrameData | null;
  microOptions: MicroDisplayOptions;
  trackedSpecies: IonSpeciesId | null;
  cameraSpeedMode: CameraSpeedMode;
  practiceFlipNonce: number;
  visualQuiz: VisualQuizState | null;
  cameraRequestNonce: number;
  showLabels: boolean;
  reducedMotion: boolean;
  isRunning: boolean;
  visuals: Lab3DVisuals;
  galvanicSnapshot: GalvanicCellSnapshot;
  cuso4Variant: 'cuso4-inert' | 'cuso4-copper';
  cuso4Params: ElectrolysisParams;
  cuso4Snapshot: ElectrolysisSnapshot;
  naclVariant: 'nacl-molten' | 'nacl-brine';
  naclParams: ElectrolysisParams;
  naclSnapshot: ElectrolysisSnapshot;
  onSelectZone: (zone: 'BOARD' | 'PRACTICE') => void;
  onSelectStation: (station: LabExperimentId) => void;
  onSelectObject: (objectId: LabObjectId) => void;
  onVisualQuizPick?: (objectId: LabObjectId) => void;
  onSelectSpecies?: (species: IonSpeciesId | null) => void;
  onEnterMicro?: (microZone?: MicroZoneId) => void;
  onExitMicro?: () => void;
  onBackToTable: () => void;
  onOpenReactionView: () => void;
  onToggleRun: () => void;
  onTogglePinSwitch: () => void;
  onFallbackTo2D: () => void;
  children?: React.ReactNode;
}

interface ProjectedPoint {
  x: number;
  y: number;
  visible: boolean;
}

interface ProjectedSpeciesChip {
  species: IonSpeciesId;
  x: number;
  y: number;
}

interface ProjectedOverlayState {
  viewportW: number;
  viewportH: number;
  boardBadge: ProjectedPoint;
  practiceBadge: ProjectedPoint;
  tables: Record<LabExperimentId, ProjectedPoint>;
  microChips: ProjectedSpeciesChip[];
  popupLayout: SmartPopupLayout | null;
  hoverBadge: { x: number; y: number; title: string; hint: string } | null;
}

function detectWebGLSupport(): { supported: boolean; isSoftwareGl: boolean } {
  if (typeof document === 'undefined') return { supported: false, isSoftwareGl: true };
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return { supported: false, isSoftwareGl: true };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return { supported: true, isSoftwareGl };
  } catch {
    return { supported: false, isSoftwareGl: true };
  }
}

function defaultMicroZoneForObject(
  objectId: LabObjectId,
  naclVariant: 'nacl-molten' | 'nacl-brine'
): MicroZoneId {
  if (objectId === 'zn-cu-electrode-zn' || objectId === 'zn-cu-beaker-zn') return 'zncu-zn';
  if (objectId === 'zn-cu-electrode-cu' || objectId === 'zn-cu-beaker-cu') return 'zncu-cu';
  if (objectId === 'zn-cu-salt-bridge') return 'zncu-bridge';
  if (objectId === 'cuso4-anode') return 'cuso4-anode';
  if (objectId.startsWith('cuso4-')) return 'cuso4-cathode';
  if (objectId.startsWith('nacl-')) {
    return naclVariant === 'nacl-molten' ? 'nacl-molten' : 'nacl-brine-membrane';
  }
  return 'zncu-zn';
}

export const Lab3DCanvas = React.forwardRef<Lab3DCanvasHandle, Lab3DCanvasProps>(
  function Lab3DCanvas(props, ref) {
    const {
      worldZone,
      selectedStation,
      selectedObject,
      microZone,
      microFrame,
      microOptions,
      trackedSpecies,
      cameraSpeedMode,
      practiceFlipNonce,
      visualQuiz,
      cameraRequestNonce,
      showLabels,
      reducedMotion,
      isRunning,
      visuals,
      galvanicSnapshot,
      cuso4Variant,
      cuso4Params,
      cuso4Snapshot,
      naclVariant,
      naclParams,
      naclSnapshot,
      onSelectZone,
      onSelectStation,
      onSelectObject,
      onSelectSpecies,
      onEnterMicro,
      onExitMicro,
      onBackToTable,
      onOpenReactionView,
      onToggleRun,
      onTogglePinSwitch,
      onFallbackTo2D,
      children,
    } = props;

    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasMountRef = useRef<HTMLDivElement | null>(null);

    const [webglUnavailable, setWebglUnavailable] = useState(false);
    const [contextLost, setContextLost] = useState(false);
    const [sheetExpanded, setSheetExpanded] = useState(false);
    const [overlayState, setOverlayState] = useState<ProjectedOverlayState>({
      viewportW: 1200,
      viewportH: 640,
      boardBadge: { x: 260, y: 150, visible: false },
      practiceBadge: { x: 960, y: 500, visible: false },
      tables: {
        'pin-zn-cu': { x: 260, y: 420, visible: false },
        'dien-phan-cuso4': { x: 600, y: 420, visible: false },
        'dien-phan-nacl': { x: 940, y: 420, visible: false },
      },
      microChips: [],
      popupLayout: null,
      hoverBadge: null,
    });

    // Latest reactive props stored in ref so the WebGL loop never re-mounts on React state changes
    const propsRef = useRef(props);
    propsRef.current = props;

    // Three.js runtime refs
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const rigRef = useRef<LabSceneRig | null>(null);
    const requestRenderRef = useRef<() => void>(() => {});
    const isSoftwareGlRef = useRef(false);

    // Camera transition director state
    const transitionRef = useRef<{
      active: boolean;
      token: number;
      startTime: number;
      durationMs: number;
      fromPos: Vec3Tuple;
      toPos: Vec3Tuple;
      fromTarget: Vec3Tuple;
      toTarget: Vec3Tuple;
      minDistance: number;
      maxDistance: number;
    }>({
      active: false,
      token: 0,
      startTime: 0,
      durationMs: 900,
      fromPos: { x: 0.2, y: 5.75, z: 10.2 },
      toPos: { x: 0.2, y: 5.75, z: 10.2 },
      fromTarget: { x: 0.15, y: 1.25, z: -0.1 },
      toTarget: { x: 0.15, y: 1.25, z: -0.1 },
      minDistance: 4.5,
      maxDistance: 18,
    });

    // Practice Desk 3D page-flip animation clock
    const pageFlipRef = useRef<{ active: boolean; startTime: number }>({
      active: false,
      startTime: 0,
    });

    const hoveredZoneRef = useRef<'BOARD' | 'PRACTICE' | null>(null);
    const hoveredTableRef = useRef<LabExperimentId | null>(null);
    const hoveredObjectRef = useRef<LabObjectId | null>(null);
    const previousPopupSideRef = useRef<'left' | 'right' | null>(null);
    const lastOverlayPushRef = useRef<number>(0);

    // Expose synchronous single-frame thumbnail capture for the 10-step gallery
    useImperativeHandle(ref, () => ({
      captureThumbnail: () => {
        const renderer = rendererRef.current;
        const rig = rigRef.current;
        const camera = cameraRef.current;
        if (!renderer || !rig || !camera) return null;
        try {
          renderer.render(rig.scene, camera);
          return renderer.domElement.toDataURL('image/jpeg', 0.78);
        } catch {
          return null;
        }
      },
    }));

    // Initialize WebGLRenderer & Scene ONCE
    useEffect(() => {
      const mount = canvasMountRef.current;
      const outer = containerRef.current;
      if (!mount || !outer) return;

      const support = detectWebGLSupport();
      if (!support.supported) {
        setWebglUnavailable(true);
        return;
      }
      const isSoftwareGl = support.isSoftwareGl;
      isSoftwareGlRef.current = isSoftwareGl;

      const width = Math.max(300, outer.clientWidth || 960);
      const height = Math.max(340, outer.clientHeight || 560);

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: !isSoftwareGl,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
        });
      } catch {
        setWebglUnavailable(true);
        return;
      }

      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.localClippingEnabled = true;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.touchAction = 'none';
      mount.innerHTML = '';
      mount.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 65);
      const initialPreset = getWorldCameraPreset({
        zone: propsRef.current.worldZone,
        station: propsRef.current.selectedStation,
        objectId: propsRef.current.selectedObject,
        microZone: propsRef.current.microZone,
        aspect: width / height,
      });
      camera.position.set(initialPreset.position.x, initialPreset.position.y, initialPreset.position.z);
      cameraRef.current = camera;

      const rig = buildLabScene(renderer, isSoftwareGl);
      rigRef.current = rig;

      // Mandatory procedural studio reflection map on every device
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
      rig.scene.environment = envRT.texture;
      pmrem.dispose();

      if (!isSoftwareGl) {
        renderer.compile(rig.scene, camera);
      }

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = !isSoftwareGl;
      controls.dampingFactor = 0.075;
      controls.enablePan = false;
      controls.minPolarAngle = 0.22;
      controls.maxPolarAngle = Math.PI * 0.455;
      controls.minDistance = initialPreset.minDistance;
      controls.maxDistance = initialPreset.maxDistance;
      controls.target.set(initialPreset.target.x, initialPreset.target.y, initialPreset.target.z);
      controls.update();
      controlsRef.current = controls;

      // Cancel active camera flight if user manually drags/zooms
      const onControlsStart = () => {
        if (transitionRef.current.active) {
          transitionRef.current.active = false;
        }
      };
      const onControlsChange = () => {
        requestRender();
      };
      controls.addEventListener('start', onControlsStart);
      controls.addEventListener('change', onControlsChange);

      // WebGL context loss / restore safety
      const onContextLost = (e: Event) => {
        e.preventDefault();
        setContextLost(true);
      };
      const onContextRestored = () => {
        setContextLost(false);
        requestRender();
      };
      renderer.domElement.addEventListener('webglcontextlost', onContextLost);
      renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

      // Pre-allocated scratch helpers (zero GC inside render / raycast)
      const raycaster = new THREE.Raycaster();
      const pointerNdc = new THREE.Vector2();
      const projVec = new THREE.Vector3();
      const occDir = new THREE.Vector3();

      const projectWorldPoint = (worldPos: Vec3Tuple, w: number, h: number): ProjectedPoint => {
        projVec.set(worldPos.x, worldPos.y, worldPos.z);
        projVec.project(camera);
        return {
          x: ((projVec.x + 1) / 2) * w,
          y: (-(projVec.y - 1) / 2) * h,
          visible: projVec.z >= -1 && projVec.z <= 1,
        };
      };

      const checkAnchorOccluded = (worldPos: Vec3Tuple): boolean => {
        occDir.set(
          worldPos.x - camera.position.x,
          worldPos.y - camera.position.y,
          worldPos.z - camera.position.z
        );
        const dist = occDir.length();
        if (dist < 0.2) return false;
        occDir.divideScalar(dist);
        raycaster.set(camera.position, occDir);
        raycaster.near = 0.05;
        raycaster.far = dist - 0.18;
        const hits = raycaster.intersectObjects(rig.occlusionMeshes, false);
        raycaster.near = 0;
        raycaster.far = Infinity;
        return hits.length > 0;
      };

      const syncProjectedOverlays = (force = false) => {
        const now = performance.now();
        if (!force && now - lastOverlayPushRef.current < 48) return;
        lastOverlayPushRef.current = now;

        const w = outer.clientWidth || width;
        const h = outer.clientHeight || height;
        const cur = propsRef.current;

        const boardBadge = projectWorldPoint(
          {
            x: WORLD_ANCHORS.boardCenter.x,
            y: WORLD_ANCHORS.boardCenter.y + 1.25,
            z: WORLD_ANCHORS.boardCenter.z + 0.1,
          },
          w,
          h
        );
        const practiceBadge = projectWorldPoint(
          {
            x: WORLD_ANCHORS.practiceDesk.x,
            y: TABLE_TOP_Y + 0.36,
            z: WORLD_ANCHORS.practiceDesk.z + 0.55,
          },
          w,
          h
        );

        const tableProj: Record<LabExperimentId, ProjectedPoint> = {
          'pin-zn-cu': projectWorldPoint(
            { x: TABLE_POSITIONS['pin-zn-cu'].x, y: TABLE_TOP_Y + 0.05, z: TABLE_POSITIONS['pin-zn-cu'].z + 0.92 },
            w,
            h
          ),
          'dien-phan-cuso4': projectWorldPoint(
            { x: TABLE_POSITIONS['dien-phan-cuso4'].x, y: TABLE_TOP_Y + 0.05, z: TABLE_POSITIONS['dien-phan-cuso4'].z + 0.92 },
            w,
            h
          ),
          'dien-phan-nacl': projectWorldPoint(
            { x: TABLE_POSITIONS['dien-phan-nacl'].x, y: TABLE_TOP_Y + 0.05, z: TABLE_POSITIONS['dien-phan-nacl'].z + 0.92 },
            w,
            h
          ),
        };

        // Project 1 crisp representative chip per active species in MICRO view (avoid HUD & chip overlap!)
        const microChips: ProjectedSpeciesChip[] = [];
        if (cur.worldZone === 'MICRO' && cur.microFrame && cur.microOptions.showIonLabels) {
          const maxX = w >= 768 ? w - 320 : w - 52;
          const bySpecies = new Map<IonSpeciesId, ProjectedPoint[]>();
          for (const p of cur.microFrame.particles) {
            const pt = projectWorldPoint(p.position, w, h);
            if (!pt.visible) continue;
            const list = bySpecies.get(p.species) ?? [];
            list.push(pt);
            bySpecies.set(p.species, list);
          }

          for (const [species, pts] of bySpecies.entries()) {
            // Prefer a particle strictly outside the right HUD card and far from existing chips
            let best = pts[0];
            let bestScore = -Infinity;
            for (const pt of pts) {
              const insideSafeX = pt.x >= 44 && pt.x <= maxX ? 100 : -50;
              const insideSafeY = pt.y >= 48 && pt.y <= h - 76 ? 40 : -30;
              let minDist = 999;
              for (const existing of microChips) {
                const d = Math.hypot(pt.x - existing.x, pt.y - existing.y);
                if (d < minDist) minDist = d;
              }
              const score = insideSafeX + insideSafeY + Math.min(minDist, 140);
              if (score > bestScore) {
                bestScore = score;
                best = pt;
              }
            }
            let cx = Math.max(48, Math.min(maxX, best.x));
            let cy = Math.max(52, Math.min(h - 80, best.y));
            // Gentle nudge if still close to an already-placed chip
            for (const existing of microChips) {
              if (Math.hypot(cx - existing.x, cy - existing.y) < 42) {
                cy = Math.max(52, Math.min(h - 80, cy + 36));
              }
            }
            microChips.push({ species, x: cx, y: cy });
          }
        }

        // Compute anchored popup layout for TABLE or OBJECT level (never during visual quiz!)
        let popupLayout: SmartPopupLayout | null = null;
        if (!cur.visualQuiz?.active) {
          if (cur.worldZone === 'OBJECT' && cur.selectedObject) {
            const anchor = getWorldAnchorForObject(cur.selectedObject);
            const pt = projectWorldPoint(anchor, w, h);
            const occluded = pt.visible ? checkAnchorOccluded(anchor) : true;
            popupLayout = computeSmartPopupLayout({
              anchorX: pt.x,
              anchorY: pt.y,
              inFrontOfCamera: pt.visible,
              occluded,
              viewportWidth: w,
              viewportHeight: h,
              popupWidth: 316,
              popupHeight: 256,
              previousSide: previousPopupSideRef.current,
            });
            previousPopupSideRef.current = popupLayout.side;
          } else if (cur.worldZone === 'TABLE' && cur.selectedStation) {
            const base = TABLE_POSITIONS[cur.selectedStation];
            const anchor = { x: base.x + 0.58, y: TABLE_TOP_Y + 0.45, z: base.z + 0.15 };
            const pt = projectWorldPoint(anchor, w, h);
            popupLayout = computeSmartPopupLayout({
              anchorX: pt.x,
              anchorY: pt.y,
              inFrontOfCamera: pt.visible,
              occluded: false,
              viewportWidth: w,
              viewportHeight: h,
              popupWidth: 312,
              popupHeight: 220,
              previousSide: previousPopupSideRef.current,
            });
            previousPopupSideRef.current = popupLayout.side;
          } else {
            previousPopupSideRef.current = null;
          }
        }

        // Hover tooltip badge (desktop only)
        let hoverBadge: { x: number; y: number; title: string; hint: string } | null = null;
        if (w >= 640) {
          if (cur.worldZone === 'OVERVIEW' && hoveredZoneRef.current === 'BOARD') {
            const pt = projectWorldPoint(WORLD_ANCHORS.boardCenter, w, h);
            if (pt.visible) {
              hoverBadge = {
                x: Math.max(120, Math.min(w - 120, pt.x)),
                y: Math.max(76, Math.min(h - 90, pt.y)),
                title: 'Bảng giảng dạy Hóa học 12',
                hint: 'Chạm để bắt đầu bài học',
              };
            }
          } else if (cur.worldZone === 'OVERVIEW' && hoveredZoneRef.current === 'PRACTICE') {
            const pt = projectWorldPoint(WORLD_ANCHORS.practicePaperCenter, w, h);
            if (pt.visible) {
              hoverBadge = {
                x: Math.max(120, Math.min(w - 120, pt.x)),
                y: Math.max(76, Math.min(h - 90, pt.y - 18)),
                title: 'Bàn bài tập & Kiểm tra',
                hint: 'Chạm để mở chồng đề luyện tập',
              };
            }
          } else if (cur.worldZone === 'OVERVIEW' && hoveredTableRef.current) {
            const tId = hoveredTableRef.current;
            const base = TABLE_POSITIONS[tId];
            const pt = projectWorldPoint({ x: base.x, y: TABLE_TOP_Y + 0.65, z: base.z }, w, h);
            if (pt.visible) {
              hoverBadge = {
                x: Math.max(100, Math.min(w - 100, pt.x)),
                y: Math.max(76, Math.min(h - 90, pt.y)),
                title: LAB_TABLES[tId].title,
                hint: 'Chọn để khám phá',
              };
            }
          } else if (
            (cur.worldZone === 'TABLE' || cur.worldZone === 'OBJECT' || cur.worldZone === 'REACTION') &&
            hoveredObjectRef.current &&
            hoveredObjectRef.current !== cur.selectedObject
          ) {
            const oId = hoveredObjectRef.current;
            const anchor = getWorldAnchorForObject(oId);
            const pt = projectWorldPoint(anchor, w, h);
            if (pt.visible) {
              hoverBadge = {
                x: Math.max(110, Math.min(w - 110, pt.x)),
                y: Math.max(76, Math.min(h - 90, pt.y - 26)),
                title: LAB_OBJECTS[oId].name,
                hint: cur.visualQuiz?.active ? 'Chạm để chọn làm đáp án' : 'Xem chi tiết',
              };
            }
          }
        }

        setOverlayState({
          viewportW: w,
          viewportH: h,
          boardBadge,
          practiceBadge,
          tables: tableProj,
          microChips,
          popupLayout,
          hoverBadge,
        });
      };

      // Coalesced on-demand + paced software-WebGL render scheduler
      let frameId = 0;
      let renderBusy = false;
      let renderDirty = false;
      let disposed = false;

      function afterDraw(cb: () => void) {
        if (disposed) return;
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (!gl || typeof gl.fenceSync !== 'function') {
          frameId = window.setTimeout(cb, 80);
          return;
        }
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 75);
          }
        };
        frameId = window.setTimeout(poll, 5);
      }

      function renderOneFrame() {
        if (disposed) return;
        renderDirty = false;

        const cur = propsRef.current;
        const tr = transitionRef.current;
        let needsFollowup = false;

        if (tr.active) {
          const elapsed = performance.now() - tr.startTime;
          const rawT = tr.durationMs <= 1 ? 1 : Math.min(1, elapsed / tr.durationMs);
          const eased = easeInOutCubic(rawT);
          const pos = interpolateVec3(tr.fromPos, tr.toPos, eased);
          const tgt = interpolateVec3(tr.fromTarget, tr.toTarget, eased);
          camera.position.set(pos.x, pos.y, pos.z);
          controls.target.set(tgt.x, tgt.y, tgt.z);
          controls.minDistance = tr.minDistance;
          controls.maxDistance = tr.maxDistance;
          if (rawT >= 1) {
            tr.active = false;
          } else {
            needsFollowup = true;
          }
        }

        // Practice Desk 3D page-flip angle
        let practiceFlipAngle = 0;
        if (pageFlipRef.current.active) {
          const dt = performance.now() - pageFlipRef.current.startTime;
          const dur = cur.reducedMotion ? 1 : 380;
          const frac = Math.min(1, dt / dur);
          practiceFlipAngle = easeInOutCubic(frac) * Math.PI;
          if (frac >= 1) {
            pageFlipRef.current.active = false;
            practiceFlipAngle = 0;
          } else {
            needsFollowup = true;
          }
        }

        controls.update();

        updateLabSceneVisuals(
          rig,
          cur.visuals,
          hoveredTableRef.current,
          cur.selectedStation,
          hoveredObjectRef.current,
          cur.selectedObject,
          {
            zone: cur.worldZone,
            hoveredZone: hoveredZoneRef.current,
            cutawayActive: cur.microOptions.cutaway,
            microFrame: cur.microFrame,
            microShowHydration: cur.microOptions.showHydration,
            microShowReactionZone: cur.microOptions.showReactionZone,
            microShowArrows: cur.microOptions.showArrows,
            practiceFlipAngle,
            practiceOpenLift: cur.worldZone === 'PRACTICE' ? 1 : 0,
            visualQuizCandidates: cur.visualQuiz?.active ? cur.visualQuiz.candidateObjects : null,
            visualQuizSelected: cur.visualQuiz?.active ? cur.visualQuiz.selectedObjectId : null,
          }
        );

        renderer.render(rig.scene, camera);
        syncProjectedOverlays(!tr.active);

        const done = () => {
          renderBusy = false;
          if (disposed) return;
          if (renderDirty || needsFollowup || propsRef.current.isRunning) {
            requestRender();
          }
        };

        if (isSoftwareGl) {
          afterDraw(done);
        } else {
          done();
        }
      }

      function requestRender() {
        if (disposed) return;
        if (renderBusy) {
          renderDirty = true;
          return;
        }
        renderBusy = true;
        frameId = window.requestAnimationFrame(renderOneFrame);
      }

      requestRenderRef.current = requestRender;

      // Pointer interaction: strict click vs drag separation & multi-touch safety
      let pointerDownX = 0;
      let pointerDownY = 0;
      let pointerDownId: number | null = null;
      let activePointers = 0;
      let lastHoverRaycast = 0;

      const updateNdc = (clientX: number, clientY: number) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      };

      const pickTarget = () => {
        const cur = propsRef.current;
        raycaster.setFromCamera(pointerNdc, camera);
        if (cur.worldZone === 'OVERVIEW') {
          const allOverviewTargets = [...rig.zoneHitboxes, ...rig.tableHitboxes];
          const hits = raycaster.intersectObjects(
            allOverviewTargets.map((h) => h.mesh),
            false
          );
          if (hits.length > 0) {
            return allOverviewTargets.find((h) => h.mesh === hits[0].object) ?? null;
          }
          return null;
        }

        if (cur.worldZone === 'BOARD' || cur.worldZone === 'PRACTICE' || cur.worldZone === 'MICRO') {
          return null;
        }

        // In TABLE, OBJECT, or REACTION view: pick apparatus objects on the active station
        const stationTargets = rig.objectHitboxes.filter((h) => {
          if (h.station !== cur.selectedStation) return false;
          if (h.objectId === 'nacl-membrane' && cur.naclVariant === 'nacl-molten') return false;
          return true;
        });
        const hits = raycaster.intersectObjects(
          stationTargets.map((h) => h.mesh),
          false
        );
        if (hits.length > 0) {
          return stationTargets.find((h) => h.mesh === hits[0].object) ?? null;
        }
        return null;
      };

      const onPointerDown = (e: PointerEvent) => {
        activePointers += 1;
        if (activePointers === 1 && e.button === 0) {
          pointerDownX = e.clientX;
          pointerDownY = e.clientY;
          pointerDownId = e.pointerId;
        } else {
          pointerDownId = null;
        }
      };

      const onPointerUp = (e: PointerEvent) => {
        activePointers = Math.max(0, activePointers - 1);
        if (pointerDownId !== e.pointerId) return;
        pointerDownId = null;

        const dx = e.clientX - pointerDownX;
        const dy = e.clientY - pointerDownY;
        const travel = Math.hypot(dx, dy);
        if (travel >= 7) return;

        updateNdc(e.clientX, e.clientY);
        const picked = pickTarget();
        if (!picked) return;

        const cur = propsRef.current;
        if (picked.kind === 'zone' && picked.zoneId) {
          cur.onSelectZone(picked.zoneId);
        } else if (picked.kind === 'table' && picked.station) {
          cur.onSelectStation(picked.station);
        } else if (picked.kind === 'object' && picked.objectId) {
          if (cur.visualQuiz?.active && cur.onVisualQuizPick) {
            cur.onVisualQuizPick(picked.objectId);
          } else {
            cur.onSelectObject(picked.objectId);
          }
        }
      };

      const onPointerMove = (e: PointerEvent) => {
        if (e.pointerType === 'touch') return;
        const now = performance.now();
        if (now - lastHoverRaycast < 48) return;
        lastHoverRaycast = now;

        updateNdc(e.clientX, e.clientY);
        const picked = pickTarget();
        const prevZ = hoveredZoneRef.current;
        const prevT = hoveredTableRef.current;
        const prevO = hoveredObjectRef.current;

        if (picked?.kind === 'zone' && picked.zoneId) {
          hoveredZoneRef.current = picked.zoneId;
          hoveredTableRef.current = null;
          hoveredObjectRef.current = null;
          renderer.domElement.style.cursor = 'pointer';
        } else if (picked?.kind === 'table' && picked.station) {
          hoveredZoneRef.current = null;
          hoveredTableRef.current = picked.station;
          hoveredObjectRef.current = null;
          renderer.domElement.style.cursor = 'pointer';
        } else if (picked?.kind === 'object' && picked.objectId) {
          hoveredZoneRef.current = null;
          hoveredTableRef.current = null;
          hoveredObjectRef.current = picked.objectId;
          renderer.domElement.style.cursor = 'pointer';
        } else {
          hoveredZoneRef.current = null;
          hoveredTableRef.current = null;
          hoveredObjectRef.current = null;
          renderer.domElement.style.cursor = 'grab';
        }

        if (
          prevZ !== hoveredZoneRef.current ||
          prevT !== hoveredTableRef.current ||
          prevO !== hoveredObjectRef.current
        ) {
          requestRender();
        }
      };

      const onPointerLeave = () => {
        if (hoveredZoneRef.current || hoveredTableRef.current || hoveredObjectRef.current) {
          hoveredZoneRef.current = null;
          hoveredTableRef.current = null;
          hoveredObjectRef.current = null;
          renderer.domElement.style.cursor = 'default';
          requestRender();
        }
      };

      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointerup', onPointerUp);
      renderer.domElement.addEventListener('pointermove', onPointerMove);
      renderer.domElement.addEventListener('pointerleave', onPointerLeave);

      // ResizeObserver for crisp desktop <-> 390px mobile resizing
      const resizeObserver = new ResizeObserver(() => {
        if (disposed) return;
        const w = Math.max(280, outer.clientWidth);
        const h = Math.max(320, outer.clientHeight);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);

        if (propsRef.current.worldZone === 'OVERVIEW' && !transitionRef.current.active) {
          const fit = getWorldCameraPreset({
            zone: 'OVERVIEW',
            station: null,
            objectId: null,
            microZone: propsRef.current.microZone,
            aspect: w / h,
          });
          camera.position.set(fit.position.x, fit.position.y, fit.position.z);
          controls.target.set(fit.target.x, fit.target.y, fit.target.z);
          controls.maxDistance = fit.maxDistance;
          controls.update();
        }
        requestRender();
      });
      resizeObserver.observe(outer);

      requestRender();

      return () => {
        disposed = true;
        window.cancelAnimationFrame(frameId);
        window.clearTimeout(frameId);
        resizeObserver.disconnect();
        controls.removeEventListener('start', onControlsStart);
        controls.removeEventListener('change', onControlsChange);
        controls.dispose();
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointerup', onPointerUp);
        renderer.domElement.removeEventListener('pointermove', onPointerMove);
        renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
        renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
        renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
        envRT.dispose();
        disposeLabScene(rig);
        renderer.dispose();
        rendererRef.current = null;
        cameraRef.current = null;
        controlsRef.current = null;
        rigRef.current = null;
      };
    }, []);

    // Trigger smooth cancellable camera flight whenever worldZone / station / object / microZone / nonce changes
    useEffect(() => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      const outer = containerRef.current;
      if (!camera || !controls || !outer) return;

      const aspect = Math.max(0.3, (outer.clientWidth || 960) / Math.max(300, outer.clientHeight || 560));
      const nextPreset = getWorldCameraPreset({
        zone: worldZone,
        station: selectedStation,
        objectId: selectedObject,
        microZone,
        aspect,
      });
      const tr = transitionRef.current;
      tr.token += 1;
      tr.fromPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
      tr.fromTarget = { x: controls.target.x, y: controls.target.y, z: controls.target.z };
      tr.toPos = nextPreset.position;
      tr.toTarget = nextPreset.target;
      tr.minDistance = nextPreset.minDistance;
      tr.maxDistance = nextPreset.maxDistance;
      tr.startTime = performance.now();
      const baseDur = CAMERA_SPEED_DURATION_MS[cameraSpeedMode];
      tr.durationMs = reducedMotion ? 1 : isSoftwareGlRef.current ? Math.min(380, baseDur) : baseDur;
      tr.active = true;
      setSheetExpanded(false);
      requestRenderRef.current();
    }, [worldZone, selectedStation, selectedObject, microZone, cameraRequestNonce, reducedMotion, cameraSpeedMode]);

    // Trigger 3D Practice Desk page-flip animation
    useEffect(() => {
      if (practiceFlipNonce <= 0) return;
      pageFlipRef.current = { active: true, startTime: performance.now() };
      requestRenderRef.current();
    }, [practiceFlipNonce]);

    // Re-render whenever visuals, microFrame, options, or quiz state change
    useEffect(() => {
      requestRenderRef.current();
    }, [
      visuals,
      microFrame,
      microOptions,
      trackedSpecies,
      visualQuiz,
      isRunning,
      showLabels,
      cuso4Variant,
      naclVariant,
    ]);

    // Build dynamic scientific content for Level 3 Object Popup from single source of truth
    const buildObjectPopupContent = (objectId: LabObjectId) => {
      const meta = LAB_OBJECTS[objectId];
      let liveStat = '';
      let equation = '';
      let description = meta.defaultDescription;
      let actionLabel: string | null = null;
      let onAction: (() => void) | null = null;

      if (objectId === 'zn-cu-switch') {
        if (galvanicSnapshot.circuitClosed) {
          description = 'Mạch đang đóng. Dòng electron chạy liên tục từ thanh Zn qua tải sang thanh Cu.';
          liveStat = `U tải = ${formatViNumber(galvanicSnapshot.terminalVoltageV, { minDecimals: 3, maxDecimals: 3 })} V · I = ${formatViNumber(galvanicSnapshot.currentMa, { maxDecimals: 2 })} mA`;
          actionLabel = 'Mở mạch';
        } else {
          description = 'Mạch đang mở. Chưa có dòng electron chạy qua tải ngoài.';
          liveStat = `E°pin (hở mạch) = ${formatViNumber(galvanicSnapshot.emfV, { minDecimals: 3, maxDecimals: 3 })} V · I = 0 mA`;
          actionLabel = 'Đóng mạch';
        }
        onAction = onTogglePinSwitch;
      } else if (objectId === 'zn-cu-voltmeter') {
        liveStat = galvanicSnapshot.circuitClosed
          ? `Số đo thực: ${formatViNumber(galvanicSnapshot.terminalVoltageV, { minDecimals: 3, maxDecimals: 3 })} V (mạch đóng, R = 100 Ω, r = 2 Ω)`
          : `Số đo thực: ${formatViNumber(galvanicSnapshot.emfV, { minDecimals: 3, maxDecimals: 3 })} V (mạch mở)`;
        equation = 'E°pin = E°(Cu²⁺/Cu) − E°(Zn²⁺/Zn) = 1,103 V';
      } else if (objectId === 'zn-cu-salt-bridge') {
        equation = 'NO₃⁻ → ngăn Zn · K⁺ → ngăn Cu';
        liveStat = galvanicSnapshot.circuitClosed
          ? 'Ion đang dịch chuyển bù điện tích (tốc độ minh họa)'
          : 'Mạch đang mở · Ion tạm ngừng dịch chuyển';
      } else if (objectId === 'zn-cu-electrode-zn') {
        equation = 'Anode (−): Zn → Zn²⁺ + 2e⁻';
        liveStat = `Đã oxi hóa minh họa: ${formatViNumber(galvanicSnapshot.znDissolvedMg, { maxDecimals: 1 })} mg Zn`;
      } else if (objectId === 'zn-cu-electrode-cu') {
        equation = 'Cathode (+): Cu²⁺ + 2e⁻ → Cu';
        liveStat = `Đồng bám thêm: ${formatViNumber(galvanicSnapshot.cuDepositedMg, { maxDecimals: 1 })} mg Cu`;
      } else if (objectId === 'zn-cu-wire') {
        equation = 'e⁻ : Anode (−) Zn → Cathode (+) Cu';
        liveStat = galvanicSnapshot.circuitClosed ? 'Electron đang chạy qua dây ngoài' : 'Mạch đang mở (chưa có dòng e⁻)';
      } else if (objectId === 'cuso4-cathode') {
        equation = `Cathode (−): ${cuso4Snapshot.cathodeEquation}`;
        liveStat = `Cu bám: ${formatViNumber(cuso4Snapshot.cuPlatedG, { minDecimals: 3, maxDecimals: 3 })} g · H₂: ${formatViNumber(cuso4Snapshot.h2Mol, { minDecimals: 4, maxDecimals: 4 })} mol`;
      } else if (objectId === 'cuso4-anode') {
        equation = `Anode (+): ${cuso4Snapshot.anodeEquation}`;
        liveStat =
          cuso4Variant === 'cuso4-copper'
            ? `Cu tan: ${formatViNumber(cuso4Snapshot.cuLostAtAnodeG, { minDecimals: 3, maxDecimals: 3 })} g (còn ${formatViNumber(cuso4Snapshot.anodeCuRemainingG, { minDecimals: 2, maxDecimals: 2 })} g)`
            : `Khí O₂: ${formatViNumber(cuso4Snapshot.o2Mol, { minDecimals: 4, maxDecimals: 4 })} mol (${formatViNumber(cuso4Snapshot.o2VolumeL, { minDecimals: 3, maxDecimals: 3 })} L)`;
      } else if (objectId === 'cuso4-power') {
        liveStat = `I = ${formatViNumber(cuso4Params.currentA, { maxDecimals: 2 })} A · Q = ${formatViNumber(cuso4Snapshot.chargeC, { maxDecimals: 1 })} C · nₑ = ${formatViNumber(cuso4Snapshot.electronMol, { minDecimals: 4, maxDecimals: 4 })} mol`;
      } else if (objectId === 'cuso4-solution') {
        liveStat =
          cuso4Variant === 'cuso4-inert'
            ? `Cu²⁺ còn lại: ${formatViNumber(cuso4Snapshot.cu2RemainingMol, { minDecimals: 4, maxDecimals: 4 })} mol`
            : 'Nồng độ Cu²⁺ không đổi (anode đồng bổ sung liên tục)';
      } else if (objectId === 'nacl-anode') {
        equation = `Anode (+): ${naclSnapshot.anodeEquation}`;
        liveStat = `Khí Cl₂ (độc, chỉ mô phỏng): ${formatViNumber(naclSnapshot.cl2Mol, { minDecimals: 4, maxDecimals: 4 })} mol (${formatViNumber(naclSnapshot.cl2VolumeL, { minDecimals: 3, maxDecimals: 3 })} L)`;
      } else if (objectId === 'nacl-cathode') {
        equation = `Cathode (−): ${naclSnapshot.cathodeEquation}`;
        liveStat =
          naclVariant === 'nacl-molten'
            ? `Na tạo thành: ${formatViNumber(naclSnapshot.naProducedG, { minDecimals: 3, maxDecimals: 3 })} g`
            : `Khí H₂: ${formatViNumber(naclSnapshot.h2Mol, { minDecimals: 4, maxDecimals: 4 })} mol · OH⁻ (NaOH): ${formatViNumber(naclSnapshot.ohProducedMol, { minDecimals: 4, maxDecimals: 4 })} mol`;
      } else if (objectId === 'nacl-membrane') {
        equation = 'Na⁺ → qua màng sang ngăn Cathode (−) → NaOH';
        liveStat = `OH⁻ (NaOH) tạo thành: ${formatViNumber(naclSnapshot.ohProducedMol, { minDecimals: 4, maxDecimals: 4 })} mol`;
      } else if (objectId === 'nacl-power') {
        liveStat = `I = ${formatViNumber(naclParams.currentA, { maxDecimals: 2 })} A · nₑ = ${formatViNumber(naclSnapshot.electronMol, { minDecimals: 4, maxDecimals: 4 })} mol`;
      }

      return { meta, description, equation, liveStat, actionLabel, onAction };
    };

    if (webglUnavailable || contextLost) {
      return (
        <div className="w-full min-h-[420px] rounded-lg border border-[#365056] bg-[#142024] flex flex-col items-center justify-center p-6 text-center space-y-4">
          <FlaskConical className="w-10 h-10 text-[#78D4C4]" />
          <div className="space-y-1 max-w-md">
            <h2 className="font-serif text-xl font-semibold text-[#EDF4F1]">
              Không thể khởi tạo phòng thí nghiệm 3D trên thiết bị này.
            </h2>
            <p className="text-sm text-[#A2B6B5]">
              {contextLost
                ? 'Ngữ cảnh đồ họa WebGL tạm thời bị gián đoạn. Bạn có thể chuyển sang chế độ 2D với đầy đủ công thức và số liệu.'
                : 'Trình duyệt hiện chưa hỗ trợ WebGL. Bạn vẫn có thể học đầy đủ các thí nghiệm bằng mô phỏng 2D dùng chung bộ tính toán.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onFallbackTo2D}
            className="min-h-[44px] px-5 rounded bg-[#78D4C4] text-[#10191C] font-semibold text-sm hover:bg-[#93E3D5] transition-colors cursor-pointer"
          >
            Mở mô phỏng 2D
          </button>
        </div>
      );
    }

    const popupLayout = overlayState.popupLayout;
    const activeObjectInfo =
      worldZone === 'OBJECT' && selectedObject && !visualQuiz?.active
        ? buildObjectPopupContent(selectedObject)
        : null;
    const activeTableMeta =
      worldZone === 'TABLE' && selectedStation && !visualQuiz?.active
        ? LAB_TABLES[selectedStation]
        : null;
    const isBoardOrPractice = worldZone === 'BOARD' || worldZone === 'PRACTICE';

    return (
      <div
        ref={containerRef}
        data-testid="lab-3d-viewport"
        data-world-zone={worldZone}
        data-station={selectedStation ?? 'none'}
        data-object={selectedObject ?? 'none'}
        data-micro-zone={microZone}
        data-zn-voltmeter={visuals.znCu.voltmeterText}
        data-cuso4-stage2={visuals.cuso4.inStage2 ? 'true' : 'false'}
        data-nacl-membrane={visuals.nacl.showMembrane ? 'true' : 'false'}
        className={`relative w-full ${
          isBoardOrPractice
            ? 'h-[74vh] min-h-[540px] sm:h-[78vh] sm:min-h-[600px] max-h-[820px]'
            : 'h-[50vh] min-h-[360px] sm:h-[68vh] sm:min-h-[540px] max-h-[720px]'
        } rounded-lg overflow-hidden border border-[#2B4046] bg-[#0E1619] select-none`}
      >
        {/* Dedicated isolated WebGL canvas mount node */}
        <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

        {/* Overview Interactive Zone Badges (Smart Board + 3 Lab Tables + Practice Desk) */}
        {worldZone === 'OVERVIEW' && showLabels && (() => {
          const isCompact = overlayState.viewportW < 540;
          const naclPt = overlayState.tables['dien-phan-nacl'];
          const naclBadgeY = Math.max(
            96,
            Math.min(overlayState.viewportH - (isCompact ? 96 : 76), naclPt.y + (isCompact ? 4 : 6))
          );
          const practiceRawY = isCompact
            ? Math.max(naclBadgeY + 54, overlayState.practiceBadge.y + 28)
            : overlayState.practiceBadge.y;
          const practiceClampedY = Math.max(
            120,
            Math.min(overlayState.viewportH - 28, practiceRawY)
          );

          return (
            <div className="pointer-events-none absolute inset-0 z-10">
              {/* Smart Board Badge */}
              {overlayState.boardBadge.visible && (
                <button
                  type="button"
                  data-testid="overview-badge-board"
                  onClick={() => onSelectZone('BOARD')}
                  aria-label="Mở bảng giảng dạy thông minh Hóa học 12"
                  style={{
                    transform: `translate(${Math.round(
                      Math.max(
                        isCompact ? 68 : 76,
                        Math.min(overlayState.viewportW - (isCompact ? 68 : 76), overlayState.boardBadge.x)
                      )
                    )}px, ${Math.round(
                      Math.max(38, Math.min(overlayState.viewportH - 140, overlayState.boardBadge.y - (isCompact ? 12 : 0)))
                    )}px) translate(-50%, -50%)`,
                  }}
                  className={`pointer-events-auto absolute top-0 left-0 min-h-[42px] rounded-md border border-[#78D4C4] bg-[#0E2328]/95 text-[#EDF4F1] hover:bg-[#16363D] transition-colors shadow-lg cursor-pointer inline-flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#78D4C4] ${
                    isCompact ? 'px-2 py-1' : 'px-3 py-1.5'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#78D4C4] shrink-0" />
                  <span className="text-left">
                    <span className="block text-[9px] font-mono tracking-wider text-[#78D4C4] leading-none">
                      BẢNG HỌC 3D
                    </span>
                    <span className="block text-[11px] sm:text-sm font-semibold whitespace-nowrap mt-0.5">
                      {isCompact ? '10 bài học' : 'Lý thuyết 10 bài'}
                    </span>
                  </span>
                </button>
              )}

              {/* 3 Experiment Tables */}
              {(['pin-zn-cu', 'dien-phan-cuso4', 'dien-phan-nacl'] as LabExperimentId[]).map((stId) => {
                const pt = overlayState.tables[stId];
                if (!pt.visible) return null;
                const meta = LAB_TABLES[stId];
                const padX = isCompact ? 48 : 68;
                const clampedX = Math.max(padX, Math.min(overlayState.viewportW - padX, pt.x));
                const clampedY = Math.max(
                  96,
                  Math.min(overlayState.viewportH - (isCompact ? 96 : 76), pt.y + (isCompact ? 4 : 6))
                );
                return (
                  <button
                    key={stId}
                    type="button"
                    data-testid={`overview-badge-${stId}`}
                    onClick={() => onSelectStation(stId)}
                    aria-label={`Chọn bàn ${meta.title}`}
                    style={{
                      transform: `translate(${Math.round(clampedX)}px, ${Math.round(clampedY)}px) translate(-50%, -50%)`,
                    }}
                    className={`pointer-events-auto absolute top-0 left-0 min-h-[42px] rounded-md border border-[#78D4C4]/80 bg-[#101D21]/95 text-[#EDF4F1] hover:bg-[#1B3339] hover:border-[#78D4C4] transition-colors shadow-lg cursor-pointer focus-visible:outline-2 focus-visible:outline-[#78D4C4] ${
                      isCompact ? 'px-2 py-1' : 'px-3.5 py-1.5'
                    }`}
                  >
                    <span className="block text-[9px] sm:text-[10px] font-mono tracking-wider text-[#78D4C4] leading-none">
                      {isCompact ? meta.shortCode.slice(0, 2) : meta.shortCode}
                    </span>
                    <span className="block text-[11px] sm:text-sm font-semibold whitespace-nowrap mt-0.5">
                      <ChemText text={meta.badgeLabel} />
                    </span>
                  </button>
                );
              })}

              {/* Practice Desk Badge (cleanly separated below Table 03 on narrow mobile!) */}
              {overlayState.practiceBadge.visible && (
                <button
                  type="button"
                  data-testid="overview-badge-practice"
                  onClick={() => onSelectZone('PRACTICE')}
                  aria-label="Mở bàn bài tập và kiểm tra"
                  style={{
                    transform: `translate(${Math.round(
                      Math.max(
                        isCompact ? 70 : 80,
                        Math.min(overlayState.viewportW - (isCompact ? 70 : 80), overlayState.practiceBadge.x)
                      )
                    )}px, ${Math.round(practiceClampedY)}px) translate(-50%, -50%)`,
                  }}
                  className={`pointer-events-auto absolute top-0 left-0 min-h-[42px] rounded-md border border-[#C77B4C] bg-[#241A15]/95 text-[#FAF6EC] hover:bg-[#34241C] transition-colors shadow-lg cursor-pointer inline-flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#C77B4C] ${
                    isCompact ? 'px-2.5 py-1' : 'px-3 py-1.5'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E3A678] shrink-0" />
                  <span className="text-left">
                    <span className="block text-[9px] font-mono tracking-wider text-[#E3A678] leading-none">
                      BÀN LUYỆN TẬP
                    </span>
                    <span className="block text-[11px] sm:text-sm font-semibold whitespace-nowrap mt-0.5">
                      {isCompact ? 'Đề & 3D' : 'Bài tập & Đề thi'}
                    </span>
                  </span>
                </button>
              )}
            </div>
          );
        })()}

        {/* Microscopic Ion Species Labels (1 crisp clickable chip per active species) */}
        {worldZone === 'MICRO' && microOptions.showIonLabels && overlayState.microChips.length > 0 && (
          <div className="pointer-events-none absolute inset-0 z-10">
            {overlayState.microChips.map((chip) => {
              const sp = MICRO_SPECIES_META[chip.species];
              const isTracked = trackedSpecies === chip.species;
              return (
                <button
                  key={chip.species}
                  type="button"
                  data-testid={`micro-species-chip-${chip.species}`}
                  onClick={() => onSelectSpecies?.(isTracked ? null : chip.species)}
                  aria-pressed={isTracked}
                  style={{
                    transform: `translate(${Math.round(chip.x)}px, ${Math.round(chip.y)}px) translate(-50%, -50%)`,
                    borderColor: isTracked ? '#EDF4F1' : sp.cssColor,
                  }}
                  className={`pointer-events-auto absolute top-0 left-0 min-h-[34px] px-2.5 py-0.5 rounded-full border text-xs font-mono font-bold shadow-md cursor-pointer transition-transform ${
                    isTracked
                      ? 'bg-[#17363C] text-[#EDF4F1] scale-110'
                      : 'bg-[#0C171B]/90 text-[#EDF4F1] hover:scale-105'
                  }`}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                    style={{ backgroundColor: sp.cssColor }}
                  />
                  <ChemText text={sp.symbol} />
                </button>
              );
            })}
          </div>
        )}

        {/* Microscopic Mechanism & Legend Card (Desktop right rail / Mobile compact bottom strip) */}
        {worldZone === 'MICRO' && microFrame && (
          <div
            data-testid="micro-hud-card"
            className="absolute right-2.5 bottom-2.5 left-2.5 md:left-auto md:top-3 md:bottom-auto md:w-[300px] z-20 rounded-lg border border-[#78D4C4]/75 bg-[#0F1E22]/94 p-3 text-[#EDF4F1] shadow-2xl space-y-2 max-h-[46%] md:max-h-[88%] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#78D4C4]">
                  Chế độ vi mô 3D · Cutaway
                </div>
                <h2
                  className="font-serif text-sm sm:text-base font-semibold leading-tight"
                  style={{ color: '#EDF4F1' }}
                >
                  <ChemText text={MICRO_ZONES[microFrame.zone].title} />
                </h2>
              </div>
              {onExitMicro && (
                <button
                  type="button"
                  onClick={onExitMicro}
                  aria-label="Thoát chế độ vi mô"
                  className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded border border-[#365056] text-[#A2B6B5] hover:text-[#EDF4F1] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {microOptions.showEquations && (
              <div className="rounded bg-[#0A1417] border border-[#284249] px-2.5 py-1.5 text-xs font-mono font-semibold text-[#78D4C4] break-words">
                <ChemText text={microFrame.equationText} />
              </div>
            )}

            <p className="text-xs text-[#C8D8D7] leading-relaxed">
              <ChemText text={microFrame.mechanismDetail} />
            </p>

            {/* Species Legend & Click-to-Track */}
            <div className="space-y-1.5 pt-1 border-t border-[#22373D]">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#96AEB0]">
                <span>Chạm hạt để theo dõi</span>
                {trackedSpecies && (
                  <button
                    type="button"
                    onClick={() => onSelectSpecies?.(null)}
                    className="text-[#78D4C4] underline cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {microFrame.activeSpecies.map((spId) => {
                  const sp = MICRO_SPECIES_META[spId];
                  const active = trackedSpecies === spId;
                  return (
                    <button
                      key={spId}
                      type="button"
                      onClick={() => onSelectSpecies?.(active ? null : spId)}
                      className={`min-h-[32px] px-2 rounded border text-xs font-mono cursor-pointer inline-flex items-center gap-1.5 ${
                        active
                          ? 'border-[#EDF4F1] bg-[#18383E] text-[#EDF4F1] font-bold'
                          : 'border-[#2D454B] bg-[#0B161A] text-[#C8D8D7] hover:border-[#78D4C4]'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sp.cssColor }}
                      />
                      <ChemText text={sp.symbol} />
                    </button>
                  );
                })}
              </div>

              {trackedSpecies && (
                <div className="rounded bg-[#13292F] border border-[#78D4C4]/50 p-2 text-xs text-[#DDF0EE]">
                  <strong className="text-[#78D4C4]">
                    <ChemText text={MICRO_SPECIES_META[trackedSpecies].name} />:
                  </strong>{' '}
                  <ChemText text={MICRO_SPECIES_META[trackedSpecies].roleSummary} />
                </div>
              )}
            </div>

            <div className="text-[10px] text-[#8CA3A6] leading-snug border-t border-[#1D3035] pt-1.5">
              Lưu ý khoa học: kích thước hạt và vận tốc chuyển động được phóng đại để minh họa cơ chế phản ứng; electron không đi xuyên qua dung dịch hay cầu muối.
            </div>
          </div>
        )}

        {/* Level 1: Hover Tooltip (Desktop) */}
        {overlayState.hoverBadge && !activeObjectInfo && !isBoardOrPractice && worldZone !== 'MICRO' && (
          <div
            style={{
              transform: `translate(${Math.round(overlayState.hoverBadge.x)}px, ${Math.round(overlayState.hoverBadge.y)}px) translate(-50%, -100%)`,
            }}
            className="pointer-events-none absolute top-0 left-0 z-20 rounded border border-[#78D4C4]/80 bg-[#101D21]/95 px-3 py-1.5 shadow-lg"
          >
            <div className="text-sm font-semibold text-[#EDF4F1] whitespace-nowrap">
              <ChemText text={overlayState.hoverBadge.title} />
            </div>
            <div className="text-xs text-[#78D4C4] whitespace-nowrap">{overlayState.hoverBadge.hint}</div>
          </div>
        )}

        {/* Dynamic 2-segment SVG Leader Line connecting 3D anchor to Desktop HTML Popup */}
        {popupLayout && popupLayout.visible && popupLayout.mode === 'anchored' && (activeTableMeta || activeObjectInfo) && (() => {
          const elbowX =
            popupLayout.side === 'right'
              ? Math.max(popupLayout.anchorX + 24, popupLayout.connectX - 38)
              : Math.min(popupLayout.anchorX - 24, popupLayout.connectX + 38);
          return (
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 w-full h-full z-20"
            >
              <polyline
                points={`${popupLayout.anchorX},${popupLayout.anchorY} ${elbowX},${popupLayout.connectY} ${popupLayout.connectX},${popupLayout.connectY}`}
                fill="none"
                stroke="#78D4C4"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx={popupLayout.anchorX} cy={popupLayout.anchorY} r="8" fill="#78D4C4" fillOpacity="0.24" />
              <circle cx={popupLayout.anchorX} cy={popupLayout.anchorY} r="4.5" fill="#78D4C4" stroke="#10191C" strokeWidth="2" />
            </svg>
          );
        })()}

        {/* Level 2 (Table Popup) & Level 3 (Object Popup) */}
        {popupLayout && popupLayout.visible && (activeTableMeta || activeObjectInfo) && (
          <div
            role="dialog"
            aria-label={activeObjectInfo ? activeObjectInfo.meta.name : activeTableMeta?.title}
            data-testid="lab-3d-popup"
            style={
              popupLayout.mode === 'anchored'
                ? {
                    transform: `translate(${Math.round(popupLayout.left)}px, ${Math.round(popupLayout.top)}px)`,
                    width: activeObjectInfo ? 316 : 312,
                  }
                : undefined
            }
            className={
              popupLayout.mode === 'anchored'
                ? 'absolute top-0 left-0 z-30 rounded-lg border border-[#78D4C4]/85 bg-[#122024]/95 p-4 text-[#EDF4F1] shadow-2xl space-y-2.5'
                : 'absolute inset-x-2 bottom-2 z-30 rounded-lg border border-[#78D4C4]/85 bg-[#122024]/96 p-3.5 text-[#EDF4F1] shadow-2xl space-y-2 max-h-[54%] overflow-y-auto'
            }
          >
            {activeTableMeta && (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-mono text-[#78D4C4]">{activeTableMeta.shortCode}</div>
                    <h2 className="font-serif text-lg font-semibold leading-tight" style={{ color: '#EDF4F1' }}>
                      <ChemText text={activeTableMeta.title} />
                    </h2>
                  </div>
                  {popupLayout.mode === 'bottom-sheet' && (
                    <button
                      type="button"
                      onClick={() => setSheetExpanded((v) => !v)}
                      className="min-h-[36px] px-2 text-xs text-[#78D4C4] cursor-pointer"
                    >
                      {sheetExpanded ? 'Thu gọn' : 'Mở rộng'}
                    </button>
                  )}
                </div>

                {(popupLayout.mode === 'anchored' || sheetExpanded) && (
                  <p className="text-sm text-[#B8CAC9] leading-relaxed">
                    <ChemText text={activeTableMeta.summary} />
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onToggleRun}
                    className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 px-3 rounded bg-[#78D4C4] text-[#10191C] font-semibold text-sm hover:bg-[#93E3D5] transition-colors cursor-pointer"
                  >
                    {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isRunning ? 'Tạm dừng' : 'Chạy thí nghiệm'}
                  </button>
                  <button
                    type="button"
                    onClick={onOpenReactionView}
                    className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 px-3 rounded border border-[#78D4C4]/75 bg-[#182B30] text-[#EDF4F1] font-medium text-sm hover:bg-[#223A40] transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-[#78D4C4]" />
                    Góc phản ứng
                  </button>
                  {onEnterMicro && (
                    <button
                      type="button"
                      data-testid="popup-enter-micro-btn"
                      onClick={() => onEnterMicro()}
                      className="min-h-[42px] w-full inline-flex items-center justify-center gap-1.5 px-3 rounded border border-[#C77B4C] bg-[#261B15] text-[#F5D3BE] font-semibold text-xs sm:text-sm hover:bg-[#34241B] transition-colors cursor-pointer"
                    >
                      <Microscope className="w-4 h-4 text-[#E3A678]" />
                      Quan sát vi mô (cấp độ ion)
                    </button>
                  )}
                </div>
              </>
            )}

            {activeObjectInfo && (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-mono text-[#C77B4C]">{activeObjectInfo.meta.kind}</div>
                    <h2 className="font-serif text-base sm:text-lg font-semibold leading-tight" style={{ color: '#EDF4F1' }}>
                      <ChemText text={activeObjectInfo.meta.name} />
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={onBackToTable}
                    aria-label="Đóng bảng chi tiết dụng cụ"
                    className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded border border-[#365056] text-[#A2B6B5] hover:text-[#EDF4F1] hover:border-[#78D4C4] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {activeObjectInfo.equation && (
                  <div className="rounded bg-[#0C1619] border border-[#284047] px-2.5 py-1.5 text-sm font-medium text-[#78D4C4]">
                    <ChemText text={activeObjectInfo.equation} />
                  </div>
                )}

                {activeObjectInfo.liveStat && (
                  <div className="text-xs font-mono tabular-nums text-[#E8C5A5]">
                    <ChemText text={activeObjectInfo.liveStat} />
                  </div>
                )}

                <p className="text-sm text-[#C4D4D3] leading-relaxed">
                  <ChemText text={activeObjectInfo.description} />
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {activeObjectInfo.actionLabel && activeObjectInfo.onAction && (
                    <button
                      type="button"
                      data-testid="popup-primary-action"
                      onClick={activeObjectInfo.onAction}
                      className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 px-3 rounded bg-[#78D4C4] text-[#10191C] font-semibold text-sm hover:bg-[#93E3D5] transition-colors cursor-pointer"
                    >
                      <Power className="w-4 h-4" />
                      {activeObjectInfo.actionLabel}
                    </button>
                  )}
                  {onEnterMicro && selectedObject && (
                    <button
                      type="button"
                      onClick={() =>
                        onEnterMicro(defaultMicroZoneForObject(selectedObject, naclVariant))
                      }
                      className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 rounded border border-[#C77B4C] bg-[#261B15] text-[#F5D3BE] text-xs sm:text-sm font-semibold hover:bg-[#34241B] cursor-pointer"
                    >
                      <Microscope className="w-4 h-4 text-[#E3A678]" />
                      Vi mô
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onBackToTable}
                    className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 rounded border border-[#365056] bg-[#18272B] text-[#EDF4F1] text-sm font-medium hover:border-[#78D4C4] transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Về bàn
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Contextual World Overlays (SmartBoardPanel, PracticeDeskPanel, Return Banners, Visual Quiz Banner) */}
        {children}
      </div>
    );
  }
);
