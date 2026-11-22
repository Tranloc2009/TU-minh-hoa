import * as THREE from 'three';
import {
  LAB_OBJECTS,
  LAB_TABLES,
  Lab3DVisuals,
  LabExperimentId,
  LabObjectId,
  TABLE_POSITIONS,
  TABLE_TOP_Y,
} from '../../utils/lab3dState';
import {
  MICRO_SPECIES_META,
  MICRO_ZONES,
  MicroscopicFrameData,
  WORLD_ANCHORS,
  WorldZone,
} from '../../utils/labWorldState';
import {
  LiveDisplayTexture,
  createBeakerGraduationTexture,
  createContactShadowTexture,
  createLabWallSignTexture,
  createLiveDisplayTexture,
  createPracticeCoverSheetTexture,
  createSlateFloorTexture,
  createSmartBoardIdleTexture,
  createStationPlaqueTexture,
  createWallDiagramTexture,
  createWalnutWoodTextures,
} from './labTextures';

export interface SelectableHitTarget {
  mesh: THREE.Mesh;
  kind: 'table' | 'object' | 'zone';
  station?: LabExperimentId;
  objectId?: LabObjectId;
  zoneId?: 'BOARD' | 'PRACTICE';
}

export interface WorldVisualOptions {
  zone: WorldZone;
  hoveredZone: 'BOARD' | 'PRACTICE' | null;
  cutawayActive: boolean;
  microFrame: MicroscopicFrameData | null;
  microShowHydration: boolean;
  microShowReactionZone: boolean;
  microShowArrows: boolean;
  practiceFlipAngle: number; // 0 .. Math.PI
  practiceOpenLift: number; // 0 .. 1
  visualQuizCandidates?: LabObjectId[] | null;
  visualQuizSelected?: LabObjectId | null;
}

export interface LabSceneRig {
  scene: THREE.Scene;
  zoneHitboxes: SelectableHitTarget[];
  tableHitboxes: SelectableHitTarget[];
  objectHitboxes: SelectableHitTarget[];
  occlusionMeshes: THREE.Object3D[];
  tableRimMaterials: Record<LabExperimentId, THREE.MeshStandardMaterial>;
  tableLedMaterials: Record<LabExperimentId, THREE.MeshStandardMaterial>;
  objectHighlightMaterials: Partial<Record<LabObjectId, THREE.MeshBasicMaterial>>;
  // V2 Smart Teaching Board & Practice Desk refs
  boardBezelMat: THREE.MeshStandardMaterial;
  practiceRimMat: THREE.MeshStandardMaterial;
  practicePagePivot: THREE.Group;
  practiceStackTopGroup: THREE.Group;
  // V2 Cutaway & Microscopic 3D Rig
  cutawayClipPlane: THREE.Plane;
  microGroup: THREE.Group;
  microRing: THREE.Mesh;
  microIonMesh: THREE.InstancedMesh;
  microHydrationMesh: THREE.InstancedMesh;
  microLatticeMesh: THREE.InstancedMesh;
  microArrows: THREE.Group[];
  // Station 1 dynamic refs
  znCuSwitchPivot: THREE.Group;
  znCuVoltmeterDisplay: LiveDisplayTexture;
  znCuZnPlate: THREE.Mesh;
  znCuCuPlating: THREE.Mesh;
  znCuCuSolutionMat: THREE.MeshPhysicalMaterial;
  znCuWireCurve: THREE.CatmullRomCurve3;
  znCuElectrons: THREE.Mesh[];
  znCuKCurve: THREE.CatmullRomCurve3;
  znCuNO3Curve: THREE.CatmullRomCurve3;
  znCuKIons: THREE.Mesh[];
  znCuNO3Ions: THREE.Mesh[];
  // Station 2 dynamic refs
  cuso4Display: LiveDisplayTexture;
  cuso4SolutionMat: THREE.MeshPhysicalMaterial;
  cuso4CathodePlating: THREE.Mesh;
  cuso4AnodeGraphite: THREE.Mesh;
  cuso4AnodeCopper: THREE.Mesh;
  cuso4WireCurve: THREE.CatmullRomCurve3;
  cuso4Electrons: THREE.Mesh[];
  cuso4O2Bubbles: THREE.Mesh[];
  cuso4H2Bubbles: THREE.Mesh[];
  // Station 3 dynamic refs
  naclDisplay: LiveDisplayTexture;
  naclBrineGroup: THREE.Group;
  naclMoltenGroup: THREE.Group;
  naclMembraneHitbox: THREE.Mesh;
  naclWireCurve: THREE.CatmullRomCurve3;
  naclElectrons: THREE.Mesh[];
  naclCl2Bubbles: THREE.Mesh[];
  naclH2Bubbles: THREE.Mesh[];
  naclNaDrops: THREE.Mesh[];
  naclNaIons: THREE.Mesh[];
  // Cleanup registry
  disposables: Array<{ dispose: () => void }>;
}

// Reusable scratch objects to prevent per-frame allocations in update loop
const _tmpVec3 = new THREE.Vector3();
const _tmpColor = new THREE.Color();
const _tmpDummy = new THREE.Object3D();
const _colorBlueRich = new THREE.Color('#0E7AE6');
const _colorBlueClear = new THREE.Color('#B5D6DE');
const _colorMint = new THREE.Color('#78D4C4');
const _colorCopper = new THREE.Color('#C77B4C');
const _colorDimBorder = new THREE.Color('#273D43');
const _colorDimParticle = new THREE.Color('#394D54');
const MICRO_MAX_PARTICLES = 64;
const MICRO_MAX_LATTICE = 36;

// Deterministic pseudo-random helper for bubbles (100% reproducible on pause / scrub backwards)
function seededFrac(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function addHighlightBox(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  disposables: Array<{ dispose: () => void }>
): THREE.MeshBasicMaterial {
  const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d));
  const mat = new THREE.MeshBasicMaterial({
    color: 0x78d4c4,
    transparent: true,
    opacity: 0,
    depthTest: true,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.position.set(x, y, z);
  lines.renderOrder = 15;
  parent.add(lines);
  disposables.push(geo, mat);
  return mat;
}

function createGlassBeakerGroup(
  radius: number,
  height: number,
  liquidColorHex: number,
  liquidOpacity: number,
  gradTex: THREE.CanvasTexture,
  isSoftwareGl: boolean,
  cutawayClipPlane: THREE.Plane,
  disposables: Array<{ dispose: () => void }>
): {
  group: THREE.Group;
  liquidMat: THREE.MeshPhysicalMaterial;
} {
  const group = new THREE.Group();

  // Inner liquid volume
  const liqHeight = height * 0.72;
  const liqGeo = new THREE.CylinderGeometry(radius * 0.91, radius * 0.9, liqHeight, 24);
  const isBlueLiq = ((liquidColorHex >> 0) & 0xff) > 150 && ((liquidColorHex >> 16) & 0xff) < 90;
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: liquidColorHex,
    emissive: isBlueLiq ? 0x063566 : 0x000000,
    emissiveIntensity: isBlueLiq ? 0.42 : 0,
    roughness: 0.14,
    metalness: 0.02,
    transparent: true,
    opacity: isBlueLiq ? Math.min(0.84, liquidOpacity + 0.12) : liquidOpacity,
    depthWrite: false,
    clippingPlanes: [cutawayClipPlane],
  });
  const liqMesh = new THREE.Mesh(liqGeo, liquidMat);
  liqMesh.position.y = liqHeight / 2 + 0.015;
  liqMesh.renderOrder = 2;
  group.add(liqMesh);

  // Liquid meniscus ring at top surface
  const menGeo = new THREE.RingGeometry(radius * 0.72, radius * 0.91, 24);
  const menMat = new THREE.MeshBasicMaterial({
    color: 0xdff6ff,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
    depthWrite: false,
    clippingPlanes: [cutawayClipPlane],
  });
  const menMesh = new THREE.Mesh(menGeo, menMat);
  menMesh.rotation.x = -Math.PI / 2;
  menMesh.position.y = liqHeight + 0.017;
  menMesh.renderOrder = 3;
  group.add(menMesh);

  // Outer borosilicate glass cylinder (open-ended with cutaway support)
  const glassGeo = new THREE.CylinderGeometry(radius, radius * 0.98, height, 28, 1, true);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6f4f6,
    roughness: 0.08,
    metalness: 0.05,
    transparent: true,
    opacity: isSoftwareGl ? 0.26 : 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    side: THREE.DoubleSide,
    depthWrite: false,
    clippingPlanes: [cutawayClipPlane],
  });
  const glassWall = new THREE.Mesh(glassGeo, glassMat);
  glassWall.position.y = height / 2;
  glassWall.renderOrder = 5;
  group.add(glassWall);

  // Thick glass bottom disc
  const botGeo = new THREE.CylinderGeometry(radius * 0.98, radius * 0.98, 0.016, 24);
  const botMat = new THREE.MeshPhysicalMaterial({
    color: 0xd7ebee,
    roughness: 0.12,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const botMesh = new THREE.Mesh(botGeo, botMat);
  botMesh.position.y = 0.008;
  botMesh.renderOrder = 4;
  group.add(botMesh);

  // Rolled top glass lip
  const rimGeo = new THREE.TorusGeometry(radius, 0.009, 10, 28);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xeaf7f8,
    roughness: 0.12,
    metalness: 0.1,
    transparent: true,
    opacity: 0.65,
    clippingPlanes: [cutawayClipPlane],
  });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = height;
  rimMesh.renderOrder = 6;
  group.add(rimMesh);

  // Subtle graduation markings cylinder slightly outside glass
  const gradGeo = new THREE.CylinderGeometry(radius * 1.006, radius * 0.986, height * 0.78, 24, 1, true);
  const gradMat = new THREE.MeshBasicMaterial({
    map: gradTex,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    clippingPlanes: [cutawayClipPlane],
  });
  const gradMesh = new THREE.Mesh(gradGeo, gradMat);
  gradMesh.position.y = height * 0.48;
  gradMesh.rotation.y = -Math.PI / 2;
  gradMesh.renderOrder = 7;
  group.add(gradMesh);

  disposables.push(liqGeo, liquidMat, menGeo, menMat, glassGeo, glassMat, botGeo, botMat, rimGeo, rimMat, gradGeo, gradMat);

  return { group, liquidMat };
}

function createDCPowerSupplyGroup(
  display: LiveDisplayTexture,
  disposables: Array<{ dispose: () => void }>
): THREE.Group {
  const group = new THREE.Group();

  const bodyGeo = new THREE.BoxGeometry(0.56, 0.34, 0.38);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x303c40,
    roughness: 0.45,
    metalness: 0.35,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.18;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Front bezel with subtle mint accent rim
  const bezelGeo = new THREE.BoxGeometry(0.54, 0.32, 0.02);
  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0x162226,
    roughness: 0.5,
    metalness: 0.2,
  });
  const bezel = new THREE.Mesh(bezelGeo, bezelMat);
  bezel.position.set(0, 0.18, 0.19);
  group.add(bezel);

  // LCD display plane
  const screenGeo = new THREE.PlaneGeometry(0.32, 0.14);
  const screenMat = new THREE.MeshBasicMaterial({ map: display.texture });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(-0.07, 0.24, 0.203);
  group.add(screen);

  // Rotary current knob
  const knobGeo = new THREE.CylinderGeometry(0.045, 0.048, 0.035, 20);
  const knobMat = new THREE.MeshStandardMaterial({
    color: 0x1e282b,
    roughness: 0.35,
    metalness: 0.6,
  });
  const knob = new THREE.Mesh(knobGeo, knobMat);
  knob.rotation.x = Math.PI / 2;
  knob.position.set(0.18, 0.22, 0.21);
  group.add(knob);

  const knobRingGeo = new THREE.TorusGeometry(0.047, 0.005, 8, 20);
  const knobRingMat = new THREE.MeshStandardMaterial({
    color: 0xc77b4c,
    roughness: 0.25,
    metalness: 0.85,
  });
  const knobRing = new THREE.Mesh(knobRingGeo, knobRingMat);
  knobRing.position.set(0.18, 0.22, 0.225);
  group.add(knobRing);

  // Power LED ring
  const pwrGeo = new THREE.TorusGeometry(0.026, 0.005, 8, 16);
  const pwrMat = new THREE.MeshBasicMaterial({ color: 0x78d4c4 });
  const pwr = new THREE.Mesh(pwrGeo, pwrMat);
  pwr.position.set(-0.19, 0.09, 0.205);
  group.add(pwr);

  // Red (+) and Black (-) binding posts
  const postGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.045, 16);
  const redMat = new THREE.MeshStandardMaterial({ color: 0xd9483b, roughness: 0.35, metalness: 0.2 });
  const blkMat = new THREE.MeshStandardMaterial({ color: 0x161a1d, roughness: 0.4, metalness: 0.25 });

  const redPost = new THREE.Mesh(postGeo, redMat);
  redPost.rotation.x = Math.PI / 2;
  redPost.position.set(-0.04, 0.09, 0.215);
  group.add(redPost);

  const blkPost = new THREE.Mesh(postGeo, blkMat);
  blkPost.rotation.x = Math.PI / 2;
  blkPost.position.set(0.09, 0.09, 0.215);
  group.add(blkPost);

  // Rubber feet
  const footGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.018, 12);
  const footMat = new THREE.MeshStandardMaterial({ color: 0x121719, roughness: 0.9 });
  for (const fx of [-0.22, 0.22]) {
    for (const fz of [-0.14, 0.14]) {
      const f = new THREE.Mesh(footGeo, footMat);
      f.position.set(fx, 0.009, fz);
      group.add(f);
    }
  }

  disposables.push(
    bodyGeo, bodyMat, bezelGeo, bezelMat, screenGeo, screenMat,
    knobGeo, knobMat, knobRingGeo, knobRingMat, pwrGeo, pwrMat,
    postGeo, redMat, blkMat, footGeo, footMat
  );

  return group;
}

export function buildLabScene(
  renderer: THREE.WebGLRenderer,
  isSoftwareGl: boolean
): LabSceneRig {
  const disposables: Array<{ dispose: () => void }> = [];
  const maxAniso = isSoftwareGl ? 1 : Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0E1619');
  scene.fog = new THREE.Fog('#0E1619', 15, 29);

  // === 3-Point Warm/Cool Studio Lab Lighting (<= 1 shadow caster) ===
  const hemiLight = new THREE.HemisphereLight(0xd9eff2, 0x1a2024, 0.85);
  scene.add(hemiLight);

  // Warm architectural overhead key light matching the pendant bar in Storyboard 01
  const keyLight = new THREE.DirectionalLight(0xfff1dc, 1.55);
  keyLight.position.set(2.8, 7.6, 4.4);
  if (!isSoftwareGl) {
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -7.5;
    keyLight.shadow.camera.right = 7.5;
    keyLight.shadow.camera.top = 5.5;
    keyLight.shadow.camera.bottom = -5.5;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 18;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
  }
  scene.add(keyLight);

  // Cool daylight fill from right-hand laboratory window
  const windowFill = new THREE.DirectionalLight(0xaadbf0, 0.72);
  windowFill.position.set(8.5, 4.2, 1.2);
  scene.add(windowFill);

  // Subtle warm rim from rear wall shelf strip
  const rimLight = new THREE.PointLight(0xffcf94, 0.9, 13, 1.4);
  rimLight.position.set(0, 2.75, -2.2);
  scene.add(rimLight);

  // Shared procedural textures
  const walnut = createWalnutWoodTextures(maxAniso);
  const floorTex = createSlateFloorTexture(maxAniso);
  const gradTex = createBeakerGraduationTexture(maxAniso);
  const wallSignTex = createLabWallSignTexture(maxAniso);
  const wallDiagTex = createWallDiagramTexture(maxAniso);
  const shadowDiscTex = createContactShadowTexture();
  disposables.push(walnut.map, walnut.bumpMap, floorTex, gradTex, wallSignTex, wallDiagTex, shadowDiscTex);

  // Shared materials
  const walnutMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: walnut.map,
    bumpMap: walnut.bumpMap,
    bumpScale: 0.012,
    roughness: 0.48,
    metalness: 0.05,
  });
  const darkWallMat = new THREE.MeshStandardMaterial({
    color: 0x1b2326,
    roughness: 0.88,
    metalness: 0.04,
  });
  const steelFrameMat = new THREE.MeshStandardMaterial({
    color: 0x1c2327,
    roughness: 0.42,
    metalness: 0.72,
  });
  const zincMat = new THREE.MeshStandardMaterial({
    color: 0xb7c2c8,
    roughness: 0.34,
    metalness: 0.84,
  });
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xc97343,
    roughness: 0.24,
    metalness: 0.88,
  });
  const graphiteMat = new THREE.MeshStandardMaterial({
    color: 0x2c3236,
    roughness: 0.68,
    metalness: 0.25,
  });
  const mintAccentMat = new THREE.MeshStandardMaterial({
    color: 0x62b4a5,
    roughness: 0.45,
    metalness: 0.12,
  });
  const trayMat = new THREE.MeshStandardMaterial({
    color: 0x1b2528,
    roughness: 0.55,
    metalness: 0.2,
  });
  const redWireMat = new THREE.MeshStandardMaterial({
    color: 0xc9493b,
    roughness: 0.42,
    metalness: 0.08,
  });
  const blackWireMat = new THREE.MeshStandardMaterial({
    color: 0x1b2024,
    roughness: 0.48,
    metalness: 0.1,
  });
  const electronMat = new THREE.MeshStandardMaterial({
    color: 0xaaf7ea,
    emissive: 0x5de6cf,
    emissiveIntensity: 1.4,
    roughness: 0.15,
    metalness: 0.1,
  });
  const kIonMat = new THREE.MeshStandardMaterial({
    color: 0x78d4c4,
    emissive: 0x3eb39f,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });
  const no3IonMat = new THREE.MeshStandardMaterial({
    color: 0xf0ae6d,
    emissive: 0xc77b4c,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });
  const o2BubbleMat = new THREE.MeshStandardMaterial({
    color: 0xbbf4ef,
    emissive: 0x5abfb4,
    emissiveIntensity: 0.45,
    transparent: true,
    opacity: 0.82,
    roughness: 0.12,
  });
  const h2BubbleMat = new THREE.MeshStandardMaterial({
    color: 0xf7fbff,
    emissive: 0x99d9f2,
    emissiveIntensity: 0.45,
    transparent: true,
    opacity: 0.86,
    roughness: 0.1,
  });
  const cl2BubbleMat = new THREE.MeshStandardMaterial({
    color: 0xd6ea76,
    emissive: 0xa4bf41,
    emissiveIntensity: 0.55,
    transparent: true,
    opacity: 0.84,
    roughness: 0.15,
  });
  const naMetalMat = new THREE.MeshStandardMaterial({
    color: 0xd9e1e6,
    emissive: 0x4b5c66,
    emissiveIntensity: 0.35,
    roughness: 0.22,
    metalness: 0.9,
  });
  const contactShadowMat = new THREE.MeshBasicMaterial({
    map: shadowDiscTex,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });

  disposables.push(
    walnutMat, darkWallMat, steelFrameMat, zincMat, copperMat, graphiteMat,
    mintAccentMat, trayMat, redWireMat, blackWireMat, electronMat, kIonMat,
    no3IonMat, o2BubbleMat, h2BubbleMat, cl2BubbleMat, naMetalMat, contactShadowMat
  );

  const occlusionMeshes: THREE.Object3D[] = [];
  const zoneHitboxes: SelectableHitTarget[] = [];
  const tableHitboxes: SelectableHitTarget[] = [];
  const objectHitboxes: SelectableHitTarget[] = [];
  const tableRimMaterials = {} as Record<LabExperimentId, THREE.MeshStandardMaterial>;
  const tableLedMaterials = {} as Record<LabExperimentId, THREE.MeshStandardMaterial>;
  const objectHighlightMaterials: Partial<Record<LabObjectId, THREE.MeshBasicMaterial>> = {};

  // Cutaway clipping plane (normal pointing -Z, constant = 100 means unclipped by default)
  const cutawayClipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 100);

  // === ARCHITECTURAL CUTAWAY LABORATORY ROOM (EXPANDED FOR BOARD + 3 TABLES + PRACTICE DESK) ===
  const roomGroup = new THREE.Group();
  scene.add(roomGroup);

  // Tiled charcoal floor (expanded to 15.6m x 13.8m so portrait mobile frames fill cleanly)
  const floorGeo = new THREE.PlaneGeometry(15.6, 13.8);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: floorTex,
    roughness: 0.68,
    metalness: 0.08,
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(0, 0, 2.3);
  floorMesh.receiveShadow = true;
  roomGroup.add(floorMesh);
  occlusionMeshes.push(floorMesh);
  disposables.push(floorGeo, floorMat);

  // Back wall, Left wall, Right wall (taller studio walls for clean portrait framing)
  const backWallGeo = new THREE.BoxGeometry(15.8, 6.2, 0.22);
  const backWall = new THREE.Mesh(backWallGeo, darkWallMat);
  backWall.position.set(0, 3.1, -3.9);
  backWall.receiveShadow = true;
  roomGroup.add(backWall);
  occlusionMeshes.push(backWall);

  const sideWallGeo = new THREE.BoxGeometry(0.22, 6.2, 13.8);
  const leftWall = new THREE.Mesh(sideWallGeo, darkWallMat);
  leftWall.position.set(-7.8, 3.1, 2.9);
  leftWall.receiveShadow = true;
  roomGroup.add(leftWall);

  const rightWall = new THREE.Mesh(sideWallGeo, darkWallMat);
  rightWall.position.set(7.8, 3.1, 2.9);
  rightWall.receiveShadow = true;
  roomGroup.add(rightWall);

  // Architectural front floor curb (cutaway miniature diorama rim)
  const curbGeo = new THREE.BoxGeometry(15.8, 0.28, 0.22);
  const curb = new THREE.Mesh(curbGeo, darkWallMat);
  curb.position.set(0, 0.14, 9.15);
  roomGroup.add(curb);
  disposables.push(backWallGeo, sideWallGeo, curbGeo);

  // Back walnut cabinetry counter
  const counterBaseGeo = new THREE.BoxGeometry(14.4, 0.9, 0.82);
  const counterBase = new THREE.Mesh(counterBaseGeo, walnutMat);
  counterBase.position.set(0, 0.45, -3.38);
  counterBase.receiveShadow = true;
  roomGroup.add(counterBase);

  const counterTopGeo = new THREE.BoxGeometry(14.55, 0.07, 0.92);
  const counterTop = new THREE.Mesh(counterTopGeo, walnutMat);
  counterTop.position.set(0, 0.93, -3.35);
  counterTop.receiveShadow = true;
  roomGroup.add(counterTop);
  disposables.push(counterBaseGeo, counterTopGeo);

  // =========================================================================
  // V2 ZONE A: 3D SMART TEACHING BOARD (MOUNTED BACK-LEFT WALL)
  // =========================================================================
  const boardGroup = new THREE.Group();
  boardGroup.position.set(
    WORLD_ANCHORS.boardCenter.x,
    WORLD_ANCHORS.boardCenter.y,
    WORLD_ANCHORS.boardCenter.z
  );
  scene.add(boardGroup);

  const boardFrameGeo = new THREE.BoxGeometry(3.86, 2.18, 0.12);
  const boardFrame = new THREE.Mesh(boardFrameGeo, steelFrameMat);
  boardFrame.castShadow = true;
  boardGroup.add(boardFrame);

  const boardBezelMat = new THREE.MeshStandardMaterial({
    color: 0x3b6068,
    emissive: 0x1a4448,
    emissiveIntensity: 0.4,
    roughness: 0.3,
    metalness: 0.5,
  });
  const boardBezelGeo = new THREE.BoxGeometry(3.94, 2.26, 0.07);
  const boardBezel = new THREE.Mesh(boardBezelGeo, boardBezelMat);
  boardBezel.position.z = -0.02;
  boardGroup.add(boardBezel);

  const smartBoardTex = createSmartBoardIdleTexture(maxAniso);
  const boardScreenGeo = new THREE.PlaneGeometry(3.64, 1.98);
  const boardScreenMat = new THREE.MeshBasicMaterial({ map: smartBoardTex });
  const boardScreen = new THREE.Mesh(boardScreenGeo, boardScreenMat);
  boardScreen.position.z = 0.068;
  boardGroup.add(boardScreen);

  // Chalk / Stylus tray below Smart Board + 3 stylus pens
  const chalkTrayGeo = new THREE.BoxGeometry(2.1, 0.055, 0.18);
  const chalkTray = new THREE.Mesh(chalkTrayGeo, steelFrameMat);
  chalkTray.position.set(0, -1.14, 0.12);
  boardGroup.add(chalkTray);

  const stylusGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.22, 10);
  const stylusColors = [0x78d4c4, 0xc77b4c, 0xedf4f1];
  for (let i = 0; i < 3; i++) {
    const sMat = new THREE.MeshStandardMaterial({ color: stylusColors[i], roughness: 0.3, metalness: 0.4 });
    const pen = new THREE.Mesh(stylusGeo, sMat);
    pen.rotation.z = Math.PI / 2;
    pen.position.set(-0.38 + i * 0.34, -1.1, 0.16);
    boardGroup.add(pen);
    disposables.push(sMat);
  }

  // Soft overhead light bar illuminating the Smart Board
  const boardLampGeo = new THREE.BoxGeometry(2.8, 0.05, 0.12);
  const boardLamp = new THREE.Mesh(boardLampGeo, steelFrameMat);
  boardLamp.position.set(0, 1.24, 0.24);
  boardGroup.add(boardLamp);
  const boardLampStripGeo = new THREE.PlaneGeometry(2.65, 0.06);
  const boardLampStripMat = new THREE.MeshBasicMaterial({ color: 0xe6fff9, side: THREE.DoubleSide });
  const boardLampStrip = new THREE.Mesh(boardLampStripGeo, boardLampStripMat);
  boardLampStrip.rotation.x = Math.PI / 2;
  boardLampStrip.position.set(0, 1.21, 0.24);
  boardGroup.add(boardLampStrip);

  // Invisible generous Smart Board hitbox for Overview clicking
  const boardHitGeo = new THREE.BoxGeometry(4.1, 2.45, 0.45);
  const boardHitMat = new THREE.MeshBasicMaterial({ visible: false });
  const boardHitMesh = new THREE.Mesh(boardHitGeo, boardHitMat);
  boardHitMesh.position.set(0, 0, 0.1);
  boardGroup.add(boardHitMesh);
  zoneHitboxes.push({ mesh: boardHitMesh, kind: 'zone', zoneId: 'BOARD' });

  disposables.push(
    boardFrameGeo, boardBezelGeo, boardBezelMat, smartBoardTex, boardScreenGeo, boardScreenMat,
    chalkTrayGeo, stylusGeo, boardLampGeo, boardLampStripGeo, boardLampStripMat, boardHitGeo, boardHitMat
  );

  // Back floating shelves on center-right (clear of Smart Board)
  const shelfGeo = new THREE.BoxGeometry(3.4, 0.06, 0.36);
  const shelfStripGeo = new THREE.BoxGeometry(3.2, 0.018, 0.03);
  const shelfGlowMat = new THREE.MeshBasicMaterial({ color: 0xffd7a1 });
  for (const sy of [1.85, 2.48]) {
    const shelf = new THREE.Mesh(shelfGeo, steelFrameMat);
    shelf.position.set(1.2, sy, -3.6);
    roomGroup.add(shelf);
    const strip = new THREE.Mesh(shelfStripGeo, shelfGlowMat);
    strip.position.set(1.2, sy - 0.035, -3.47);
    roomGroup.add(strip);
  }
  disposables.push(shelfGeo, shelfStripGeo, shelfGlowMat);

  // Decorative reagent bottles along back shelves
  const bottleGeo = new THREE.CylinderGeometry(0.065, 0.07, 0.24, 12);
  const amberBottleMat = new THREE.MeshStandardMaterial({
    color: 0x6f4325,
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
  });
  const clearBottleMat = new THREE.MeshStandardMaterial({
    color: 0x9fd0d6,
    roughness: 0.15,
    transparent: true,
    opacity: 0.55,
  });
  for (let i = 0; i < 6; i++) {
    const bx = -0.15 + i * 0.52;
    const by = i % 2 === 0 ? 2.63 : 2.0;
    const b = new THREE.Mesh(bottleGeo, i % 3 === 0 ? amberBottleMat : clearBottleMat);
    b.position.set(bx, by, -3.56);
    roomGroup.add(b);
  }
  disposables.push(bottleGeo, amberBottleMat, clearBottleMat);

  // Tall backlit glass display cabinet on far back-left (clear of Smart Board!)
  const cabBackGeo = new THREE.BoxGeometry(1.45, 2.35, 0.52);
  const cabBack = new THREE.Mesh(cabBackGeo, steelFrameMat);
  cabBack.position.set(-6.55, 2.15, -3.52);
  roomGroup.add(cabBack);

  const cabInteriorGeo = new THREE.PlaneGeometry(1.22, 2.08);
  const cabInteriorMat = new THREE.MeshStandardMaterial({
    color: 0x1e3036,
    emissive: 0x162b31,
    emissiveIntensity: 0.65,
    roughness: 0.7,
  });
  const cabInterior = new THREE.Mesh(cabInteriorGeo, cabInteriorMat);
  cabInterior.position.set(-6.55, 2.15, -3.25);
  roomGroup.add(cabInterior);

  const cabShelfGeo = new THREE.BoxGeometry(1.22, 0.04, 0.42);
  for (const csy of [1.62, 2.18, 2.74]) {
    const cs = new THREE.Mesh(cabShelfGeo, steelFrameMat);
    cs.position.set(-6.55, csy, -3.36);
    roomGroup.add(cs);
    for (let j = 0; j < 2; j++) {
      const cb = new THREE.Mesh(bottleGeo, j === 1 ? amberBottleMat : clearBottleMat);
      cb.position.set(-6.8 + j * 0.48, csy + 0.14, -3.34);
      roomGroup.add(cb);
    }
  }

  const cabGlassGeo = new THREE.PlaneGeometry(1.26, 2.14);
  const cabGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xbce6ea,
    transparent: true,
    opacity: 0.18,
    roughness: 0.1,
    depthWrite: false,
  });
  const cabGlass = new THREE.Mesh(cabGlassGeo, cabGlassMat);
  cabGlass.position.set(-6.55, 2.15, -3.18);
  roomGroup.add(cabGlass);

  // Tall steel lab storage cabinet on back-right with mint trim stripe
  const lockerGeo = new THREE.BoxGeometry(0.96, 2.65, 0.6);
  const locker = new THREE.Mesh(lockerGeo, steelFrameMat);
  locker.position.set(6.55, 1.38, -3.45);
  roomGroup.add(locker);
  const lockerTrimGeo = new THREE.BoxGeometry(0.82, 0.03, 0.02);
  const lockerTrim = new THREE.Mesh(lockerTrimGeo, mintAccentMat);
  lockerTrim.position.set(6.55, 2.52, -3.14);
  roomGroup.add(lockerTrim);
  disposables.push(
    cabBackGeo, cabInteriorGeo, cabInteriorMat, cabShelfGeo,
    cabGlassGeo, cabGlassMat, lockerGeo, lockerTrimGeo
  );

  // Back-wall "Phòng thí nghiệm" sign plaque (center-right clear of Smart Board)
  const signGeo = new THREE.PlaneGeometry(3.4, 0.74);
  const signMat = new THREE.MeshBasicMaterial({ map: wallSignTex, transparent: true });
  const signMesh = new THREE.Mesh(signGeo, signMat);
  signMesh.position.set(1.2, 3.48, -3.76);
  roomGroup.add(signMesh);

  // Back-right framed electrochemical diagram poster
  const diagGeo = new THREE.PlaneGeometry(1.65, 1.16);
  const diagMat = new THREE.MeshBasicMaterial({ map: wallDiagTex });
  const diagMesh = new THREE.Mesh(diagGeo, diagMat);
  diagMesh.position.set(4.55, 2.38, -3.76);
  roomGroup.add(diagMesh);
  disposables.push(signGeo, signMat, diagGeo, diagMat);

  // Right-wall sunlit architectural window with dark steel mullions
  const winGlowGeo = new THREE.PlaneGeometry(2.9, 1.85);
  const winGlowMat = new THREE.MeshBasicMaterial({ color: 0x9fc2cc });
  const winGlow = new THREE.Mesh(winGlowGeo, winGlowMat);
  winGlow.rotation.y = -Math.PI / 2;
  winGlow.position.set(7.68, 2.42, 0.9);
  roomGroup.add(winGlow);

  const winFrameHGeo = new THREE.BoxGeometry(0.06, 0.07, 3.02);
  const winFrameVGeo = new THREE.BoxGeometry(0.06, 1.98, 0.07);
  for (const wy of [1.5, 2.42, 3.34]) {
    const bar = new THREE.Mesh(winFrameHGeo, steelFrameMat);
    bar.position.set(7.64, wy, 0.9);
    roomGroup.add(bar);
  }
  for (const wz of [-0.55, 0.9, 2.35]) {
    const bar = new THREE.Mesh(winFrameVGeo, steelFrameMat);
    bar.position.set(7.64, 2.42, wz);
    roomGroup.add(bar);
  }
  disposables.push(winGlowGeo, winGlowMat, winFrameHGeo, winFrameVGeo);

  // Overhead warm-white linear lab pendant fixture
  const pendantBodyGeo = new THREE.BoxGeometry(7.2, 0.11, 0.2);
  const pendantBody = new THREE.Mesh(pendantBodyGeo, steelFrameMat);
  pendantBody.position.set(0, 4.78, -0.45);
  roomGroup.add(pendantBody);
  const pendantLightGeo = new THREE.PlaneGeometry(7.0, 0.14);
  const pendantLightMat = new THREE.MeshBasicMaterial({ color: 0xfff5e4, side: THREE.DoubleSide });
  const pendantLight = new THREE.Mesh(pendantLightGeo, pendantLightMat);
  pendantLight.rotation.x = Math.PI / 2;
  pendantLight.position.set(0, 4.715, -0.45);
  roomGroup.add(pendantLight);
  disposables.push(pendantBodyGeo, pendantLightGeo, pendantLightMat);

  // Subtle corner & counter potted botanical accents
  const potGeo = new THREE.CylinderGeometry(0.18, 0.13, 0.28, 14);
  const potMat = new THREE.MeshStandardMaterial({ color: 0xc2b8a8, roughness: 0.72 });
  const leafGeo = new THREE.DodecahedronGeometry(0.16, 1);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f7a44, roughness: 0.65 });
  const plantCoords: Array<[number, number, number]> = [
    [-6.9, 0.14, 4.4],
    [6.9, 0.14, 4.4],
    [-1.1, 1.1, -3.32],
    [3.3, 1.1, -3.32],
  ];
  for (const [px, py, pz] of plantCoords) {
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.set(px, py, pz);
    roomGroup.add(pot);
    for (let k = 0; k < 6; k++) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      const ang = (k / 6) * Math.PI * 2;
      leaf.position.set(px + Math.cos(ang) * 0.13, py + 0.24 + (k % 2) * 0.11, pz + Math.sin(ang) * 0.13);
      leaf.scale.set(1.08, 0.85, 0.92);
      roomGroup.add(leaf);
    }
  }
  disposables.push(potGeo, potMat, leafGeo, leafMat);

  // =========================================================================
  // V2 ZONE B: 3D PRACTICE DESK WITH 10-SHEET EXAM PAPER STACK & PAGE-FLIP
  // =========================================================================
  const practiceGroup = new THREE.Group();
  practiceGroup.position.set(
    WORLD_ANCHORS.practiceDesk.x,
    WORLD_ANCHORS.practiceDesk.y,
    WORLD_ANCHORS.practiceDesk.z
  );
  practiceGroup.rotation.y = -0.24;
  scene.add(practiceGroup);

  const pShadowGeo = new THREE.PlaneGeometry(2.4, 1.85);
  const pShadow = new THREE.Mesh(pShadowGeo, contactShadowMat);
  pShadow.rotation.x = -Math.PI / 2;
  pShadow.position.y = 0.015;
  practiceGroup.add(pShadow);

  const pDeskTopGeo = new THREE.BoxGeometry(1.96, 0.075, 1.32);
  const pDeskTop = new THREE.Mesh(pDeskTopGeo, walnutMat);
  pDeskTop.position.y = TABLE_TOP_Y - 0.04;
  pDeskTop.castShadow = true;
  pDeskTop.receiveShadow = true;
  practiceGroup.add(pDeskTop);
  occlusionMeshes.push(pDeskTop);

  const pLegGeo = new THREE.BoxGeometry(0.075, 0.88, 0.075);
  for (const lx of [-0.88, 0.88]) {
    for (const lz of [-0.56, 0.56]) {
      const leg = new THREE.Mesh(pLegGeo, steelFrameMat);
      leg.position.set(lx, 0.44, lz);
      leg.castShadow = true;
      practiceGroup.add(leg);
    }
  }

  // Highlightable perimeter trim for Practice Desk
  const practiceRimMat = new THREE.MeshStandardMaterial({
    color: 0x3f4c52,
    emissive: 0x000000,
    emissiveIntensity: 0,
    roughness: 0.35,
    metalness: 0.45,
  });
  const pRimLGeo = new THREE.BoxGeometry(2.02, 0.024, 0.024);
  const pRimSGeo = new THREE.BoxGeometry(0.024, 0.024, 1.38);
  const pRimF = new THREE.Mesh(pRimLGeo, practiceRimMat);
  pRimF.position.set(0, TABLE_TOP_Y - 0.014, 0.67);
  practiceGroup.add(pRimF);
  const pRimB = new THREE.Mesh(pRimLGeo, practiceRimMat);
  pRimB.position.set(0, TABLE_TOP_Y - 0.014, -0.67);
  practiceGroup.add(pRimB);
  const pRimLeft = new THREE.Mesh(pRimSGeo, practiceRimMat);
  pRimLeft.position.set(-1.0, TABLE_TOP_Y - 0.014, 0);
  practiceGroup.add(pRimLeft);
  const pRimRight = new THREE.Mesh(pRimSGeo, practiceRimMat);
  pRimRight.position.set(1.0, TABLE_TOP_Y - 0.014, 0);
  practiceGroup.add(pRimRight);

  // Front plaque "BÀI TẬP & KIỂM TRA"
  const pPlaqueTex = createStationPlaqueTexture('BÀI TẬP', maxAniso);
  const pPlaqueGeo = new THREE.PlaneGeometry(0.76, 0.19);
  const pPlaqueMat = new THREE.MeshBasicMaterial({ map: pPlaqueTex });
  const pPlaque = new THREE.Mesh(pPlaqueGeo, pPlaqueMat);
  pPlaque.position.set(0, TABLE_TOP_Y - 0.16, 0.668);
  practiceGroup.add(pPlaque);

  // Dark green leather desk blotter pad under paper stack
  const padGeo = new THREE.BoxGeometry(1.18, 0.012, 0.88);
  const padMat = new THREE.MeshStandardMaterial({ color: 0x182b30, roughness: 0.82 });
  const padMesh = new THREE.Mesh(padGeo, padMat);
  padMesh.position.set(-0.08, TABLE_TOP_Y + 0.004, 0.02);
  practiceGroup.add(padMesh);

  // Layered 10-sheet cream examination paper stack (with subtle offset & shadow)
  const paperSheetGeo = new THREE.BoxGeometry(0.56, 0.005, 0.74);
  const creamSheetMat = new THREE.MeshStandardMaterial({ color: 0xf6f1e4, roughness: 0.88 });
  const creamEdgeMat = new THREE.MeshStandardMaterial({ color: 0xe6decb, roughness: 0.9 });
  for (let i = 0; i < 9; i++) {
    const sh = new THREE.Mesh(paperSheetGeo, i % 2 === 0 ? creamSheetMat : creamEdgeMat);
    const jitterX = (seededFrac(i * 13 + 7) - 0.5) * 0.016;
    const jitterZ = (seededFrac(i * 19 + 3) - 0.5) * 0.014;
    const jitterRot = (seededFrac(i * 29 + 5) - 0.5) * 0.045;
    sh.position.set(-0.12 + jitterX, TABLE_TOP_Y + 0.014 + i * 0.0052, 0.02 + jitterZ);
    sh.rotation.y = jitterRot;
    practiceGroup.add(sh);
  }

  // Top sheet group (gently lifts slightly when focused) + animated page-flip pivot along left spine
  const practiceStackTopGroup = new THREE.Group();
  practiceStackTopGroup.position.set(-0.12, TABLE_TOP_Y + 0.064, 0.02);
  practiceGroup.add(practiceStackTopGroup);

  const coverTex = createPracticeCoverSheetTexture(maxAniso);
  const coverMat = new THREE.MeshStandardMaterial({
    map: coverTex,
    roughness: 0.82,
    side: THREE.DoubleSide,
  });
  const baseTopPlaneGeo = new THREE.PlaneGeometry(0.56, 0.74);
  const baseTopSheet = new THREE.Mesh(baseTopPlaneGeo, coverMat);
  baseTopSheet.rotation.x = -Math.PI / 2;
  practiceStackTopGroup.add(baseTopSheet);

  // Page-flip hinged mesh (pivots around left edge x = -0.28)
  const practicePagePivot = new THREE.Group();
  practicePagePivot.position.set(-0.28, 0.006, 0);
  practiceStackTopGroup.add(practicePagePivot);

  const flipSheetGeo = new THREE.PlaneGeometry(0.56, 0.74);
  const flipSheetMat = new THREE.MeshStandardMaterial({
    map: coverTex,
    roughness: 0.78,
    side: THREE.DoubleSide,
  });
  const flipSheetMesh = new THREE.Mesh(flipSheetGeo, flipSheetMat);
  flipSheetMesh.rotation.x = -Math.PI / 2;
  flipSheetMesh.position.set(0.28, 0, 0);
  practicePagePivot.add(flipSheetMesh);
  practicePagePivot.visible = false;

  // Metallic fountain pen & brass paperclip props beside the stack
  const penBodyGeo = new THREE.CylinderGeometry(0.014, 0.012, 0.34, 12);
  const penBodyMat = new THREE.MeshStandardMaterial({ color: 0x1e2c30, roughness: 0.28, metalness: 0.72 });
  const penTipMat = new THREE.MeshStandardMaterial({ color: 0xd4a455, roughness: 0.25, metalness: 0.88 });
  const penMesh = new THREE.Mesh(penBodyGeo, penBodyMat);
  penMesh.rotation.z = Math.PI / 2;
  penMesh.rotation.y = 0.35;
  penMesh.position.set(0.46, TABLE_TOP_Y + 0.024, 0.14);
  practiceGroup.add(penMesh);

  const penTipGeo = new THREE.ConeGeometry(0.013, 0.055, 10);
  const penTip = new THREE.Mesh(penTipGeo, penTipMat);
  penTip.rotation.z = -Math.PI / 2;
  penTip.position.set(0.64, TABLE_TOP_Y + 0.024, 0.08);
  practiceGroup.add(penTip);

  const clipGeo = new THREE.TorusGeometry(0.032, 0.005, 8, 16);
  const clipMesh = new THREE.Mesh(clipGeo, penTipMat);
  clipMesh.rotation.x = Math.PI / 2;
  clipMesh.position.set(0.38, TABLE_TOP_Y + 0.016, -0.22);
  practiceGroup.add(clipMesh);

  // Invisible Practice Desk hitbox for Overview clicking
  const practiceHitGeo = new THREE.BoxGeometry(2.15, 1.35, 1.55);
  const practiceHitMat = new THREE.MeshBasicMaterial({ visible: false });
  const practiceHitMesh = new THREE.Mesh(practiceHitGeo, practiceHitMat);
  practiceHitMesh.position.set(0, 0.8, 0);
  practiceGroup.add(practiceHitMesh);
  zoneHitboxes.push({ mesh: practiceHitMesh, kind: 'zone', zoneId: 'PRACTICE' });

  disposables.push(
    pShadowGeo, pDeskTopGeo, pLegGeo, practiceRimMat, pRimLGeo, pRimSGeo,
    pPlaqueTex, pPlaqueGeo, pPlaqueMat, padGeo, padMat,
    paperSheetGeo, creamSheetMat, creamEdgeMat, coverTex, coverMat,
    baseTopPlaneGeo, flipSheetGeo, flipSheetMat, penBodyGeo, penBodyMat,
    penTipMat, penTipGeo, clipGeo, practiceHitGeo, practiceHitMat
  );

  // === THREE LAB TABLES (Zn-Cu LEFT, CuSO4 CENTER, NaCl RIGHT) ===
  const tableTopGeo = new THREE.BoxGeometry(2.65, 0.08, 1.75);
  const legGeo = new THREE.BoxGeometry(0.08, 0.88, 0.08);
  const lowerShelfGeo = new THREE.BoxGeometry(2.48, 0.04, 1.56);
  const binGeo = new THREE.BoxGeometry(0.55, 0.24, 0.42);
  const rimBarLongGeo = new THREE.BoxGeometry(2.71, 0.025, 0.025);
  const rimBarShortGeo = new THREE.BoxGeometry(0.025, 0.025, 1.81);
  const ledGeo = new THREE.SphereGeometry(0.025, 12, 12);
  const tableHitGeo = new THREE.BoxGeometry(2.85, 1.55, 1.95);
  const tableHitMat = new THREE.MeshBasicMaterial({ visible: false });
  const plaqueGeo = new THREE.PlaneGeometry(0.84, 0.21);
  const shadowPlaneGeo = new THREE.PlaneGeometry(3.2, 2.25);

  disposables.push(
    tableTopGeo, legGeo, lowerShelfGeo, binGeo, rimBarLongGeo,
    rimBarShortGeo, ledGeo, tableHitGeo, tableHitMat, plaqueGeo, shadowPlaneGeo
  );

  const stationIds: LabExperimentId[] = ['pin-zn-cu', 'dien-phan-cuso4', 'dien-phan-nacl'];
  for (const stId of stationIds) {
    const meta = LAB_TABLES[stId];
    const base = TABLE_POSITIONS[stId];
    const tGroup = new THREE.Group();
    tGroup.position.set(base.x, base.y, base.z);
    scene.add(tGroup);

    // Contact shadow disc grounded just above floor (no Z-fighting)
    const cShadow = new THREE.Mesh(shadowPlaneGeo, contactShadowMat);
    cShadow.rotation.x = -Math.PI / 2;
    cShadow.position.y = 0.015;
    tGroup.add(cShadow);

    // Walnut tabletop
    const topMesh = new THREE.Mesh(tableTopGeo, walnutMat);
    topMesh.position.y = TABLE_TOP_Y - 0.04;
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    tGroup.add(topMesh);
    occlusionMeshes.push(topMesh);

    // 4 steel legs + lower shelf
    for (const lx of [-1.22, 1.22]) {
      for (const lz of [-0.78, 0.78]) {
        const leg = new THREE.Mesh(legGeo, steelFrameMat);
        leg.position.set(lx, 0.44, lz);
        leg.castShadow = true;
        tGroup.add(leg);
      }
    }
    const lowerShelf = new THREE.Mesh(lowerShelfGeo, walnutMat);
    lowerShelf.position.y = 0.24;
    lowerShelf.receiveShadow = true;
    tGroup.add(lowerShelf);

    // Storage bin props on lower shelf (matching Storyboard 01)
    const binLeft = new THREE.Mesh(binGeo, mintAccentMat);
    binLeft.position.set(-0.75, 0.38, 0.05);
    tGroup.add(binLeft);
    const binRight = new THREE.Mesh(binGeo, trayMat);
    binRight.position.set(0.72, 0.38, 0.05);
    tGroup.add(binRight);

    // Subtle hover/selected mint perimeter glow rail around tabletop
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x273d43,
      emissive: 0x000000,
      emissiveIntensity: 0,
      roughness: 0.35,
      metalness: 0.4,
    });
    tableRimMaterials[stId] = rimMat;
    disposables.push(rimMat);

    const rimFront = new THREE.Mesh(rimBarLongGeo, rimMat);
    rimFront.position.set(0, TABLE_TOP_Y - 0.015, 0.89);
    tGroup.add(rimFront);
    const rimBack = new THREE.Mesh(rimBarLongGeo, rimMat);
    rimBack.position.set(0, TABLE_TOP_Y - 0.015, -0.89);
    tGroup.add(rimBack);
    const rimLeft = new THREE.Mesh(rimBarShortGeo, rimMat);
    rimLeft.position.set(-1.34, TABLE_TOP_Y - 0.015, 0);
    tGroup.add(rimLeft);
    const rimRight = new THREE.Mesh(rimBarShortGeo, rimMat);
    rimRight.position.set(1.34, TABLE_TOP_Y - 0.015, 0);
    tGroup.add(rimRight);

    // Front station nameplate plaque
    const plaqueTex = createStationPlaqueTexture(meta.shortCode, maxAniso);
    const plaqueMat = new THREE.MeshBasicMaterial({ map: plaqueTex });
    const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaque.position.set(0, TABLE_TOP_Y - 0.17, 0.885);
    tGroup.add(plaque);
    disposables.push(plaqueTex, plaqueMat);

    // Small status indicator LED on front-right edge
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0x3b585f,
      emissive: 0x1b3a3e,
      emissiveIntensity: 0.4,
    });
    tableLedMaterials[stId] = ledMat;
    disposables.push(ledMat);
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(1.12, TABLE_TOP_Y - 0.04, 0.89);
    tGroup.add(led);

    // Invisible generous table proxy hitbox for Overview selection
    const hitMesh = new THREE.Mesh(tableHitGeo, tableHitMat);
    hitMesh.position.set(0, 0.92, 0);
    tGroup.add(hitMesh);
    tableHitboxes.push({ mesh: hitMesh, kind: 'table', station: stId });
  }

  // Helper to register clickable object hitbox + wireframe highlight
  const registerObjectHitbox = (
    parent: THREE.Object3D,
    objectId: LabObjectId,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number
  ): THREE.Mesh => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshBasicMaterial({ visible: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    disposables.push(geo, mat);
    objectHitboxes.push({
      mesh,
      kind: 'object',
      station: LAB_OBJECTS[objectId].station,
      objectId,
    });
    objectHighlightMaterials[objectId] = addHighlightBox(parent, w * 0.94, h * 0.94, d * 0.94, x, y, z, disposables);
    return mesh;
  };

  // =========================================================================
  // STATION 1: PIN Zn–Cu (x = -3.55, y = TABLE_TOP_Y, z = 0.4)
  // =========================================================================
  const s1 = new THREE.Group();
  s1.position.set(TABLE_POSITIONS['pin-zn-cu'].x, TABLE_TOP_Y, TABLE_POSITIONS['pin-zn-cu'].z);
  scene.add(s1);

  // Lab base tray under beakers
  const s1TrayGeo = new THREE.BoxGeometry(1.62, 0.03, 0.72);
  const s1Tray = new THREE.Mesh(s1TrayGeo, trayMat);
  s1Tray.position.set(0, 0.015, 0.04);
  s1.add(s1Tray);
  disposables.push(s1TrayGeo);

  // Left Beaker: ZnSO4 (clear)
  const znBeaker = createGlassBeakerGroup(0.27, 0.48, 0xd4e6ea, 0.32, gradTex, isSoftwareGl, cutawayClipPlane, disposables);
  znBeaker.group.position.set(-0.52, 0.03, 0.04);
  s1.add(znBeaker.group);
  registerObjectHitbox(s1, 'zn-cu-beaker-zn', 0.56, 0.52, 0.56, -0.52, 0.28, 0.04);

  // Right Beaker: CuSO4 (blue, fades as Cu2+ is consumed)
  const cuBeaker = createGlassBeakerGroup(0.27, 0.48, 0x136fd1, 0.66, gradTex, isSoftwareGl, cutawayClipPlane, disposables);
  cuBeaker.group.position.set(0.52, 0.03, 0.04);
  s1.add(cuBeaker.group);
  registerObjectHitbox(s1, 'zn-cu-beaker-cu', 0.56, 0.52, 0.56, 0.52, 0.28, 0.04);

  // Zn Electrode Plate (left, thins over reaction progress)
  const plateGeo = new THREE.BoxGeometry(0.16, 0.54, 0.032);
  const znCuZnPlate = new THREE.Mesh(plateGeo, zincMat);
  znCuZnPlate.position.set(-0.64, 0.34, 0.04);
  znCuZnPlate.castShadow = true;
  s1.add(znCuZnPlate);
  registerObjectHitbox(s1, 'zn-cu-electrode-zn', 0.24, 0.62, 0.22, -0.64, 0.36, 0.04);

  // Cu Electrode Plate (right) + growing copper deposit shell
  const cuBasePlate = new THREE.Mesh(plateGeo, copperMat);
  cuBasePlate.position.set(0.64, 0.34, 0.04);
  cuBasePlate.castShadow = true;
  s1.add(cuBasePlate);

  const cuPlatingGeo = new THREE.BoxGeometry(0.175, 0.36, 0.056);
  const cuPlatingMat = new THREE.MeshStandardMaterial({
    color: 0xd96e3a,
    roughness: 0.32,
    metalness: 0.82,
  });
  const znCuCuPlating = new THREE.Mesh(cuPlatingGeo, cuPlatingMat);
  znCuCuPlating.position.set(0.64, 0.24, 0.04);
  znCuCuPlating.scale.set(1, 1, 0.01);
  s1.add(znCuCuPlating);
  registerObjectHitbox(s1, 'zn-cu-electrode-cu', 0.24, 0.62, 0.22, 0.64, 0.36, 0.04);
  disposables.push(plateGeo, cuPlatingGeo, cuPlatingMat);

  // Alligator clamps atop Zn & Cu electrodes
  const clampGeo = new THREE.BoxGeometry(0.06, 0.08, 0.055);
  const znClamp = new THREE.Mesh(clampGeo, blackWireMat);
  znClamp.position.set(-0.64, 0.64, 0.04);
  s1.add(znClamp);
  const cuClamp = new THREE.Mesh(clampGeo, redWireMat);
  cuClamp.position.set(0.64, 0.64, 0.04);
  s1.add(cuClamp);
  disposables.push(clampGeo);

  // U-Shaped Salt Bridge KNO3 (TubeGeometry)
  const bridgePoints = [
    new THREE.Vector3(-0.36, 0.22, 0.04),
    new THREE.Vector3(-0.36, 0.56, 0.04),
    new THREE.Vector3(-0.26, 0.64, 0.04),
    new THREE.Vector3(0, 0.65, 0.04),
    new THREE.Vector3(0.26, 0.64, 0.04),
    new THREE.Vector3(0.36, 0.56, 0.04),
    new THREE.Vector3(0.36, 0.22, 0.04),
  ];
  const znCuKCurve = new THREE.CatmullRomCurve3(bridgePoints);
  const znCuNO3Curve = new THREE.CatmullRomCurve3([...bridgePoints].reverse());

  const bridgeGeo = new THREE.TubeGeometry(znCuKCurve, 36, 0.045, 14, false);
  const bridgeMat = new THREE.MeshPhysicalMaterial({
    color: 0xd9f1ef,
    roughness: 0.24,
    metalness: 0.02,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
  });
  const bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
  bridgeMesh.renderOrder = 6;
  s1.add(bridgeMesh);

  // Cotton plugs at salt bridge tips
  const plugGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.055, 12);
  const plugMat = new THREE.MeshStandardMaterial({ color: 0xe9ece8, roughness: 0.9 });
  const plugL = new THREE.Mesh(plugGeo, plugMat);
  plugL.position.set(-0.36, 0.22, 0.04);
  s1.add(plugL);
  const plugR = new THREE.Mesh(plugGeo, plugMat);
  plugR.position.set(0.36, 0.22, 0.04);
  s1.add(plugR);
  registerObjectHitbox(s1, 'zn-cu-salt-bridge', 0.84, 0.54, 0.2, 0, 0.48, 0.04);
  disposables.push(bridgeGeo, bridgeMat, plugGeo, plugMat);

  // Digital Voltmeter on sleek vertical column behind beakers (matching Storyboard 03/06)
  const znCuVoltmeterDisplay = createLiveDisplayTexture(maxAniso);
  disposables.push(znCuVoltmeterDisplay.texture);

  const vmGroup = new THREE.Group();
  vmGroup.position.set(0, 0, -0.44);
  s1.add(vmGroup);

  const vmBaseGeo = new THREE.BoxGeometry(0.34, 0.03, 0.24);
  const vmBase = new THREE.Mesh(vmBaseGeo, steelFrameMat);
  vmBase.position.y = 0.015;
  vmGroup.add(vmBase);

  const vmStandGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.72, 14);
  const vmStand = new THREE.Mesh(vmStandGeo, steelFrameMat);
  vmStand.position.y = 0.38;
  vmGroup.add(vmStand);

  const vmBodyGeo = new THREE.BoxGeometry(0.62, 0.34, 0.14);
  const vmBody = new THREE.Mesh(vmBodyGeo, steelFrameMat);
  vmBody.position.y = 0.88;
  vmBody.castShadow = true;
  vmGroup.add(vmBody);

  const vmRimGeo = new THREE.BoxGeometry(0.65, 0.37, 0.11);
  const vmRim = new THREE.Mesh(vmRimGeo, mintAccentMat);
  vmRim.position.set(0, 0.88, -0.01);
  vmGroup.add(vmRim);

  const vmScreenGeo = new THREE.PlaneGeometry(0.54, 0.25);
  const vmScreenMat = new THREE.MeshBasicMaterial({ map: znCuVoltmeterDisplay.texture });
  const vmScreen = new THREE.Mesh(vmScreenGeo, vmScreenMat);
  vmScreen.position.set(0, 0.88, 0.074);
  vmGroup.add(vmScreen);
  registerObjectHitbox(s1, 'zn-cu-voltmeter', 0.7, 0.44, 0.24, 0, 0.88, -0.44);
  disposables.push(vmBaseGeo, vmStandGeo, vmBodyGeo, vmRimGeo, vmScreenGeo, vmScreenMat);

  // Physical Brass Knife Switch (Khóa K) at front center of Table 1 (matching Storyboard 05 & 03)
  const swGroup = new THREE.Group();
  swGroup.position.set(0, 0, 0.62);
  s1.add(swGroup);

  const swBaseGeo = new THREE.BoxGeometry(0.54, 0.055, 0.22);
  const swBase = new THREE.Mesh(swBaseGeo, steelFrameMat);
  swBase.position.y = 0.028;
  swBase.castShadow = true;
  swGroup.add(swBase);

  const swRimGeo = new THREE.BoxGeometry(0.56, 0.016, 0.24);
  const swRim = new THREE.Mesh(swRimGeo, mintAccentMat);
  swRim.position.y = 0.008;
  swGroup.add(swRim);

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4a455,
    roughness: 0.24,
    metalness: 0.88,
  });
  const postBlockGeo = new THREE.BoxGeometry(0.06, 0.09, 0.06);
  const swPostLeft = new THREE.Mesh(postBlockGeo, brassMat);
  swPostLeft.position.set(-0.16, 0.095, 0);
  swGroup.add(swPostLeft);
  const swPostRight = new THREE.Mesh(postBlockGeo, brassMat);
  swPostRight.position.set(0.16, 0.095, 0);
  swGroup.add(swPostRight);

  // Pivoting brass blade + handle
  const znCuSwitchPivot = new THREE.Group();
  znCuSwitchPivot.position.set(-0.16, 0.11, 0);
  swGroup.add(znCuSwitchPivot);

  const bladeGeo = new THREE.BoxGeometry(0.35, 0.024, 0.02);
  const blade = new THREE.Mesh(bladeGeo, brassMat);
  blade.position.set(0.175, 0, 0);
  znCuSwitchPivot.add(blade);

  const handleGeo = new THREE.BoxGeometry(0.11, 0.048, 0.048);
  const handle = new THREE.Mesh(handleGeo, mintAccentMat);
  handle.position.set(0.36, 0.01, 0);
  znCuSwitchPivot.add(handle);

  registerObjectHitbox(s1, 'zn-cu-switch', 0.64, 0.3, 0.34, 0, 0.14, 0.62);
  disposables.push(swBaseGeo, swRimGeo, brassMat, postBlockGeo, bladeGeo, handleGeo);

  // Outer 3D wire path for Pin Zn-Cu: Zn (-) -> up -> voltmeter -> Cu (+) -> front switch -> back
  const znCuWireCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.64, 0.66, 0.04),
    new THREE.Vector3(-0.64, 0.92, -0.06),
    new THREE.Vector3(-0.34, 0.94, -0.36),
    new THREE.Vector3(-0.16, 0.86, -0.37),
    new THREE.Vector3(0.16, 0.86, -0.37),
    new THREE.Vector3(0.34, 0.94, -0.36),
    new THREE.Vector3(0.64, 0.92, -0.06),
    new THREE.Vector3(0.64, 0.66, 0.04),
  ]);
  const s1WireGeo = new THREE.TubeGeometry(znCuWireCurve, 44, 0.012, 8, false);
  const s1WireMesh = new THREE.Mesh(s1WireGeo, redWireMat);
  s1.add(s1WireMesh);

  // Front switch leads connecting beakers to knife switch
  const swLeadL = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.64, 0.64, 0.04),
    new THREE.Vector3(-0.88, 0.42, 0.36),
    new THREE.Vector3(-0.56, 0.06, 0.62),
    new THREE.Vector3(-0.22, 0.06, 0.62),
  ]);
  const swLeadR = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.22, 0.06, 0.62),
    new THREE.Vector3(0.56, 0.06, 0.62),
    new THREE.Vector3(0.88, 0.42, 0.36),
    new THREE.Vector3(0.64, 0.64, 0.04),
  ]);
  const swLeadLGeo = new THREE.TubeGeometry(swLeadL, 24, 0.011, 8, false);
  const swLeadRGeo = new THREE.TubeGeometry(swLeadR, 24, 0.011, 8, false);
  s1.add(new THREE.Mesh(swLeadLGeo, blackWireMat));
  s1.add(new THREE.Mesh(swLeadRGeo, redWireMat));
  registerObjectHitbox(s1, 'zn-cu-wire', 1.38, 0.24, 0.56, 0, 0.88, -0.18);
  disposables.push(s1WireGeo, swLeadLGeo, swLeadRGeo);

  // Animated electron orbs (Zn -> Cu along wire) & salt bridge ions (K+ -> Cu, NO3- -> Zn)
  const orbGeo = new THREE.SphereGeometry(0.028, 12, 12);
  const ionGeo = new THREE.SphereGeometry(0.022, 10, 10);
  disposables.push(orbGeo, ionGeo);

  const znCuElectrons: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(orbGeo, electronMat);
    m.visible = false;
    s1.add(m);
    znCuElectrons.push(m);
  }
  const znCuKIons: THREE.Mesh[] = [];
  const znCuNO3Ions: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const k = new THREE.Mesh(ionGeo, kIonMat);
    k.visible = false;
    s1.add(k);
    znCuKIons.push(k);

    const n = new THREE.Mesh(ionGeo, no3IonMat);
    n.visible = false;
    s1.add(n);
    znCuNO3Ions.push(n);
  }

  // =========================================================================
  // STATION 2: ĐIỆN PHÂN CuSO₄ (x = 0, y = TABLE_TOP_Y, z = 0.4)
  // =========================================================================
  const s2 = new THREE.Group();
  s2.position.set(TABLE_POSITIONS['dien-phan-cuso4'].x, TABLE_TOP_Y, TABLE_POSITIONS['dien-phan-cuso4'].z);
  scene.add(s2);

  // Mint-trimmed lab stand under CuSO4 cell (Storyboard 08/09)
  const s2StandGeo = new THREE.BoxGeometry(0.92, 0.055, 0.72);
  const s2Stand = new THREE.Mesh(s2StandGeo, steelFrameMat);
  s2Stand.position.set(-0.25, 0.028, 0.08);
  s2.add(s2Stand);
  const s2StandTrimGeo = new THREE.BoxGeometry(0.94, 0.018, 0.74);
  const s2StandTrim = new THREE.Mesh(s2StandTrimGeo, mintAccentMat);
  s2StandTrim.position.set(-0.25, 0.01, 0.08);
  s2.add(s2StandTrim);
  disposables.push(s2StandGeo, s2StandTrimGeo);

  // Main CuSO4 glass electrolytic cell
  const cuso4Cell = createGlassBeakerGroup(0.38, 0.56, 0x136fd1, 0.68, gradTex, isSoftwareGl, cutawayClipPlane, disposables);
  cuso4Cell.group.position.set(-0.25, 0.055, 0.08);
  s2.add(cuso4Cell.group);
  registerObjectHitbox(s2, 'cuso4-cell', 0.82, 0.64, 0.8, -0.25, 0.34, 0.08);
  registerObjectHitbox(s2, 'cuso4-solution', 0.64, 0.32, 0.64, -0.25, 0.22, 0.08);

  // Blue CuSO4·5H2O crystals petri dish accent (Storyboard 01 & 09)
  const dishGeo = new THREE.CylinderGeometry(0.16, 0.15, 0.032, 20);
  const dishMat = new THREE.MeshPhysicalMaterial({ color: 0xe6f4f6, transparent: true, opacity: 0.45, roughness: 0.1 });
  const dish = new THREE.Mesh(dishGeo, dishMat);
  dish.position.set(0.62, 0.016, 0.42);
  s2.add(dish);
  const crystalGeo = new THREE.ConeGeometry(0.11, 0.05, 8);
  const crystalMat = new THREE.MeshStandardMaterial({ color: 0x1d7ef0, roughness: 0.25, metalness: 0.1 });
  const crystals = new THREE.Mesh(crystalGeo, crystalMat);
  crystals.position.set(0.62, 0.042, 0.42);
  s2.add(crystals);
  disposables.push(dishGeo, dishMat, crystalGeo, crystalMat);

  // Cathode (-) on left inside CuSO4 cell + growing copper plating shell
  const rodGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.58, 16);
  const cuso4CathodeCore = new THREE.Mesh(rodGeo, graphiteMat);
  cuso4CathodeCore.position.set(-0.46, 0.38, 0.08);
  s2.add(cuso4CathodeCore);

  const platingSleeveGeo = new THREE.CylinderGeometry(0.054, 0.054, 0.38, 16);
  const cuso4CathodePlating = new THREE.Mesh(platingSleeveGeo, copperMat);
  cuso4CathodePlating.position.set(-0.46, 0.28, 0.08);
  cuso4CathodePlating.scale.set(0.65, 1, 0.65);
  cuso4CathodePlating.visible = false;
  s2.add(cuso4CathodePlating);
  registerObjectHitbox(s2, 'cuso4-cathode', 0.22, 0.62, 0.22, -0.46, 0.38, 0.08);

  // Anode (+) on right inside CuSO4 cell: switches between inert graphite rod and soluble copper plate
  const cuso4AnodeGraphite = new THREE.Mesh(rodGeo, graphiteMat);
  cuso4AnodeGraphite.position.set(-0.04, 0.38, 0.08);
  s2.add(cuso4AnodeGraphite);

  const cuAnodePlateGeo = new THREE.BoxGeometry(0.12, 0.56, 0.04);
  const cuso4AnodeCopper = new THREE.Mesh(cuAnodePlateGeo, copperMat);
  cuso4AnodeCopper.position.set(-0.04, 0.38, 0.08);
  cuso4AnodeCopper.visible = false;
  s2.add(cuso4AnodeCopper);
  registerObjectHitbox(s2, 'cuso4-anode', 0.22, 0.62, 0.22, -0.04, 0.38, 0.08);
  disposables.push(rodGeo, platingSleeveGeo, cuAnodePlateGeo);

  // DC Power Supply on right side of Table 2
  const cuso4Display = createLiveDisplayTexture(maxAniso);
  disposables.push(cuso4Display.texture);
  const s2Power = createDCPowerSupplyGroup(cuso4Display, disposables);
  s2Power.position.set(0.72, 0, -0.18);
  s2Power.rotation.y = -0.22;
  s2.add(s2Power);
  registerObjectHitbox(s2, 'cuso4-power', 0.66, 0.42, 0.46, 0.72, 0.2, -0.18);

  // Outer wire path for CuSO4: Anode (+) -> DC (+) -> DC (-) -> Cathode (-) (exact electron flow direction!)
  const cuso4WireCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.04, 0.68, 0.08),
    new THREE.Vector3(0.08, 0.84, 0.02),
    new THREE.Vector3(0.45, 0.62, 0.02),
    new THREE.Vector3(0.64, 0.14, 0.06),
    new THREE.Vector3(0.76, 0.14, 0.06),
    new THREE.Vector3(0.35, 0.78, -0.22),
    new THREE.Vector3(-0.28, 0.88, -0.06),
    new THREE.Vector3(-0.46, 0.68, 0.08),
  ]);
  const s2WireGeo = new THREE.TubeGeometry(cuso4WireCurve, 44, 0.012, 8, false);
  s2.add(new THREE.Mesh(s2WireGeo, redWireMat));
  registerObjectHitbox(s2, 'cuso4-wire', 1.15, 0.34, 0.45, 0.18, 0.74, -0.04);
  disposables.push(s2WireGeo);

  // CuSO4 dynamic electrons + O2 bubbles (anode) + H2 bubbles (cathode stage 2)
  const bubbleGeo = new THREE.SphereGeometry(0.017, 8, 8);
  disposables.push(bubbleGeo);

  const cuso4Electrons: THREE.Mesh[] = [];
  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(orbGeo, electronMat);
    m.visible = false;
    s2.add(m);
    cuso4Electrons.push(m);
  }
  const cuso4O2Bubbles: THREE.Mesh[] = [];
  const cuso4H2Bubbles: THREE.Mesh[] = [];
  for (let i = 0; i < 14; i++) {
    const o2 = new THREE.Mesh(bubbleGeo, o2BubbleMat);
    o2.visible = false;
    s2.add(o2);
    cuso4O2Bubbles.push(o2);

    const h2 = new THREE.Mesh(bubbleGeo, h2BubbleMat);
    h2.visible = false;
    s2.add(h2);
    cuso4H2Bubbles.push(h2);
  }

  // =========================================================================
  // STATION 3: ĐIỆN PHÂN NaCl (x = +3.55, y = TABLE_TOP_Y, z = 0.4)
  // =========================================================================
  const s3 = new THREE.Group();
  s3.position.set(TABLE_POSITIONS['dien-phan-nacl'].x, TABLE_TOP_Y, TABLE_POSITIONS['dien-phan-nacl'].z);
  scene.add(s3);

  // DC Power Supply on left side of Table 3 (matching Storyboard 08 NaCl)
  const naclDisplay = createLiveDisplayTexture(maxAniso);
  disposables.push(naclDisplay.texture);
  const s3Power = createDCPowerSupplyGroup(naclDisplay, disposables);
  s3Power.position.set(-0.78, 0, -0.14);
  s3Power.rotation.y = 0.22;
  s3.add(s3Power);
  registerObjectHitbox(s3, 'nacl-power', 0.66, 0.42, 0.46, -0.78, 0.2, -0.14);

  // Shared Graphite Electrodes inside Station 3 cell (Anode left x=-0.08, Cathode right x=+0.52)
  const naclAnodeMesh = new THREE.Mesh(rodGeo, graphiteMat);
  naclAnodeMesh.position.set(-0.08, 0.36, 0.08);
  s3.add(naclAnodeMesh);
  registerObjectHitbox(s3, 'nacl-anode', 0.22, 0.62, 0.22, -0.08, 0.36, 0.08);

  const naclCathodeMesh = new THREE.Mesh(rodGeo, graphiteMat);
  naclCathodeMesh.position.set(0.52, 0.36, 0.08);
  s3.add(naclCathodeMesh);
  registerObjectHitbox(s3, 'nacl-cathode', 0.22, 0.62, 0.22, 0.52, 0.36, 0.08);

  // --- Variant B: Brine Two-Compartment Glass Tank + Central Cation-Exchange Membrane ---
  const naclBrineGroup = new THREE.Group();
  naclBrineGroup.position.set(0.22, 0, 0.08);
  s3.add(naclBrineGroup);

  const tankW = 1.16;
  const tankH = 0.54;
  const tankD = 0.52;
  const tankGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xe3f4f5,
    roughness: 0.09,
    transparent: true,
    opacity: isSoftwareGl ? 0.24 : 0.2,
    side: THREE.DoubleSide,
    depthWrite: false,
    clippingPlanes: [cutawayClipPlane],
  });
  const tankGeo = new THREE.BoxGeometry(tankW, tankH, tankD);
  const tankMesh = new THREE.Mesh(tankGeo, tankGlassMat);
  tankMesh.position.y = tankH / 2 + 0.02;
  tankMesh.renderOrder = 5;
  naclBrineGroup.add(tankMesh);

  // Mint corner feet & top lid rim (matching Storyboard 08)
  const tankLidGeo = new THREE.BoxGeometry(tankW + 0.04, 0.032, tankD + 0.04);
  const tankLid = new THREE.Mesh(tankLidGeo, steelFrameMat);
  tankLid.position.y = tankH + 0.035;
  naclBrineGroup.add(tankLid);

  const brineLiqGeo = new THREE.BoxGeometry(tankW - 0.06, tankH * 0.72, tankD - 0.06);
  const brineLiqMat = new THREE.MeshPhysicalMaterial({
    color: 0x76c0c9,
    roughness: 0.14,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
    clippingPlanes: [cutawayClipPlane],
  });
  const brineLiq = new THREE.Mesh(brineLiqGeo, brineLiqMat);
  brineLiq.position.y = (tankH * 0.72) / 2 + 0.03;
  brineLiq.renderOrder = 2;
  naclBrineGroup.add(brineLiq);

  // Prominent Central Cation-Exchange Membrane ("Màng trao đổi cation")
  const memGeo = new THREE.BoxGeometry(0.032, tankH - 0.04, tankD - 0.04);
  const memMat = new THREE.MeshStandardMaterial({
    color: 0xdaf2ee,
    emissive: 0x3f8f82,
    emissiveIntensity: 0.22,
    roughness: 0.35,
    transparent: true,
    opacity: 0.78,
  });
  const memMesh = new THREE.Mesh(memGeo, memMat);
  memMesh.position.y = tankH / 2 + 0.02;
  memMesh.renderOrder = 4;
  naclBrineGroup.add(memMesh);
  disposables.push(tankGeo, tankGlassMat, tankLidGeo, brineLiqGeo, brineLiqMat, memGeo, memMat);

  // --- Variant A: Molten NaCl Refractory Heated Vessel (NO membrane, NO water!) ---
  const naclMoltenGroup = new THREE.Group();
  naclMoltenGroup.position.set(0.22, 0, 0.08);
  naclMoltenGroup.visible = false;
  s3.add(naclMoltenGroup);

  const crucibleGeo = new THREE.BoxGeometry(1.12, 0.48, 0.54);
  const crucibleMat = new THREE.MeshStandardMaterial({
    color: 0x3b3532,
    roughness: 0.82,
    metalness: 0.18,
  });
  const crucible = new THREE.Mesh(crucibleGeo, crucibleMat);
  crucible.position.y = 0.24;
  crucible.castShadow = true;
  naclMoltenGroup.add(crucible);

  // Glowing molten NaCl bath inside open-top crucible
  const moltenSaltGeo = new THREE.BoxGeometry(1.0, 0.14, 0.44);
  const moltenSaltMat = new THREE.MeshStandardMaterial({
    color: 0xe69244,
    emissive: 0xc25b19,
    emissiveIntensity: 0.75,
    roughness: 0.3,
  });
  const moltenSalt = new THREE.Mesh(moltenSaltGeo, moltenSaltMat);
  moltenSalt.position.y = 0.42;
  naclMoltenGroup.add(moltenSalt);

  // Heating coil accent around base
  const heaterBandGeo = new THREE.BoxGeometry(1.16, 0.06, 0.58);
  const heaterBandMat = new THREE.MeshStandardMaterial({
    color: 0xd96b27,
    emissive: 0xb84814,
    emissiveIntensity: 0.65,
    roughness: 0.4,
  });
  const heaterBand = new THREE.Mesh(heaterBandGeo, heaterBandMat);
  heaterBand.position.y = 0.08;
  naclMoltenGroup.add(heaterBand);
  disposables.push(crucibleGeo, crucibleMat, moltenSaltGeo, moltenSaltMat, heaterBandGeo, heaterBandMat);

  // Station 3 hitboxes
  registerObjectHitbox(s3, 'nacl-cell', 1.24, 0.62, 0.62, 0.22, 0.3, 0.08);
  registerObjectHitbox(s3, 'nacl-electrolyte', 1.0, 0.34, 0.46, 0.22, 0.22, 0.08);
  const naclMembraneHitbox = registerObjectHitbox(s3, 'nacl-membrane', 0.16, 0.56, 0.54, 0.22, 0.3, 0.08);

  // Station 3 outer wire: Anode (+) -> DC (+) -> DC (-) -> Cathode (-)
  const naclWireCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.08, 0.66, 0.08),
    new THREE.Vector3(-0.22, 0.82, 0.02),
    new THREE.Vector3(-0.52, 0.52, 0.06),
    new THREE.Vector3(-0.74, 0.14, 0.08),
    new THREE.Vector3(-0.62, 0.14, 0.08),
    new THREE.Vector3(-0.1, 0.78, -0.22),
    new THREE.Vector3(0.42, 0.84, -0.06),
    new THREE.Vector3(0.52, 0.66, 0.08),
  ]);
  const s3WireGeo = new THREE.TubeGeometry(naclWireCurve, 44, 0.012, 8, false);
  s3.add(new THREE.Mesh(s3WireGeo, blackWireMat));
  disposables.push(s3WireGeo);

  // Station 3 dynamic particles (electrons, Cl2 bubbles, H2 bubbles, molten Na droplets, Na+ ions crossing membrane)
  const naclElectrons: THREE.Mesh[] = [];
  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(orbGeo, electronMat);
    m.visible = false;
    s3.add(m);
    naclElectrons.push(m);
  }
  const naclCl2Bubbles: THREE.Mesh[] = [];
  const naclH2Bubbles: THREE.Mesh[] = [];
  for (let i = 0; i < 14; i++) {
    const cl2 = new THREE.Mesh(bubbleGeo, cl2BubbleMat);
    cl2.visible = false;
    s3.add(cl2);
    naclCl2Bubbles.push(cl2);

    const h2 = new THREE.Mesh(bubbleGeo, h2BubbleMat);
    h2.visible = false;
    s3.add(h2);
    naclH2Bubbles.push(h2);
  }
  const naclNaDrops: THREE.Mesh[] = [];
  const naDropGeo = new THREE.SphereGeometry(0.036, 12, 12);
  disposables.push(naDropGeo);
  for (let i = 0; i < 6; i++) {
    const d = new THREE.Mesh(naDropGeo, naMetalMat);
    d.visible = false;
    s3.add(d);
    naclNaDrops.push(d);
  }
  const naclNaIons: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const ion = new THREE.Mesh(ionGeo, no3IonMat);
    ion.visible = false;
    s3.add(ion);
    naclNaIons.push(ion);
  }

  // =========================================================================
  // V2 MICROSCOPIC 3D RIG (SAME SCENE — INSTANCED IONS, HYDRATION, LATTICE)
  // =========================================================================
  const microGroup = new THREE.Group();
  microGroup.visible = false;
  scene.add(microGroup);

  // Glowing mint observation reaction-zone ring
  const microRingGeo = new THREE.TorusGeometry(0.32, 0.008, 10, 40);
  const microRingMat = new THREE.MeshBasicMaterial({
    color: 0x78d4c4,
    transparent: true,
    opacity: 0.72,
  });
  const microRing = new THREE.Mesh(microRingGeo, microRingMat);
  microRing.renderOrder = 16;
  microGroup.add(microRing);

  // Instanced hydrated ions / molecules (64 max, per-instance colors, zero GC)
  const microIonGeo = new THREE.SphereGeometry(1, isSoftwareGl ? 10 : 14, isSoftwareGl ? 8 : 12);
  const microIonMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.22,
    metalness: 0.15,
    emissive: 0x10282e,
    emissiveIntensity: 0.35,
  });
  const microIonMesh = new THREE.InstancedMesh(microIonGeo, microIonMat, MICRO_MAX_PARTICLES);
  microIonMesh.count = 0;
  microIonMesh.frustumCulled = false;
  microIonMesh.renderOrder = 12;
  microGroup.add(microIonMesh);

  // Instanced translucent hydration shell aura around aqueous ions
  const microHydrationGeo = new THREE.SphereGeometry(1, 10, 8);
  const microHydrationMat = new THREE.MeshBasicMaterial({
    color: 0x8be4f5,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });
  const microHydrationMesh = new THREE.InstancedMesh(
    microHydrationGeo,
    microHydrationMat,
    MICRO_MAX_PARTICLES
  );
  microHydrationMesh.count = 0;
  microHydrationMesh.frustumCulled = false;
  microHydrationMesh.renderOrder = 13;
  microGroup.add(microHydrationMesh);

  // Instanced metallic crystal lattice surface atoms (shown on Zn / Cu microscopic zones)
  const microLatticeGeo = new THREE.SphereGeometry(0.022, 10, 8);
  const microLatticeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.25,
    metalness: 0.85,
  });
  const microLatticeMesh = new THREE.InstancedMesh(
    microLatticeGeo,
    microLatticeMat,
    MICRO_MAX_LATTICE
  );
  microLatticeMesh.count = 0;
  microLatticeMesh.frustumCulled = false;
  microLatticeMesh.renderOrder = 11;
  microGroup.add(microLatticeMesh);

  // 6 directional flow arrows (shaft + cone) indicating ion / electron migration
  const microArrows: THREE.Group[] = [];
  const arrowShaftGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.12, 8);
  const arrowHeadGeo = new THREE.ConeGeometry(0.016, 0.042, 10);
  const arrowMintMat = new THREE.MeshBasicMaterial({ color: 0x78d4c4 });
  const arrowCopperMat = new THREE.MeshBasicMaterial({ color: 0xf0a05a });
  for (let i = 0; i < 6; i++) {
    const ag = new THREE.Group();
    const mat = i % 2 === 0 ? arrowMintMat : arrowCopperMat;
    const shaft = new THREE.Mesh(arrowShaftGeo, mat);
    shaft.rotation.z = -Math.PI / 2;
    shaft.position.x = -0.02;
    const head = new THREE.Mesh(arrowHeadGeo, mat);
    head.rotation.z = -Math.PI / 2;
    head.position.x = 0.055;
    ag.add(shaft, head);
    ag.visible = false;
    microGroup.add(ag);
    microArrows.push(ag);
  }

  disposables.push(
    microRingGeo, microRingMat, microIonGeo, microIonMat,
    microHydrationGeo, microHydrationMat, microLatticeGeo, microLatticeMat,
    arrowShaftGeo, arrowHeadGeo, arrowMintMat, arrowCopperMat
  );

  return {
    scene,
    zoneHitboxes,
    tableHitboxes,
    objectHitboxes,
    occlusionMeshes,
    tableRimMaterials,
    tableLedMaterials,
    objectHighlightMaterials,
    boardBezelMat,
    practiceRimMat,
    practicePagePivot,
    practiceStackTopGroup,
    cutawayClipPlane,
    microGroup,
    microRing,
    microIonMesh,
    microHydrationMesh,
    microLatticeMesh,
    microArrows,
    znCuSwitchPivot,
    znCuVoltmeterDisplay,
    znCuZnPlate,
    znCuCuPlating,
    znCuCuSolutionMat: cuBeaker.liquidMat,
    znCuWireCurve,
    znCuElectrons,
    znCuKCurve,
    znCuNO3Curve,
    znCuKIons,
    znCuNO3Ions,
    cuso4Display,
    cuso4SolutionMat: cuso4Cell.liquidMat,
    cuso4CathodePlating,
    cuso4AnodeGraphite,
    cuso4AnodeCopper,
    cuso4WireCurve,
    cuso4Electrons,
    cuso4O2Bubbles,
    cuso4H2Bubbles,
    naclDisplay,
    naclBrineGroup,
    naclMoltenGroup,
    naclMembraneHitbox,
    naclWireCurve,
    naclElectrons,
    naclCl2Bubbles,
    naclH2Bubbles,
    naclNaDrops,
    naclNaIons,
    disposables,
  };
}

/**
 * Deterministically updates every 3D visual element from the single source of truth (`Lab3DVisuals`)
 * plus V2 Smart Board, Practice Desk page-flip, cutaway clipping, and Microscopic InstancedMesh.
 * Zero heap allocations per frame.
 */
export function updateLabSceneVisuals(
  rig: LabSceneRig,
  visuals: Lab3DVisuals,
  hoveredTable: LabExperimentId | null,
  selectedTable: LabExperimentId | null,
  hoveredObject: LabObjectId | null,
  selectedObject: LabObjectId | null,
  world?: WorldVisualOptions
): void {
  // 0. V2 Smart Teaching Board & Practice Desk highlight + page-flip animation
  if (world) {
    const boardActive = world.zone === 'BOARD' || world.hoveredZone === 'BOARD';
    rig.boardBezelMat.color.copy(boardActive ? _colorMint : _colorDimBorder);
    rig.boardBezelMat.emissive.copy(boardActive ? _colorMint : _colorDimBorder);
    rig.boardBezelMat.emissiveIntensity = world.zone === 'BOARD' ? 0.75 : boardActive ? 0.45 : 0.15;

    const practiceActive = world.zone === 'PRACTICE' || world.hoveredZone === 'PRACTICE';
    rig.practiceRimMat.color.copy(practiceActive ? _colorCopper : _colorDimBorder);
    rig.practiceRimMat.emissive.copy(practiceActive ? _colorCopper : _colorDimBorder);
    rig.practiceRimMat.emissiveIntensity =
      world.zone === 'PRACTICE' ? 0.72 : practiceActive ? 0.45 : 0;

    // Gentle lift of top paper sheet when Practice Desk is open
    rig.practiceStackTopGroup.position.y = TABLE_TOP_Y + 0.064 + world.practiceOpenLift * 0.025;
    if (world.practiceFlipAngle > 0.01 && world.practiceFlipAngle < Math.PI - 0.01) {
      rig.practicePagePivot.visible = true;
      rig.practicePagePivot.rotation.z = world.practiceFlipAngle;
    } else {
      rig.practicePagePivot.visible = false;
      rig.practicePagePivot.rotation.z = 0;
    }

    // Cutaway clipping plane (slices front glass cleanly only when cutawayActive or in MICRO view)
    const enableClip = world.cutawayActive || world.zone === 'MICRO';
    if (enableClip) {
      const activeStation = world.microFrame?.station ?? selectedTable ?? 'pin-zn-cu';
      const baseZ = TABLE_POSITIONS[activeStation].z;
      // Plane normal is (0, 0, -1), so world z <= constant is kept; slicing at baseZ + 0.11 opens front beaker glass
      rig.cutawayClipPlane.constant = baseZ + 0.11;
    } else {
      rig.cutawayClipPlane.constant = 100;
    }

    // Microscopic 3D Rig (InstancedMesh particles + hydration shells + crystal lattice + arrows)
    const showMicro = world.zone === 'MICRO' && world.microFrame !== null;
    rig.microGroup.visible = showMicro;
    if (showMicro && world.microFrame) {
      const mf = world.microFrame;
      const meta = MICRO_ZONES[mf.zone];
      const base = TABLE_POSITIONS[meta.station];

      // Position glowing observation ring around active microscopic region
      rig.microRing.visible = world.microShowReactionZone;
      rig.microRing.position.set(
        base.x + meta.focusCenterLocal.x,
        base.y + meta.focusCenterLocal.y,
        base.z + meta.focusCenterLocal.z + 0.09
      );
      const rScale = meta.ringRadius / 0.32;
      rig.microRing.scale.setScalar(rScale);

      // Update InstancedMesh ions + hydration shells
      const pCount = Math.min(MICRO_MAX_PARTICLES, mf.particles.length);
      rig.microIonMesh.count = pCount;
      let hydCount = 0;

      for (let i = 0; i < pCount; i++) {
        const p = mf.particles[i];
        const spMeta = MICRO_SPECIES_META[p.species];
        const radius = spMeta.radius * p.scale;

        _tmpDummy.position.set(p.position.x, p.position.y, p.position.z);
        _tmpDummy.rotation.set(0, 0, 0);
        _tmpDummy.scale.setScalar(radius);
        _tmpDummy.updateMatrix();
        rig.microIonMesh.setMatrixAt(i, _tmpDummy.matrix);

        _tmpColor.setHex(spMeta.colorHex);
        if (!p.highlighted) {
          _tmpColor.lerp(_colorDimParticle, 0.72);
        }
        rig.microIonMesh.setColorAt(i, _tmpColor);

        if (world.microShowHydration && p.hydrated && p.highlighted) {
          _tmpDummy.scale.setScalar(radius * 1.55);
          _tmpDummy.updateMatrix();
          rig.microHydrationMesh.setMatrixAt(hydCount, _tmpDummy.matrix);
          hydCount += 1;
        }
      }
      rig.microIonMesh.instanceMatrix.needsUpdate = true;
      if (rig.microIonMesh.instanceColor) {
        rig.microIonMesh.instanceColor.needsUpdate = true;
      }
      rig.microHydrationMesh.count = hydCount;
      rig.microHydrationMesh.visible = hydCount > 0;
      if (hydCount > 0) {
        rig.microHydrationMesh.instanceMatrix.needsUpdate = true;
      }

      // Metallic surface lattice atoms on Zn / Cu electrode microscopic zones
      const showLattice =
        mf.zone === 'zncu-zn' ||
        mf.zone === 'zncu-cu' ||
        mf.zone === 'cuso4-cathode' ||
        (mf.zone === 'cuso4-anode' && visuals.cuso4.variant === 'cuso4-copper');
      if (showLattice) {
        const isZinc = mf.zone === 'zncu-zn';
        _tmpColor.setHex(isZinc ? 0xc8d4da : 0xd97542);
        const anchorX =
          mf.zone === 'zncu-zn'
            ? base.x - 0.64
            : mf.zone === 'zncu-cu'
              ? base.x + 0.64
              : mf.zone === 'cuso4-cathode'
                ? base.x - 0.46
                : base.x - 0.04;
        const anchorZ = base.z + (mf.station === 'pin-zn-cu' ? 0.04 : 0.08);
        let latIdx = 0;
        for (let row = 0; row < 6 && latIdx < MICRO_MAX_LATTICE; row++) {
          for (let col = 0; col < 5 && latIdx < MICRO_MAX_LATTICE; col++) {
            const lx = anchorX + (col - 2) * 0.032;
            const ly = TABLE_TOP_Y + 0.14 + row * 0.046;
            const lz = anchorZ + 0.024;
            _tmpDummy.position.set(lx, ly, lz);
            _tmpDummy.scale.setScalar(1);
            _tmpDummy.updateMatrix();
            rig.microLatticeMesh.setMatrixAt(latIdx, _tmpDummy.matrix);
            rig.microLatticeMesh.setColorAt(latIdx, _tmpColor);
            latIdx += 1;
          }
        }
        rig.microLatticeMesh.count = latIdx;
        rig.microLatticeMesh.visible = true;
        rig.microLatticeMesh.instanceMatrix.needsUpdate = true;
        if (rig.microLatticeMesh.instanceColor) {
          rig.microLatticeMesh.instanceColor.needsUpdate = true;
        }
      } else {
        rig.microLatticeMesh.count = 0;
        rig.microLatticeMesh.visible = false;
      }

      // Directional flow arrows inside active microscopic zone
      for (let i = 0; i < rig.microArrows.length; i++) {
        const arr = rig.microArrows[i];
        arr.visible = world.microShowArrows && i < 4;
        if (arr.visible) {
          const cx = base.x + meta.focusCenterLocal.x;
          const cy = base.y + meta.focusCenterLocal.y;
          const cz = base.z + meta.focusCenterLocal.z + 0.07;
          if (mf.zone === 'zncu-bridge') {
            // Top arrows point right (K+ -> Cu), bottom arrows point left (NO3- -> Zn)
            const isTop = i < 2;
            arr.position.set(cx + (i % 2 === 0 ? -0.14 : 0.14), cy + (isTop ? 0.1 : -0.06), cz);
            arr.rotation.set(0, 0, isTop ? 0 : Math.PI);
          } else if (mf.zone === 'zncu-zn') {
            // Zn2+ leaves electrode rightward; e- rises up electrode
            const isElectron = i === 0;
            arr.position.set(
              isElectron ? cx : cx + 0.14,
              isElectron ? cy + 0.14 : cy - 0.08 + i * 0.07,
              cz
            );
            arr.rotation.set(0, 0, isElectron ? Math.PI / 2 : 0);
          } else if (mf.zone === 'zncu-cu' || mf.zone === 'cuso4-cathode') {
            // Cu2+ approaches electrode; e- arrives down electrode
            const isElectron = i === 0;
            arr.position.set(
              isElectron ? cx : cx + (mf.zone === 'zncu-cu' ? -0.14 : 0.14),
              isElectron ? cy + 0.14 : cy - 0.08 + i * 0.07,
              cz
            );
            arr.rotation.set(0, 0, isElectron ? -Math.PI / 2 : mf.zone === 'zncu-cu' ? 0 : Math.PI);
          } else {
            // NaCl & CuSO4 anode: ions migrate left/right toward opposite electrodes
            const goRight = i % 2 === 0;
            arr.position.set(cx + (goRight ? 0.04 : -0.12), cy - 0.06 + i * 0.055, cz);
            arr.rotation.set(0, 0, goRight ? 0 : Math.PI);
          }
        }
      }
    }
  }

  // 1. Table rim & status LED highlight feedback
  const stations: LabExperimentId[] = ['pin-zn-cu', 'dien-phan-cuso4', 'dien-phan-nacl'];
  for (const st of stations) {
    const isSel = selectedTable === st;
    const isHov = hoveredTable === st;
    const rim = rig.tableRimMaterials[st];
    const led = rig.tableLedMaterials[st];
    if (isSel) {
      rim.color.copy(_colorMint);
      rim.emissive.copy(_colorMint);
      rim.emissiveIntensity = 0.55;
      led.emissive.copy(_colorMint);
      led.emissiveIntensity = 1.1;
    } else if (isHov) {
      rim.color.copy(_colorMint);
      rim.emissive.copy(_colorMint);
      rim.emissiveIntensity = 0.35;
      led.emissive.copy(_colorMint);
      led.emissiveIntensity = 0.7;
    } else {
      rim.color.copy(_colorDimBorder);
      rim.emissive.setHex(0x000000);
      rim.emissiveIntensity = 0;
      led.emissive.setHex(0x1b3a3e);
      led.emissiveIntensity = 0.35;
    }
  }

  // 2. Object selection / hover / visual-quiz wireframe highlight
  const quizCands = world?.visualQuizCandidates;
  const quizSel = world?.visualQuizSelected;
  for (const key of Object.keys(rig.objectHighlightMaterials) as LabObjectId[]) {
    const mat = rig.objectHighlightMaterials[key];
    if (!mat) continue;
    if (quizCands && quizCands.length > 0) {
      if (quizSel === key) {
        mat.color.setHex(0xc77b4c);
        mat.opacity = 0.95;
      } else if (hoveredObject === key && quizCands.includes(key)) {
        mat.color.setHex(0x78d4c4);
        mat.opacity = 0.85;
      } else if (quizCands.includes(key)) {
        mat.color.setHex(0x78d4c4);
        mat.opacity = 0.35;
      } else {
        mat.opacity = 0;
      }
    } else {
      mat.color.setHex(0x78d4c4);
      if (selectedObject === key) {
        mat.opacity = 0.9;
      } else if (hoveredObject === key) {
        mat.opacity = 0.45;
      } else {
        mat.opacity = 0;
      }
    }
  }

  // 3. Station 1: Pin Zn-Cu
  const zn = visuals.znCu;
  rig.znCuSwitchPivot.rotation.z = zn.switchLeverAngleRad;
  rig.znCuVoltmeterDisplay.draw(
    zn.voltmeterText,
    zn.circuitClosed ? 'Mạch đóng · Tải 100 Ω' : 'Mạch mở · E°pin',
    zn.circuitClosed ? '#78D4C4' : '#E8B17E'
  );
  rig.znCuZnPlate.scale.set(zn.znThinScale, 1, 1);
  rig.znCuCuPlating.visible = zn.cuPlatingScale > 0.01;
  rig.znCuCuPlating.scale.set(1, 1, Math.max(0.08, zn.cuPlatingScale));

  _tmpColor.copy(_colorBlueClear).lerp(_colorBlueRich, zn.cuSolutionBlueRatio);
  rig.znCuCuSolutionMat.color.copy(_tmpColor);

  // Pin Zn-Cu electrons along 3D wire (Zn -> Cu)
  for (let i = 0; i < rig.znCuElectrons.length; i++) {
    const orb = rig.znCuElectrons[i];
    orb.visible = zn.electronsActive;
    if (zn.electronsActive) {
      const u = (zn.electronPhase + i / rig.znCuElectrons.length) % 1;
      rig.znCuWireCurve.getPointAt(u, _tmpVec3);
      orb.position.copy(_tmpVec3);
    }
  }
  // Salt bridge K+ (-> Cu) and NO3- (-> Zn) ions
  for (let i = 0; i < rig.znCuKIons.length; i++) {
    const kIon = rig.znCuKIons[i];
    const no3Ion = rig.znCuNO3Ions[i];
    kIon.visible = zn.ionsActive;
    no3Ion.visible = zn.ionsActive;
    if (zn.ionsActive) {
      const u = (zn.electronPhase * 0.7 + i / rig.znCuKIons.length) % 1;
      rig.znCuKCurve.getPointAt(u, _tmpVec3);
      kIon.position.set(_tmpVec3.x, _tmpVec3.y + 0.014, _tmpVec3.z + 0.015);

      const u2 = (zn.electronPhase * 0.7 + (i + 0.5) / rig.znCuNO3Ions.length) % 1;
      rig.znCuNO3Curve.getPointAt(u2, _tmpVec3);
      no3Ion.position.set(_tmpVec3.x, _tmpVec3.y - 0.014, _tmpVec3.z - 0.015);
    }
  }

  // 4. Station 2: CuSO4 Electrolysis
  const cu = visuals.cuso4;
  rig.cuso4Display.draw(
    cu.powerVoltageText,
    `I = ${cu.powerCurrentText}`,
    cu.inStage2 ? '#F0B37A' : '#78D4C4'
  );
  _tmpColor.copy(_colorBlueClear).lerp(_colorBlueRich, cu.solutionBlueRatio);
  rig.cuso4SolutionMat.color.copy(_tmpColor);
  rig.cuso4SolutionMat.opacity = 0.25 + cu.solutionBlueRatio * 0.44;

  // Cathode copper plating
  rig.cuso4CathodePlating.visible = cu.cathodeCuThickness > 0.01;
  const sleeveRadiusScale = 0.65 + cu.cathodeCuThickness * 0.55;
  rig.cuso4CathodePlating.scale.set(sleeveRadiusScale, 1, sleeveRadiusScale);

  // Switchable anode (inert graphite vs soluble copper plate)
  const isCopperAnode = cu.variant === 'cuso4-copper';
  rig.cuso4AnodeGraphite.visible = !isCopperAnode;
  rig.cuso4AnodeCopper.visible = isCopperAnode;
  if (isCopperAnode) {
    rig.cuso4AnodeCopper.scale.set(cu.anodeCuRemainingRatio, 1, 1);
  }

  // Electrons along CuSO4 outer wire (count & phase scaled by I)
  for (let i = 0; i < rig.cuso4Electrons.length; i++) {
    const orb = rig.cuso4Electrons[i];
    const active = cu.electronsActive && i < cu.wireParticleCount;
    orb.visible = active;
    if (active) {
      const u = (cu.electronPhase + i / cu.wireParticleCount) % 1;
      rig.cuso4WireCurve.getPointAt(u, _tmpVec3);
      orb.position.copy(_tmpVec3);
    }
  }

  // Deterministic rising O2 bubbles (anode x = -0.04) & H2 bubbles (cathode x = -0.46, ONLY stage 2!)
  const bubbleClockCu = cu.timeSeconds * 0.025 * cu.electronSpeedMultiplier;
  for (let i = 0; i < rig.cuso4O2Bubbles.length; i++) {
    const b = rig.cuso4O2Bubbles[i];
    const show = cu.o2BubbleIntensity > 0 && i < Math.ceil(cu.o2BubbleIntensity * rig.cuso4O2Bubbles.length);
    b.visible = show;
    if (show) {
      const cycle = (bubbleClockCu + seededFrac(i + 11)) % 1;
      const angle = seededFrac(i + 37) * Math.PI * 2;
      const rad = 0.045 + seededFrac(i + 53) * 0.04;
      b.position.set(
        -0.04 + Math.cos(angle) * rad,
        0.14 + cycle * 0.32,
        0.08 + Math.sin(angle) * rad
      );
      const sc = 0.7 + (1 - cycle) * 0.55;
      b.scale.setScalar(sc);
    }
  }
  for (let i = 0; i < rig.cuso4H2Bubbles.length; i++) {
    const b = rig.cuso4H2Bubbles[i];
    const show = cu.h2BubbleIntensity > 0 && i < Math.ceil(cu.h2BubbleIntensity * rig.cuso4H2Bubbles.length);
    b.visible = show;
    if (show) {
      const cycle = (bubbleClockCu * 1.15 + seededFrac(i + 101)) % 1;
      const angle = seededFrac(i + 137) * Math.PI * 2;
      const rad = 0.052 + seededFrac(i + 173) * 0.042;
      b.position.set(
        -0.46 + Math.cos(angle) * rad,
        0.14 + cycle * 0.32,
        0.08 + Math.sin(angle) * rad
      );
      b.scale.setScalar(0.75 + (1 - cycle) * 0.5);
    }
  }

  // 5. Station 3: NaCl Electrolysis (Molten vs Saturated Brine with Membrane)
  const na = visuals.nacl;
  rig.naclDisplay.draw(
    na.powerVoltageText,
    `I = ${na.powerCurrentText}`,
    na.variant === 'nacl-molten' ? '#F0B37A' : '#78D4C4'
  );
  rig.naclBrineGroup.visible = na.showMembrane;
  rig.naclMoltenGroup.visible = !na.showMembrane;
  rig.naclMembraneHitbox.visible = false; // hitbox stays invisible; interactable filter checks showMembrane

  for (let i = 0; i < rig.naclElectrons.length; i++) {
    const orb = rig.naclElectrons[i];
    const active = na.electronsActive && i < na.wireParticleCount;
    orb.visible = active;
    if (active) {
      const u = (na.electronPhase + i / na.wireParticleCount) % 1;
      rig.naclWireCurve.getPointAt(u, _tmpVec3);
      orb.position.copy(_tmpVec3);
    }
  }

  const bubbleClockNa = na.timeSeconds * 0.028 * na.electronSpeedMultiplier;
  // Cl2 bubbles at Anode (+) x = -0.08 (both molten & brine)
  for (let i = 0; i < rig.naclCl2Bubbles.length; i++) {
    const b = rig.naclCl2Bubbles[i];
    const show = na.cl2BubbleIntensity > 0 && i < Math.ceil(na.cl2BubbleIntensity * rig.naclCl2Bubbles.length);
    b.visible = show;
    if (show) {
      const cycle = (bubbleClockNa + seededFrac(i + 211)) % 1;
      const angle = seededFrac(i + 241) * Math.PI * 2;
      const rad = 0.045 + seededFrac(i + 271) * 0.045;
      b.position.set(
        -0.08 + Math.cos(angle) * rad,
        0.16 + cycle * 0.34,
        0.08 + Math.sin(angle) * rad
      );
      b.scale.setScalar(0.75 + (1 - cycle) * 0.55);
    }
  }

  // H2 bubbles at Cathode (-) x = +0.52 (ONLY in brine!)
  for (let i = 0; i < rig.naclH2Bubbles.length; i++) {
    const b = rig.naclH2Bubbles[i];
    const show = na.h2BubbleIntensity > 0 && i < Math.ceil(na.h2BubbleIntensity * rig.naclH2Bubbles.length);
    b.visible = show;
    if (show) {
      const cycle = (bubbleClockNa * 1.1 + seededFrac(i + 311)) % 1;
      const angle = seededFrac(i + 347) * Math.PI * 2;
      const rad = 0.045 + seededFrac(i + 383) * 0.045;
      b.position.set(
        0.52 + Math.cos(angle) * rad,
        0.16 + cycle * 0.34,
        0.08 + Math.sin(angle) * rad
      );
      b.scale.setScalar(0.7 + (1 - cycle) * 0.5);
    }
  }

  // Molten Na silvery metal droplets collecting near Cathode (-) x = +0.52 (ONLY in molten!)
  for (let i = 0; i < rig.naclNaDrops.length; i++) {
    const drop = rig.naclNaDrops[i];
    const threshold = (i + 0.5) / rig.naclNaDrops.length;
    const show = !na.showMembrane && na.moltenNaDepositRatio >= threshold * 0.65;
    drop.visible = show;
    if (show) {
      const ang = (i / rig.naclNaDrops.length) * Math.PI * 2;
      drop.position.set(
        0.52 + Math.cos(ang) * 0.075,
        0.48 + (i % 2) * 0.02,
        0.08 + Math.sin(ang) * 0.075
      );
      const grow = Math.min(1, na.moltenNaDepositRatio * 1.4);
      drop.scale.setScalar(0.65 + grow * 0.55);
    }
  }

  // Na+ ions migrating left -> right across central cation-exchange membrane (x = 0.05 -> 0.40)
  for (let i = 0; i < rig.naclNaIons.length; i++) {
    const ion = rig.naclNaIons[i];
    ion.visible = na.naIonMembraneActive;
    if (na.naIonMembraneActive) {
      const u = (bubbleClockNa * 0.45 + i / rig.naclNaIons.length) % 1;
      ion.position.set(0.04 + u * 0.36, 0.2 + (i % 3) * 0.08, 0.08 + ((i % 2) - 0.5) * 0.14);
    }
  }
}

export function disposeLabScene(rig: LabSceneRig): void {
  for (const item of rig.disposables) {
    try {
      item.dispose();
    } catch {
      // Ignore already disposed resource
    }
  }
  rig.scene.clear();
}
