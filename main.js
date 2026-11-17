import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { CFG } from './config.js';
import { load, save } from './save.js';

const tg = window.Telegram?.WebApp; tg?.ready(); tg?.expand(); tg?.disableVerticalSwipes?.();
const S = load(), $ = (i) => document.getElementById(i);
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const lvl = () => 1 + Math.floor(Math.sqrt(S.xp / 40));
const axeD = () => CFG.axes.find((a) => a.id === S.axe), bagD = () => CFG.bags.find((b) => b.id === S.bag);
let carried = 0, mode = null, panel = null, tab = 'axes', dirty = false, yaw = 0.6, pitch = 0.5, dist = 9, attackAnim = 0;

// Камера
let cameraDist = 9;
let firstPerson = false;

const commit = () => { dirty = true; hud(); };
const toast = (m) => { const t = $('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2200); };

// ---------- сцена ----------
const R = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true });
R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x8ec9ff); scene.fog = new THREE.Fog(0x8ec9ff, 45, 115);
const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
scene.add(cam);
scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x4a6b3a, 0.9));
const sun = new THREE.DirectionalLight(0xfff0d0, 1.1); sun.position.set(25, 40, 15); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 120 }); scene.add(sun);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.9, ...o });
const add = (geo, col, pos, parent, cast = true, mo) => { const m = new THREE.Mesh(geo, M(col, mo)); m.position.set(...pos); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; };
const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const sign = (text, w, h, parent, pos) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: canvasTex(256, 64, (g, W, H) => { g.fillStyle = '#12306b'; g.fillRect(0, 0, W, H); g.strokeStyle = '#27e0ff'; g.lineWidth = 4; g.strokeRect(2, 2, W - 4, H - 4); g.fillStyle = '#fff'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, W / 2, H / 2 + 2); }), side: THREE.DoubleSide })); m.position.set(...pos); parent.add(m); };

const grass = canvasTex(128, 128, (g) => { g.fillStyle = '#4f8f3a'; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 700; i++) { g.fillStyle = `hsl(${95 + Math.random() * 30},45%,${28 + Math.random() * 18}%)`; g.fillRect(Math.random() * 128, Math.random() * 128, 2, 3); } });
grass.wrapS = grass.wrapT = THREE.RepeatWrapping; grass.repeat.set(40, 40);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshStandardMaterial({ map: grass, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

const col = [];
const CV = { x: 14, z: -6 }, SH = { x: -14, z: -6 };
const ring = (x, z, c) => { const m = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.1, 32), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.05, z); scene.add(m); };

// конвейер
const beltTex = canvasTex(64, 64, (g) => { g.fillStyle = '#2b2f36'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#4a515c'; for (let i = 0; i < 64; i += 16) g.fillRect(i, 0, 6, 64); });
beltTex.wrapS = beltTex.wrapT = THREE.RepeatWrapping; beltTex.repeat.set(8, 1);
const cvG = new THREE.Group(); cvG.position.set(CV.x, 0, CV.z); scene.add(cvG);
add(new THREE.BoxGeometry(9, 0.6, 1.8), 0x444a52, [0, 0.3, 0], cvG);
const belt = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.08, 1.4), new THREE.MeshStandardMaterial({ map: beltTex })); belt.position.set(0, 0.64, 0); belt.receiveShadow = true; cvG.add(belt);
for (const sz of [-0.85, 0.85]) add(new THREE.BoxGeometry(8.8, 0.25, 0.1), 0x8a929e, [0, 0.75, sz], cvG);
add(new THREE.BoxGeometry(2.2, 2.4, 2.2), 0x2f3a46, [5.4, 1.2, 0], cvG); add(new THREE.BoxGeometry(0.1, 1.2, 1.3), 0x050505, [4.28, 1.1, 0], cvG);
add(new THREE.SphereGeometry(0.22, 12, 8), 0xff8a1f, [5.4, 2.6, 0], cvG, false, { emissive: 0xff5500 });
sign('СДАТЬ БРЁВНА', 3, 0.75, cvG, [-4.2, 2.4, 0]);
for (const x of [-3, -1, 1, 3, 5.4]) col.push({ x: CV.x + x, z: CV.z, r: x > 5 ? 1.6 : 1.1, act: true });
ring(CV.x - 4.8, CV.z, 0x27e0ff);

// магазин
const shG = new THREE.Group();
shG.position.set(SH.x, 0, SH.z);
scene.add(shG);

const shopLoader = new GLTFLoader();

shopLoader.load(
  './assets/models/witch-cottage.glb',
  (gltf) => {
    const shopModel = gltf.scene;

    shopModel.updateMatrixWorld(true);

    const originalBox = new THREE.Box3().setFromObject(shopModel);
    const originalSize = new THREE.Vector3();
    originalBox.getSize(originalSize);

    const targetWidth = 7;
    const scale = targetWidth / Math.max(originalSize.x, originalSize.z);

    shopModel.scale.setScalar(scale);
    shopModel.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(shopModel);
    const center = new THREE.Vector3();
    box.getCenter(center);

    shopModel.position.x -= center.x;
    shopModel.position.y -= box.min.y;
    shopModel.position.z -= center.z;

    shopModel.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    shG.add(shopModel);
    toast('Новый магазин загружен!');
  },
  undefined,
  (error) => {
    console.error('Ошибка загрузки магазина:', error);
    toast('Не удалось загрузить магазин');
  }
);

for (const x of [-2.2, 0, 2.2]) {
  col.push({
    x: SH.x + x,
    z: SH.z,
    r: 2.1,
    act: true
  });
}

ring(SH.x, SH.z + 4, 0xffd23f);

// деревья
const trees = [];
function tree(x, z, big) {
  const s = big ? 1.5 : 0.8 + rnd() * 0.6, g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  add(new THREE.CylinderGeometry(0.22 * s, 0.32 * s, 2.2 * s, 7), big ? 0x6b4a2a : 0x6b4423, [0, 1.1 * s, 0], g);
  const f = big ? [0xe0a030, 0xd08a20, 0xc07818] : [0x2f7d32, 0x3a9a3a, 0x2a6e30];
  for (let i = 0; i < 3; i++) add(new THREE.ConeGeometry((1.5 - i * 0.35) * s, (1.6 - i * 0.2) * s, 8), f[i], [0, (2.4 + i * 0.9) * s, 0], g);
  const t = { g, x, z, s, big, max: Math.round(4 + s * 3) + (big ? 4 : 0), state: 'alive', t: 0, pulse: 0, dx: 1, dz: 0, ax: new THREE.Vector3(), c: { x, z, r: 0.6 * s, act: true } };
  t.hp = t.max; col.push(t.c); trees.push(t);
}
for (let i = 0, n = 0; n < 44 && i < 800; i++) {
  const a = rnd() * 6.283, d = 11 + rnd() * 42, x = Math.cos(a) * d, z = Math.sin(a) * d;
  if (Math.hypot(x - CV.x, z - CV.z) < 9 || Math.hypot(x - SH.x, z - SH.z) < 9 || trees.some((t) => Math.hypot(t.x - x, t.z - z) < 3.2)) continue;
  tree(x, z, n % 9 === 0); n++;
}
for (let i = 0; i < 14; i++) { const a = rnd() * 6.283, d = 8 + rnd() * 48, x = Math.cos(a) * d, z = Math.sin(a) * d, s = 0.5 + rnd() * 0.9;
  if (Math.hypot(x - CV.x, z - CV.z) < 8 || Math.hypot(x - SH.x, z - SH.z) < 8) continue;
  const r = add(new THREE.IcosahedronGeometry(s, 0), 0x8b8f94, [x, s * 0.5, z], scene); r.rotation.set(rnd() * 3, rnd() * 3, 0); col.push({ x, z, r: s * 0.9, act: true }); }
for (let i = 0; i < 26; i++) { const a = rnd() * 6.283, d = 5 + rnd() * 52; add(new THREE.SphereGeometry(0.45 + rnd() * 0.3, 8, 6), 0x2e8a3c, [Math.cos(a) * d, 0.3, Math.sin(a) * d], scene); }

// ---------- персонаж ----------
const P = new THREE.Group(); scene.add(P); P.position.set(0, 0, 4);
const characterVisual = new THREE.Group(); P.add(characterVisual);

// ---------- здоровье персонажа ----------
const PLAYER_MAX_HP = 100;
let playerHp = PLAYER_MAX_HP;

const healthCanvas = document.createElement('canvas');
healthCanvas.width = 512;
healthCanvas.height = 128;
const healthContext = healthCanvas.getContext('2d');
const healthTexture = new THREE.CanvasTexture(healthCanvas);
healthTexture.colorSpace = THREE.SRGBColorSpace;

const healthMaterial = new THREE.SpriteMaterial({
  map: healthTexture,
  transparent: true,
  depthTest: false,
  depthWrite: false
});

const healthBar = new THREE.Sprite(healthMaterial);
healthBar.position.set(0, 2.65, 0);
healthBar.scale.set(1.55, 0.32, 1);
healthBar.renderOrder = 10;
P.add(healthBar);

function updateHealthBar() {
  const ctx = healthContext;
  const w = healthCanvas.width;
  const h = healthCanvas.height;
  const percent = Math.max(0, Math.min(1, playerHp / PLAYER_MAX_HP));

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(15, 15, 20, 0.9)';
  ctx.fillRect(4, 4, w - 8, h - 8);

  if (percent > 0) {
    ctx.fillStyle = '#ed2525';
    ctx.fillRect(12, 12, (w - 24) * percent, h - 24);
  }

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 7;
  ctx.strokeRect(4, 4, w - 8, h - 8);

  ctx.font = 'bold 54px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#171717';
  ctx.strokeText(`${playerHp}/${PLAYER_MAX_HP}`, w / 2, h / 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${playerHp}/${PLAYER_MAX_HP}`, w / 2, h / 2);

  healthTexture.needsUpdate = true;
}

function setPlayerHealth(value) {
  playerHp = Math.max(0, Math.min(PLAYER_MAX_HP, Math.round(value)));
  updateHealthBar();

  if (playerHp <= 0) {
    toast('Персонаж потерял всё здоровье!');
  }
}

function damagePlayer(amount = 10) {
  if (playerHp <= 0) return;
  setPlayerHealth(playerHp - Math.max(0, amount));
}

function healPlayer(amount = 10) {
  setPlayerHealth(playerHp + Math.max(0, amount));
}

window.damagePlayer = damagePlayer;
window.healPlayer = healPlayer;
window.setPlayerHealth = setPlayerHealth;

updateHealthBar();

let characterMixer = null, walkAction = null, runAction = null, idleAction = null;
let characterReady = false;
const axeG = new THREE.Group(); axeG.position.set(0.48, 1.05, 0.18); P.add(axeG);
const bagG = new THREE.Group(); bagG.position.set(0, 1.15, -0.34); P.add(bagG);

// Топор для вида от первого лица.
const fpAxeG = new THREE.Group();
cam.add(fpAxeG);
fpAxeG.position.set(0.42, -0.38, -0.85);
fpAxeG.rotation.set(-0.15, 0.2, 0.2);
fpAxeG.scale.setScalar(0.75);
fpAxeG.visible = false;

function updateFirstPersonAxe() {
  while (fpAxeG.children.length) {
    fpAxeG.remove(fpAxeG.children[0]);
  }

  for (const child of axeG.children) {
    const clone = child.clone(true);
    fpAxeG.add(clone);
  }
}

// Брёвна
const LG = new THREE.CylinderGeometry(0.13, 0.13, 0.7, 8).rotateZ(Math.PI / 2);
const LM = M(0x8a5a2b);

function loadPlayerModel() {
  const loader = new GLTFLoader();
  loader.load('./assets/models/woman-base-character-rigged.glb', (gltf) => {
    const model = gltf.scene;
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3(); box.getSize(size);
    const height = Math.max(size.y, 0.001);
    const scale = 2.1 / height;
    model.scale.setScalar(scale);
    model.position.set(-((box.min.x + box.max.x) / 2) * scale, -box.min.y * scale, -((box.min.z + box.max.z) / 2) * scale);
    model.traverse((o) => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    characterVisual.add(model);
    characterMixer = new THREE.AnimationMixer(model);
    const clips = gltf.animations || [];
    const walkClip = clips.find((c) => /walk/i.test(c.name));
    const runClip = clips.find((c) => /run/i.test(c.name));
    if (walkClip) { walkAction = characterMixer.clipAction(walkClip); walkAction.play(); walkAction.enabled = false; }
    if (runClip) { runAction = characterMixer.clipAction(runClip); runAction.play(); runAction.enabled = false; }
    characterReady = true;
    setCharacterMotion(false, false);
    toast('Новый персонаж загружен');
  }, undefined, (err) => {
    console.error('Не удалось загрузить GLB персонажа:', err);
    toast('Не удалось загрузить персонажа. Проверьте файл модели.');
  });
}

function setCharacterMotion(moving, running) {
  if (!characterMixer) return;
  const next = moving ? (running && runAction ? runAction : walkAction) : null;
  for (const a of [walkAction, runAction]) {
    if (!a) continue;
    if (a === next) { a.enabled = true; a.setEffectiveWeight(1); a.paused = false; }
    else { a.setEffectiveWeight(0); a.paused = true; }
  }
}

loadPlayerModel();

function equip() {
  const clear = (g) => { while (g.children.length) g.remove(g.children[0]); };
  clear(axeG); const a = axeD(), k = CFG.axes.indexOf(a), L = 0.8 + k * 0.05;
  const h = add(new THREE.CylinderGeometry(0.04, 0.04, L, 8), 0x7a4a22, [0, 0, L / 2], axeG, false); h.rotation.x = Math.PI / 2;
  add(new THREE.BoxGeometry(0.07, 0.26 + k * 0.04, 0.3 + k * 0.03), a.head, [0, 0, L], axeG, false, a.glow ? { emissive: a.glow, metalness: 0.5 } : { metalness: 0.5 });
  clear(bagG); const b = bagD(), i = CFG.bags.indexOf(b), s = 0.8 + i * 0.12;
  add(new THREE.BoxGeometry(0.5 * s, 0.6 * s, 0.28 * s), b.color, [0, 0, 0], bagG);
  for (let j = 0; j < Math.min(i, 3); j++) add(new THREE.BoxGeometry(0.12 * s, 0.2 * s, 0.1 * s), b.color, [(j - 1) * 0.17 * s, -0.12 * s, -0.17 * s], bagG);
  if (i >= 4) add(new THREE.BoxGeometry(0.52 * s, 0.05, 0.3 * s), 0xffd23f, [0, 0.3 * s, 0], bagG);

  updateFirstPersonAxe();
}

// ---------- брёвна, частицы, конвейер ----------
const logs = [], beltLogs = [], chips = [];
const chipG = new THREE.BoxGeometry(0.1, 0.1, 0.1), chipM = M(0xc89a5a);

function spawnLogs(t) {
  const n = 2 + Math.round(t.s * 1.5) + (t.big ? 2 : 0);
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(LG, LM); m.castShadow = true; m.rotation.y = Math.atan2(t.dz, t.dx) + (rnd() - 0.5) * 0.8;
    m.position.set(t.x + t.dx * (1.2 + i * 0.8) + (rnd() - 0.5) * 0.5, 0.9, t.z + t.dz * (1.2 + i * 0.8) + (rnd() - 0.5) * 0.5); scene.add(m); logs.push({ m, vy: 2 + rnd() * 2 }); }
}
function chipsAt(t) { for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(chipG, chipM); m.position.set(t.x, 1.2, t.z); scene.add(m); chips.push({ m, v: new THREE.Vector3((rnd() - 0.5) * 4, 2 + rnd() * 3, (rnd() - 0.5) * 4), life: 0.7 }); } }
function addXp(n) { const o = lvl(); S.xp += n; if (lvl() > o) toast('⭐ Новый уровень: ' + lvl()); }
function pop(text, wx, wy, wz) { const v = new THREE.Vector3(wx, wy, wz).project(cam), d = document.createElement('div'); d.className = 'pop'; d.textContent = text; d.style.left = (v.x * 0.5 + 0.5) * innerWidth + 'px'; d.style.top = (-v.y * 0.5 + 0.5) * innerHeight + 'px'; document.body.appendChild(d); setTimeout(() => d.remove(), 1000); }
function deposit() {
  carried--; const m = new THREE.Mesh(LG, LM); m.castShadow = true; m.position.set(CV.x - 4, 0.8, CV.z); scene.add(m); beltLogs.push({ m, lx: -4 }); commit();
}

// ---------- ввод ----------
const keys = {}, joy = { x: 0, y: 0, on: false };
addEventListener('keydown', (e) => { keys[e.code] = true; if (e.code === 'KeyE' || e.code === 'Space') { e.preventDefault(); act(); } if (e.code === 'Escape') closePanel(); });
addEventListener('keyup', (e) => { keys[e.code] = false; });

// Управление камерой: один палец — поворот, два пальца — приближение.
let drag = null;
const pointers = new Map();
let pinchDistance = null;

const getPinchDistance = () => {
  const pts = [...pointers.values()];
  if (pts.length < 2) return null;

  return Math.hypot(
    pts[0].x - pts[1].x,
    pts[0].y - pts[1].y
  );
};

$('c').addEventListener('pointerdown', (e) => {
  pointers.set(e.pointerId, {
    x: e.clientX,
    y: e.clientY
  });

  $('c').setPointerCapture(e.pointerId);

  if (pointers.size >= 2) {
    drag = null;
    pinchDistance = getPinchDistance();
  } else {
    drag = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY
    };
  }
});

$('c').addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;

  pointers.set(e.pointerId, {
    x: e.clientX,
    y: e.clientY
  });

  if (pointers.size >= 2) {
    const nextDistance = getPinchDistance();

    if (pinchDistance !== null && nextDistance !== null) {
      const delta = nextDistance - pinchDistance;

      // Разведение пальцев приближает камеру.
      dist = THREE.MathUtils.clamp(
        dist - delta * 0.025,
        1.2,
        16
      );
    }

    pinchDistance = nextDistance;
    drag = null;
    return;
  }

  if (!drag || drag.id !== e.pointerId) return;

  yaw -= (e.clientX - drag.x) * 0.006;
  pitch = Math.max(0.15, Math.min(1.25, pitch + (e.clientY - drag.y) * 0.004));

  drag.x = e.clientX;
  drag.y = e.clientY;
});

const endCameraPointer = (e) => {
  pointers.delete(e.pointerId);

  if (pointers.size < 2) {
    pinchDistance = null;
  }

  drag = null;

  if (pointers.size === 1) {
    const [id, p] = [...pointers.entries()][0];
    drag = {
      id,
      x: p.x,
      y: p.y
    };
  }
};

$('c').addEventListener('pointerup', endCameraPointer);
$('c').addEventListener('pointercancel', endCameraPointer);

$('c').addEventListener('wheel', (e) => {
  dist = THREE.MathUtils.clamp(
    dist + e.deltaY * 0.01,
    1.2,
    16
  );
}, { passive: true });

const J = $('joy'); let jid = null;
const jmove = (e) => { const r = J.getBoundingClientRect(), dx = e.clientX - (r.left + 60), dy = e.clientY - (r.top + 60), m = Math.min(1, Math.hypot(dx, dy) / 50), a = Math.atan2(dy, dx);
  joy.x = Math.cos(a) * m; joy.y = -Math.sin(a) * m; joy.on = true; $('knob').style.transform = `translate(${Math.cos(a) * m * 40}px,${Math.sin(a) * m * 40}px)`; };
J.addEventListener('pointerdown', (e) => { jid = e.pointerId; J.setPointerCapture(jid); jmove(e); });
J.addEventListener('pointermove', (e) => { if (e.pointerId === jid) jmove(e); });
const jend = (e) => { if (e.pointerId !== jid) return; jid = null; joy.x = joy.y = 0; joy.on = false; $('knob').style.transform = ''; };
J.addEventListener('pointerup', jend); J.addEventListener('pointercancel', jend);
$('act').addEventListener('click', () => act());

// ---------- взаимодействие ----------
const dist2 = (x, z) => Math.hypot(P.position.x - x, P.position.z - z);
const nearTree = () => { let b = null, bd = 1e9; for (const t of trees) if (t.state === 'alive') { const d = dist2(t.x, t.z) - t.c.r; if (d < CFG.hitRange && d < bd) { b = t; bd = d; } } return b; };
const nearShop = () => dist2(SH.x, SH.z + 3) < 5.5, nearCv = () => dist2(CV.x - 4.8, CV.z) < 3.4;

function context() {
  if (nearShop()) return 'shop';
  if (nearCv() && carried > 0) return 'deliver';
  if (nearTree()) return 'chop';
  return null;
}

function act() {
  if (panel) return;
  const c = context();

  if (c === 'shop') return openPanel('shop');

  // Рубка теперь ручная: одно нажатие — один удар.
  if (c === 'chop') {
    const t = nearTree();
    if (!t) return;
    if (t.big && lvl() < CFG.bigLvl) {
      return toast(`Древнее дерево: нужен уровень ${CFG.bigLvl}`);
    }
    if (carried >= bagD().cap) {
      toast('Рюкзак полон — брёвна не подобрать');
    }

    P.rotation.y = Math.atan2(t.x - P.position.x, t.z - P.position.z);
    attackAnim = 0.28;
    hit(t);
    return;
  }

  // Сдача брёвен на конвейер остаётся автоматической.
  if (c === 'deliver') {
    if (mode === 'deliver') {
      mode = null;
      return;
    }
    mode = 'deliver';
    dt2 = 0;
  }
}

function hit(t) {
  t.hp--; t.pulse = 0.15; chipsAt(t); addXp(CFG.xp.chop);
  if (t.hp <= 0) { S.stats.trees++; const dx = t.x - P.position.x, dz = t.z - P.position.z, l = Math.hypot(dx, dz) || 1; t.dx = dx / l; t.dz = dz / l; t.ax.set(t.dz, 0, -t.dx); t.state = 'fall'; t.t = 0; t.c.act = false; mode = null; }
  commit();
}

function treeUpdate(t, dt) {
  if (t.state === 'alive') { t.pulse = Math.max(0, t.pulse - dt); t.g.scale.setScalar(1 + t.pulse * 0.4); }
  else if (t.state === 'fall') { t.t += dt; const k = Math.min(t.t / 1.3, 1); t.g.quaternion.setFromAxisAngle(t.ax, k * k * Math.PI / 2 * 0.98); if (k >= 1) { t.state = 'lie'; t.t = 0; spawnLogs(t); } }
  else if (t.state === 'lie') { t.t += dt; if (t.t > 2) { const k = Math.min(t.t - 2, 1); t.g.scale.setScalar(Math.max(0.001, 1 - k)); if (k >= 1) { t.g.visible = false; t.state = 'wait'; t.t = 0; } } }
  else if (t.state === 'wait') { t.t += dt; if (t.t >= CFG.treeRespawn - 3) { t.g.quaternion.identity(); t.g.scale.setScalar(0.001); t.g.visible = true; t.state = 'grow'; t.t = 0; } }
  else if (t.state === 'grow') { t.t += dt; t.g.scale.setScalar(Math.min(1, 0.001 + t.t)); if (t.t >= 1) { t.state = 'alive'; t.hp = t.max; t.c.act = true; t.g.scale.setScalar(1); } }
}

// ---------- интерфейс ----------
function hud() {
  const L = lvl(), a = 40 * (L - 1) ** 2, b = 40 * L * L;
  $('coins').textContent = S.coins; $('bag').textContent = `${carried}/${bagD().cap}`; $('axe').textContent = axeD().name; $('lvl').textContent = L; $('xp').style.width = ((S.xp - a) / (b - a) * 100) + '%';
}

function actLabel() {
  const c = context(), B = $('act'); B.disabled = !c || !!panel;
  B.textContent = c === 'shop' ? 'Магазин' : c === 'deliver' ? (mode === 'deliver' ? 'Стоп' : 'Сдать') : c === 'chop' ? '🪓 Ударить' : '—';
}

const opened = (kind, id) => S[kind].includes(id), cur = (kind, id) => (kind === 'axes' ? S.axe : S.bag) === id;

function panelHtml() {
  if (panel === 'quests') return '<h2>📋 Задания</h2>' + CFG.quests.map((q) => { const v = Math.min(S.stats[q.stat] || 0, q.goal), done = S.claimed.includes(q.id);
    return `<div class="row"><div class="g">${q.text}<small>${v}/${q.goal} · награда ${q.reward} 🪙</small></div><button data-a="claim:${q.id}" ${done || v < q.goal ? 'disabled' : ''}>${done ? 'Получено' : 'Забрать'}</button></div>`; }).join('') + '<button class="gh" data-a="close">Закрыть</button>';
  const list = (kind) => CFG[kind].filter((it) => panel === 'shop' || opened(kind, it.id)).map((it) => {
    const own = opened(kind, it.id), stat = kind === 'axes' ? `скорость ×${it.speed}` : `вместимость ${it.cap}`, lock = lvl() < it.lvl;
    const label = cur(kind, it.id) ? 'Надето' : own ? 'Надеть' : lock ? `Ур. ${it.lvl}` : `${it.price} 🪙`;
    return `<div class="row"><span class="sw" style="background:#${(it.head ?? it.color).toString(16).padStart(6, '0')}"></span><div class="g">${it.name}<small>${stat}${own ? ' · куплено' : ''}</small></div><button data-a="buy:${kind}:${it.id}" ${cur(kind, it.id) || (!own && (lock || S.coins < it.price)) ? 'disabled' : ''}>${label}</button></div>`; }).join('');
  const tabs = `<div class="tabs"><button class="${tab === 'axes' ? 'on' : 'gh'}" data-a="tab:axes">🪓 Топоры</button><button class="${tab === 'bags' ? 'on' : 'gh'}" data-a="tab:bags">🎒 Рюкзаки</button></div>`;
  return `<h2>${panel === 'shop' ? '🛒 Магазин' : '🎒 Инвентарь'} · 🪙 ${S.coins}</h2>${tabs}${list(tab)}<button class="gh" data-a="close">Закрыть</button>`;
}

function openPanel(p) { panel = p; mode = null; $('box').innerHTML = panelHtml(); $('panel').classList.add('show'); }
function closePanel() { panel = null; $('panel').classList.remove('show'); }

$('box').addEventListener('click', (e) => {
  const a = e.target.closest('[data-a]')?.dataset.a?.split(':'); if (!a) return;
  if (a[0] === 'close') return closePanel();
  if (a[0] === 'tab') tab = a[1];
  if (a[0] === 'claim') { const q = CFG.quests.find((x) => x.id === a[1]); if (q && !S.claimed.includes(q.id) && (S.stats[q.stat] || 0) >= q.goal) { S.coins += q.reward; S.claimed.push(q.id); toast(`+${q.reward} 🪙`); commit(); } }
  if (a[0] === 'buy') { const kind = a[1], it = CFG[kind].find((x) => x.id === a[2]), key = kind === 'axes' ? 'axe' : 'bag';
    if (it) { if (!opened(kind, it.id)) { if (lvl() < it.lvl) return toast(`Нужен уровень ${it.lvl}`); if (S.coins < it.price) return toast('Не хватает монет'); S.coins -= it.price; S[kind].push(it.id); toast('Куплено: ' + it.name); } S[key] = it.id; equip(); commit(); } }
  $('box').innerHTML = panelHtml();
});

// Магазин доступен только рядом с домиком.
if ($('bShop')) {
  $('bShop').style.display = 'none';
  $('bShop').onclick = null;
}

$('bInv').onclick = () => openPanel('inv');
$('bQ').onclick = () => openPanel('quests');

setInterval(() => { if (dirty) { save(S); dirty = false; } }, 1000);
addEventListener('beforeunload', () => save(S));
document.addEventListener('visibilitychange', () => { if (document.hidden) save(S); });

function resize() {
  R.setSize(innerWidth, innerHeight);
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

// ---------- игровой цикл ----------
let last = performance.now(), phase = 0, dt2 = 0, pk = 0, pickT = 0, spd = 0, tAct = 0;

function update(dt) {
  const ix = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x;
  const iy = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) + joy.y;
  const mag = Math.min(1, Math.hypot(ix, iy)), moving = mag > 0.08 && !panel;
  let mx = 0, mz = 0;

  if (moving) {
    mx = -Math.sin(yaw) * iy + Math.cos(yaw) * ix;
    mz = -Math.cos(yaw) * iy - Math.sin(yaw) * ix;
    const l = Math.hypot(mx, mz) || 1;
    mx /= l;
    mz /= l;
    if (mode) mode = null;
  }

  const run = moving && (keys.ShiftLeft || keys.ShiftRight || (joy.on && mag > 0.85));
  spd = moving ? (run ? 7 : 4) * (joy.on ? Math.max(0.55, mag) : 1) : 0;

  P.position.x += mx * spd * dt;
  P.position.z += mz * spd * dt;

  for (const c of col) {
    if (!c.act) continue;
    const dx = P.position.x - c.x, dz = P.position.z - c.z, d = Math.hypot(dx, dz), m = c.r + 0.45;
    if (d < m && d > 1e-4) {
      P.position.x = c.x + dx / d * m;
      P.position.z = c.z + dz / d * m;
    }
  }

  const wr = Math.hypot(P.position.x, P.position.z);
  if (wr > 58) { P.position.x *= 58 / wr; P.position.z *= 58 / wr; }

  let face = moving ? Math.atan2(mx, mz) : null;

  if (mode === 'deliver' && (carried <= 0 || !nearCv())) mode = null;

  if (mode === 'deliver') {
    face = Math.atan2(CV.x - 4.8 - P.position.x, CV.z - P.position.z);
    dt2 += dt;
    tAct += dt;
    if (dt2 >= 0.28) { dt2 = 0; deposit(); }
  }

  if (face !== null) {
    let d = face - P.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    P.rotation.y += d * Math.min(1, dt * 12);
  }

  pickT -= dt;
  pk = Math.max(0, pk - dt);

  if (pickT <= 0 && carried < bagD().cap) {
    for (let i = logs.length - 1; i >= 0; i--) {
      const l = logs[i];
      if (l.vy === 0 && Math.hypot(l.m.position.x - P.position.x, l.m.position.z - P.position.z) < CFG.pickRadius) {
        scene.remove(l.m);
        logs.splice(i, 1);
        carried++;
        S.stats.picked++;
        addXp(CFG.xp.pick);
        pickT = 0.12;
        pk = 0.35;
        commit();
        break;
      }
    }
  }

  for (const l of logs) {
    l.vy -= 12 * dt;
    l.m.position.y += l.vy * dt;
    if (l.m.position.y < 0.13) {
      l.m.position.y = 0.13;
      l.vy = Math.abs(l.vy) > 1.5 ? -l.vy * 0.35 : 0;
    }
  }

  for (let i = beltLogs.length - 1; i >= 0; i--) {
    const b = beltLogs[i];
    b.lx += 2.2 * dt;
    b.m.position.x = CV.x + b.lx;

    if (b.lx >= 4.2) {
      scene.remove(b.m);
      beltLogs.splice(i, 1);
      S.coins += CFG.logValue;
      S.stats.delivered++;
      addXp(CFG.xp.deliver);
      pop('+' + CFG.logValue + ' 🪙', CV.x + 4.4, 2.2, CV.z);
      commit();
    }
  }

  beltTex.offset.x -= dt * 0.55;

  for (let i = chips.length - 1; i >= 0; i--) {
    const c = chips[i];
    c.life -= dt;
    c.v.y -= 9 * dt;
    c.m.position.addScaledVector(c.v, dt);
    if (c.life <= 0) {
      scene.remove(c.m);
      chips.splice(i, 1);
    }
  }

  for (const t of trees) treeUpdate(t, dt);

  attackAnim = Math.max(0, attackAnim - dt);
  const swingProgress = attackAnim > 0 ? 1 - attackAnim / 0.28 : 0;
  const swing = attackAnim > 0 ? Math.sin(swingProgress * Math.PI) : 0;
  axeG.rotation.x = -swing * 1.1;
  fpAxeG.rotation.x = -0.15 - swing * 1.1;

  if (characterMixer) characterMixer.update(dt);
  setCharacterMotion(spd > 0, run);
  P.position.y = 0;

  // ---------- камера: плавное приближение ----------
  const tx = P.position.x;
  const ty = P.position.y + 1.6;
  const tz = P.position.z;

  cameraDist += (dist - cameraDist) * Math.min(1, dt * 8);

  // Небольшой запас между режимами предотвращает мигание.
  if (!firstPerson && cameraDist <= 1.65) {
    firstPerson = true;
    characterVisual.visible = false;
    axeG.visible = false;
    bagG.visible = false;
    healthBar.visible = false;
    fpAxeG.visible = true;
  } else if (firstPerson && cameraDist >= 2.0) {
    firstPerson = false;
    characterVisual.visible = true;
    axeG.visible = true;
    bagG.visible = true;
    healthBar.visible = true;
    fpAxeG.visible = false;
  }

  if (firstPerson) {
    // Камера на уровне глаз персонажа.
    cam.position.set(tx, ty, tz);

    cam.lookAt(
      tx - Math.sin(yaw) * 10 * Math.cos(pitch),
      ty - Math.sin(pitch) * 10,
      tz - Math.cos(yaw) * 10 * Math.cos(pitch)
    );
  } else {
    // Камера третьего лица.
    cam.position.set(
      tx + Math.sin(yaw) * Math.cos(pitch) * cameraDist,
      ty + Math.sin(pitch) * cameraDist,
      tz + Math.cos(yaw) * Math.cos(pitch) * cameraDist
    );

    cam.lookAt(tx, ty, tz);
  }

  sun.position.set(tx + 25, 40, tz + 15);
  sun.target.position.set(tx, 0, tz);
  sun.target.updateMatrixWorld();

  actLabel();
}

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  update(dt);
  R.render(scene, cam);
}

equip();
hud();
requestAnimationFrame(loop);
