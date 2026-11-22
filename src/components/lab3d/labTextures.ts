import * as THREE from 'three';

function createCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not acquire 2D canvas context for procedural texture');
  }
  return [canvas, ctx];
}

export function createWalnutWoodTextures(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const [canvas, ctx] = createCanvas(512, 512);
  ctx.fillStyle = '#4E3323';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle horizontal walnut grain streaks
  for (let y = 0; y < 512; y += 2) {
    const wave = Math.sin(y * 0.06) * 8 + Math.sin(y * 0.19) * 4;
    const tone = Math.floor(14 * Math.sin(y * 0.09) + (y % 7) * 1.5);
    const r = Math.min(110, Math.max(48, 78 + tone));
    const g = Math.min(76, Math.max(32, 50 + Math.floor(tone * 0.65)));
    const b = Math.min(54, Math.max(20, 34 + Math.floor(tone * 0.45)));
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y, 512, 2);

    if (y % 18 === 0) {
      ctx.strokeStyle = 'rgba(26, 15, 9, 0.24)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(170, y + wave, 340, y - wave, 512, y);
      ctx.stroke();
    }
  }

  // Plank seams
  ctx.strokeStyle = 'rgba(20, 11, 6, 0.35)';
  ctx.lineWidth = 2;
  for (const py of [128, 256, 384]) {
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(512, py);
    ctx.stroke();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = maxAnisotropy;

  // Matching subtle grayscale bump texture
  const [bCanvas, bCtx] = createCanvas(256, 256);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    const v = 128 + Math.floor(Math.sin(y * 0.22) * 18 + Math.cos(y * 0.53) * 10);
    bCtx.fillStyle = `rgb(${v},${v},${v})`;
    bCtx.fillRect(0, y, 256, 2);
  }
  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createSlateFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 512);
  ctx.fillStyle = '#2B3135';
  ctx.fillRect(0, 0, 512, 512);

  // 2x2 architectural matte stone tiles
  const tiles = [
    { x: 0, y: 0, fill: '#2D3438' },
    { x: 256, y: 0, fill: '#293034' },
    { x: 0, y: 256, fill: '#282F33' },
    { x: 256, y: 256, fill: '#2E3539' },
  ];
  for (const t of tiles) {
    ctx.fillStyle = t.fill;
    ctx.fillRect(t.x + 2, t.y + 2, 252, 252);
    // Gentle stone speckle
    for (let i = 0; i < 160; i++) {
      const sx = t.x + ((i * 53) % 248) + 2;
      const sy = t.y + ((i * 97) % 248) + 2;
      const alpha = (i % 5) * 0.012 + 0.015;
      ctx.fillStyle = i % 2 === 0 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha * 1.4})`;
      ctx.fillRect(sx, sy, 3, 2);
    }
  }

  // Grout lines
  ctx.strokeStyle = '#1B2124';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, 512, 512);
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.moveTo(0, 256);
  ctx.lineTo(512, 256);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(7, 5);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createBeakerGraduationTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 256);
  ctx.clearRect(0, 0, 512, 256);

  // Place crisp graduation marks along the front-facing quadrant of cylinder UV
  const centerX = 256;
  ctx.strokeStyle = 'rgba(235, 245, 244, 0.72)';
  ctx.fillStyle = 'rgba(235, 245, 244, 0.82)';
  ctx.lineWidth = 2;
  ctx.font = '600 18px "IBM Plex Mono", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const marks = [
    { y: 52, label: '250 mL', len: 28 },
    { y: 92, label: '200', len: 22 },
    { y: 132, label: '150', len: 26 },
    { y: 172, label: '100', len: 22 },
    { y: 212, label: '50', len: 20 },
  ];

  // Vertical spine
  ctx.beginPath();
  ctx.moveTo(centerX - 30, 48);
  ctx.lineTo(centerX - 30, 218);
  ctx.stroke();

  for (const m of marks) {
    ctx.beginPath();
    ctx.moveTo(centerX - 30, m.y);
    ctx.lineTo(centerX - 30 + m.len, m.y);
    ctx.stroke();
    ctx.fillText(m.label, centerX + 4, m.y);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createLabWallSignTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(1024, 220);
  ctx.clearRect(0, 0, 1024, 220);

  // Chamfered architectural dark-lab plaque matching Storyboard 01
  ctx.fillStyle = '#152529';
  ctx.beginPath();
  ctx.moveTo(64, 18);
  ctx.lineTo(960, 18);
  ctx.lineTo(1006, 110);
  ctx.lineTo(960, 202);
  ctx.lineTo(64, 202);
  ctx.lineTo(18, 110);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#C77B4C';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Inner mint accents
  ctx.strokeStyle = '#78D4C4';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(78, 110);
  ctx.lineTo(138, 110);
  ctx.moveTo(886, 110);
  ctx.lineTo(946, 110);
  ctx.stroke();

  ctx.fillStyle = '#EDF4F1';
  ctx.font = '700 66px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Phòng thí nghiệm', 512, 112);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createWallDiagramTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 360);
  ctx.fillStyle = '#101B1E';
  ctx.fillRect(0, 0, 512, 360);

  ctx.strokeStyle = '#C77B4C';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 502, 350);

  // Minimalist glowing teal galvanic cell blueprint matching Storyboard 01
  ctx.strokeStyle = '#78D4C4';
  ctx.lineWidth = 4;
  // Left beaker
  ctx.strokeRect(72, 165, 130, 135);
  // Right beaker
  ctx.strokeRect(310, 165, 130, 135);
  // Liquid surfaces
  ctx.fillStyle = 'rgba(120, 212, 196, 0.14)';
  ctx.fillRect(74, 215, 126, 83);
  ctx.fillRect(312, 215, 126, 83);
  // Electrodes
  ctx.strokeRect(102, 130, 22, 145);
  ctx.strokeRect(388, 130, 22, 145);
  // Salt bridge U
  ctx.beginPath();
  ctx.moveTo(165, 250);
  ctx.lineTo(165, 178);
  ctx.quadraticCurveTo(165, 145, 200, 145);
  ctx.lineTo(312, 145);
  ctx.quadraticCurveTo(347, 145, 347, 178);
  ctx.lineTo(347, 250);
  ctx.stroke();
  // Wire & voltmeter
  ctx.beginPath();
  ctx.moveTo(113, 130);
  ctx.lineTo(113, 72);
  ctx.lineTo(222, 72);
  ctx.moveTo(290, 72);
  ctx.lineTo(399, 72);
  ctx.lineTo(399, 130);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(256, 72, 34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#78D4C4';
  ctx.font = '700 32px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('V', 256, 74);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createStationPlaqueTexture(
  code: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 128);
  ctx.fillStyle = '#132226';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#365056';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 116);

  ctx.fillStyle = '#78D4C4';
  ctx.font = '600 36px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(code, 256, 66);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(128, 128);
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface LiveDisplayTexture {
  texture: THREE.CanvasTexture;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  lastKey: string;
  draw: (primary: string, secondary?: string, accentColor?: string) => void;
}

export function createLiveDisplayTexture(maxAnisotropy: number): LiveDisplayTexture {
  const [canvas, ctx] = createCanvas(384, 192);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;

  const handle: LiveDisplayTexture = {
    texture,
    canvas,
    ctx,
    lastKey: '',
    draw(primary: string, secondary = '', accentColor = '#78D4C4') {
      const key = `${primary}|${secondary}|${accentColor}`;
      if (key === handle.lastKey) return;
      handle.lastKey = key;

      ctx.fillStyle = '#0B1417';
      ctx.fillRect(0, 0, 384, 192);

      // Subtle inner bezel line
      ctx.strokeStyle = '#253D43';
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, 368, 176);

      ctx.fillStyle = accentColor;
      ctx.font = '700 66px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(primary, 192, secondary ? 78 : 98);

      if (secondary) {
        ctx.fillStyle = '#B7CCD0';
        ctx.font = '600 28px "IBM Plex Mono", monospace';
        ctx.fillText(secondary, 192, 144);
      }

      texture.needsUpdate = true;
    },
  };

  handle.draw('1,103 V', 'E°pin');
  return handle;
}

export function createSmartBoardIdleTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(1024, 576);

  // Deep architectural classroom slate background
  const bg = ctx.createLinearGradient(0, 0, 1024, 576);
  bg.addColorStop(0, '#0E1B1F');
  bg.addColorStop(1, '#15272C');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 576);

  // Subtle geometric grid
  ctx.strokeStyle = 'rgba(120, 212, 196, 0.07)';
  ctx.lineWidth = 1;
  for (let x = 48; x < 1024; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 576);
    ctx.stroke();
  }
  for (let y = 48; y < 576; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Outer refined border
  ctx.strokeStyle = '#78D4C4';
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, 988, 540);

  // Top badge
  ctx.fillStyle = '#78D4C4';
  ctx.font = '600 22px "IBM Plex Mono", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('CHƯƠNG 5 · PIN ĐIỆN & ĐIỆN PHÂN', 56, 72);

  // Main title
  ctx.fillStyle = '#EDF4F1';
  ctx.font = '700 54px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText('HÓA HỌC 12 — ĐIỆN HÓA', 56, 140);

  // Copper rule accent
  ctx.fillStyle = '#C77B4C';
  ctx.fillRect(56, 182, 240, 5);

  // Key schematic formulas on left
  ctx.fillStyle = '#CBE3E0';
  ctx.font = '600 28px "IBM Plex Mono", monospace';
  ctx.fillText('• Pin Zn–Cu:   Zn + Cu²⁺ → Zn²⁺ + Cu   (E° = 1,103 V)', 56, 250);
  ctx.fillText('• Điện phân:   Anode (+) oxi hóa · Cathode (−) khử', 56, 308);
  ctx.fillText('• Faraday:     m = (A · I · t) / (n · F)', 56, 366);

  // Miniature schematic on right
  ctx.strokeStyle = '#78D4C4';
  ctx.lineWidth = 3;
  ctx.strokeRect(724, 224, 88, 96);
  ctx.strokeRect(862, 224, 88, 96);
  ctx.fillStyle = 'rgba(38, 146, 242, 0.25)';
  ctx.fillRect(866, 258, 80, 58);
  ctx.beginPath();
  ctx.moveTo(792, 276);
  ctx.lineTo(792, 206);
  ctx.lineTo(882, 206);
  ctx.lineTo(882, 276);
  ctx.stroke();

  // Interactive prompt button strip at bottom
  ctx.fillStyle = 'rgba(120, 212, 196, 0.16)';
  ctx.fillRect(56, 444, 520, 74);
  ctx.strokeStyle = '#78D4C4';
  ctx.lineWidth = 3;
  ctx.strokeRect(56, 444, 520, 74);

  ctx.fillStyle = '#78D4C4';
  ctx.font = '700 30px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText('Chạm để bắt đầu bài học  →', 84, 482);

  ctx.fillStyle = '#A2B6B5';
  ctx.font = '500 22px "IBM Plex Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('10 bài giảng · Tương tác 3D', 964, 482);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createPracticeCoverSheetTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 680);

  // Warm cream examination paper
  ctx.fillStyle = '#FAF6EC';
  ctx.fillRect(0, 0, 512, 680);

  // Subtle paper margin border
  ctx.strokeStyle = '#D4CCB9';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, 472, 640);

  // Header band
  ctx.fillStyle = '#182B30';
  ctx.fillRect(36, 42, 440, 128);
  ctx.fillStyle = '#78D4C4';
  ctx.font = '600 20px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HÓA HỌC 12 · CHƯƠNG 5', 256, 78);

  ctx.fillStyle = '#EDF4F1';
  ctx.font = '700 34px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText('BÀI TẬP & KIỂM TRA', 256, 126);

  // Ruled question preview lines
  ctx.textAlign = 'left';
  ctx.fillStyle = '#2B3A3F';
  ctx.font = '600 22px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText('Phiếu bài tập điện hóa', 46, 224);

  ctx.strokeStyle = '#C77B4C';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(46, 246);
  ctx.lineTo(240, 246);
  ctx.stroke();

  ctx.fillStyle = '#4B5C62';
  ctx.font = '500 19px "IBM Plex Mono", monospace';
  ctx.fillText('1. Cặp oxi hóa – khử & E°pin', 46, 294);
  ctx.fillText('2. Pin Galvani & cầu muối KNO₃', 46, 336);
  ctx.fillText('3. Điện phân CuSO₄ & NaCl', 46, 378);
  ctx.fillText('4. Bài toán Định luật Faraday', 46, 420);
  ctx.fillText('5. Chọn điện cực trực tiếp 3D', 46, 462);

  // Faint ruled writing lines
  ctx.strokeStyle = '#E4DEC9';
  ctx.lineWidth = 2;
  for (let y = 508; y <= 558; y += 24) {
    ctx.beginPath();
    ctx.moveTo(46, y);
    ctx.lineTo(466, y);
    ctx.stroke();
  }

  // Call-to-action stamp
  ctx.fillStyle = '#182B30';
  ctx.fillRect(46, 578, 420, 56);
  ctx.fillStyle = '#78D4C4';
  ctx.font = '700 22px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Chạm để bắt đầu luyện tập', 256, 608);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}
